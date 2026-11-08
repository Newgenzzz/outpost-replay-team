/** Shared domain types for Outpost Replay. */

export type Lang = 'en' | 'az';
export type TrainingMode = 'cadet' | 'engineer';
export type StormPresetId = 'may2024' | 'sept2017' | 'quiet' | 'live';

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

export interface HourlyTelemetryPoint {
  hour: number;
  powerKwh: number;
  lifeSupportPct: number;
  radiationMsv: number;
  sciencePoints: number;
  oxygenKg: number;
  waterKg: number;
  foodKg: number;
  surfaceTempK: number;
  sunlightPct: number;
  lowPower: boolean;
  outage: boolean;
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
  /** Kid-friendly summary shown in Junior Cadet (Ages 7–12) mode. */
  cadetLabel?: Bilingual;
  cadetSummary?: Bilingual;
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
  nasaSourceCitation: Bilingual;
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
  cadetTitle?: Bilingual;
  context: Bilingual;
  cadetContext?: Bilingual;
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

/** Optional engineering preparations and field discoveries recorded as mission inputs. */
export interface MissionTaskSettings {
  solarCalibrated: boolean;
  icePrepared: boolean;
  eclssSealed?: boolean;
  busPatched?: boolean;
  extraIceCores?: number;
  stormClamped?: boolean;
  dishAligned?: boolean;
  fieldSamplesCount?: number;
  stormPeakPfu?: number;
}
