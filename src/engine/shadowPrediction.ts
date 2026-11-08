import type { SimulationResult } from './simulation';
import { cloneRunInput, getPhaseContext, type RunInput } from './runInput';

export type ShadowStrategy = 'backup' | 'drill' | 'tie';
export interface ShadowPrediction {
  expected: ShadowStrategy;
  /** The committed setup through D3, independent of later mission plans. */
  context: RunInput;
}

export function recordShadowPrediction(expected: ShadowStrategy, input: RunInput): ShadowPrediction {
  if (!['backup', 'drill', 'tie'].includes(expected) || input.phases.length < 3) {
    throw new RangeError('A prediction requires a valid strategy and a committed D3 setup.');
  }
  return Object.freeze({ expected, context: cloneRunInput({ scenario: input.scenario, phases: input.phases.slice(0, 3) }) });
}

function hasSameSetup(prediction: ShadowPrediction, input: RunInput): boolean {
  if (input.scenario.stormPeakPfu !== prediction.context.scenario.stormPeakPfu || input.phases.length < 2) return false;
  for (let index = 0; index < Math.min(3, input.phases.length); index++) {
    const expected = prediction.context.phases[index];
    if (!expected || (index < 2 && input.phases[index].choiceIndex !== expected.choiceIndex)) return false;
    const actualContext = { ...getPhaseContext(input, index), ...(index === 2 ? { choiceIndex: 0 } : {}) };
    const expectedContext = { ...getPhaseContext(prediction.context, index), ...(index === 2 ? { choiceIndex: 0 } : {}) };
    if (JSON.stringify(actualContext) !== JSON.stringify(expectedContext)) return false;
  }
  return true;
}

/** Compare actual D3 endpoints only when all relevant non-choice inputs match. */
export function evaluateShadowPrediction(prediction: ShadowPrediction, a: SimulationResult, b: SimulationResult | null) {
  const runs = b ? [a, b] : [a];
  if (!runs.every((run) => hasSameSetup(prediction, run.input))) return { status: 'changed' as const };
  const backup = runs.find((run) => run.steps[2]?.choiceId === 'D3-B')?.steps[2];
  const drill = runs.find((run) => run.steps[2]?.choiceId === 'D3-C')?.steps[2];
  if (!backup || !drill) return { status: 'pending' as const };
  if (backup.endHour !== 120 || drill.endHour !== 120) return { status: 'incomplete' as const };
  const difference = Math.round((backup.after.powerKwh - drill.after.powerKwh) * 10) / 10;
  const actual: ShadowStrategy = difference === 0 ? 'tie' : difference > 0 ? 'backup' : 'drill';
  return { status: actual === prediction.expected ? 'supported' as const : 'contradicted' as const,
    backupKwh: backup.after.powerKwh, drillKwh: drill.after.powerKwh };
}
