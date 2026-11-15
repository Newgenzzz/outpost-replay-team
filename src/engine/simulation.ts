/**
 * Outpost Replay — deterministic simulation engine.
 *
 * `runSimulation(choiceIndices)` is a PURE function: no randomness, no clock, no I/O.
 * Identical inputs always produce identical outputs, which is what makes the
 * "Rewind & Compare" mechanic a fair, controlled experiment.
 *
 * The power and supply ledgers advance one hour at a time through the same scripted environment.
 */
import type { AbortCause, Bilingual, Choice, FlagId, MetricDelta, MetricKey, MetricState, ResourceState } from '../types';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import {
  GAME_CONSTANTS as K,
  integrateSepDoseMsv,
  RADIATION_LIMITS,
  SHIELDING,
} from '../data/nasaTelemetry';
import { advancePower, CALIBRATED_INCIDENCE_LIMIT_DEG, newEnvironmentDetail, phasePowerPlan, summarizeEnvironment, type EnvironmentDetail } from './power';
import { advanceResources, crewReservePct, CROP_TRIAL, depletionCause, emptyResourceFlows, INITIAL_RESOURCES, type ResourceFlows } from './resources';

export type { EnvironmentDetail } from './power';

export const METRIC_KEYS: MetricKey[] = ['powerKwh', 'lifeSupportPct', 'radiationMsv', 'sciencePoints'];

export type RuleId = 'survivalFocus' | 'doseRestriction' | 'brownout' | 'blackout';
export type ContributionSource = 'environment' | 'choice' | 'conditional' | 'rule';

export interface Contribution {
  source: ContributionSource;
  label: Bilingual;
  delta: MetricDelta;
  ruleId?: RuleId;
  flag?: FlagId;
}

export interface StepRecord {
  step: number;
  startHour: number;
  endHour: number;
  choiceIndex: number;
  choiceId: string;
  before: MetricState;
  after: MetricState;
  delta: MetricState;
  env: EnvironmentDetail;
  resourcesBefore: ResourceState;
  resourcesAfter: ResourceState;
  resourceFlows: ResourceFlows;
  contributions: Contribution[];
  rulesTriggered: RuleId[];
  conditionalsApplied: FlagId[];
  flagsBefore: FlagId[];
  flagsAfter: FlagId[];
}

export type Outcome = 'in-progress' | 'success' | 'warning' | 'abort';

export interface SimulationResult {
  choices: number[];
  solarCalibrated: boolean;
  icePrepared: boolean;
  /** history[0] = initial state, history[k] = state after decision k. */
  history: MetricState[];
  steps: StepRecord[];
  final: MetricState;
  resourceHistory: ResourceState[];
  resources: ResourceState;
  elapsedHours: number;
  flags: FlagId[];
  complete: boolean;
  outcome: Outcome;
  score: number | null;
  doseWarningStep: number | null;
  lifeSupportDepletedStep: number | null;
  abortCause: AbortCause | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const r1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const zero = (): MetricState => ({ powerKwh: 0, lifeSupportPct: 0, radiationMsv: 0, sciencePoints: 0 });

function addInto(target: MetricState, d: MetricDelta) {
  for (const k of METRIC_KEYS) target[k] += d[k] ?? 0;
}

function metricDifference(before: MetricState, after: MetricState): MetricState {
  const delta = zero();
  for (const key of METRIC_KEYS) delta[key] = r1(after[key] - before[key]);
  return delta;
}

export const RULE_LABELS: Record<RuleId, Bilingual> = {
  survivalFocus: {
    en: 'Survival focus: life support < 40 % → science gains halved',
    az: 'Sağ qalma prioriteti: həyat təminatı < 40 % → elmi qazanc yarıya enir',
  },
  doseRestriction: {
    en: 'Dose restriction: crew ≥ 50 mSv → EVA science gains halved',
    az: 'Doza məhdudiyyəti: ekipaj ≥ 50 mSv → EVA elmi qazancı yarıya enir',
  },
  brownout: {
    en: 'Low battery reserve: below 20 kWh, life support runs in reduced-power mode',
    az: 'Aşağı batareya ehtiyatı: 20 kVt·saatdan az olduqda həyat təminatı azaldılmış güclə işləyir',
  },
  blackout: {
    en: 'Habitat power outage: demand exceeds supply and battery energy',
    az: 'Yaşayış modulunda enerji kəsintisi: tələb mövcud təchizatı və batareya ehtiyatını aşır',
  },
};

/* ------------------------------------------------------------------ */
/* Core: runSimulation                                                */
/* ------------------------------------------------------------------ */

function hourlyStormDose(protection: Choice['stormProtection'], hour: number, flags: ReadonlySet<FlagId>): number {
  if (!protection) return 0;
  const transmission = protection === 'finishEva' && hour < 24
    ? SHIELDING.evaSuit
    : protection === 'shelter'
      ? flags.has('regolithBerm') ? SHIELDING.regolithBerm : SHIELDING.waterWall
      : SHIELDING.habitat;
  return integrateSepDoseMsv(hour, hour + 1) * transmission;
}

function roundedResources(resources: ResourceState): ResourceState {
  const snapshot = { ...resources };
  for (const key of Object.keys(snapshot) as Array<keyof ResourceState>) {
    snapshot[key] = Math.round(snapshot[key] * 1000) / 1000;
  }
  return snapshot;
}

export function runSimulation(
  choiceIndices: readonly number[],
  { solarCalibrated = false, icePrepared = false }: { solarCalibrated?: boolean; icePrepared?: boolean } = {},
): SimulationResult {
  const choices = choiceIndices.slice(0, MISSION_DECISIONS.length);
  for (const [i, choiceIndex] of choices.entries()) {
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 2) {
      throw new RangeError(`runSimulation: invalid choice index ${choiceIndex} at decision ${i + 1}`);
    }
  }

  const history = [{ ...K.initialState }];
  const resources = { ...INITIAL_RESOURCES };
  const resourceHistory = [{ ...resources }];
  const steps: StepRecord[] = [];
  const flags = new Set<FlagId>();
  let batteryKwh = K.initialState.powerKwh;
  let doseMsv = K.initialState.radiationMsv;
  let sciencePoints = K.initialState.sciencePoints;
  let orientationFactor = 1;
  let elapsedHours = 0;
  let doseWarningStep: number | null = null;
  let abortCause: AbortCause | null = null;
  let appliedIcePreparation = false;

  for (const [i, choiceIndex] of choices.entries()) {
    const decision = MISSION_DECISIONS[i];
    const choice = decision.choices[choiceIndex];
    const usePreparedExtractor = icePrepared && choice.id === 'D4-A';
    appliedIcePreparation ||= usePreparedExtractor;
    const { startHour, endHour } = decision.phase;
    const phaseHours = endHour - startHour;
    const before = history[i];
    const reservePctBefore = crewReservePct(resources);
    const doseWarningBefore = doseWarningStep !== null;
    const resourcesBefore = resourceHistory[i];
    const flagsBefore = [...flags].sort();
    const activeConditionals = (choice.conditionals ?? []).filter((conditional) => flags.has(conditional.ifFlag));
    const conditionalsApplied = activeConditionals.map((conditional) => conditional.ifFlag);
    const choiceEffects = { ...choice.effects };
    const combinedEffects = zero();
    addInto(combinedEffects, choiceEffects);
    for (const conditional of activeConditionals) addInto(combinedEffects, conditional.effects);

    if (choice.solarIncidenceDeg !== undefined) {
      const incidenceDeg = solarCalibrated
        ? Math.min(choice.solarIncidenceDeg, CALIBRATED_INCIDENCE_LIMIT_DEG)
        : choice.solarIncidenceDeg;
      orientationFactor = Math.max(0, Math.cos(incidenceDeg * Math.PI / 180));
    }

    const power = newEnvironmentDetail(orientationFactor);
    const powerPlan = phasePowerPlan(choice, activeConditionals, phaseHours);
    const resourceFlows = emptyResourceFlows();
    let stormDoseMsv = 0;

    for (let hour = startHour; hour < endHour; hour++) {
      const frame = advancePower(power, powerPlan, hour, flags, resources, batteryKwh);
      batteryKwh = frame.batteryKwh;
      const healthDelta = combinedEffects.lifeSupportPct / phaseHours -
        (K.lifeSupportDrainPctPerDay +
          (frame.lowPower ? K.brownoutLifeSupportPenalty : 0) +
          (frame.outage ? K.blackoutLifeSupportPenalty : 0)) / 24;
      advanceResources(resources, resourceFlows, choice, phaseHours, healthDelta,
        frame.lowPower, frame.outage, frame.cropPowered, frame.taskPowerFraction, usePreparedExtractor);

      const stormHourDose = hourlyStormDose(choice.stormProtection, hour - startHour, flags);
      stormDoseMsv += stormHourDose;
      doseMsv += K.gcrMsvPerDay / 24 + combinedEffects.radiationMsv / phaseHours + stormHourDose;
      if (doseWarningStep === null && doseMsv >= RADIATION_LIMITS.missionWarningMsv) doseWarningStep = i + 1;

      elapsedHours = hour + 1;
      abortCause = depletionCause(resources);
      if (abortCause) break;
    }

    if (!abortCause) {
      for (const flag of choice.setsFlags ?? []) flags.add(flag);
      if (flags.has('greenhouse') && resources.cropGrowthDays === 0) resources.cropGrowthDays = CROP_TRIAL.ageAtInstallDays;
    }

    const fractionElapsed = power.simulatedHours / phaseHours;
    const durationDays = power.simulatedHours / 24;
    const taskFraction = power.taskLoadKwh === 0 ? 1 : (power.taskLoadKwh - power.unservedTaskKwh) / power.taskLoadKwh;
    const phaseScience = abortCause ? 0 : combinedEffects.sciencePoints * taskFraction;
    const cropScience = resources.harvestedFoodKg > resourcesBefore.harvestedFoodKg ? CROP_TRIAL.sciencePoints : 0;
    let phaseScienceEarned = phaseScience + cropScience;
    const rulesTriggered: RuleId[] = [];
    const env = summarizeEnvironment(power);
    const contributions: Contribution[] = [
      {
        source: 'environment',
        delta: {
          powerKwh: r1(power.generationKwh - power.loadKwh - power.heaterKwh),
          lifeSupportPct: r1(-K.lifeSupportDrainPctPerDay * durationDays),
          radiationMsv: r1(K.gcrMsvPerDay * durationDays),
        },
        label: {
          en: `Environment (${power.simulatedHours} h): solar generation, base load, heaters, equipment wear and background dose`,
          az: `Mühit (${power.simulatedHours} saat): günəş enerjisi, əsas yük, qızdırıcılar, avadanlığın köhnəlməsi və fon dozası`,
        },
      },
      {
        source: 'choice',
        label: choice.label,
        delta: {
          powerKwh: r1((choiceEffects.powerKwh ?? 0) * fractionElapsed),
          lifeSupportPct: r1((choiceEffects.lifeSupportPct ?? 0) * fractionElapsed),
          radiationMsv: r1((choiceEffects.radiationMsv ?? 0) * fractionElapsed + stormDoseMsv),
          sciencePoints: r1(abortCause ? 0 : (choiceEffects.sciencePoints ?? 0) * taskFraction),
        },
      },
    ];

    for (const conditional of activeConditionals) {
      contributions.push({
        source: 'conditional',
        flag: conditional.ifFlag,
        label: conditional.note,
        delta: {
          powerKwh: r1((conditional.effects.powerKwh ?? 0) * fractionElapsed),
          lifeSupportPct: r1((conditional.effects.lifeSupportPct ?? 0) * fractionElapsed),
          radiationMsv: r1((conditional.effects.radiationMsv ?? 0) * fractionElapsed),
          sciencePoints: r1(abortCause ? 0 : (conditional.effects.sciencePoints ?? 0) * taskFraction),
        },
      });
    }

    if (power.greenhouseLoadKwh > 0) {
      contributions.push({
        source: 'choice',
        label: { en: 'Crop trial lights and harvest research', az: 'Bitki sınağının işıqlandırılması və məhsul tədqiqatı' },
        delta: { powerKwh: r1(-power.greenhouseLoadKwh), sciencePoints: cropScience },
      });
    }

    if (power.unservedTaskKwh > 0 && taskFraction < 1) {
      contributions.push({
        source: 'rule',
        label: { en: 'Unpowered task time yields less science', az: 'Enerjisiz tapşırıq vaxtı daha az elmi nəticə verir' },
        delta: {},
      });
    }

    const applyRule = (rule: RuleId, delta: MetricDelta) => {
      rulesTriggered.push(rule);
      contributions.push({ source: 'rule', ruleId: rule, delta, label: RULE_LABELS[rule] });
    };
    const gateScience = (rule: RuleId) => {
      const lost = Math.max(0, phaseScienceEarned) * (1 - K.scienceGateFactor);
      phaseScienceEarned -= lost;
      applyRule(rule, { sciencePoints: r1(-lost) });
    };
    if (reservePctBefore < K.survivalFocusThresholdPct) gateScience('survivalFocus');
    if (doseWarningBefore) gateScience('doseRestriction');
    if (power.lowPowerHours > 0) {
      applyRule('brownout', { lifeSupportPct: r1(-K.brownoutLifeSupportPenalty * power.lowPowerHours / 24) });
    }
    if (power.outageHours > 0) {
      const outageDays = power.outageHours / 24;
      phaseScienceEarned -= K.blackoutSciencePenalty * outageDays;
      applyRule('blackout', {
        lifeSupportPct: r1(-K.blackoutLifeSupportPenalty * outageDays),
        sciencePoints: r1(-K.blackoutSciencePenalty * outageDays),
      });
    }

    sciencePoints = clamp(sciencePoints + phaseScienceEarned, 0, 100);
    const after: MetricState = {
      powerKwh: r1(batteryKwh),
      lifeSupportPct: r1(abortCause ? 0 : crewReservePct(resources)),
      radiationMsv: r1(doseMsv),
      sciencePoints: r1(sciencePoints),
    };
    const delta = metricDifference(before, after);
    const listed = zero();
    for (const contribution of contributions) addInto(listed, contribution.delta);
    const balanceAdjustment = metricDifference(listed, delta);
    if (METRIC_KEYS.some((key) => balanceAdjustment[key] !== 0)) {
      contributions.push({
        source: 'rule',
        delta: balanceAdjustment,
        label: {
          en: 'Ledger adjustment: storage limits, unserved load, limiting supply and rounding',
          az: 'Balans düzəlişi: saxlama hədləri, qarşılanmayan yük, məhdudlaşdırıcı ehtiyat və yuvarlaqlaşdırma',
        },
      });
    }

    const resourcesAfter = roundedResources(resources);
    history.push(after);
    resourceHistory.push(resourcesAfter);
    steps.push({
      step: i + 1,
      startHour,
      endHour: elapsedHours,
      choiceIndex,
      choiceId: choice.id,
      before,
      after,
      delta,
      env,
      resourcesBefore,
      resourcesAfter,
      resourceFlows,
      contributions,
      rulesTriggered,
      conditionalsApplied,
      flagsBefore,
      flagsAfter: [...flags].sort(),
    });
    if (abortCause) break;
  }

  const final = history[history.length - 1];
  const complete = abortCause !== null || choices.length === MISSION_DECISIONS.length;
  let outcome: Outcome = 'in-progress';
  let score: number | null = null;
  if (complete) {
    if (abortCause) outcome = 'abort';
    else if (crewReservePct(resources) >= K.survivalFocusThresholdPct &&
        doseWarningStep === null && batteryKwh > 0) outcome = 'success';
    else outcome = 'warning';
    score = missionScore(final, outcome);
  }

  return {
    choices,
    solarCalibrated: choices.length > 0 && solarCalibrated,
    icePrepared: appliedIcePreparation,
    history,
    steps,
    final,
    resourceHistory,
    resources: resourceHistory[resourceHistory.length - 1],
    elapsedHours,
    flags: [...flags].sort(),
    complete,
    outcome,
    score,
    doseWarningStep,
    lifeSupportDepletedStep: abortCause ? steps.length : null,
    abortCause,
  };
}

/** Safety multiplier applied to the mission score. */
export const OUTCOME_MULTIPLIER: Record<Exclude<Outcome, 'in-progress'>, number> = {
  success: 1,
  warning: 0.8,
  abort: 0.4,
};

/** Mission score = (S + 0.25·LS + 0.15·P − 2·max(0, R − 50)) × safety multiplier. */
export function missionScore(s: MetricState, outcome: Exclude<Outcome, 'in-progress'>): number {
  const raw =
    s.sciencePoints + 0.25 * s.lifeSupportPct + 0.15 * s.powerKwh -
    2 * Math.max(0, s.radiationMsv - RADIATION_LIMITS.missionWarningMsv);
  return Math.round(raw * OUTCOME_MULTIPLIER[outcome]);
}

/* ------------------------------------------------------------------ */
/* Rewind & Compare                                                   */
/* ------------------------------------------------------------------ */

export type ComparisonReason =
  | { kind: 'solarCalibrationChanged'; from: boolean; to: boolean }
  | { kind: 'icePreparationChanged'; from: boolean; to: boolean }
  | { kind: 'choiceChanged'; step: number; fromIndex: number; toIndex: number }
  | { kind: 'ruleAvoided'; step: number; rule: RuleId }
  | { kind: 'ruleTriggered'; step: number; rule: RuleId }
  | { kind: 'conditionalGained'; step: number; flag: FlagId; note: Bilingual }
  | { kind: 'conditionalLost'; step: number; flag: FlagId; note: Bilingual }
  | { kind: 'doseWarning'; stepA: number | null; stepB: number | null };

export interface RunComparison {
  changedSteps: number[];
  firstDivergence: number | null;
  finalDelta: MetricState;
  scoreDelta: number | null;
  reasons: ComparisonReason[];
}

/** Explains, deterministically, why Run B ended differently from Run A. */
export function compareRuns(a: SimulationResult, b: SimulationResult): RunComparison {
  const n = Math.min(a.steps.length, b.steps.length);
  const reasons: ComparisonReason[] = [];
  const changedSteps: number[] = [];
  const calibrationChanged = n > 0 && a.solarCalibrated !== b.solarCalibrated;
  const icePreparationChanged = n >= 4 && a.icePrepared !== b.icePrepared;
  if (calibrationChanged) {
    reasons.push({ kind: 'solarCalibrationChanged', from: a.solarCalibrated, to: b.solarCalibrated });
  }

  for (let i = 0; i < n; i++) {
    const sa = a.steps[i];
    const sb = b.steps[i];
    const preparationChanged = i === 3 && icePreparationChanged;
    if (sa.choiceIndex !== sb.choiceIndex || (i === 0 && calibrationChanged) || preparationChanged) {
      changedSteps.push(i + 1);
    }
    if (sa.choiceIndex !== sb.choiceIndex) {
      reasons.push({ kind: 'choiceChanged', step: i + 1, fromIndex: sa.choiceIndex, toIndex: sb.choiceIndex });
    }
    if (preparationChanged) {
      reasons.push({ kind: 'icePreparationChanged', from: a.icePrepared, to: b.icePrepared });
    }
  }
  for (let i = 0; i < n; i++) {
    const sa = a.steps[i];
    const sb = b.steps[i];
    for (const r of sa.rulesTriggered) if (!sb.rulesTriggered.includes(r)) reasons.push({ kind: 'ruleAvoided', step: i + 1, rule: r });
    for (const r of sb.rulesTriggered) if (!sa.rulesTriggered.includes(r)) reasons.push({ kind: 'ruleTriggered', step: i + 1, rule: r });
    // Conditional effects only compare when the same choice was made at this step.
    if (sa.choiceIndex === sb.choiceIndex) {
      const choice = MISSION_DECISIONS[i].choices[sa.choiceIndex];
      for (const c of choice.conditionals ?? []) {
        const inA = sa.conditionalsApplied.includes(c.ifFlag);
        const inB = sb.conditionalsApplied.includes(c.ifFlag);
        if (inB && !inA) reasons.push({ kind: 'conditionalGained', step: i + 1, flag: c.ifFlag, note: c.note });
        if (inA && !inB) reasons.push({ kind: 'conditionalLost', step: i + 1, flag: c.ifFlag, note: c.note });
      }
    }
  }
  if (a.doseWarningStep !== b.doseWarningStep) {
    reasons.push({ kind: 'doseWarning', stepA: a.doseWarningStep, stepB: b.doseWarningStep });
  }

  const finalDelta = zero();
  for (const k of METRIC_KEYS) finalDelta[k] = r1(b.final[k] - a.final[k]);

  return {
    changedSteps,
    firstDivergence: changedSteps.length ? changedSteps[0] : null,
    finalDelta,
    scoreDelta: a.score !== null && b.score !== null ? b.score - a.score : null,
    reasons,
  };
}

/** Preview the deltas a choice WOULD apply given flags held before the step (for the decision card). */
export function previewChoiceEffects(step: number, choiceIndex: number, flagsBefore: readonly FlagId[]): {
  base: MetricDelta;
  conditionals: Array<{ flag: FlagId; effects: MetricDelta; note: Bilingual; active: boolean }>;
} {
  const choice = MISSION_DECISIONS[step - 1].choices[choiceIndex];
  return {
    base: choice.effects,
    conditionals: (choice.conditionals ?? []).map((c) => ({
      flag: c.ifFlag,
      effects: c.effects,
      note: c.note,
      active: flagsBefore.includes(c.ifFlag),
    })),
  };
}
