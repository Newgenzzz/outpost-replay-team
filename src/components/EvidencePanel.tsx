import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calculator, Database, FlaskConical, ShieldCheck, Wrench } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  CITATIONS,
  DOSE_COEFF_MSV_PER_HR_PER_PFU,
  ECLSS_BASELINES,
  GAME_CONSTANTS as K,
  LRO_PROFILE,
  LRO_SHADOW,
  TRAINING_SITE,
  MAY_2024_PROTON_EVENT,
  RADIATION_LIMITS,
  SEP_PEAK_DOSE_RATE_MSV_PER_HR,
  SEP_PEAK_FLUX_PFU,
  SEP_PROFILE,
  SEP_STORM_DOSE_UNSHIELDED_MSV,
  SHIELDING,
  TALL_MAST_SHADOW_OUTPUT_FACTOR,
} from '../data/nasaTelemetry';
import type { Bilingual } from '../types';

const tooltipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 };

const SIMPLIFIED_ROWS: Array<{ param: Bilingual; value: string; why: Bilingual }> = [
  {
    param: { en: 'Power unit', az: 'Enerji vahidi' },
    value: '1 unit = 1 kWh, 0–100',
    why: { en: 'Small-outpost battery scale chosen for readability; real habitats need far more.', az: 'Oxunaqlılıq üçün seçilmiş kiçik baza batareya miqyası; real modullara daha çox lazımdır.' },
  },
  {
    param: { en: 'Solar generation / base load', az: 'Günəş istehsalı / əsas yük' },
    value: `${K.generationKwhPerDay} / ${K.baseLoadKwhPerDay} kWh·day⁻¹`,
    why: { en: 'The scripted shadow cuts production and forces the crew to draw on storage or backup power.', az: 'Ssenaridəki kölgə istehsalı azaldır. Ekipaj batareya və ya ehtiyat enerji mənbəyindən istifadə edir.' },
  },
  {
    param: { en: 'Tall-mast shadow output', az: 'Hündür dirəyin kölgədə gücü' },
    value: `${Math.round(TALL_MAST_SHADOW_OUTPUT_FACTOR * 100)} % (vs ${100 - LRO_SHADOW.arrayOutputDropPct} %)`,
    why: { en: 'A taller mast can clear more of the local horizon. The percentages are set for this scenario.', az: 'Hündür dirəkdə üfüqün daha çox hissəsi görünə bilər. Faizlər bu ssenari üçün seçilib.' },
  },
  {
    param: { en: 'Heater load', az: 'Qızdırıcı yükü' },
    value: `${K.heaterKwhPerDayPer100K} kWh·day⁻¹ per 100 K below ${K.heaterReferenceTempK} K`,
    why: { en: 'A linear approximation links simulated surface temperature to heater demand.', az: 'Xətti yaxınlaşma ssenaridəki səth temperaturunu qızdırıcının enerji tələbi ilə əlaqələndirir.' },
  },
  {
    param: { en: 'Life support %', az: 'Həyat təminatı %' },
    value: `−${K.lifeSupportDrainPctPerDay} %·day⁻¹`,
    why: { en: 'A training allowance for equipment strain and consumable wear. The crew also uses oxygen, water and food.', az: 'Avadanlıq və sərf materiallarının aşınması üçün təlim dəyəri. Ekipaj həmçinin oksigen, su və qida sərf edir.' },
  },
  {
    param: { en: 'Resource reserves', az: 'Resurs ehtiyatları' },
    value: 'kg O₂ · kg H₂O · kg',
    why: { en: 'The crew uses oxygen, water, and rations each hour. Low power reduces water recovery.', az: 'Ekipaj hər saat oksigen, su və qida ehtiyatından istifadə edir. Enerji azaldıqda suyun təkrar emalı zəifləyir.' },
  },
  {
    param: { en: 'Crop trial', az: 'Bitki sınağı' },
    value: '25 → 30 d',
    why: { en: 'A pre-grown tray needs five more powered growing days. It provides a small supplement to stored rations.', az: 'Əvvəlcədən yetişdirilmiş bitkilərə işıqlandırma ilə daha beş böyümə günü lazımdır. Məhsul saxlanmış qida ehtiyatını az miqdarda tamamlayır.' },
  },
  {
    param: { en: 'GCR background', az: 'Kosmik şüa fonu' },
    value: `${K.gcrMsvPerDay} mSv·day⁻¹`,
    why: { en: 'Constant background radiation allowance used throughout the exercise.', az: 'Təlim boyu istifadə edilən sabit fon radiasiyası dəyəri.' },
  },
  {
    param: { en: 'Flux → dose coefficient', az: 'Axın → doza əmsalı' },
    value: `k = ${DOSE_COEFF_MSV_PER_HR_PER_PFU} mSv·h⁻¹·pfu⁻¹`,
    why: { en: 'Classroom scaling. A real dose estimate requires the particle spectrum and shielding geometry.', az: 'Təlim əmsalı. Həqiqi dozanı qiymətləndirmək üçün hissəcik spektri və qalxanın həndəsəsi lazımdır.' },
  },
  {
    param: { en: 'Shielding transmission', az: 'Qoruyucu keçiriciliyi' },
    value: `suit ${SHIELDING.evaSuit} · hab ${SHIELDING.habitat} · water ${SHIELDING.waterWall} · berm ${SHIELDING.regolithBerm}`,
    why: { en: 'Each scenario factor sets how much of the modeled storm dose passes through a shield.', az: 'Hər ssenari əmsalı modelləşdirilmiş fırtına dozasının qalxandan keçən hissəsini göstərir.' },
  },
  {
    param: { en: 'Mission dose warning', az: 'Missiya doza xəbərdarlığı' },
    value: `${RADIATION_LIMITS.missionWarningMsv} mSv`,
    why: { en: 'Training threshold for this scenario.', az: 'Bu ssenari üçün təlim həddi.' },
  },
  {
    param: { en: 'Science points', az: 'Elm xalları' },
    value: '0–100',
    why: { en: 'Relative value of activities; purely an educational scoring unit.', az: 'Fəaliyyətlərin nisbi dəyəri; sırf təhsil məqsədli qiymətləndirmə vahidi.' },
  },
];

const EQUATIONS = {
  en: `Energy balance = solar + backup − equipment loads\nCrew oxygen demand = crew × ${ECLSS_BASELINES.o2KgPerCrewDay} kg/day × days\nIce extraction yield = processed soil × ice mass fraction × recovery efficiency\nTraining dose estimate = ∫ (scripted flux × assumed dose scale × assumed transmission) dt\nFull exposure in the training storm ≈ ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv before background`,
  az: `Enerji balansı = günəş + ehtiyat enerji − avadanlıq sərfi\nEkipajın oksigen tələbi = ekipaj sayı × ${ECLSS_BASELINES.o2KgPerCrewDay} kq/gün × gün sayı\nBuzdan çıxarılan su = emal edilən qrunt × buzun kütlə payı × emal səmərəliliyi\nTəlim dozasının hesablanması = ∫ (ssenari axını × fərz edilən doza əmsalı × fərz edilən keçiricilik) dt\nTəlim fırtınasında tam məruzqalma ≈ ${SEP_STORM_DOSE_UNSHIELDED_MSV} mSv (fon radiasiyası xaric)`,
};

function Tag({ kind }: { kind: 'reference' | 'model' }) {
  const { lang } = useI18n();
  const label = kind === 'model' ? 'MODEL' : lang === 'az' ? 'MƏNBƏ' : 'REFERENCE';
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
        kind === 'reference' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
      }`}
    >
      {label}
    </span>
  );
}

export default function EvidencePanel() {
  const { lang, t, tr } = useI18n();
  const az = lang === 'az';

  return (
    <section className="panel space-y-4 p-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <FlaskConical className="h-5 w-5 text-sky-300" /> {t('evidenceTitle')}
          </h2>
          <p className="text-xs text-slate-400">
            {az ? 'Nəşr edilmiş mənbələr, təlim əyriləri və modelin fərziyyələri.' : 'Published references, training curves, and the assumptions behind the model.'}
          </p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-200">
            <Database className="h-4 w-4" /> {az ? 'Missiya profilləri' : 'Mission profiles'} <Tag kind="model" />
          </h3>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-sm font-medium text-slate-100">{az ? 'Təlimdə relyef kölgəsi' : 'Terrain shadow in training'}</p>
            <p className="text-[11px] text-slate-400">
              {tr(TRAINING_SITE.name)} · {az ? 'Ayın cənub qütbü' : 'Lunar south pole'}
            </p>
            <p className="mt-1 text-xs text-slate-300">{az
              ? 'Bu ssenaridə işıq 48–120-ci saatlarda azalır və səth 90 K-ə qədər soyuyur.'
              : 'In this scenario, sunlight drops from mission hour 48 to 120 and the surface cools to 90 K.'}</p>
            <div className="mt-2 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={LRO_PROFILE} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
                  <ReferenceArea yAxisId="sun" x1={LRO_SHADOW.startHour} x2={LRO_SHADOW.endHour} fill="#f59e0b" fillOpacity={0.08} />
                  <XAxis dataKey="hour" type="number" domain={[0, 216]} ticks={[0, 48, 120, 192, 216]} stroke="#64748b" />
                  <YAxis yAxisId="sun" domain={[0, 100]} stroke="#f59e0b" width={40} />
                  <YAxis yAxisId="temp" orientation="right" domain={[0, 250]} stroke="#38bdf8" width={36} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(h) => `${t('missionHour')} ${h}`} />
                  <Area yAxisId="sun" type="stepAfter" dataKey="sunVisibilityPct" name={t('sunVisible')} stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} isAnimationActive={false} />
                  <Line yAxisId="temp" type="stepAfter" dataKey="surfaceTempK" name={t('surfaceTemp')} stroke="#38bdf8" dot={false} strokeWidth={2} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-amber-400">■</span> {t('sunVisible')} · <span className="text-sky-400">■</span> {t('surfaceTemp')} · {t('missionHour')}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-sm font-medium text-slate-100">{az ? 'Təlimdə hissəcik fırtınası' : 'Particle storm in training'}</p>
            <p className="mt-1 text-xs text-slate-300">{az
              ? `Əyrinin vaxtı və forması ssenariyə aiddir. Pik dəyər NOAA-nın Yer orbitində müşahidə etdiyi ${MAY_2024_PROTON_EVENT.peakPfu} pfu göstəricisinə bərabərdir.`
              : `The curve follows a scripted timeline and shape. Its peak matches NOAA’s observed ${MAY_2024_PROTON_EVENT.peakPfu} pfu in Earth orbit.`}</p>
            <div className="mt-2 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={SEP_PROFILE} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
                  <XAxis dataKey="hour" type="number" domain={[0, 48]} ticks={[0, 12, 24, 36, 48]} stroke="#64748b" />
                  <YAxis yAxisId="flux" domain={[0, 250]} stroke="#f43f5e" width={40} />
                  <YAxis yAxisId="dose" orientation="right" domain={[0, 4]} stroke="#e2e8f0" width={36} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(hour) => `${az ? 'Fırtınanın ssenari saatı' : 'Scripted storm hour'} ${hour}`} />
                  <Area yAxisId="flux" type="linear" dataKey="protonFluxPfu" name={t('protonFlux')} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} isAnimationActive={false} />
                  <Line yAxisId="dose" type="linear" dataKey="unshieldedDoseMsvPerHr" name={t('doseRateSuit')} stroke="#e2e8f0" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                  <Line yAxisId="dose" type="linear" dataKey="shieldedDoseMsvPerHr" name={t('doseRateHab')} stroke="#94a3b8" strokeDasharray="4 3" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-rose-400">■</span> {t('protonFlux')} ({SEP_PEAK_FLUX_PFU} pfu) · — {t('doseRateSuit')} ({SEP_PEAK_DOSE_RATE_MSV_PER_HR} mSv/h) · - - {t('doseRateHab')}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
              {az ? 'Planlama və avadanlıq göstəriciləri' : 'Planning and hardware references'} <Tag kind="reference" />
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-slate-900 p-2">
                <dt className="text-slate-400">{t('eclssO2')}</dt>
                <dd className="font-semibold text-slate-100">{ECLSS_BASELINES.o2KgPerCrewDay} {t('perCrewDay')}</dd>
              </div>
              <div className="rounded-lg bg-slate-900 p-2">
                <dt className="text-slate-400">{t('eclssCo2')}</dt>
                <dd className="font-semibold text-slate-100">{ECLSS_BASELINES.co2KgPerCrewDay} {t('perCrewDay')}</dd>
              </div>
              <div className="rounded-lg bg-slate-900 p-2">
                <dt className="text-slate-400">{t('eclssWater')}</dt>
                <dd className="font-semibold text-slate-100">~{ECLSS_BASELINES.issWaterRecoveryPct} %</dd>
              </div>
              <div className="rounded-lg bg-slate-900 p-2">
                <dt className="text-slate-400">{t('careerLimit')}</dt>
                <dd className="font-semibold text-slate-100">{RADIATION_LIMITS.careerLimitMsv} mSv</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* ---------------- SIMPLIFIED ---------------- */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <Wrench className="h-4 w-4" /> {t('simplified')} <Tag kind="model" />
          </h3>
          <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th scope="col" className="w-[24%] px-2 py-1.5 font-medium">{t('parameter')}</th>
                  <th scope="col" className="w-[31%] px-2 py-1.5 font-medium">{t('value')}</th>
                  <th scope="col" className="px-2 py-1.5 font-medium">{t('why')}</th>
                </tr>
              </thead>
              <tbody>
                {SIMPLIFIED_ROWS.map((r) => (
                  <tr key={r.param.en} className="border-t border-slate-800 align-top">
                    <td className="px-2 py-1.5 text-slate-200">{tr(r.param)}</td>
                    <td className="px-2 py-1.5 font-mono text-[11px] break-words text-amber-200">{r.value}</td>
                    <td className="px-2 py-1.5 text-slate-400">{tr(r.why)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-sky-300">
              <Calculator className="h-4 w-4" /> {t('equations')}
            </h3>
            <pre className="scrollbar-thin whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-[10.5px] leading-relaxed text-slate-300">
              {tr(EQUATIONS)}
            </pre>
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-sky-100">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> {az
          ? 'Təlim modeli ssenari dəyərlərindən, NASA-nın LCROSS və BVAD göstəricilərindən və NOAA pik müşahidəsindən istifadə edir.'
          : 'The training model combines scripted conditions, published NASA LCROSS and BVAD values, and an observed NOAA peak.'}
      </p>

      <details className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
        <summary className="cursor-pointer font-semibold text-slate-200">
          {t('citations')} ({Object.keys(CITATIONS).length})
        </summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          {Object.values(CITATIONS).map((c) => (
            <li key={c.id}>
              <span className="text-slate-200">{c.full}</span>{' '}
              <a href={c.url} target="_blank" rel="noreferrer" className="text-sky-300 underline underline-offset-2">{c.short}</a>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
