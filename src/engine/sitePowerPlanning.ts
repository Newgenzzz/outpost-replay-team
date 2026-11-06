import { GAME_CONSTANTS } from '../data/nasaTelemetry';
import type { LUNAR_PLANNING_SITES } from '../data/lunarSiteIntelligence';

/** Screen a candidate with an ideal Sun-tracking array and a constant base load. */
export function estimateSitePower(site: (typeof LUNAR_PLANNING_SITES)[number], reserveKwh: number) {
  const meanGenerationKwhPerDay = GAME_CONSTANTS.generationKwhPerDay * site.meanIlluminationPct / 100;
  const shadowEnergyKwh = GAME_CONSTANTS.baseLoadKwhPerDay * site.longestShadowHours / 24;
  return {
    meanGenerationKwhPerDay,
    shadowEnergyKwh,
    reserveMarginKwh: reserveKwh - shadowEnergyKwh,
  };
}
