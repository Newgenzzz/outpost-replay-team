import type { TrainingMode } from '../types';
import { cloneRunInput, createRunInput, type RunInput } from './runInput';
import { recordShadowPrediction, type ShadowPrediction } from './shadowPrediction';

export interface SharedReplay {
  a: RunInput;
  b: RunInput | null;
  m: TrainingMode;
  prediction?: ShadowPrediction | null;
}

export interface ParsedSharedReplay extends SharedReplay {
  legacy: boolean;
  prediction: ShadowPrediction | null;
}

const BOOLEAN_TASKS = ['solarCalibrated', 'icePrepared', 'eclssSealed', 'busPatched', 'stormClamped', 'dishAligned'] as const;
const TASK_KEYS = [...BOOLEAN_TASKS, 'extraIceCores', 'fieldSamplesCount'];
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const onlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every((key) => keys.includes(key));
const validCount = (value: unknown, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
const validPeak = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5000;

function validatedInput(value: unknown): RunInput {
  if (!record(value) || !onlyKeys(value, ['scenario', 'phases']) || !record(value.scenario) ||
      !onlyKeys(value.scenario, ['stormPeakPfu']) || !validPeak(value.scenario.stormPeakPfu) ||
      !Array.isArray(value.phases) || value.phases.length > 6) throw new RangeError('Invalid replay input.');
  for (const phase of value.phases) {
    if (!record(phase) || !onlyKeys(phase, ['choiceIndex', 'tasks']) || !validCount(phase.choiceIndex, 2)) {
      throw new RangeError('Invalid replay phase.');
    }
    const tasks = phase.tasks;
    if (!record(tasks) || !onlyKeys(tasks, TASK_KEYS) ||
        !BOOLEAN_TASKS.every((key) => typeof tasks[key] === 'boolean') ||
        !validCount(tasks.extraIceCores, 5) || !validCount(tasks.fieldSamplesCount, 6)) {
      throw new RangeError('Invalid replay phase.');
    }
  }
  return cloneRunInput(value as unknown as RunInput);
}

function validatedPrediction(value: unknown): ShadowPrediction | null {
  if (value === undefined || value === null) return null;
  if (!record(value) || !onlyKeys(value, ['expected', 'context']) ||
      !['backup', 'drill', 'tie'].includes(value.expected as string)) throw new RangeError('Invalid prediction.');
  const context = validatedInput(value.context);
  if (context.phases.length !== 3) throw new RangeError('Invalid prediction context.');
  return recordShadowPrediction(value.expected as ShadowPrediction['expected'], context);
}

/** Complete immutable inputs, never an exported result or personal callsign. */
export function encodeSharedReplayUrl(baseUrl: string, replay: SharedReplay): string {
  const base = new URL(baseUrl);
  base.search = '';
  base.hash = '';
  const a = validatedInput(replay.a);
  if (a.phases.length === 0) return base.toString();
  const b = replay.b === null ? null : validatedInput(replay.b);
  if (replay.m !== 'cadet' && replay.m !== 'engineer') throw new RangeError('Invalid training mode.');
  const prediction = validatedPrediction(replay.prediction);
  const payload = { v: 2, a, b, m: replay.m, ...(prediction ? { prediction } : {}) };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  base.searchParams.set('m', btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  return base.toString();
}

/** Invalid links fail closed. Legacy links explicitly report assumed preparation defaults. */
export function parseSharedReplayFromUrl(url: string): ParsedSharedReplay | null {
  try {
    const raw = new URL(url).searchParams.get('m');
    if (!raw || raw.length > 32768 || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
    const json = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
    const value: unknown = JSON.parse(json);
    if (!record(value)) return null;
    if (value.v === 2) {
      if (!onlyKeys(value, ['v', 'a', 'b', 'm', 'prediction']) || (value.m !== 'cadet' && value.m !== 'engineer')) return null;
      const a = validatedInput(value.a);
      if (a.phases.length === 0) return null;
      const b = value.b === null || value.b === undefined ? null : validatedInput(value.b);
      return { a, b, m: value.m, legacy: false, prediction: validatedPrediction(value.prediction) };
    }
    if (value.v !== undefined || !onlyKeys(value, ['a', 'b', 'm', 'p'])) return null;
    const validChoices = (choices: unknown): choices is number[] => Array.isArray(choices) && choices.length <= 6 && choices.every((choice) => validCount(choice, 2));
    if (!validChoices(value.a) || value.a.length === 0 || (value.b !== undefined && value.b !== null && !validChoices(value.b)) ||
        (value.p !== undefined && !validPeak(value.p)) || (value.m !== undefined && value.m !== 'cadet' && value.m !== 'engineer')) return null;
    const tasks = value.p === undefined ? {} : { stormPeakPfu: value.p as number };
    return {
      a: createRunInput(value.a, tasks),
      b: value.b === undefined || value.b === null ? null : createRunInput(value.b as number[], tasks),
      m: value.m === 'engineer' ? 'engineer' : 'cadet', legacy: true, prediction: null,
    };
  } catch {
    return null;
  }
}
