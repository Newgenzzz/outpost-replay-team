import { MAY_2024_PROTON_EVENT } from '../data/nasaTelemetry';
import type { MissionTaskSettings } from '../types';

/** A complete, immutable record of the field settings committed with one choice. */
export interface PhaseTaskSettings {
  readonly solarCalibrated: boolean;
  readonly icePrepared: boolean;
  readonly eclssSealed: boolean;
  readonly busPatched: boolean;
  readonly extraIceCores: number;
  readonly stormClamped: boolean;
  readonly dishAligned: boolean;
  readonly fieldSamplesCount: number;
}

export interface RunInput {
  readonly scenario: { readonly stormPeakPfu: number };
  readonly phases: readonly {
    readonly choiceIndex: number;
    readonly tasks: PhaseTaskSettings;
  }[];
}

const BOOLEAN_KEYS = [
  'solarCalibrated', 'icePrepared', 'eclssSealed', 'busPatched', 'stormClamped', 'dishAligned',
] as const;

export function normalizeStormPeakPfu(value: number = MAY_2024_PROTON_EVENT.peakPfu): number {
  if (!Number.isFinite(value) || value < 0 || value > 5000) {
    throw new RangeError('Storm peak must be a finite number from 0 to 5000 pfu');
  }
  return value;
}

/** Defaults are explicit; truthy strings and fractional/out-of-range counts are rejected. */
export function normalizePhaseTasks(tasks: Partial<PhaseTaskSettings> = {}): PhaseTaskSettings {
  if (!tasks || typeof tasks !== 'object' || Array.isArray(tasks)) {
    throw new TypeError('Phase tasks must be an object');
  }
  for (const key of BOOLEAN_KEYS) {
    if (tasks[key] !== undefined && typeof tasks[key] !== 'boolean') {
      throw new TypeError(`${key} must be a boolean`);
    }
  }
  const count = (key: 'extraIceCores' | 'fieldSamplesCount', maximum: number) => {
    const value = tasks[key] === undefined ? 0 : tasks[key];
    if (!Number.isInteger(value) || value < 0 || value > maximum) {
      throw new RangeError(`${key} must be an integer from 0 to ${maximum}`);
    }
    return value;
  };
  return Object.freeze({
    solarCalibrated: tasks.solarCalibrated ?? false,
    icePrepared: tasks.icePrepared ?? false,
    eclssSealed: tasks.eclssSealed ?? false,
    busPatched: tasks.busPatched ?? false,
    extraIceCores: count('extraIceCores', 5),
    stormClamped: tasks.stormClamped ?? false,
    dishAligned: tasks.dishAligned ?? false,
    fieldSamplesCount: count('fieldSamplesCount', 6),
  });
}

function validateChoice(choiceIndex: number): number {
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 2) {
    throw new RangeError('Choice index must be an integer from 0 to 2');
  }
  return choiceIndex;
}

/** Copy and freeze at every input boundary so external drafts cannot rewrite a run. */
export function cloneRunInput(input: RunInput): RunInput {
  if (!input || !input.scenario || !Array.isArray(input.phases) || input.phases.length > 6) {
    throw new TypeError('Run input requires a scenario and up to six contiguous phases');
  }
  const phases = Array.from(input.phases, (phase) => {
    if (!phase || typeof phase !== 'object') throw new TypeError('Invalid phase snapshot');
    return Object.freeze({ choiceIndex: validateChoice(phase.choiceIndex), tasks: normalizePhaseTasks(phase.tasks) });
  });
  return Object.freeze({
    scenario: Object.freeze({ stormPeakPfu: normalizeStormPeakPfu(input.scenario.stormPeakPfu) }),
    phases: Object.freeze(phases),
  });
}

/** Legacy adapter: existing global settings become snapshots without changing their numerical effects. */
export function createRunInput(choices: readonly number[], legacyTasks: Partial<MissionTaskSettings> = {}): RunInput {
  const tasks = normalizePhaseTasks(legacyTasks);
  return cloneRunInput({
    scenario: { stormPeakPfu: normalizeStormPeakPfu(legacyTasks.stormPeakPfu) },
    phases: Array.from(choices.slice(0, 6), (choiceIndex) => ({ choiceIndex, tasks })),
  });
}

/** Recorded snapshots take precedence; the next unplanned choice inherits the last committed settings. */
export function getRunTasks(input: RunInput, step: number): MissionTaskSettings {
  if (!Number.isInteger(step) || step < 1 || step > 6) throw new RangeError('Step must be from 1 to 6');
  const tasks = input.phases[step - 1]?.tasks ?? input.phases[input.phases.length - 1]?.tasks ?? normalizePhaseTasks();
  return { ...tasks, stormPeakPfu: input.scenario.stormPeakPfu };
}

/** Replace exactly one snapshot, preserving all other planned/committed phases. */
export function applyRunChoice(input: RunInput, step: number, choiceIndex: number, tasks: MissionTaskSettings): RunInput {
  const original = cloneRunInput(input);
  if (!Number.isInteger(step) || step < 1 || step > 6 || step > original.phases.length + 1) {
    throw new RangeError('A choice must replace a phase or append the next phase without gaps');
  }
  const phases = [...original.phases];
  phases[step - 1] = { choiceIndex: validateChoice(choiceIndex), tasks: normalizePhaseTasks(tasks) };
  return cloneRunInput({ scenario: original.scenario, phases });
}

/** Only newly committed samples earn credit, even when a later snapshot has a lower count. */
function sampleCredit(input: RunInput, index: number): number {
  let previous = 0;
  for (let i = 0; i < index; i++) previous = Math.max(previous, input.phases[i].tasks.fieldSamplesCount);
  return Math.max(0, input.phases[index].tasks.fieldSamplesCount - previous);
}

/** Canonical effective inputs for a zero-based phase; suitable for replay/prediction equality. */
export function getPhaseContext(input: RunInput, index: number) {
  const phase = input.phases[index];
  if (!phase) return null;
  const t = phase.tasks;
  return {
    choiceIndex: phase.choiceIndex,
    solarCalibrated: index === 0 ? t.solarCalibrated : false,
    eclssSealed: index === 1 ? t.eclssSealed : false,
    busPatched: index === 2 ? t.busPatched : false,
    icePrepared: index === 3 && phase.choiceIndex === 0 ? t.icePrepared : false,
    extraIceCores: index === 3 && phase.choiceIndex === 0 ? t.extraIceCores : 0,
    stormClamped: index === 4 ? t.stormClamped : false,
    dishAligned: index === 5 ? t.dishAligned : false,
    fieldSamplesCount: sampleCredit(input, index),
    stormPeakPfu: index === 4 ? input.scenario.stormPeakPfu : null,
  };
}
