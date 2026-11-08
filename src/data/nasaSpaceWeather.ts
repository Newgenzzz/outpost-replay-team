/**
 * Near-Earth reference values and separate educational storm scenarios.
 * DONKI FLR is a flare catalog; X-ray class is never converted to proton flux or crew dose.
 */
import type { Bilingual, StormPresetId } from '../types';
import { DOSE_COEFF_MSV_PER_HR_PER_PFU, MAY_2024_PROTON_EVENT, SEP_PROFILE, SHIELDING } from './nasaTelemetry';

export interface HistoricalStormPreset {
  id: StormPresetId;
  name: Bilingual;
  badge: Bilingual;
  provenance: 'observed-peak' | 'training-assumption';
  peakPfu: number;
  summary: Bilingual;
  sourceUrl: string;
}

export const HISTORICAL_STORM_PRESETS: readonly HistoricalStormPreset[] = [
  {
    id: 'may2024',
    name: { en: 'May 2024 GOES peak reference', az: 'May 2024 GOES pik göstəricisi' },
    badge: { en: 'Observed near Earth', az: 'Yer yaxınlığında ölçülüb' },
    provenance: 'observed-peak',
    peakPfu: MAY_2024_PROTON_EVENT.peakPfu,
    summary: {
      en: 'NOAA reports 207 pfu at geosynchronous Earth orbit on 10 May 2024, associated with an X3.9 flare. Only this peak amplitude is reused; the lunar storm timeline and dose are fictional.',
      az: 'NOAA 10 may 2024-də Yerətrafı geosinxron orbitdə X3.9 alışması ilə əlaqəli 207 pfu pik bildirir. Yalnız pik qiymət istifadə edilir; Ay fırtınasının vaxtı və dozası təlimə aiddir.',
    },
    sourceUrl: 'https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf',
  },
  {
    // Preserve the old preset identifier and amplitude for replay compatibility.
    id: 'sept2017',
    name: { en: 'High-flux stress test', az: 'Yüksək axın sınağı' },
    badge: { en: 'Assumed scenario', az: 'Ssenari fərziyyəsi' },
    provenance: 'training-assumption',
    peakPfu: 840,
    summary: {
      en: '840 pfu is retained as a classroom stress-test input. It is not a verified September 2017 peak. The linked NASA example discusses actual 2017 measurements at Mars, not this scenario.',
      az: '840 pfu təlim sınağının giriş qiymətidir; sentyabr 2017 üçün təsdiqlənmiş pik deyil. NASA keçidi Marsdakı real 2017 ölçmələrini izah edir, bu ssenarini deyil.',
    },
    sourceUrl: 'https://science.nasa.gov/resource/solar-storms-radiation-at-martian-orbit-and-surface/',
  },
  {
    id: 'quiet',
    name: { en: 'Lower-flux exercise', az: 'Aşağı axın məşqi' },
    badge: { en: 'Assumed scenario', az: 'Ssenari fərziyyəsi' },
    provenance: 'training-assumption',
    peakPfu: 18,
    summary: {
      en: '18 pfu is an assumed lower-flux training input, not a dated observation or a flare-class conversion. Even this value exceeds NOAA’s 10 pfu radiation-storm threshold near Earth.',
      az: '18 pfu aşağı axın üçün təlim fərziyyəsidir; tarixli ölçmə və ya alışma sinfindən çevrilmə deyil. Bu qiymət də NOAA-nın Yer yaxınlığındakı 10 pfu fırtına həddini aşır.',
    },
    sourceUrl: 'https://www.swpc.noaa.gov/phenomena/solar-radiation-storm',
  },
] as const;

export interface LiveDonkiEventSummary {
  id: string;
  eventTime: string;
  flareClass: string;
  link: string;
}

/** Missing metadata stays missing; no class, timestamp, proton flux or dose is fabricated. */
export function parseDonkiFlares(data: unknown): LiveDonkiEventSummary[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item) => item && typeof item === 'object' &&
    typeof item.flrID === 'string' && typeof item.classType === 'string' &&
    /^[ABCMX]\d+(\.\d+)?$/.test(item.classType) &&
    typeof (item.peakTime ?? item.beginTime) === 'string' &&
    Number.isFinite(Date.parse(item.peakTime ?? item.beginTime)))
    .slice(-5).reverse().map((item) => {
      let link = 'https://ccmc.gsfc.nasa.gov/DONKI/';
      try {
        const candidate = new URL(item.link);
        if (candidate.protocol === 'https:' && ['ccmc.gsfc.nasa.gov', 'kauai.ccmc.gsfc.nasa.gov'].includes(candidate.hostname)) {
          candidate.hostname = 'ccmc.gsfc.nasa.gov';
          link = candidate.toString();
        }
      } catch { /* Use the official catalog landing page. */ }
      return { id: item.flrID, eventTime: new Date(item.peakTime ?? item.beginTime).toISOString(), flareClass: item.classType, link };
    });
}

export interface DonkiFlareFeed {
  status: 'live' | 'empty' | 'unavailable';
  events: LiveDonkiEventSummary[];
}

/** Optional catalog context only. A failed/empty feed leaves the recorded experiment unchanged. */
export async function fetchLiveDonkiSpaceWeather(fetcher: typeof fetch = fetch, now = new Date()): Promise<DonkiFlareFeed> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
    const url = 'https://api.nasa.gov/DONKI/FLR?startDate=' + fmtDate(start) + '&endDate=' + fmtDate(now) + '&api_key=DEMO_KEY';
    const res = await fetcher(url, { signal: controller.signal });
    if (!res.ok) throw new Error('DONKI unavailable');
    const data: unknown = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid DONKI response');
    const events = parseDonkiFlares(data);
    return { status: events.length ? 'live' : 'empty', events };
  } catch {
    return { status: 'unavailable', events: [] };
  } finally {
    clearTimeout(timeout);
  }
}

/** Same fictional pulse and classroom dose scale as the mission engine; no live measurements. */
export function buildStormProfileForPeak(peakPfu: number) {
  if (!Number.isFinite(peakPfu) || peakPfu < 0 || peakPfu > 5000) throw new RangeError('Invalid training storm peak');
  const scale = peakPfu / MAY_2024_PROTON_EVENT.peakPfu;
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  return SEP_PROFILE.map((point) => ({
    hour: point.hour,
    protonFluxPfu: r3(point.protonFluxPfu * scale),
    unshieldedDoseMsvPerHr: r3(point.protonFluxPfu * scale * DOSE_COEFF_MSV_PER_HR_PER_PFU),
    shieldedDoseMsvPerHr: r3(point.protonFluxPfu * scale * DOSE_COEFF_MSV_PER_HR_PER_PFU * SHIELDING.habitat),
  }));
}
