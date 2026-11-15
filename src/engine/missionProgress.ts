import type { Lang, MissionTaskSettings } from '../types';
import type { RunInput } from './runInput';
import { normalizePhaseTasks } from './runInput';
import { validateReplayInput, validateReplayPrediction } from './sharedReplay';
import type { ShadowPrediction } from './shadowPrediction';

export const MISSION_PROGRESS_KEY = 'outpost_mission_progress';

/** Save inputs and completed exploration only. Simulation results are always recalculated. */
export interface MissionProgress {
  a: RunInput;
  b: RunInput | null;
  pendingTasks: Record<number, Partial<MissionTaskSettings>>;
  calibratedTasks: boolean[];
  minedCrystals: boolean[];
  collectedSamples: boolean[];
  marsChoices: number[];
  prediction: ShadowPrediction | null;
  viewStep: number;
  debriefStep: number | null;
  demoStage: 'setup' | 'shadow' | 'rewind' | null;
  legacyReplay: boolean;
  lang: Lang;
}

const TASK_KEYS = ['solarCalibrated', 'icePrepared', 'eclssSealed', 'busPatched',
  'extraIceCores', 'stormClamped', 'dishAligned', 'fieldSamplesCount'];
const KEYS = ['v', 'a', 'b', 'pendingTasks', 'calibratedTasks', 'minedCrystals',
  'collectedSamples', 'marsChoices', 'prediction', 'viewStep', 'debriefStep', 'demoStage', 'legacyReplay', 'lang'];
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const step = (value: unknown): value is number => Number.isInteger(value) && typeof value === 'number' && value >= 1 && value <= 6;

function bools(value: unknown, count: number): boolean[] {
  if (!Array.isArray(value) || value.length !== count || !value.every((entry) => typeof entry === 'boolean')) {
    throw new RangeError('Invalid exploration progress.');
  }
  return [...value];
}

/** Bounded, versioned saves fail closed, including future schemas and incomplete settings. */
export function parseMissionProgress(raw: string | null): MissionProgress | null {
  try {
    if (!raw || raw.length > 32768) return null;
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.v !== 1 || Object.keys(value).some((key) => !KEYS.includes(key)) ||
        !step(value.viewStep) || (value.debriefStep !== null && !step(value.debriefStep)) ||
        (value.demoStage !== null && !['setup', 'shadow', 'rewind'].includes(value.demoStage as string)) ||
        typeof value.legacyReplay !== 'boolean' || (value.lang !== 'en' && value.lang !== 'az') ||
        !record(value.pendingTasks) || !Array.isArray(value.marsChoices) || value.marsChoices.length > 3 ||
        !value.marsChoices.every((choice) => Number.isInteger(choice) && choice >= 0 && choice <= 2)) return null;
    const a = validateReplayInput(value.a);
    const b = value.b === null ? null : validateReplayInput(value.b);
    if (value.viewStep > Math.min(6, (b ?? a).phases.length + 1) ||
        (value.debriefStep !== null && value.debriefStep > (b ?? a).phases.length)) return null;
    const pendingTasks: MissionProgress['pendingTasks'] = {};
    for (const [key, draft] of Object.entries(value.pendingTasks)) {
      if (!/^[1-6]$/.test(key) || !record(draft) || Object.keys(draft).some((task) => !TASK_KEYS.includes(task))) return null;
      normalizePhaseTasks(draft);
      // Keep drafts partial: adding defaults here would overwrite inherited preparation.
      pendingTasks[Number(key)] = { ...draft };
    }
    return {
      a, b, pendingTasks,
      calibratedTasks: bools(value.calibratedTasks, 6),
      minedCrystals: bools(value.minedCrystals, 5),
      collectedSamples: bools(value.collectedSamples, 6),
      marsChoices: [...value.marsChoices],
      prediction: validateReplayPrediction(value.prediction),
      viewStep: value.viewStep, debriefStep: value.debriefStep,
      demoStage: value.demoStage as MissionProgress['demoStage'], legacyReplay: value.legacyReplay, lang: value.lang,
    };
  } catch {
    return null;
  }
}

export function serializeMissionProgress(progress: MissionProgress): string {
  const raw = JSON.stringify({ v: 1, ...progress });
  if (!parseMissionProgress(raw)) throw new RangeError('Invalid mission progress.');
  return raw;
}
