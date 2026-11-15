import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Database, Droplet, ExternalLink, HeartPulse, Snowflake, SunDim, X, Zap } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  CITATIONS,
  ECLSS_BASELINES,
  LCROSS_CABEUS,
  LRO_PROFILE,
  LRO_SHADOW,
  LUNAR_RESEARCH,
  MAY_2024_PROTON_EVENT,
  RADIATION_LIMITS,
  SEP_PROFILE,
  SEP_STORM_DOSE_UNSHIELDED_MSV,
  TALL_MAST_SHADOW_OUTPUT_FACTOR,
} from '../data/nasaTelemetry';

interface NasaSensorDeckModalProps {
  onClose: () => void;
}

const TABS = [
  { id: 'lola', icon: SunDim, label: { en: 'Sunlight', az: 'Günəş işığı' } },
  { id: 'diviner', icon: Snowflake, label: { en: 'Temperature', az: 'Temperatur' } },
  { id: 'lcross', icon: Droplet, label: { en: 'Water ice', az: 'Su buzu' } },
  { id: 'donki', icon: Zap, label: { en: 'Particle storm', az: 'Hissəcik fırtınası' } },
  { id: 'bvad', icon: HeartPulse, label: { en: 'Life support', az: 'Həyat təminatı' } },
] as const;

const tooltipStyle = {
  background: '#09151e',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 8,
  fontSize: 12,
};

const CHARTS = {
  lola: {
    title: { en: 'Visible solar disk (%)', az: 'Günəş diskinin görünən hissəsi (%)' },
    data: LRO_PROFILE,
    dataKey: 'sunVisibilityPct',
    domain: [0, 100],
    unit: '%',
    color: '#fde047',
    interpolation: 'stepAfter',
  },
  diviner: {
    title: { en: 'Surface temperature (K)', az: 'Səth temperaturu (K)' },
    data: LRO_PROFILE,
    dataKey: 'surfaceTempK',
    domain: [70, 240],
    unit: ' K',
    color: '#38bdf8',
    interpolation: 'stepAfter',
  },
  donki: {
    title: { en: 'Proton flux ≥10 MeV (pfu)', az: 'Proton axını ≥10 MeV (pfu)' },
    data: SEP_PROFILE,
    dataKey: 'protonFluxPfu',
    domain: [0, 220],
    unit: ' pfu',
    color: '#fb7185',
    interpolation: 'linear',
  },
} as const;

export function NasaSensorDeckModal({ onClose }: NasaSensorDeckModalProps) {
  const { lang, t, tr } = useI18n();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('lola');
  const az = lang === 'az';
  const chart = activeTab === 'bvad' || activeTab === 'lcross' ? null : CHARTS[activeTab];
  const title = az ? 'NASA mənbələri və missiya modeli' : 'NASA sources and mission model';
  const storm = MAY_2024_PROTON_EVENT;
  const iceConcentration = `${(LCROSS_CABEUS.waterIceMassFraction * 100).toFixed(1)} ± ${(LCROSS_CABEUS.uncertaintyMassFraction * 100).toFixed(1)}%`;
  const references = {
    lola: {
      title: az ? 'LOLA topoqrafiyasına əsaslanan araşdırma' : 'Research based on LOLA topography',
      body: az
        ? `LRO lazer altimetri ilə qurulan relyef modeli Şeklton kənarı yaxınlığındakı xüsusilə işıqlı bir nöqtədə ildə ${LUNAR_RESEARCH.nearRimContinuousSunlightDays} gün fasiləsiz işıq və ən çox ${LUNAR_RESEARCH.nearRimLongestDarknessDays} gün fasiləsiz tam qaranlıq göstərib. Nəticə yerə və hündürlüyə bağlıdır.`
        : `A model built from LRO laser altimetry found ${LUNAR_RESEARCH.nearRimContinuousSunlightDays} days of continuous sunlight each year and up to ${LUNAR_RESEARCH.nearRimLongestDarknessDays} days of continuous darkness at one particularly well-lit spot near Shackleton’s rim. Illumination varies by position and elevation.`,
      sources: [CITATIONS.LOLA_ILLUM],
    },
    diviner: {
      title: az ? 'Diviner məlumatlarına əsaslanan qiymətləndirmə' : 'Estimate from Diviner observations',
      body: az
        ? `Tədqiqatçılar Ayın cənub qütb bölgəsində, LCROSS-un Kabeus kraterinə düşdüyü yerdə səthaltı temperaturu təxminən ${LUNAR_RESEARCH.cabeusSubsurfaceTempK} K hesablayıblar. Bu nəticə həmin əraziyə aiddir.`
        : `Researchers estimated a subsurface temperature of about ${LUNAR_RESEARCH.cabeusSubsurfaceTempK} K at the LCROSS impact site in Cabeus crater, in the Moon’s south polar region. The estimate applies to that location.`,
      sources: [CITATIONS.DIVINER_COLDTRAPS],
    },
    lcross: {
      title: az ? 'LCROSS ölçmələrinə əsaslanan qiymətləndirmə' : 'Estimate from LCROSS observations',
      body: az
        ? `9 oktyabr 2009-cu ildə LCROSS Kabeus kraterində zərbə ilə qalxan materialın spektrini ölçdü. Tədqiqatçılar həmin nöqtədə su buzunun kütlə payını ${iceConcentration} hesabladılar. Buz miqdarı əraziyə görə dəyişir.`
        : `On October 9, 2009, LCROSS measured spectra of the impact plume at Cabeus crater. Researchers estimated a water-ice concentration of ${iceConcentration} by mass at that site. Ice abundance varies by location.`,
      sources: [CITATIONS.LCROSS],
    },
    donki: {
      title: az ? 'Yer yaxınlığında qeydə alınmış hadisə' : 'Event recorded near Earth',
      body: az
        ? `NASA DONKI-yə görə, GOES-də >10 MeV proton axını ${storm.onsetUtc} vaxtında ${storm.onsetThresholdPfu} pfu həddini keçdi. NOAA ${storm.peakUtc} vaxtında ${storm.peakPfu} pfu pik qeydə alıb. Bu müşahidələr geosinxron Yer orbitinə aiddir.`
        : `NASA DONKI reports that the GOES >10 MeV proton flux crossed ${storm.onsetThresholdPfu} pfu at ${storm.onsetUtc}. NOAA reports a ${storm.peakPfu} pfu peak at ${storm.peakUtc}. These measurements come from geosynchronous Earth orbit.`,
      sources: [CITATIONS.DONKI, CITATIONS.GOES_PROTONS],
    },
    bvad: {
      title: az ? 'NASA planlama göstəriciləri və BKS nümayişi' : 'NASA planning values and ISS demonstration',
      body: az
        ? 'BVAD qısa missiya üçün bir nümunə ekipaj üzvünün maddələr mübadiləsini modelləşdirir. BKS-də suyun 98%-nin geri qazanılması sistem sınağında nümayiş etdirilib. BKS-də ilk Veggie kahı sınağı 33 gün davam edib.'
        : 'BVAD models a reference crewmember’s metabolism for a short mission. The ISS demonstrated 98% water recovery. Its first Veggie lettuce trial ran for 33 days.',
      sources: [CITATIONS.BVAD, CITATIONS.ISS_ECLSS, CITATIONS.ISS_VEGGIE, CITATIONS.NASA_STD_3001],
    },
  }[activeTab];
  const model = {
    lola: az
      ? `Təlimdə relyef kölgəsi 48–120-ci saatları əhatə edir. Bu müddətdə alçaq panellər nominal istehsalın ${100 - LRO_SHADOW.arrayOutputDropPct}%-ni, hündür dirək isə ${TALL_MAST_SHADOW_OUTPUT_FACTOR * 100}%-ni təmin edir.`
      : `In training, the terrain shadow lasts from hour 48 to 120. Low panels deliver ${100 - LRO_SHADOW.arrayOutputDropPct}% of nominal output while the tall mast delivers ${TALL_MAST_SHADOW_OUTPUT_FACTOR * 100}%.`,
    diviner: az
      ? `Uydurma baza səthi kölgədə ${LRO_SHADOW.minSurfaceTempK} K-ə (təxminən ${LRO_SHADOW.minSurfaceTempC} °C) qədər soyuyur. Model bunu qızdırıcının enerji tələbini artırmaq üçün istifadə edir.`
      : `The simulated outpost surface cools to ${LRO_SHADOW.minSurfaceTempK} K (about ${LRO_SHADOW.minSurfaceTempC} °C) in shadow. Colder surface conditions increase heater demand in the model.`,
    lcross: az
      ? 'Təlimdə Kabeus göstəricisi ssenaridəki buzlu qrunt nümunəsinə tətbiq edilir. Çıxarılan suyun miqdarı emal edilən kütlədən, buz payından və emalın səmərəliliyindən asılıdır.'
      : 'The exercise applies the Cabeus estimate to a fictional batch of icy soil. Water yield depends on how much material is processed, its ice fraction, and the recovery efficiency.',
    donki: az
      ? `48 saatlıq təlim əyrisi tarixi pik dəyərindən istifadə edir. Əyrinin vaxtı və forması ssenariyə aiddir. Oyun əmsalı tam məruzqalma üçün təxminən ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv verir. Həqiqi doza spektrdən, qalxanın materialı və həndəsəsindən asılıdır.`
      : `The 48-hour training curve uses the historical peak and a scripted timeline and shape. The game’s scaling gives about ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv for full exposure. Real dose depends on the particle spectrum, shield material, and geometry.`,
    bvad: az
      ? `Missiyada oksigen tələbi iki ekipaj üzvü üçün gündə ${2 * ECLSS_BASELINES.o2KgPerCrewDay} kq-dır. Bazanın su emalı ssenariyə görə dəyişir. Oyunda doza xəbərdarlığı ${RADIATION_LIMITS.missionWarningMsv} mSv-dir. NASA-nın karyera limiti ${RADIATION_LIMITS.careerLimitMsv} mSv-dir.`
      : `Mission oxygen demand is ${2 * ECLSS_BASELINES.o2KgPerCrewDay} kg/day for two crew. Outpost water recovery varies by scenario. The game uses a ${RADIATION_LIMITS.missionWarningMsv} mSv warning. NASA’s career limit is ${RADIATION_LIMITS.careerLimitMsv} mSv.`,
  }[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/85 p-4 backdrop-blur-md"
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
      <div className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-sky-400/35 bg-[#10202b] p-4 shadow-2xl scrollbar-thin sm:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#c0e6aa]">
              <Database size={15} aria-hidden="true" />
              {az ? 'Elmi mənbələr' : 'Science reference'}
            </div>
            <h2 id="science-deck-title" className="mt-1 text-xl font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            autoFocus
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

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-4">
            <h3 className="text-sm font-semibold text-emerald-200">{references.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-200">{references.body}</p>
            <ul className="mt-3 space-y-1">
              {references.sources.map((source) => (
                <li key={source.id}>
                  <a className="inline-flex items-center gap-1.5 text-xs text-emerald-200 underline decoration-emerald-300/40 underline-offset-2 hover:text-white"
                    href={source.url} target="_blank" rel="noreferrer">
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

        {chart ? (
          <figure className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <figcaption className="mb-2 flex flex-wrap justify-between gap-2 px-2 text-xs">
              <span className="font-semibold text-slate-100">{tr(chart.title)}</span>
              <span className="text-slate-400">{activeTab === 'donki'
                ? az ? 'Fırtınanın ssenari saatı' : 'Scripted storm hour'
                : t('missionHour')}</span>
            </figcaption>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart.data} margin={{ top: 4, right: 14, bottom: 3, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#223340" />
                  <XAxis dataKey="hour" type="number" domain={activeTab === 'donki' ? [0, 48] : [0, 216]} stroke="#8da4aa" unit=" h" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8da4aa" domain={[...chart.domain]} unit={chart.unit} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  {activeTab !== 'donki' && (
                    <ReferenceArea x1={LRO_SHADOW.startHour} x2={LRO_SHADOW.endHour} fill={chart.color} fillOpacity={0.12} />
                  )}
                  <Area
                    type={chart.interpolation}
                    dataKey={chart.dataKey}
                    name={tr(chart.title)}
                    stroke={chart.color}
                    fill={chart.color}
                    fillOpacity={0.18}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </figure>
        ) : activeTab === 'bvad' ? (
          <dl className="mt-4 grid grid-cols-3 gap-2 text-xs sm:gap-3">
            {[
              { title: t('eclssO2'), value: ECLSS_BASELINES.o2KgPerCrewDay, unit: t('perCrewDay') },
              { title: t('eclssCo2'), value: ECLSS_BASELINES.co2KgPerCrewDay, unit: t('perCrewDay') },
              { title: t('eclssWater'), value: ECLSS_BASELINES.issWaterRecoveryPct, unit: '%' },
            ].map(({ title: label, value, unit }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <dt className="text-slate-300">{label}</dt>
                <dd className="mt-1 text-base font-bold text-teal-200">{value} <span className="text-xs font-normal">{unit}</span></dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}
