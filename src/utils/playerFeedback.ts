import { getPhaseContext, type RunInput } from '../engine/runInput';

/** Compare effective phase preparations, excluding the choice shown separately in replay. */
export function phasePreparationChanged(a: RunInput, b: RunInput, index: number): boolean {
  const left = getPhaseContext(a, index);
  const right = getPhaseContext(b, index);
  if (!left || !right) return false;
  return Object.keys(left).some(key => key !== 'choiceIndex' && key !== 'stormPeakPfu' &&
    left[key as keyof typeof left] !== right[key as keyof typeof right]);
}
