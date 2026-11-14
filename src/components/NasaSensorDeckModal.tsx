import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Database,
  Droplet,
  ExternalLink,
  HeartPulse,
  Radio,
  ShieldAlert,
  Snowflake,
  SunDim,
  X,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  CITATIONS,
  DOSE_COEFF_MSV_PER_HR_PER_PFU,
  SHIELDING,
  ECLSS_BASELINES,
  LCROSS_CABEUS,
  LRO_PROFILE,
  LRO_SHADOW,
  LUNAR_RESEARCH,
  MAY_2024_PROTON_EVENT,
  RADIATION_LIMITS,
  SEP_STORM_DOSE_UNSHIELDED_MSV,
  TALL_MAST_SHADOW_OUTPUT_FACTOR,
} from '../data/nasaTelemetry';
import {
  HISTORICAL_STORM_PRESETS,
  buildStormProfileForPeak,
  fetchLiveDonkiSpaceWeather,
  type DonkiFlareFeed,
} from '../data/nasaSpaceWeather';
import type { StormPresetId } from '../types';
import { ICE_TREATMENT_RECOVERY } from '../engine/resources';
import LunarSiteIntelligence from './LunarSiteIntelligence';
import { Shackleton3DHologram } from './ShackletonHologram';

interface NasaSensorDeckModalProps {
  onClose: () => void;
  activeStormPeakPfu?: number;
  onSelectStormPeakPfu?: (peakPfu: number, label: string) => void;
}

const TABS = [
  { id: 'lola', icon: SunDim, label: { en: 'Sunlight Lab', az: 'Günəş Sınağı' } },
  { id: 'diviner', icon: Snowflake, label: { en: 'Diviner Temp', az: 'Diviner Temp' } },
  { id: 'lcross', icon: Droplet, label: { en: 'LCROSS Ice', az: 'LCROSS Buzu' } },
  { id: 'donki', icon: Zap, label: { en: 'DONKI & Radiation', az: 'DONKI və Radiasiya' } },
  { id: 'bvad', icon: HeartPulse, label: { en: 'BVAD & OSDR', az: 'BVAD və OSDR' } },
] as const;

const tooltipStyle = {
  background: '#09151e',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 8,
  fontSize: 12,
};

export function NasaSensorDeckModal({
  onClose,
  activeStormPeakPfu = 207,
  onSelectStormPeakPfu,
}: NasaSensorDeckModalProps) {
  const { lang, t, tr } = useI18n();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('lola');
  const [selectedPresetId, setSelectedPresetId] = useState<StormPresetId>(() => {
    const match = HISTORICAL_STORM_PRESETS.find((p) => p.peakPfu === activeStormPeakPfu);
    return match ? match.id : 'may2024';
  });
  const [liveDonki, setLiveDonki] = useState<DonkiFlareFeed | null>(null);
  const [fetchingLive, setFetchingLive] = useState(false);

  const az = lang === 'az';
  const title = az ? 'Elm və Mənbələr · Günəş, DONKI və OSDR' : 'Science & Sources · Sunlight, DONKI & OSDR';
  const storm = MAY_2024_PROTON_EVENT;
  const iceConcentration = `${(LCROSS_CABEUS.waterIceMassFraction * 100).toFixed(1)} ± ${(LCROSS_CABEUS.uncertaintyMassFraction * 100).toFixed(1)}%`;

  const selectedPreset =
    HISTORICAL_STORM_PRESETS.find((p) => p.id === selectedPresetId) ?? HISTORICAL_STORM_PRESETS[0];
  const activeDisplayPfu = selectedPreset.peakPfu;
  const dynamicStormSeries = buildStormProfileForPeak(activeDisplayPfu);

  const handleFetchLiveDonki = async () => {
    setFetchingLive(true);
    setLiveDonki(await fetchLiveDonkiSpaceWeather());
    setFetchingLive(false);
  };

  const handleChoosePreset = (presetId: StormPresetId) => {
    setSelectedPresetId(presetId);
  };

  const references = {
    lola: {
      title: az ? 'Nəşr edilmiş model · LOLA işıqlanması' : 'Published model · LOLA illumination',
      body: az
        ? `Mazarico və b. (2011) LOLA relyefindən modelləşdirdikləri xüsusi bir nöqtədə ildə ${LUNAR_RESEARCH.nearRimContinuousSunlightDays} gün fasiləsiz işıq və təxminən ${LUNAR_RESEARCH.nearRimLongestDarknessDays} gün ən uzun tam qaranlıq dövrü tapıblar. Bu nəticələr bütün kənara və ya yuxarıdakı prosedur səhnəyə aid deyil. Aşağıdakı S/C1 cədvəli ayrıca nəşr edilmiş modeldir.`
        : `Mazarico et al. (2011) modeled one particularly well-lit near-rim point with ${LUNAR_RESEARCH.nearRimContinuousSunlightDays} days of continuous sunlight each year and a longest total-darkness interval of about ${LUNAR_RESEARCH.nearRimLongestDarknessDays} days. These are location-specific model results, not measurements for the whole rim or the procedural scene above. The S/C1 table below is a separate published model.`,
      sources: [CITATIONS.LOLA_ILLUM, CITATIONS.SHACKLETON_SHAPE],
    },
    diviner: {
      title: az ? 'Müşahidədən hesablanmış qiymət · Diviner' : 'Observation-derived estimate · Diviner',
      body: az
        ? `Diviner müşahidələrinə əsasən LCROSS-un Kabeus zərbə yerində səthaltı temperatur təxminən ${LUNAR_RESEARCH.cabeusSubsurfaceTempK} K hesablanıb. Bu, Şeklton dibi üçün sabit temperatur deyil. 3D səhnənin rəngləri temperatur ölçməsi deyil.`
        : `From Diviner observations, researchers estimated a subsurface temperature of about ${LUNAR_RESEARCH.cabeusSubsurfaceTempK} K at the LCROSS impact site in Cabeus. This is not a constant temperature for Shackleton’s floor. The 3D scene’s colors are not temperature measurements.`,
      sources: [CITATIONS.DIVINER_COLDTRAPS],
    },
    lcross: {
      title: az ? 'Müşahidədən hesablanmış qiymət · LCROSS' : 'Observation-derived estimate · LCROSS',
      body: az
        ? `9 oktyabr 2009-cu ildə LCROSS Kabeus kraterində zərbə ilə qalxan materialın spektrini ölçdü. Tədqiqatçılar həmin nöqtədə su buzunun kütlə payını ${iceConcentration} hesabladılar.`
        : `On October 9, 2009, LCROSS measured spectra of the impact plume at Cabeus crater, estimating a water-ice concentration of ${iceConcentration} by mass.`,
      sources: [CITATIONS.LCROSS],
    },
    donki: {
      title: az ? 'GOES müşahidəsi · DONKI kataloqu · təlim dozası' : 'GOES observation · DONKI catalog · training dose',
      body: az
        ? `NOAA GOES-in Yer yaxınlığındakı ≥10 MeV proton axını üçün ${storm.onsetUtc} tarixində ${storm.onsetThresholdPfu} pfu həddi keçidini və ${storm.peakUtc} tarixində ${storm.peakPfu} pfu pik bildirir. NASA DONKI hadisə kataloqudur; alışmanın rentgen sinfi proton axınını və astronavt dozasını müəyyən etmir. 1 pfu = 1 proton·sm⁻²·san⁻¹·sr⁻¹.`
        : `NOAA reports GOES near-Earth ≥10 MeV proton flux crossing ${storm.onsetThresholdPfu} pfu at ${storm.onsetUtc}, peaking at ${storm.peakPfu} pfu at ${storm.peakUtc}. NASA DONKI is an event catalog; a flare’s X-ray class does not determine proton flux or astronaut dose. 1 pfu = 1 proton·cm⁻²·s⁻¹·sr⁻¹.`,
      sources: [CITATIONS.GOES_PROTONS, CITATIONS.DONKI_API, CITATIONS.RADIATION_UNITS, CITATIONS.MARS_2017],
    },
    bvad: {
      title: az ? 'NASA mühəndislik mənbələri · BVAD və ECLSS' : 'NASA engineering references · BVAD & ECLSS',
      body: az
        ? 'BVAD qısa missiya üçün ekipaj üzvünün maddələr mübadiləsini modelləşdirir. BKS-də toplanmış suyun 98%-nin geri qazanılması nümayiş etdirilib; VEG-01A kahısı 33 gündən sonra yığılıb. Bunlar Ay üçün bu bitki və su modelini təsdiqləmir.'
        : 'BVAD models reference crew metabolism (0.82 kg O₂/day, 1.04 kg CO₂/day). The ISS demonstrated 98% recovery of collected water; VEG-01A lettuce was harvested after 33 days. Neither value validates this lunar crop or recycling model.',
      sources: [CITATIONS.BVAD, CITATIONS.ISS_ECLSS, CITATIONS.ISS_VEGGIE, CITATIONS.NASA_STD_3001],
    },
  }[activeTab];

  const model = {
    lola: az
      ? `Təlimdə relyef kölgəsi 48–120-ci saatları əhatə edir. Bu müddətdə alçaq panellər nominal istehsalın ${100 - LRO_SHADOW.arrayOutputDropPct}%-ni, 10 m-lik şaquli dirək isə ${TALL_MAST_SHADOW_OUTPUT_FACTOR * 100}%-ni təmin edir.`
      : `In training, the terrain shadow spans hours 48–120. Low 2 m panels deliver ${100 - LRO_SHADOW.arrayOutputDropPct}% of nominal output while the 10 m vertical mast delivers ${TALL_MAST_SHADOW_OUTPUT_FACTOR * 100}%.`,
    diviner: az
      ? `Baza səthi kölgədə ${LRO_SHADOW.minSurfaceTempK} K-ə (${LRO_SHADOW.minSurfaceTempC} °C) qədər soyuyur və qızdırıcının enerji tələbini artırır.`
      : `The simulated outpost cools to ${LRO_SHADOW.minSurfaceTempK} K (${LRO_SHADOW.minSurfaceTempC} °C) in shadow, driving up habitat thermal power draw.`,
    lcross: az
      ? `Kabeus göstəricisi buzlu qrunt nümunəsinə tətbiq edilir: standart qurğuda ${ICE_TREATMENT_RECOVERY.standard * 100}%, hazırlanmış qurğuda ${ICE_TREATMENT_RECOVERY.prepared * 100}% su bərpası.`
      : `Applies the Cabeus 5.6% water-ice mass fraction to harvested regolith: ${ICE_TREATMENT_RECOVERY.standard * 100}% standard recovery vs. ${ICE_TREATMENT_RECOVERY.prepared * 100}% when pre-calibrated.`,
    donki: az
      ? `48 saatlıq Ay fırtınasının forması uydurmadır. ${DOSE_COEFF_MSV_PER_HR_PER_PFU} mSv·saat⁻¹·pfu⁻¹ əmsalı və keçiriciliklər (skafandr ${SHIELDING.evaSuit * 100}%, modul ${SHIELDING.habitat * 100}%, su ${SHIELDING.waterWall * 100}%, reqolit ${SHIELDING.regolithBerm * 100}%) təlim fərziyyələridir. 207 pfu bazasında fırtına üçün ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv alınır, fon daxil deyil. Bu, real ekipaj doza proqnozu deyil; spektr, material və radiasiya nəqli hesablanmır.`
      : `The 48-hour lunar storm shape is fictional. The ${DOSE_COEFF_MSV_PER_HR_PER_PFU} mSv·h⁻¹·pfu⁻¹ coefficient and transmission factors (suit ${SHIELDING.evaSuit * 100}%, habitat ${SHIELDING.habitat * 100}%, water ${SHIELDING.waterWall * 100}%, regolith ${SHIELDING.regolithBerm * 100}%) are classroom assumptions. At the 207 pfu baseline, storm-only exposure is ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv before background. This is not a real crew-dose prediction: spectra, material geometry and radiation transport are not calculated.`,
    bvad: az
      ? `İki nəfərlik ekipaj gündə ${2 * ECLSS_BASELINES.o2KgPerCrewDay} kq O₂ tələb edir. Təlim radiasiya xəbərdarlığı ${RADIATION_LIMITS.missionWarningMsv} mSv, NASA-STD-3001 karyera həddi ${RADIATION_LIMITS.careerLimitMsv} mSv-dir.`
      : `Two crew require ${2 * ECLSS_BASELINES.o2KgPerCrewDay} kg O₂/day. Mission radiation warning triggers at ${RADIATION_LIMITS.missionWarningMsv} mSv (NASA-STD-3001 career limit: ${RADIATION_LIMITS.careerLimitMsv} mSv).`,
  }[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/85 p-3 sm:p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="science-deck-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[93dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-sky-400/35 bg-[#10202b] p-4 shadow-2xl scrollbar-thin sm:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#c0e6aa]">
              <Database size={15} aria-hidden="true" />
              {az ? 'MÜŞAHİDƏ · NƏŞR EDİLMİŞ MODEL · TƏLİM FƏRZİYYƏSİ' : 'OBSERVATION · PUBLISHED MODEL · TRAINING ASSUMPTION'}
            </div>
            <h2 id="science-deck-title" className="mt-1 text-lg sm:text-xl font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
          >
            <X size={15} aria-hidden="true" /> {t('close')}
          </button>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                activeTab === id
                  ? 'border-[#c0e6aa] bg-[#214237] text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon size={14} aria-hidden="true" /> {tr(label)}
            </button>
          ))}
        </div>

        {/* Procedural teaching scene, separate from the published LOLA study below */}
        {activeTab === 'lola' && (
          <div className="mb-4">
            <Shackleton3DHologram />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-4">
            <h3 className="text-sm font-semibold text-emerald-200">{references.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-200">{references.body}</p>
            <ul className="mt-3 space-y-1">
              {references.sources.map((source) => (
                <li key={source.id}>
                  <a
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-200 underline decoration-emerald-300/40 underline-offset-2 hover:text-white"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.short} <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
            <h3 className="text-sm font-semibold text-amber-200">{az ? 'Təlim modeli' : 'Training model'}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-200">{model}</p>
          </section>
        </div>

        {activeTab === 'lola' && (
          <div className="mt-4">
            <LunarSiteIntelligence hide3D />
          </div>
        )}

        {/* Training presets, verified archived DONKI event card, and explicitly assumed dose chart */}
        {activeTab === 'donki' && (
          <div className="mt-4 space-y-4">
            <section className="rounded-xl border border-cyan-400/30 bg-cyan-950/25 p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    {az
                      ? 'NASA DONKI HƏFTƏLİK XÜLASƏSİ VƏ GOES PEYK QEYDİ'
                      : 'NASA DONKI WEEKLY SUMMARY & GOES SATELLITE RECORD'}
                  </span>
                  <h4 className="mt-0.5 text-sm font-bold text-white">
                    {az
                      ? 'NASA CCMC DONKI · 20240516-7D-001 (8–14 May 2024 Həftəlik Xülasə · #30944)'
                      : 'NASA CCMC DONKI · 20240516-7D-001 (May 8–14, 2024 Weekly Summary · Alert #30944)'}
                  </h4>
                </div>
                <span className="rounded border border-cyan-300/35 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-cyan-100">
                  {storm.activeRegion}
                </span>
              </div>
              <p className="mt-1.5 rounded-lg border border-amber-300/30 bg-amber-950/35 px-2.5 py-1.5 text-[11px] leading-snug text-amber-100">
                {az
                  ? 'Elmi sərhəd: 20240516-7D-001 8–14 May 2024 tarixlərini əhatə edən həftəlik kosmik hava xülasəsidir — astronavtın müşahidə olunmuş radiasiya dozası deyil. NOAA GOES piki (207 pfu) Yerə yaxın zərrəcik axınıdır, Ay səthində ölçülmüş doza deyil.'
                  : 'Scientific provenance: 20240516-7D-001 is a weekly space-weather summary covering May 8–14, 2024 — not an observed astronaut radiation dose. NOAA GOES (207 pfu) is near-Earth geosynchronous particle flux, not a lunar surface dose measurement.'}
              </p>
              <dl className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-cyan-400/30 bg-slate-950/60 p-2">
                  <dt className="font-mono text-[9.5px] font-bold uppercase text-cyan-300">
                    {az ? '1. Faktiki NASA/NOAA Müşahidəsi' : '1. Actual NASA/NOAA Data'}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-slate-200">
                    {az
                      ? `GOES ≥10 MeV axını: ${storm.onsetUtc} >${storm.onsetThresholdPfu} pfu; pik ${storm.peakPfu} pfu (${storm.peakUtc}, Yerə yaxın).`
                      : `GOES ≥10 MeV flux crossed >${storm.onsetThresholdPfu} pfu at ${storm.onsetUtc}; peaked at ${storm.peakPfu} pfu (${storm.peakUtc}, near-Earth).`}
                  </dd>
                </div>
                <div className="rounded-lg border border-sky-400/30 bg-slate-950/60 p-2">
                  <dt className="font-mono text-[9.5px] font-bold uppercase text-sky-300">
                    {az ? '2. Nəşr Edilmiş Standart' : '2. Published Standard'}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-slate-200">
                    {az
                      ? `NASA-STD-3001 karyera həddi <${RADIATION_LIMITS.careerLimitMsv} mSv və ALARA mühafizə prinsipi; alışma (FLR) sinfi pfu-ya çevrilmir.`
                      : `NASA-STD-3001 career limit <${RADIATION_LIMITS.careerLimitMsv} mSv & ALARA shielding principle; FLR flare classes never convert to pfu/dose.`}
                  </dd>
                </div>
                <div className="rounded-lg border border-amber-400/30 bg-slate-950/60 p-2">
                  <dt className="font-mono text-[9.5px] font-bold uppercase text-amber-300">
                    {az ? '3. Təlim Fərziyyələri' : '3. Educational Assumptions'}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-slate-200">
                    {az
                      ? '0.015 mSv·saat⁻¹·pfu⁻¹ çevirmə əmsalı və qalxan vuruqları (EVA ×1.00, Modul ×0.25, Su divarı ×0.15, Sədd ×0.06).'
                      : 'Classroom conversion 0.015 mSv·h⁻¹·pfu⁻¹ and shielding factors (EVA ×1.00, Hab ×0.25, Water-wall ×0.15, Berm ×0.06).'}
                  </dd>
                </div>
                <div className="rounded-lg border border-rose-400/30 bg-slate-950/60 p-2">
                  <dt className="font-mono text-[9.5px] font-bold uppercase text-rose-300">
                    {az ? '4. Uydurma Missiya Parametri' : '4. Fictional Mission Inputs'}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-slate-200">
                    {az
                      ? `48 saatlıq Ay fırtınası əyrisi və ${RADIATION_LIMITS.missionWarningMsv} mSv təlim xəbərdarlıq həddi.`
                      : `Synthetic 48-hour lunar pulse timing & ${RADIATION_LIMITS.missionWarningMsv} mSv educational warning threshold.`}
                  </dd>
                </div>
              </dl>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                <a href={CITATIONS.DONKI.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-200 underline hover:text-white">
                  {CITATIONS.DONKI.short} <ExternalLink size={11} aria-hidden="true" />
                </a>
                <a href={CITATIONS.GOES_PROTONS.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-200 underline hover:text-white">
                  {CITATIONS.GOES_PROTONS.short} <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </section>

            <section className="rounded-xl border border-rose-400/30 bg-rose-950/20 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-rose-300">
                    {az ? 'TƏLİM FIRTINASI · AYRI DONKI KATALOQU' : 'TRAINING STORM · SEPARATE DONKI CATALOG'}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {az
                      ? 'Nəşr edilmiş pik və fərziyyə ssenariləri'
                      : 'Published peak & assumed scenarios'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleFetchLiveDonki}
                  disabled={fetchingLive}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300/50 bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/30 disabled:opacity-60"
                >
                  <Radio size={13} className={fetchingLive ? 'animate-spin' : ''} />
                  {fetchingLive
                    ? az ? 'NASA DONKI sorğulanır...' : 'Querying NASA DONKI...'
                    : az ? 'Son DONKI alışmalarını yoxla' : 'Fetch recent DONKI flares'}
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {HISTORICAL_STORM_PRESETS.map((p) => {
                  const active = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleChoosePreset(p.id)}
                      className={`rounded-lg border p-2.5 text-left text-xs transition ${
                        active
                          ? 'border-rose-300 bg-rose-500/20 text-white'
                          : 'border-white/10 bg-slate-950/60 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 font-mono text-[11px] font-bold text-rose-200">
                        <span>{tr(p.badge)}</span>
                        <span>{p.peakPfu} pfu</span>
                      </div>
                      <p className="mt-1 font-semibold text-white">{tr(p.name)}</p>
                      <p className="mt-1 text-[11px] text-slate-300">{tr(p.summary)}</p>
                    </button>
                  );
                })}
              </div>
              <a href={selectedPreset.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-sky-200 underline">
                {az ? 'Seçilmiş ssenarinin mənbəsi / konteksti' : 'Selected scenario source / context'}
              </a>

              {onSelectStormPeakPfu && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <p className="text-xs text-slate-300">
                    {az
                      ? 'Seçim yalnız önbaxışı dəyişir. Yeni sınağa başlamaq cari A və B gedişlərini sıfırlayır.'
                      : 'Selection changes the preview only. Starting a new experiment clears the current A and B runs.'}
                  </p>
                  <button type="button"
                    disabled={fetchingLive || activeDisplayPfu === activeStormPeakPfu}
                    onClick={() => onSelectStormPeakPfu(activeDisplayPfu, tr(selectedPreset.name))}
                    className="rounded-lg border border-sky-300/50 bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/30 disabled:opacity-50">
                    {az ? 'Seçilmiş fırtına ilə yeni sınağa başla' : 'Start new experiment with selected storm'}
                  </button>
                </div>
              )}

              {liveDonki && (
                <div className="mt-2.5 rounded-lg border border-sky-300/30 bg-sky-950/40 px-3 py-2 text-xs text-sky-100">
                  <p role="status">{liveDonki.status === 'live'
                    ? az ? 'NASA DONKI-dən son alışma qeydləri (FLR):' : 'Recent NASA DONKI flare records (FLR):'
                    : liveDonki.status === 'empty'
                      ? az ? 'Son 30 gündə etibarlı alışma qeydi qaytarılmadı.' : 'No valid flare records returned for the last 30 days.'
                      : az ? 'Canlı kataloq əlçatmazdır. Təlim ssenariləri oflayn işləyir.' : 'Live catalog unavailable. Training scenarios still work offline.'}</p>
                  {liveDonki.events.map((event) => <p className="mt-1" key={event.id}>
                    <a className="underline" href={event.link} target="_blank" rel="noreferrer">{event.flareClass} · {event.eventTime.replace('T', ' ').replace('.000Z', ' UTC')}</a>
                  </p>)}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-300">{az
                ? 'FLR rentgen alışmalarını bildirir; pfu və ya ekipaj dozası vermir. Alışma qeydləri yuxarıdakı fırtına qiymətini və A/B gedişlərini dəyişmir.'
                : 'FLR reports X-ray flares, not pfu or crew dose. Flare records do not change the selected storm peak or A/B runs.'}</p>
            </section>

            {/* Explicit classroom estimates from the same scripted pulse as gameplay. */}
            <figure className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-100">
                  <ShieldAlert size={14} className="text-amber-300" />
                  {az
                    ? 'Təlim doza sürəti · fərz edilən qalxan (mSv/saat)'
                    : 'Training dose rate · assumed shielding (mSv/h)'}
                </span>
                <span className="font-mono text-[11px] text-amber-200">{az ? 'Ssenari saatı · ölçmə deyil' : 'Scenario hours · not measurements'}</span>
              </figcaption>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dynamicStormSeries} margin={{ top: 6, right: 14, bottom: 3, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#223340" />
                    <XAxis dataKey="hour" unit=" h" stroke="#8da4aa" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#8da4aa" unit=" mSv/h" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="linear"
                      dataKey="unshieldedDoseMsvPerHr"
                      name={az ? 'Təlim · 100% keçiricilik' : 'Training · 100% transmission'}
                      stroke="#fb7185"
                      fill="#fb7185"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Line
                      type="linear"
                      dataKey="shieldedDoseMsvPerHr"
                      name={az ? 'Təlim modulu · 25% keçiricilik' : 'Training habitat · 25% transmission'}
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-slate-300">{az
                ? 'BKS/Ay telemetriyası göstərilmir. Real 2017 Mars ölçmələri başqa cihaz, spektr və atmosferə aiddir. Gy udulmuş enerjini, Sv isə radiasiya təsirinə görə çəkilən dozanı bildirir; onları birbaşa əvəz etmək olmaz. NASA-nın 600 mSv karyera həddi bu oyunun 50 mSv xəbərdarlığından ayrıdır.'
                : 'No ISS/Moon telemetry is plotted. Actual 2017 Mars measurements involve different instruments, spectra and atmospheric shielding. Gy measures absorbed energy per mass; Sv expresses radiation-weighted dose. They are not interchangeable. NASA’s 600 mSv career limit is separate from this game’s 50 mSv warning.'}</p>
            </figure>
          </div>
        )}

        {/* Standard Time-Series Charts */}
        {(activeTab === 'lola' || activeTab === 'diviner' || activeTab === 'donki') && (
          <figure className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <figcaption className="mb-2 flex flex-wrap justify-between gap-2 px-2 text-xs">
              <span className="font-semibold text-slate-100">
                {activeTab === 'lola'
                  ? az ? '216 saatlıq ssenaridə görünən Günəş diski (%)' : '216-Hour Scenario Visible Solar Disk (%)'
                  : activeTab === 'diviner'
                  ? az ? 'Səth temperaturu (K)' : 'Surface Temperature (K)'
                  : az ? `Uydurma ≥10 MeV axın profili (pik ${activeDisplayPfu} pfu)` : `Fictional ≥10 MeV flux profile (peak ${activeDisplayPfu} pfu)`}
              </span>
              <span className="text-slate-400">
                {activeTab === 'donki' ? (az ? 'Fırtına saatı (0–48 saat)' : 'Storm hour (0–48 h)') : t('missionHour')}
              </span>
            </figcaption>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={activeTab === 'donki' ? dynamicStormSeries : LRO_PROFILE}
                  margin={{ top: 4, right: 14, bottom: 3, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#223340" />
                  <XAxis
                    dataKey="hour"
                    type="number"
                    domain={activeTab === 'donki' ? [0, 48] : [0, 216]}
                    stroke="#8da4aa"
                    unit=" h"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#8da4aa"
                    domain={
                      activeTab === 'lola'
                        ? [0, 100]
                        : activeTab === 'diviner'
                        ? [70, 240]
                        : [0, Math.max(220, Math.ceil(activeDisplayPfu * 1.1))]
                    }
                    unit={activeTab === 'lola' ? '%' : activeTab === 'diviner' ? ' K' : ' pfu'}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  {activeTab !== 'donki' && (
                    <ReferenceArea
                      x1={LRO_SHADOW.startHour}
                      x2={LRO_SHADOW.endHour}
                      fill={activeTab === 'lola' ? '#fde047' : '#38bdf8'}
                      fillOpacity={0.12}
                    />
                  )}
                  <Area
                    type={activeTab === 'donki' ? 'linear' : 'stepAfter'}
                    dataKey={
                      activeTab === 'lola'
                        ? 'sunVisibilityPct'
                        : activeTab === 'diviner'
                        ? 'surfaceTempK'
                        : 'protonFluxPfu'
                    }
                    name={
                      activeTab === 'lola'
                        ? 'Sun %'
                        : activeTab === 'diviner'
                        ? 'Temp K'
                        : 'Flux pfu'
                    }
                    stroke={activeTab === 'lola' ? '#fde047' : activeTab === 'diviner' ? '#38bdf8' : '#fb7185'}
                    fill={activeTab === 'lola' ? '#fde047' : activeTab === 'diviner' ? '#38bdf8' : '#fb7185'}
                    fillOpacity={0.18}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </figure>
        )}

        {activeTab === 'bvad' && (
          <div className="mt-4 space-y-3">
            <dl className="grid grid-cols-3 gap-2 text-xs sm:gap-3">
              {[
                { title: t('eclssO2'), value: ECLSS_BASELINES.o2KgPerCrewDay, unit: t('perCrewDay') },
                { title: t('eclssCo2'), value: ECLSS_BASELINES.co2KgPerCrewDay, unit: t('perCrewDay') },
                { title: t('eclssWater'), value: ECLSS_BASELINES.issWaterRecoveryPct, unit: '%' },
              ].map(({ title: label, value, unit }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                  <dt className="text-slate-300">{label}</dt>
                  <dd className="mt-1 text-base font-bold text-teal-200">
                    {value} <span className="text-xs font-normal">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <section className="rounded-xl border border-emerald-400/30 bg-emerald-950/20 p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {az ? 'NASA OSDR BKS BİTKİ SINAĞI ARXİVİ' : 'NASA OSDR ISS PLANT EXPERIMENT ARCHIVE'}
                  </span>
                  <h4 className="mt-0.5 text-sm font-bold text-white">
                    {az ? 'NASA OSDR · VEG-01A Kahı Sınağı (BKS)' : 'NASA OSDR · VEG-01A ISS Lettuce Trial'}
                  </h4>
                </div>
                <span className="rounded border border-emerald-300/35 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-100">
                  May 8 – Jun 10, 2014 · 33 d
                </span>
              </div>
              <p className="mt-1.5 leading-relaxed text-slate-200">
                {az
                  ? 'VEG-01A kahısı BKS-də 33 gün yetişdi (8 may – 10 iyun 2014). Su çatışmazlığı bitkilərə zərər verdi; ekipajın birbaşa suvarması böyüməyə kömək etdi. Bu nəticə D2-C üçün su planlamasının əhəmiyyətini göstərir. Oyundakı 25 günlük göyərti + 5 işıqlı böyümə günü, su və enerji sərfi, məhsuldarlıq fərziyyədir; Ay üçün təsdiqlənmiş bitki modeli deyil.'
                  : 'VEG-01A lettuce grew for 33 days on the ISS (May 8 – June 10, 2014). Water stress harmed plants; direct crew watering helped growth. This finding motivates water planning for D2-C. The game’s 25-day-old greens + five powered growing days, water and power costs, and yield are assumptions, not a validated lunar crop model.'}
              </p>
              <a href={CITATIONS.ISS_VEGGIE.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-emerald-200 underline hover:text-white">
                {CITATIONS.ISS_VEGGIE.short} <ExternalLink size={11} aria-hidden="true" />
              </a>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
