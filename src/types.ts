/** Shared domain types for Outpost Replay. */

export type Lang = 'en' | 'az';

/** Every learner-facing string in the data layer is bilingual. */
export interface Bilingual {
  en: string;
  az: string;
}

export interface MetricState {
  /** Battery reserve, 0–100 game units (1 unit = 1 kWh). */
  powerKwh: number;
  /** ECLSS health + consumables margin, 0–100 %. */
  lifeSupportPct: number;
  /** Cumulative crew effective dose in mSv (no upper clamp). */
  radiationMsv: number;
  /** Mission science return, 0–100 points. */
  sciencePoints: number;
}

export type MetricKey = keyof MetricState;
export type MetricDelta = Partial<MetricState>;

/** State flags set by choices and read by later steps (cross-decision coupling). */
export type FlagId = 'tallMast' | 'regolithBerm' | 'isruOxygen' | 'fuelCellsSpent' | 'greenhouse';

/** Stores and equipment state for the two-person crew. */
export interface ResourceState {
  oxygenKg: number;
  waterKg: number;
  /** Packaged ration equivalents, adjusted for the small food value of fresh greens. */
  foodKg: number;
  cropGrowthDays: number;
  harvestedFoodKg: number;
  eclssHealthPct: number;
}

export type AbortCause = 'oxygen' | 'water' | 'food' | 'equipment';

export interface ConditionalEffect {
  /** Applies only when this flag was set by an EARLIER decision. */
  ifFlag: FlagId;
  effects: MetricDelta;
  /** Positive energy normally offsets task load. Use generation for added supply. */
  powerStrategy?: 'generation';
  note: Bilingual;
}

export interface Choice {
  id: string;
  label: Bilingual;
  /** Deterministic base changes applied when this choice is made. */
  effects: MetricDelta;
  resourceEffects?: Partial<Pick<ResourceState, 'oxygenKg' | 'waterKg' | 'foodKg'>>;
  /** Fictional feedstock processed with LCROSS's Cabeus ice fraction as a reference. */
  iceProcessingKg?: number;
  solarIncidenceDeg?: number;
  powerStrategy?: 'load-shed' | 'backup';
  /** Additional percentage points of water recovery for this phase. */
  waterRecoveryBonusPct?: number;
  stormProtection?: 'finishEva' | 'habitat' | 'shelter';
  setsFlags?: FlagId[];
  conditionals?: ConditionalEffect[];
  causeAndEffectExplanation: Bilingual;
  nasaSourceCitation: string;
  copilotRecommendation?: boolean;
  copilotBadge?: Bilingual;
  copilotTip?: Bilingual;
  riskLevel?: 'safe' | 'moderate' | 'critical';
}

export type NasaTriggerSource = 'LRO_SHADOW' | 'DONKI_SEP';

export interface NasaDataTrigger {
  source: NasaTriggerSource;
  headline: Bilingual;
  detail: Bilingual;
  citationIds: string[];
}

export interface Decision {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  title: Bilingual;
  context: Bilingual;
  phase: { startHour: number; endHour: number; label: Bilingual };
  nasaDataTrigger: NasaDataTrigger | null;
  choices: [Choice, Choice, Choice];
}

export interface Citation {
  id: string;
  short: string;
  full: string;
  url: string;
  agency: 'NASA' | 'NASA/NOAA' | 'Peer-reviewed (NASA mission data)';
}
