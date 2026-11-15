/**
 * Published reference values and scripted mission inputs, bundled without runtime API calls.
 * See NASA_SCIENCE.md for provenance, units, coverage, and limitations.
 */
import type { Bilingual, Citation } from '../types';

/* ------------------------------------------------------------------ */
/* Citations                                                          */
/* ------------------------------------------------------------------ */

export const CITATIONS: Record<string, Citation> = {
  LOLA_ILLUM: {
    id: 'LOLA_ILLUM',
    short: 'Mazarico et al. 2011 (LRO/LOLA)',
    full: 'Mazarico, E., Neumann, G.A., Smith, D.E., Zuber, M.T., Torrence, M.H. (2011). Illumination conditions of the lunar polar regions using LOLA topography. Icarus 211(2), 1066–1081. doi:10.1016/j.icarus.2010.10.030',
    url: 'https://ntrs.nasa.gov/citations/20120010094',
    agency: 'Peer-reviewed (NASA mission data)',
  },
  DIVINER_COLDTRAPS: {
    id: 'DIVINER_COLDTRAPS',
    short: 'Paige et al. 2010 (LRO/Diviner)',
    full: "Paige, D.A., et al. (2010). Diviner Lunar Radiometer observations of cold traps in the Moon's south polar region. Science 330(6003), 479–482. doi:10.1126/science.1187726",
    url: 'https://pubs.usgs.gov/publication/70036393',
    agency: 'Peer-reviewed (NASA mission data)',
  },
  DIVINER_GLOBAL: {
    id: 'DIVINER_GLOBAL',
    short: 'Williams et al. 2017 (LRO/Diviner)',
    full: 'Williams, J.-P., Paige, D.A., Greenhagen, B.T., Sefton-Nash, E. (2017). The global surface temperatures of the Moon as measured by the Diviner Lunar Radiometer Experiment. Icarus 283, 300–325. doi:10.1016/j.icarus.2016.08.012',
    url: 'https://doi.org/10.1016/j.icarus.2016.08.012',
    agency: 'Peer-reviewed (NASA mission data)',
  },
  PDS_LRO: {
    id: 'PDS_LRO',
    short: 'NASA PDS Geosciences Node — LRO LOLA & Diviner archives',
    full: 'NASA Planetary Data System, Geosciences Node: Lunar Reconnaissance Orbiter LOLA and Diviner data archives.',
    url: 'https://pds-geosciences.wustl.edu/missions/lro/default.htm',
    agency: 'NASA',
  },
  LCROSS: {
    id: 'LCROSS',
    short: 'NASA LCROSS · Cabeus impact plume',
    full: 'Colaprete, A., et al. (2010). Detection of Water in the LCROSS Ejecta Plume. Science 330(6003), 463–468. doi:10.1126/science.1186986. See also NASA SMD-LUN-102 Rev A, p. 15.',
    url: 'https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf#page=15',
    agency: 'NASA',
  },
  DONKI: {
    id: 'DONKI',
    short: 'NASA CCMC DONKI · 8–14 May 2024 weekly report',
    full: 'NASA CCMC DONKI, 20240516-7D-001. Weekly Space Weather Summary for 8–14 May 2024. The GOES >10 MeV proton flux exceeded 10 pfu at 13:35 UTC on May 10.',
    url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/Alert/30944/1',
    agency: 'NASA',
  },
  GOES_PROTONS: {
    id: 'GOES_PROTONS',
    short: 'NOAA SWPC · GOES proton event summary (PRF 2541)',
    full: 'NOAA Space Weather Prediction Center, PRF 2541, 13 May 2024, p. 1. The 10 MeV channel at geosynchronous orbit peaked at 207 pfu on May 10 at 17:45 UTC.',
    url: 'https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf',
    agency: 'NASA/NOAA',
  },
  BVAD: {
    id: 'BVAD',
    short: 'NASA BVAD (NASA/TP-2015-218570/REV1)',
    full: 'Anderson, M.S., Ewert, M.K., Keener, J.F. (2018). Life Support Baseline Values and Assumptions Document. NASA/TP-2015-218570/REV1, NASA Johnson Space Center, Table 3-22 (p. 45), short-mission reference crewmember.',
    url: 'https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf',
    agency: 'NASA',
  },
  ISS_ECLSS: {
    id: 'ISS_ECLSS',
    short: 'NASA ISS ECLSS — 98 % water recovery (2023)',
    full: 'NASA (2023). International Space Station Environmental Control and Life Support System reaches ~98% water recovery (Brine Processor Assembly demonstration).',
    url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
    agency: 'NASA',
  },
  ISS_VEGGIE: {
    id: 'ISS_VEGGIE',
    short: 'NASA OSDR · VEG-01A lettuce trial',
    full: 'NASA Open Science Data Repository, VEG-01A. The first ISS Veggie lettuce test ran from May 8 to June 10, 2014 (33 days).',
    url: 'https://osdr.nasa.gov/bio/repo/data/payloads/VEG-01A',
    agency: 'NASA',
  },
  NASA_STD_3001: {
    id: 'NASA_STD_3001',
    short: 'NASA-STD-3001 Vol. 1 Rev C (600 mSv career limit)',
    full: 'NASA-STD-3001, NASA Space Flight Human-System Standard, Volume 1: Crew Health, Revision C (2023), §4.8.2. Career effective dose must stay below 600 mSv.',
    url: 'https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_1',
    agency: 'NASA',
  },
  CRATER: {
    id: 'CRATER',
    short: 'Schwadron et al. 2012 (LRO/CRaTER)',
    full: 'Schwadron, N.A., et al. (2012). Lunar radiation environment and space weathering from the Cosmic Ray Telescope for the Effects of Radiation (CRaTER). J. Geophys. Res. 117, E00H13. doi:10.1029/2011JE003978',
    url: 'https://doi.org/10.1029/2011JE003978',
    agency: 'Peer-reviewed (NASA mission data)',
  },
};

/* ------------------------------------------------------------------ */
/* Published lunar results and the scripted Shackleton rim scenario    */
/* ------------------------------------------------------------------ */

/** Fictional training setting near the rim. The published crater center is documented separately. */
export const TRAINING_SITE = {
  name: { en: 'Fictional outpost near Shackleton’s rim', az: 'Şeklton kənarı yaxınlığında uydurma baza' } as Bilingual,
};

export const LUNAR_RESEARCH = {
  /** Mazarico et al. modeled a particularly well-lit near-rim location. */
  nearRimContinuousSunlightDays: 240,
  nearRimLongestDarknessDays: 1.5,
  /** Paige et al. estimated subsurface temperature at the LCROSS Cabeus impact site. */
  cabeusSubsurfaceTempK: 38,
};

/** Observation-derived estimate for the single LCROSS impact site at Cabeus (9 Oct 2009). */
export const LCROSS_CABEUS = {
  waterIceMassFraction: 0.056,
  uncertaintyMassFraction: 0.029,
};

export interface LroSample {
  /** Mission elapsed hour (0 = touchdown). */
  hour: number;
  /** Scripted percent of the solar disk clearing the local horizon. */
  sunVisibilityPct: number;
  /** Scripted fraction of nominal solar output before engineering modifiers. */
  arrayOutputFactor: number;
  /** Scripted surface temperature, kelvin. */
  surfaceTempK: number;
}

/** The 72-hour topographic horizon shadow window (mission hours). */
export const LRO_SHADOW = {
  startHour: 48,
  endHour: 120,
  durationHours: 72,
  /** Solar array output drop during the shadow. */
  arrayOutputDropPct: 85,
  /** Minimum surface temperature reached during the shadow. */
  minSurfaceTempK: 90,
  minSurfaceTempC: -183,
};

/**
 * Scripted 216-hour (9-day) profile at 12-hour samples.
 * The synthetic temperature series and shadow levels represent a training site.
 */
export const LRO_PROFILE: LroSample[] = [
  { hour: 0, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 218 },
  { hour: 12, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 221 },
  { hour: 24, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 219 },
  { hour: 36, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 214 },
  // ---- 72 h topographic horizon shadow begins ----
  { hour: 48, sunVisibilityPct: 15, arrayOutputFactor: 0.15, surfaceTempK: 160 },
  { hour: 60, sunVisibilityPct: 15, arrayOutputFactor: 0.15, surfaceTempK: 118 },
  { hour: 72, sunVisibilityPct: 15, arrayOutputFactor: 0.15, surfaceTempK: 101 },
  { hour: 84, sunVisibilityPct: 15, arrayOutputFactor: 0.15, surfaceTempK: 94 },
  { hour: 96, sunVisibilityPct: 15, arrayOutputFactor: 0.15, surfaceTempK: 91 },
  { hour: 108, sunVisibilityPct: 15, arrayOutputFactor: 0.15, surfaceTempK: 90 },
  // ---- shadow ends: sun clears the ridge again ----
  { hour: 120, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 140 },
  { hour: 132, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 196 },
  { hour: 144, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 215 },
  { hour: 156, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 218 },
  { hour: 168, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 220 },
  { hour: 180, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 219 },
  { hour: 192, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 217 },
  { hour: 204, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 216 },
  { hour: 216, sunVisibilityPct: 100, arrayOutputFactor: 1.0, surfaceTempK: 218 },
];

/**
 * Classroom mast output assumption, motivated by horizon clearance with height.
 */
export const TALL_MAST_SHADOW_OUTPUT_FACTOR = 0.4;

/* ------------------------------------------------------------------ */
/* Published space-weather metadata and the scripted training pulse   */
/* ------------------------------------------------------------------ */

export const MAY_2024_PROTON_EVENT = {
  activeRegion: 'AR 13664',
  /** NASA DONKI GOES threshold crossing, not a reading of exactly 10 pfu. */
  onsetUtc: '2024-05-10 13:35 UTC',
  onsetThresholdPfu: 10,
  /** Observed GOES peak as reported in NOAA SWPC PRF 2541. */
  peakUtc: '2024-05-10 17:45 UTC',
  peakPfu: 207,
};

/**
 * Classroom scaling for the scripted flux curve. It has no radiation-transport calibration.
 */
export const DOSE_COEFF_MSV_PER_HR_PER_PFU = 0.015;

/** Assumed fractions of the training storm dose for each shielding option. */
export const SHIELDING = {
  evaSuit: 1.0,
  habitat: 0.25,
  waterWall: 0.15,
  regolithBerm: 0.06,
};

export interface SepSample {
  /** Hours since the start of the 48 h storm window. */
  hour: number;
  /** ≥10 MeV integral proton flux, particle flux units (pfu = p·cm⁻²·s⁻¹·sr⁻¹). */
  protonFluxPfu: number;
  /** Derived: EVA-suit / unshielded dose rate, mSv/hr. */
  unshieldedDoseMsvPerHr: number;
  /** Derived: inside habitat (× 0.25), mSv/hr. */
  shieldedDoseMsvPerHr: number;
}

/** Scripted 48 h pulse, scaled to the published GOES peak. Timing and shape are fictional. */
const TRAINING_SEP: Array<[number, number]> = [
  [0, 1],
  [4, 2],
  [8, 12],
  [12, 45],
  [16, 120],
  [20, MAY_2024_PROTON_EVENT.peakPfu],
  [24, 160],
  [28, 95],
  [32, 60],
  [36, 38],
  [40, 22],
  [44, 14],
  [48, 9],
];

const r3 = (x: number) => Math.round(x * 1000) / 1000;

export const SEP_PROFILE: SepSample[] = TRAINING_SEP.map(([hour, flux]) => ({
  hour,
  protonFluxPfu: flux,
  unshieldedDoseMsvPerHr: r3(flux * DOSE_COEFF_MSV_PER_HR_PER_PFU),
  shieldedDoseMsvPerHr: r3(flux * DOSE_COEFF_MSV_PER_HR_PER_PFU * SHIELDING.habitat),
}));

export const SEP_PEAK_FLUX_PFU = Math.max(...SEP_PROFILE.map((s) => s.protonFluxPfu));
export const SEP_PEAK_DOSE_RATE_MSV_PER_HR = r3(SEP_PEAK_FLUX_PFU * DOSE_COEFF_MSV_PER_HR_PER_PFU);

/** Trapezoid-rule integral of the unshielded dose rate over the 48 h window (mSv). */
export function integrateSepDoseMsv(startHour: number, endHour: number): number {
  let fluence = 0;
  for (let i = 1; i < SEP_PROFILE.length; i++) {
    const a = SEP_PROFILE[i - 1];
    const b = SEP_PROFILE[i];
    const start = Math.max(startHour, a.hour);
    const end = Math.min(endHour, b.hour);
    if (end <= start) continue;

    const slope = (b.protonFluxPfu - a.protonFluxPfu) / (b.hour - a.hour);
    const startFlux = a.protonFluxPfu + slope * (start - a.hour);
    const endFlux = a.protonFluxPfu + slope * (end - a.hour);
    fluence += (startFlux + endFlux) * (end - start) / 2;
  }
  return fluence * DOSE_COEFF_MSV_PER_HR_PER_PFU;
}

export const SEP_STORM_DOSE_UNSHIELDED_MSV = Math.round(integrateSepDoseMsv(0, 48) * 10) / 10;

/* ------------------------------------------------------------------ */
/* Life-support & radiation-standard baselines (real reference values)*/
/* ------------------------------------------------------------------ */

export const ECLSS_BASELINES = {
  o2KgPerCrewDay: 0.82,
  co2KgPerCrewDay: 1.04,
  issWaterRecoveryPct: 98,
};

export const RADIATION_LIMITS = {
  /** NASA-STD-3001 career effective-dose limit. */
  careerLimitMsv: 600,
  /** Game-specific mission warning threshold (educational). */
  missionWarningMsv: 50,
};

/* ------------------------------------------------------------------ */
/* Simplified game constants (all used by src/engine/simulation.ts)    */
/* ------------------------------------------------------------------ */

export const GAME_CONSTANTS = {
  initialState: { powerKwh: 60, lifeSupportPct: 100, radiationMsv: 0, sciencePoints: 0 },
  /** Nominal solar generation, kWh per day at arrayOutputFactor = 1. */
  generationKwhPerDay: 12,
  /** Habitat base load, kWh per day. */
  baseLoadKwhPerDay: 10,
  /** Extra heater load per 100 K below the reference temperature, kWh per day. */
  heaterKwhPerDayPer100K: 2,
  heaterReferenceTempK: 200,
  /** Consumables / ECLSS wear, % per day. */
  lifeSupportDrainPctPerDay: 3,
  /** Constant game allowance for background radiation on the surface, mSv per day. */
  gcrMsvPerDay: 1.0,
  brownoutThresholdKwh: 20,
  brownoutLifeSupportPenalty: 10,
  blackoutLifeSupportPenalty: 12,
  blackoutSciencePenalty: 5,
  survivalFocusThresholdPct: 40,
  scienceGateFactor: 0.5,
};
