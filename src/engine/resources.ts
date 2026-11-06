import { ECLSS_BASELINES, GAME_CONSTANTS as K, LCROSS_CABEUS } from '../data/nasaTelemetry';
import type { AbortCause, Choice, ResourceState } from '../types';

const crewSize = 2;
const hoursPerDay = 24;
const waterDemandKgPerDay = crewSize * 3;
const oxygenDemandKgPerDay = crewSize * ECLSS_BASELINES.o2KgPerCrewDay;
const rationDemandKgPerDay = crewSize * 0.62;
const nominalWaterRecovery = 0.85;
const iceTreatmentEfficiency = 0.6;
const epsilon = 1e-9;

/** Classroom assumptions for an established tray of leafy greens. */
export const CROP_TRIAL = {
  ageAtInstallDays: 25,
  harvestAgeDays: 30,
  energyKwhPerDay: 1.2,
  waterKgPerDay: 0.4,
  harvestKg: 1.5,
  rationEquivalentKg: 0.25,
  sciencePoints: 8,
};

export const INITIAL_RESOURCES: ResourceState = {
  oxygenKg: 18,
  waterKg: 16,
  foodKg: 14,
  cropGrowthDays: 0,
  harvestedFoodKg: 0,
  eclssHealthPct: 100,
};

export interface ResourceFlows {
  oxygenAddedKg: number;
  oxygenUsedKg: number;
  waterAddedKg: number;
  waterExtractedKg: number;
  waterUsedKg: number;
  waterRecoveredKg: number;
  rationAddedKg: number;
  rationUsedKg: number;
  cropWaterKg: number;
  cropHours: number;
}

export function emptyResourceFlows(): ResourceFlows {
  return {
    oxygenAddedKg: 0,
    oxygenUsedKg: 0,
    waterAddedKg: 0,
    waterExtractedKg: 0,
    waterUsedKg: 0,
    waterRecoveredKg: 0,
    rationAddedKg: 0,
    rationUsedKg: 0,
    cropWaterKg: 0,
    cropHours: 0,
  };
}

export function canPowerCrop(resources: ResourceState, batteryAfterBaseLoadKwh: number): boolean {
  return resources.cropGrowthDays > 0 &&
    resources.harvestedFoodKg === 0 &&
    batteryAfterBaseLoadKwh - CROP_TRIAL.energyKwhPerDay / hoursPerDay >= K.brownoutThresholdKwh &&
    resources.waterKg >= 2 * waterDemandKgPerDay * (1 - nominalWaterRecovery);
}

function applyStoreFlow(available: number, netSupply: number, demand: number) {
  const added = Math.max(0, netSupply);
  const used = Math.min(available + added, demand + Math.max(0, -netSupply));
  return { remaining: available + added - used, added, used };
}

/** Advances actual store masses and equipment health by one mission hour. */
export function advanceResources(
  resources: ResourceState,
  flows: ResourceFlows,
  choice: Choice,
  phaseHours: number,
  healthDelta: number,
  lowPower: boolean,
  outage: boolean,
  cropPowered: boolean,
  taskPowerFraction: number,
): void {
  const taskOxygenKg = (choice.resourceEffects?.oxygenKg ?? 0) / phaseHours;
  const netOxygenSupply = taskOxygenKg > 0 ? taskOxygenKg * taskPowerFraction : taskOxygenKg;
  const oxygen = applyStoreFlow(resources.oxygenKg, netOxygenSupply, oxygenDemandKgPerDay / hoursPerDay);
  resources.oxygenKg = oxygen.remaining;
  flows.oxygenAddedKg += oxygen.added;
  flows.oxygenUsedKg += oxygen.used;

  const waterRecovery = outage ? 0.2 : lowPower ? 0.55 : nominalWaterRecovery;
  const serviceBonus = outage ? 0 : (choice.waterRecoveryBonusPct ?? 0) / 100;
  const recovery = Math.min(0.98, waterRecovery + serviceBonus);
  const grossWaterUse = waterDemandKgPerDay / hoursPerDay;
  const taskWaterKg = (choice.resourceEffects?.waterKg ?? 0) / phaseHours;
  const waterExtractedKg = (choice.iceProcessingKg ?? 0) / phaseHours *
    LCROSS_CABEUS.waterIceMassFraction * iceTreatmentEfficiency * taskPowerFraction;
  const waterAddedKg = Math.max(0, taskWaterKg) + waterExtractedKg;
  const availableWater = resources.waterKg + waterAddedKg;
  const crewNetUse = Math.min(availableWater, grossWaterUse * (1 - recovery));
  const recovered = crewNetUse * recovery / (1 - recovery);
  const waterUsedByTask = Math.min(availableWater - crewNetUse, Math.max(0, -taskWaterKg));
  resources.waterKg = availableWater - crewNetUse - waterUsedByTask;
  flows.waterAddedKg += waterAddedKg;
  flows.waterExtractedKg += waterExtractedKg;
  flows.waterUsedKg += crewNetUse + recovered + waterUsedByTask;
  flows.waterRecoveredKg += recovered;

  let rationTopUp = (choice.resourceEffects?.foodKg ?? 0) / phaseHours;
  if (cropPowered) {
    const cropWater = Math.min(resources.waterKg, CROP_TRIAL.waterKgPerDay / hoursPerDay);
    resources.waterKg -= cropWater;
    flows.cropWaterKg += cropWater;
    flows.cropHours += 1;
    resources.cropGrowthDays += 1 / hoursPerDay;
    if (resources.cropGrowthDays + epsilon >= CROP_TRIAL.harvestAgeDays) {
      resources.cropGrowthDays = CROP_TRIAL.harvestAgeDays;
      resources.harvestedFoodKg = CROP_TRIAL.harvestKg;
      rationTopUp += CROP_TRIAL.rationEquivalentKg;
    }
  }

  const ration = applyStoreFlow(resources.foodKg, rationTopUp, rationDemandKgPerDay / hoursPerDay);
  resources.foodKg = ration.remaining;
  flows.rationAddedKg += ration.added;
  flows.rationUsedKg += ration.used;
  resources.eclssHealthPct = Math.min(100, Math.max(0, resources.eclssHealthPct + healthDelta));
}

export function crewReservePct(resources: ResourceState): number {
  const reserveDays = Math.min(
    resources.oxygenKg / oxygenDemandKgPerDay,
    resources.waterKg / (waterDemandKgPerDay * (1 - nominalWaterRecovery)),
    resources.foodKg / rationDemandKgPerDay,
  );
  return Math.min(resources.eclssHealthPct, 100 * reserveDays / 2);
}

export function depletionCause(resources: ResourceState): AbortCause | null {
  if (resources.oxygenKg < epsilon) return 'oxygen';
  if (resources.waterKg < epsilon) return 'water';
  if (resources.foodKg < epsilon) return 'food';
  return resources.eclssHealthPct < epsilon ? 'equipment' : null;
}
