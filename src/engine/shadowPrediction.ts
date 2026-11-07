import type { SimulationResult } from './simulation';

export type ShadowStrategy = 'backup' | 'drill' | 'tie';
export interface ShadowPrediction {
  expected: ShadowStrategy;
  priorChoices: number[];
  solarCalibrated: boolean;
}

/** Compare the tested D3 endpoints, independently of the runs' later end times. */
export function evaluateShadowPrediction(prediction: ShadowPrediction, a: SimulationResult, b: SimulationResult | null) {
  const runs = b ? [a, b] : [a];
  const sameSetup = runs.every((run) => run.solarCalibrated === prediction.solarCalibrated &&
    prediction.priorChoices.length === 2 && prediction.priorChoices.every((choice, index) => run.choices[index] === choice));
  if (!sameSetup) return { status: 'changed' as const };
  const backup = runs.find((run) => run.steps[2]?.choiceId === 'D3-B')?.steps[2];
  const drill = runs.find((run) => run.steps[2]?.choiceId === 'D3-C')?.steps[2];
  if (!backup || !drill) return { status: 'pending' as const };
  if (backup.endHour !== 120 || drill.endHour !== 120) return { status: 'incomplete' as const };
  const difference = Math.round((backup.after.powerKwh - drill.after.powerKwh) * 10) / 10;
  const actual: ShadowStrategy = difference === 0 ? 'tie' : difference > 0 ? 'backup' : 'drill';
  return { status: actual === prediction.expected ? 'supported' as const : 'contradicted' as const,
    backupKwh: backup.after.powerKwh, drillKwh: drill.after.powerKwh };
}
