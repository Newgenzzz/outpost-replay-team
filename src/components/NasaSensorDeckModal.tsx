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
  OSDR_RADLAB_MAY2024_SERIES,
  buildStormProfileForPeak,
  fetchLiveDonkiSpaceWeather,
  type LiveDonkiEventSummary,
} from '../data/nasaSpaceWeather';
import type { StormPresetId } from '../types';
import { ICE_TREATMENT_RECOVERY } from '../engine/resources';
import LunarSiteIntelligence from './LunarSiteIntelligence';
import { Shackleton3DHologram } from './Shackleton3DHologram';

interface NasaSensorDeckModalProps {
  onClose: () => void;
  activeStormPeakPfu?: number;
  onSelectStormPeakPfu?: (peakPfu: number, label: string) => void;
}

const TABS = [
  { id: 'lola', icon: SunDim, label: { en: '3D LOLA & Sunlight', az: '3D LOLA və İşıq' } },
  { id: 'diviner', icon: Snowflake, label: { en: 'Diviner Temp', az: 'Diviner Temp' } },
  { id: 'lcross', icon: Droplet, label: { en: 'LCROSS Ice', az: 'LCROSS Buzu' } },
  { id: 'donki', icon: Zap, label: { en: 'DONKI & RadLab', az: 'DONKI və RadLab' } },
  { id: 'bvad', icon: HeartPulse, label: { en: 'BVAD & ECLSS', az: 'BVAD və ECLSS' } },
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
  const [liveDonki, setLiveDonki] = useState<LiveDonkiEventSummary | null>(null);
  const [fetchingLive, setFetchingLive] = useState(false);

  const az = lang === 'az';
  const title = az ? '3D NASA LOLA Relyefi, DONKI və RadLab Telemetriyası' : '3D NASA LOLA Terrain, DONKI & OSDR RadLab Deck';
  const storm = MAY_2024_PROTON_EVENT;
  const iceConcentration = `${(LCROSS_CABEUS.waterIceMassFraction * 100).toFixed(1)} ± ${(LCROSS_CABEUS.uncertaintyMassFraction * 100).toFixed(1)}%`;

  const selectedPreset =
    HISTORICAL_STORM_PRESETS.find((p) => p.id === selectedPresetId) ?? HISTORICAL_STORM_PRESETS[0];
  const activeDisplayPfu =
    selectedPresetId === 'live' && liveDonki ? liveDonki.estimatedPeakPfu : selectedPreset.peakPfu;
  const dynamicStormSeries = buildStormProfileForPeak(activeDisplayPfu);

  const handleFetchLiveDonki = async () => {
    setFetchingLive(true);
    const events = await fetchLiveDonkiSpaceWeather();
    const latest = events[0] ?? null;
    setLiveDonki(latest);
    setSelectedPresetId('live');
    setFetchingLive(false);
    if (latest && onSelectStormPeakPfu) {
      onSelectStormPeakPfu(latest.estimatedPeakPfu, `Live DONKI (${latest.flareClass})`);
    }
  };

  const handleChoosePreset = (presetId: StormPresetId) => {
    setSelectedPresetId(presetId);
    const found = HISTORICAL_STORM_PRESETS.find((p) => p.id === presetId);
    if (found && onSelectStormPeakPfu) {
      onSelectStormPeakPfu(found.peakPfu, tr(found.name));
    }
  };

  const references = {
    lola: {
      title: az ? 'LRO LOLA lazer topoqrafiyası' : 'LRO LOLA Laser Altimetry Topography',
      body: az
        ? `LRO lazer altimetri ilə qurulan relyef modeli Şeklton kənarı yaxınlığındakı xüsusilə işıqlı bir nöqtədə ildə ${LUNAR_RESEARCH.nearRimContinuousSunlightDays} gün fasiləsiz işıq və ən çox ${LUNAR_RESEARCH.nearRimLongestDarknessDays} gün fasiləsiz tam qaranlıq göstərib. Aşağıdakı 3D holoqramı fırladaraq 10 m-lik dirəyin kölgədən necə çıxdığını yoxlayın.`
        : `A model built from LRO laser altimetry found ${LUNAR_RESEARCH.nearRimContinuousSunlightDays} days of continuous sunlight each year and up to ${LUNAR_RESEARCH.nearRimLongestDarknessDays} days of continuous darkness near Shackleton’s rim. Rotate the 3D hologram below to see how a 10 m mast clears local ridges.`,
      sources: [CITATIONS.LOLA_ILLUM],
    },
    diviner: {
      title: az ? 'Diviner termal xəritələməsi' : 'LRO Diviner Thermal Radiometer',
      body: az
        ? `Tədqiqatçılar Ayın cənub qütb bölgəsində, LCROSS-un Kabeus kraterinə düşdüyü yerdə səthaltı temperaturu təxminən ${LUNAR_RESEARCH.cabeusSubsurfaceTempK} K hesablayıblar. Şekltonun dibi daim ~40–90 K soyuq tələdir.`
        : `Researchers estimated a subsurface temperature of about ${LUNAR_RESEARCH.cabeusSubsurfaceTempK} K at the LCROSS impact site in Cabeus crater. Shackleton’s floor remains a ~40–90 K cryogenic cold trap.`,
      sources: [CITATIONS.DIVINER_COLDTRAPS],
    },
    lcross: {
      title: az ? 'LCROSS su buzu spektri' : 'LCROSS Impact Plume Spectroscopy',
      body: az
        ? `9 oktyabr 2009-cu ildə LCROSS Kabeus kraterində zərbə ilə qalxan materialın spektrini ölçdü. Tədqiqatçılar həmin nöqtədə su buzunun kütlə payını ${iceConcentration} hesabladılar.`
        : `On October 9, 2009, LCROSS measured spectra of the impact plume at Cabeus crater, estimating a water-ice concentration of ${iceConcentration} by mass.`,
      sources: [CITATIONS.LCROSS],
    },
    donki: {
      title: az ? 'NASA DONKI + BKS OSDR RadLab Dozimetriyası' : 'NASA DONKI + ISS OSDR RadLab Dosimetry',
      body: az
        ? `NASA DONKI GOES-də >10 MeV proton axınının ${storm.onsetUtc} tarixində ${storm.onsetThresholdPfu} pfu həddini keçdiyini və ${storm.peakPfu} pfu pikə çatdığını qeyd edib. OSDR RadLab BKS-də maqnitosfer qorunmasını, Ayda isə qalxansız səth təhlükəsini müqayisə edir.`
        : `NASA DONKI recorded GOES >10 MeV proton flux crossing ${storm.onsetThresholdPfu} pfu at ${storm.onsetUtc} with a ${storm.peakPfu} pfu peak. NASA OSDR RadLab compares shielded ISS orbit vs. unshielded Lunar South Pole exposure.`,
      sources: [CITATIONS.DONKI, CITATIONS.GOES_PROTONS],
    },
    bvad: {
      title: az ? 'NASA BVAD və BKS ECLSS Göstəriciləri' : 'NASA BVAD & ISS ECLSS Baselines',
      body: az
        ? 'BVAD qısa missiya üçün ekipaj üzvünün maddələr mübadiləsini modelləşdirir. BKS-də suyun 98%-nin geri qazanılması nümayiş etdirilib və Veggie kahı sınağı 33 gün davam edib.'
        : 'BVAD models reference crew metabolism (0.82 kg O₂/day, 1.04 kg CO₂/day). The ISS demonstrated 98% closed-loop water recovery and 33-day Veggie crop growth.',
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
      ? `48 saatlıq fırtına pik axından (${activeDisplayPfu} pfu) istifadə edir. ${DOSE_COEFF_MSV_PER_HR_PER_PFU} mSv·saat⁻¹·pfu⁻¹ əmsalı ilə baza (207 pfu) sığınacaqsız ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv verir. Keçiricilik: skafandr ${SHIELDING.evaSuit * 100}%, yaşayış modulu ${SHIELDING.habitat * 100}%, su divarı ${SHIELDING.waterWall * 100}%, reqolit səddi ${SHIELDING.regolithBerm * 100}%.`
      : `48h storm scales from peak proton flux (${activeDisplayPfu} pfu). At baseline 207 pfu (${DOSE_COEFF_MSV_PER_HR_PER_PFU} mSv·h⁻¹·pfu⁻¹), unshielded dose is ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv. Transmission: suit ${SHIELDING.evaSuit * 100}%, hab ${SHIELDING.habitat * 100}%, water wall ${SHIELDING.waterWall * 100}%, regolith berm ${SHIELDING.regolithBerm * 100}%.`,
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
              {az ? 'NASA ELMİ MƏNBƏLƏRİ VƏ 3D TELEMETRİYA' : 'NASA SCIENCE DECK & 3D TELEMETRY'}
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

        {/* Interactive 3D Shackleton Crater Hologram at top of LOLA tab */}
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

        {/* DONKI Space Weather Preset Switcher + Live NASA API Fetch + OSDR RadLab Chart */}
        {activeTab === 'donki' && (
          <div className="mt-4 space-y-4">
            <section className="rounded-xl border border-rose-400/30 bg-rose-950/20 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-rose-300">
                    NASA CCMC DONKI · SPACE WEATHER SCENARIO LAB
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {az
                      ? 'Tarixi və Canlı Günəş Fırtınası Müqayisəsi'
                      : 'Historical & Live NASA DONKI Solar Storm Selector'}
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
                    : az ? 'Canlı NASA DONKI Yoxla' : 'Fetch Live NASA DONKI'}
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
                        <span>{p.flareClass}</span>
                        <span>{p.peakPfu} pfu</span>
                      </div>
                      <p className="mt-1 font-semibold text-white">{tr(p.name)}</p>
                      <p className="mt-1 text-[11px] text-slate-300 line-clamp-2">{tr(p.summary)}</p>
                    </button>
                  );
                })}
              </div>

              {liveDonki && (
                <div className="mt-2.5 rounded-lg border border-sky-300/30 bg-sky-950/40 px-3 py-2 text-xs text-sky-100">
                  <strong>{liveDonki.liveFetched ? 'LIVE api.nasa.gov/DONKI:' : 'Offline Cached DONKI:'}</strong>{' '}
                  {liveDonki.note} · Peak {liveDonki.flareClass} ({liveDonki.estimatedPeakPfu} pfu eq.)
                </div>
              )}
            </section>

            {/* NASA OSDR RadLab: ISS Shielded Orbit vs Lunar Surface Unshielded */}
            <figure className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-100">
                  <ShieldAlert size={14} className="text-amber-300" />
                  {az
                    ? 'NASA OSDR RadLab Müqayisəsi: BKS Orbiti vs. Qalxansız Ay Səthi (μGy/saat)'
                    : 'NASA OSDR RadLab Comparison: ISS Magnetosphere vs. Unshielded Lunar Surface (μGy/h)'}
                </span>
                <span className="font-mono text-[11px] text-amber-200">May 10–12, 2024</span>
              </figcaption>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={[...OSDR_RADLAB_MAY2024_SERIES]} margin={{ top: 6, right: 14, bottom: 3, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#223340" />
                    <XAxis dataKey="hour" unit=" h" stroke="#8da4aa" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#8da4aa" unit=" μGy/h" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="lunarSurfaceEstUgyHr"
                      name={az ? 'Ay səthi (qalxansız)' : 'Lunar Surface (Unshielded)'}
                      stroke="#fb7185"
                      fill="#fb7185"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="issDoseUgyHr"
                      name={az ? 'BKS RadLab (Maqnitosfer)' : 'ISS RadLab (Magnetosphere)'}
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
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
                  : az ? `Proton axını ≥10 MeV (pik ${activeDisplayPfu} pfu)` : `Proton Flux ≥10 MeV (Peak ${activeDisplayPfu} pfu)`}
              </span>
              <span className="text-slate-400">
                {activeTab === 'donki' ? (az ? 'Fırtına saatı (0–48s)' : 'Storm hour (0–48h)') : t('missionHour')}
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
          <dl className="mt-4 grid grid-cols-3 gap-2 text-xs sm:gap-3">
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
        )}
      </div>
    </div>
  );
}
