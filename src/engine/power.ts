import { GAME_CONSTANTS as K, LRO_PROFILE, LRO_SHADOW, TALL_MAST_SHADOW_OUTPUT_FACTOR } from '../data/nasaTelemetry';
import type { Choice, ConditionalEffect, FlagId, ResourceState } from '../types';
import { canPowerCrop, CROP_TRIAL } from './resources';

const hoursPerDay = 24;
const epsilon = 1e-9;
export const BATTERY_CAPACITY_KWH = 100;
export const ESSENTIAL_BASE_KWH_PER_DAY = 4;

export interface EnvironmentDetail {
  durationDays: number;
  simulatedHours: number;
  arrayOutputFactor: number;
  orientationFactor: number;
  meanSurfaceTempK: number;
  generationKwh: number;
  supplementalGenerationKwh: number;
  loadKwh: number;
  loadReductionKwh: number;
  heaterKwh: number;
  taskLoadKwh: number;
  unservedTaskKwh: number;
  greenhouseLoadKwh: number;
  curtailedKwh: number;
  unservedKwh: number;
  lowPowerHours: number;
  outageHours: number;
  inShadow: boolean;
}

export function newEnvironmentDetail(orientationFactor: number): EnvironmentDetail {
  return {
    durationDays: 0,
    simulatedHours: 0,
    arrayOutputFactor: 0,
    orientationFactor,
    meanSurfaceTempK: 0,
    generationKwh: 0,
    supplementalGenerationKwh: 0,
    loadKwh: 0,
    loadReductionKwh: 0,
    heaterKwh: 0,
    taskLoadKwh: 0,
    unservedTaskKwh: 0,
    greenhouseLoadKwh: 0,
    curtailedKwh: 0,
    unservedKwh: 0,
    lowPowerHours: 0,
    outageHours: 0,
    inShadow: false,
  };
}

function environmentAtHour(hour: number, flags: ReadonlySet<FlagId>, orientationFactor: number) {
  let sample = LRO_PROFILE[0];
  for (const candidate of LRO_PROFILE) {
    if (candidate.hour > hour) break;
    sample = candidate;
  }
  const inShadow = hour >= LRO_SHADOW.startHour && hour < LRO_SHADOW.endHour;
  const availableSun = inShadow && flags.has('tallMast')
    ? Math.max(sample.arrayOutputFactor, TALL_MAST_SHADOW_OUTPUT_FACTOR)
    : sample.arrayOutputFactor;
  const arrayOutputFactor = availableSun * orientationFactor;
  const heaterKwh = K.heaterKwhPerDayPer100K / hoursPerDay *
    Math.max(0, (K.heaterReferenceTempK - sample.surfaceTempK) / 100);
  return {
    inShadow,
    surfaceTempK: sample.surfaceTempK,
    arrayOutputFactor,
    generationKwh: K.generationKwhPerDay / hoursPerDay * arrayOutputFactor,
    loadKwh: K.baseLoadKwhPerDay / hoursPerDay,
    heaterKwh,
  };
}

export function phasePowerPlan(choice: Choice, conditionals: ConditionalEffect[], phaseHours: number) {
  const energy = choice.effects.powerKwh ?? 0;
  let taskLoad = Math.max(0, -energy);
  let supplementalGeneration = 0;
  const loadReduction = choice.powerStrategy === 'load-shed' ? Math.max(0, energy) : 0;
  if (choice.powerStrategy !== 'load-shed') supplementalGeneration += Math.max(0, energy);
  for (const conditional of conditionals) {
    const energyChange = conditional.effects.powerKwh ?? 0;
    if (conditional.powerStrategy === 'generation') supplementalGeneration += Math.max(0, energyChange);
    else taskLoad -= energyChange;
  }
  return {
    taskLoadKwh: Math.max(0, taskLoad) / phaseHours,
    loadReductionKwh: loadReduction / phaseHours,
    supplementalGenerationKwh: supplementalGeneration / phaseHours,
  };
}

/** Allocate electricity to habitat loads, mission tasks, then the optional crop trial. */
export function advancePower(
  env: EnvironmentDetail,
  plan: ReturnType<typeof phasePowerPlan>,
  hour: number,
  flags: ReadonlySet<FlagId>,
  resources: ResourceState,
  batteryKwh: number,
) {
  const frame = environmentAtHour(hour, flags, env.orientationFactor);
  const essentialBaseKwh = ESSENTIAL_BASE_KWH_PER_DAY / hoursPerDay;
  const discretionaryKwh = Math.max(0, frame.loadKwh - essentialBaseKwh);
  const loadReductionKwh = Math.min(plan.loadReductionKwh, discretionaryKwh);
  const afterEssentials = batteryKwh + frame.generationKwh + plan.supplementalGenerationKwh -
    (essentialBaseKwh + frame.heaterKwh);
  const afterHabitat = Math.max(0, afterEssentials) - (discretionaryKwh - loadReductionKwh);
  const servedTask = Math.min(plan.taskLoadKwh, Math.max(0, afterHabitat));
  const unservedTaskKwh = plan.taskLoadKwh - servedTask;
  const taskPowerFraction = plan.taskLoadKwh > 0 ? servedTask / plan.taskLoadKwh : 1;
  const afterTasks = Math.max(0, afterHabitat) - servedTask;
  const cropPowered = canPowerCrop(resources, afterTasks);
  const greenhouseLoadKwh = cropPowered ? CROP_TRIAL.energyKwhPerDay / hoursPerDay : 0;
  const rawBattery = afterTasks - greenhouseLoadKwh;
  const curtailedKwh = Math.max(0, rawBattery - BATTERY_CAPACITY_KWH);
  const unservedKwh = Math.max(0, -afterEssentials) + Math.max(0, -afterHabitat) + unservedTaskKwh;
  const nextBattery = Math.min(rawBattery, BATTERY_CAPACITY_KWH);
  const lowPower = nextBattery + epsilon < K.brownoutThresholdKwh;
  const outage = afterEssentials < -epsilon;

  env.simulatedHours += 1;
  env.durationDays = env.simulatedHours / hoursPerDay;
  env.arrayOutputFactor += frame.arrayOutputFactor;
  env.meanSurfaceTempK += frame.surfaceTempK;
  env.generationKwh += frame.generationKwh;
  env.supplementalGenerationKwh += plan.supplementalGenerationKwh;
  env.loadKwh += frame.loadKwh;
  env.loadReductionKwh += loadReductionKwh;
  env.heaterKwh += frame.heaterKwh;
  env.taskLoadKwh += plan.taskLoadKwh;
  env.unservedTaskKwh += unservedTaskKwh;
  env.greenhouseLoadKwh += greenhouseLoadKwh;
  env.curtailedKwh += curtailedKwh;
  env.unservedKwh += unservedKwh;
  env.lowPowerHours += Number(lowPower);
  env.outageHours += Number(outage);
  env.inShadow ||= frame.inShadow;
  return { batteryKwh: nextBattery, cropPowered, lowPower, outage, taskPowerFraction };
}

export function summarizeEnvironment(env: EnvironmentDetail): EnvironmentDetail {
  const divisor = env.simulatedHours || 1;
  const summary = {
    ...env,
    arrayOutputFactor: env.arrayOutputFactor / divisor,
    meanSurfaceTempK: env.meanSurfaceTempK / divisor,
  };
  // Retain thousandths in the audit while keeping displayed values readable.
  for (const key of Object.keys(summary) as Array<keyof EnvironmentDetail>) {
    if (key !== 'inShadow') summary[key] = Math.round(summary[key] * 1000) / 1000;
  }
  return summary;
}
