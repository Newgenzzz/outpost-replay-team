import { GAME_CONSTANTS, RADIATION_LIMITS } from '../data/nasaTelemetry';
import type { SimulationResult } from '../engine/simulation';
import type { AudioMusicState, SoundEffectType } from './soundEffects';

/** Audio follows the latest computed run, never the historical phase being inspected. */
export function missionMusicState(menu: boolean, run: SimulationResult): AudioMusicState {
  if (menu) return 'menu';
  return run.outcome === 'abort' || run.final.powerKwh < GAME_CONSTANTS.brownoutThresholdKwh ||
    run.final.lifeSupportPct < GAME_CONSTANTS.survivalFocusThresholdPct ||
    run.final.radiationMsv >= RADIATION_LIMITS.missionWarningMsv ? 'critical' : 'exploration';
}

/** Called only when a decision is committed. One prioritized cue avoids alarm stacking. */
export function decisionAudioCue(previous: SimulationResult, next: SimulationResult, step: number): SoundEffectType {
  if (next.outcome === 'abort' && previous.outcome !== 'abort') return 'failure';
  if (next.complete && next.outcome === 'success' && previous.outcome !== 'success') return 'success';
  if (next.final.powerKwh < GAME_CONSTANTS.brownoutThresholdKwh &&
      (previous.final.powerKwh >= GAME_CONSTANTS.brownoutThresholdKwh || next.complete && !previous.complete)) return 'batteryAlert';
  if (next.final.radiationMsv >= RADIATION_LIMITS.missionWarningMsv &&
      previous.final.radiationMsv < RADIATION_LIMITS.missionWarningMsv) return 'stormAlert';
  if (step === 3 && next.steps[2]?.choiceId === 'D3-B') return 'backup';
  return 'choice';
}
