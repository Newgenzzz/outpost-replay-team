import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Bot,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Info,
  Radio,
  Rocket,
  Satellite,
  ShieldAlert,
  Snowflake,
  Sparkles,
  SunDim,
  Volume2,
  Wrench,
  Zap,
} from 'lucide-react';
import { CALIBRATED_INCIDENCE_LIMIT_DEG } from '../engine/power';
import { ICE_TREATMENT_RECOVERY } from '../engine/resources';
import { useI18n } from '../i18n/LanguageContext';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import { CITATIONS, GAME_CONSTANTS, RADIATION_LIMITS } from '../data/nasaTelemetry';
import { soundFX } from '../utils/soundEffects';
import {
  METRIC_KEYS,
  RULE_LABELS,
  previewChoiceEffects,
  runExperiment,
  type StepRecord,
} from '../engine/simulation';
import type { Bilingual, FlagId, MetricDelta, MissionTaskSettings, TrainingMode } from '../types';
import LunarSiteIntelligence from './LunarSiteIntelligence';
import { CHOICE_LETTERS, METRICS, deltaTone, fmt, signed } from './metricMeta';
import { ShadowPredictionInput } from './ShadowPrediction';
import type { ShadowPrediction, ShadowStrategy } from '../engine/shadowPrediction';
import { applyRunChoice, type RunInput } from '../engine/runInput';

const CREW_ADVISORY: Record<number, { speaker: Bilingual; tip: Bilingual }> = {
  1: {
    speaker: { en: 'Eng. Leyla · Power', az: 'Mühəndis Leyla · Enerji' },
    tip: {
      en: 'The array makes the most power when it faces the Sun. Elevation can help it see over the ridge.',
      az: 'Panel Günəşə birbaşa baxanda daha çox enerji verir. Hündürlük silsilənin üstündən işıq almağa kömək edə bilər.',
    },
  },
  2: {
    speaker: { en: 'Eng. Leyla · Habitat', az: 'Mühəndis Leyla · Yaşayış modulu' },
    tip: {
      en: 'You have time for one upgrade. Compare the crew’s oxygen reserve, storm protection and the power a crop trial needs.',
      az: 'Bir təkmilləşdirməyə vaxt var. Oksigen ehtiyatını, fırtınadan qorunmanı və bitki sınağının enerji tələbini müqayisə edin.',
    },
  },
  3: {
    speaker: { en: 'Mission Control · Shadow alert', az: 'İdarəetmə mərkəzi · Kölgə xəbərdarlığı' },
    tip: {
      en: 'A reserve below 20 kWh strains life support in this model. See how many hours each option spends below that threshold.',
      az: 'Bu modeldə ehtiyat 20 kVt·saatdan aşağı düşəndə həyat təminatı zəifləyir. Hər variantın həddən aşağı neçə saat qaldığına baxın.',
    },
  },
  4: {
    speaker: { en: 'Cmdr. Azer · Rover operations', az: 'Komandir Azər · Rover əməliyyatları' },
    tip: {
      en: 'A crewed traverse gathers more science but draws power and suit supplies. A robot saves crew exposure. Maintenance buys time.',
      az: 'Ekipajlı səfər daha çox elm gətirir, lakin enerji və skafandr ehtiyatı sərf edir. Robot ekipajın dozasını azaldır. Texniki xidmət vaxt qazandırır.',
    },
  },
  5: {
    speaker: { en: 'Mission Control · Particle storm', az: 'İdarəetmə mərkəzi · Zərrəcik fırtınası' },
    tip: {
      en: 'Compare total modeled dose after the storm. If you prepared the berm, the dedicated shelter offers better protection at lower operating cost.',
      az: 'Fırtınadan sonra modeldə toplam dozanı müqayisə edin. Səddi hazırlamısınızsa, xüsusi sığınacaq daha az əməliyyat xərci ilə daha yaxşı qoruyur.',
    },
  },
  6: {
    speaker: { en: 'Mission Control · Close-out', az: 'İdarəetmə mərkəzi · Yekun mərhələ' },
    tip: {
      en: 'Check the final reserves and dose before trading crew margin for more data.',
      az: 'Daha çox məlumat üçün ekipaj ehtiyatını azaltmazdan əvvəl son ehtiyatları və dozanı yoxlayın.',
    },
  },
};

const STATION_BONUS_META: Record<
  number,
  { title: Bilingual; badge: Bilingual; detail: Bilingual }
> = {
  1: {
    title: {
      en: 'Hands-On Station Task · Solar Mast Pointing Lock',
      az: 'Praktiki Stansiya Tapşırığı · Günəş Dirəyi Yönəltmə Kilidi',
    },
    badge: {
      en: `≤${CALIBRATED_INCIDENCE_LIMIT_DEG}° Sun Lock`,
      az: `≤${CALIBRATED_INCIDENCE_LIMIT_DEG}° Günəş Kilidi`,
    },
    detail: {
      en: `Caps panel pointing error at ${CALIBRATED_INCIDENCE_LIMIT_DEG}° to boost harvested solar power across the mission.`,
      az: `Missiya boyu daha çox günəş enerjisi toplamaq üçün panelin yönəlmə xətasını ${CALIBRATED_INCIDENCE_LIMIT_DEG}° həddində saxlayır.`,
    },
  },
  2: {
    title: {
      en: 'Hands-On Station Task · ECLSS Water Loop Seal',
      az: 'Praktiki Stansiya Tapşırığı · Həyat Təminatı Su Dövrü Kipləşdirməsi',
    },
    badge: {
      en: '+4 pp H₂O Recovery',
      az: '+4 faiz b. H₂O Bərpası',
    },
    detail: {
      en: 'Adds 4 percentage points to water recovery during D2, except during an outage. This is a classroom bonus, separate from NASA’s 98% ISS demonstration.',
      az: 'Enerji kəsintisi olmadıqda D2-də su bərpasını 4 faiz bəndi artırır. Bu təlim bonusu NASA-nın BKS-dəki 98% nümayişindən ayrıdır.',
    },
  },
  3: {
    title: {
      en: 'Hands-On Station Task · HVDC Feeder Patch',
      az: 'Praktiki Stansiya Tapşırığı · Yüksək Gərginlikli Şin Birləşməsi',
    },
    badge: {
      en: '+1.8 kWh Saved',
      az: '+1.8 kVt·s Qənaət',
    },
    detail: {
      en: 'Bypasses resistive feeder losses during the 72-hour crater shadow, saving 1.8 kWh of battery reserve.',
      az: '72 saatlıq krater kölgəsi zamanı naqil itkilərini azaldaraq 1.8 kVt·saat batareya ehtiyatına qənaət edir.',
    },
  },
  4: {
    title: {
      en: 'Hands-On Station Task · Cryo-Extractor Pre-Heat',
      az: 'Praktiki Stansiya Tapşırığı · Buz Emal Qurğusunun Hazırlığı',
    },
    badge: {
      en: `${ICE_TREATMENT_RECOVERY.standard * 100}% → ${ICE_TREATMENT_RECOVERY.prepared * 100}% Ice Yield`,
      az: `${ICE_TREATMENT_RECOVERY.standard * 100}% → ${ICE_TREATMENT_RECOVERY.prepared * 100}% Su Çıxımı`,
    },
    detail: {
      en: `Raises clean water recovery from ${ICE_TREATMENT_RECOVERY.standard * 100}% to ${ICE_TREATMENT_RECOVERY.prepared * 100}% in Option A (plus +3 kg icy regolith feedstock per mined 90K basin core).`,
      az: `A variantında təmiz su çıxımını ${ICE_TREATMENT_RECOVERY.standard * 100}%-dən ${ICE_TREATMENT_RECOVERY.prepared * 100}%-ə qaldırır (üstəlik qazılan hər 90K buz nümunəsi üçün +3 kq xammal).`,
    },
  },
  5: {
    title: {
      en: 'Hands-On Station Task · Storm Bulkhead Clamp',
      az: 'Praktiki Stansiya Tapşırığı · Fırtına Qapısı Germetik Kilidi',
    },
    badge: {
      en: '−15% Storm Dose',
      az: '−15% Fırtına Dozası',
    },
    detail: {
      en: 'Assumes 15% less storm dose while sheltered. It does not reduce outside exposure or background dose; this is not a tested shielding measurement.',
      az: 'Sığınacaqda fırtına dozasının 15% azalması fərz edilir. Çöldəki və fon dozası azalmır; bu, sınaqdan keçirilmiş qalxan ölçməsi deyil.',
    },
  },
  6: {
    title: {
      en: 'Hands-On Station Task · Ka-Band Earth Dish Lock',
      az: 'Praktiki Stansiya Tapşırığı · Ka-Diapazon Yer Antenası Kilidi',
    },
    badge: {
      en: '+4 Science Pts',
      az: '+4 Elm Xalı',
    },
    detail: {
      en: 'Locks high-gain Earth telemetry alignment, adding +4 bonus science points on final downlink.',
      az: 'Yüksək güclü Yer telemetriya xəttini dəqiq yönəldərək yekun ötürmədə +4 bonus elm xalı gətirir.',
    },
  },
};

function CrewAvatar({ step }: { step: number }) {
  if (step === 4) {
    // Stylized 2.5D Lunar Rover SVG
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="h-11 w-11 shrink-0 rounded-xl border border-sky-400/50 bg-[#0c1a24] p-1"
      >
        <circle cx="24" cy="24" r="20" fill="#102636" />
        <line x1="26" y1="20" x2="26" y2="10" stroke="#fde047" strokeWidth="2" />
        <circle cx="26" cy="9" r="3" fill="#38bdf8" />
        <polygon points="29,9 43,4 43,14" fill="#38bdf8" opacity="0.28" />
        <rect x="11" y="20" width="24" height="10" rx="3" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="1.2" />
        <rect x="14" y="22" width="10" height="5" rx="1" fill="#0ea5e9" opacity="0.7" />
        <circle cx="15" cy="33" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="31" cy="33" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    );
  }
  if (step === 3 || step === 5 || step === 6) {
    // Mission Control CapCom Dish & Waveform SVG
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="h-11 w-11 shrink-0 rounded-xl border border-amber-400/45 bg-[#121e28] p-1"
      >
        <circle cx="24" cy="24" r="20" fill="#132330" />
        <path d="M14 33 C14 23, 25 16, 33 16" fill="none" stroke="#c0e6aa" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="23" y1="24" x2="31" y2="15" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="14" r="2.6" fill="#fde047" />
        <path d="M28 9 A10 10 0 0 1 39 20" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="18" y="33" width="12" height="4" rx="1.5" fill="#64748b" />
      </svg>
    );
  }
  // Artemis Astronaut Helmet (Eng. Leyla) SVG
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="h-11 w-11 shrink-0 rounded-xl border border-emerald-400/45 bg-[#0e2028] p-1"
    >
      <circle cx="24" cy="24" r="20" fill="#122934" />
      <line x1="34" y1="15" x2="34" y2="8" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="34" cy="7.5" r="2" fill="#34d399" />
      <rect x="12" y="12" width="24" height="24" rx="11" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.4" />
      <rect x="15" y="16" width="18" height="13" rx="6" fill="#f59e0b" stroke="#fef08a" strokeWidth="1" />
      <path d="M18 19 Q24 16 30 19" fill="none" stroke="#fef9c3" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      <rect x="16" y="34" width="16" height="4" rx="2" fill="#38bdf8" opacity="0.8" />
    </svg>
  );
}

function DeltaChips({ delta, size = 'sm' }: { delta: MetricDelta; size?: 'sm' | 'xs' }) {
  const { t } = useI18n();
  const entries = METRIC_KEYS.filter((k) => (delta[k] ?? 0) !== 0);
  if (!entries.length) return <span className="text-[10px] text-slate-500">±0</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {entries.map((k) => {
        const m = METRICS.find((x) => x.key === k)!;
        const v = delta[k] ?? 0;
        return (
          <span
            key={k}
            className={`inline-flex items-center gap-0.5 rounded border px-1 tabular-nums ${
              size === 'xs' ? 'text-[10px]' : 'text-[11px]'
            } ${deltaTone(v, m.higherIsBetter)}`}
          >
            <m.icon className="h-3 w-3" />
            {signed(Math.round(v * 10) / 10)} {t(m.unitKey)}
          </span>
        );
      })}
    </span>
  );
}

interface DecisionCardProps {
  step: number;
  mode: 'baseline' | 'branch';
  trainingMode?: TrainingMode;
  onToggleTrainingMode?: () => void;
  choiceA: number | undefined;
  choiceB: number | undefined;
  record: StepRecord | undefined;
  flagsBefore: FlagId[];
  runInput: RunInput;
  canChoose: boolean;
  taskSettings: MissionTaskSettings;
  taskAvailable: boolean;
  minedCount?: number;
  collectedSamplesCount?: number;
  taskExercise?: ReactNode;
  shadowPrediction: ShadowPrediction | null;
  onChoose: (index: number, tasks: MissionTaskSettings, prediction: ShadowStrategy | null) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function DecisionCard(props: DecisionCardProps) {
  const {
    step,
    mode,
    trainingMode = 'cadet',
    onToggleTrainingMode,
    choiceA,
    choiceB,
    record,
    flagsBefore,
    runInput,
    canChoose,
    taskSettings,
    taskAvailable,
    minedCount,
    collectedSamplesCount,
    taskExercise,
    onChoose,
    onPrev,
    onNext,
  } = props;
  const { lang, t, tr } = useI18n();
  const isCadet = trainingMode === 'cadet';
  const [inspectedChoice, setInspectedChoice] = useState<number | null>(null);
  const [hypothesis, setHypothesis] = useState<'safe' | 'drain' | null>(null);
  const [copilotEnabled, setCopilotEnabled] = useState(isCadet);
  const [taskOverride, setTaskOverride] = useState<boolean | null>(null);
  const [shadowGuess, setShadowGuess] = useState<ShadowStrategy | null>(props.shadowPrediction?.expected ?? null);

  const currentStepDefault =
    step === 1
      ? taskSettings.solarCalibrated
      : step === 2
        ? Boolean(taskSettings.eclssSealed)
        : step === 3
          ? Boolean(taskSettings.busPatched)
          : step === 4
            ? taskSettings.icePrepared
            : step === 5
              ? Boolean(taskSettings.stormClamped)
              : Boolean(taskSettings.dishAligned);

  const stepTaskEnabled = taskOverride ?? currentStepDefault;

  const effectiveTasks: MissionTaskSettings = useMemo(
    () => ({
      ...taskSettings,
      solarCalibrated: step === 1 ? stepTaskEnabled : taskSettings.solarCalibrated,
      eclssSealed: step === 2 ? stepTaskEnabled : taskSettings.eclssSealed,
      busPatched: step === 3 ? stepTaskEnabled : taskSettings.busPatched,
      icePrepared: step === 4 ? stepTaskEnabled : taskSettings.icePrepared,
      stormClamped: step === 5 ? stepTaskEnabled : taskSettings.stormClamped,
      dishAligned: step === 6 ? stepTaskEnabled : taskSettings.dishAligned,
      extraIceCores: minedCount ?? taskSettings.extraIceCores ?? 0,
      fieldSamplesCount: collectedSamplesCount ?? taskSettings.fieldSamplesCount ?? 0,
    }),
    [taskSettings, step, stepTaskEnabled, minedCount, collectedSamplesCount],
  );

  const decision = MISSION_DECISIONS[step - 1];
  const activeChoice = mode === 'branch' ? choiceB : choiceA;
  const trigger = decision.nasaDataTrigger;
  const advisory = CREW_ADVISORY[step] ?? CREW_ADVISORY[1];
  const stationMeta = STATION_BONUS_META[step] ?? STATION_BONUS_META[1];

  const inspectedIdx = inspectedChoice ?? activeChoice ?? 0;
  const earlierSamples = Math.max(0, ...runInput.phases.slice(0, step - 1).map(p => p.tasks.fieldSamplesCount));
  const newSamples = Math.max(0, (collectedSamplesCount ?? 0) - earlierSamples);
  const forecasts = useMemo(() => {
    const prefix = { ...runInput, phases: runInput.phases.slice(0, step - 1) };
    if (prefix.phases.length !== step - 1) return [];
    return decision.choices.map((_, index) =>
      runExperiment(applyRunChoice(
        prefix, step, index,
        {
          ...effectiveTasks,
          icePrepared: step === 4 ? index === 0 && stepTaskEnabled : effectiveTasks.icePrepared,
        },
      )).steps[step - 1],
    );
  }, [decision, runInput, step, effectiveTasks, stepTaskEnabled]);

  const forecastStep = forecasts[inspectedIdx];
  const ledgerRecord = forecastStep ?? record;
  const conditionals = previewChoiceEffects(step, inspectedIdx, flagsBefore).conditionals;
  const kg = lang === 'az' ? 'kq' : 'kg';
  const pp = lang === 'az' ? 'faiz b.' : 'pp';

  const willBeSafe = (forecastStep?.env.lowPowerHours ?? 0) === 0;
  const hypothesisMatches =
    hypothesis !== null ? (hypothesis === 'safe' && willBeSafe) || (hypothesis === 'drain' && !willBeSafe) : null;

  const displayedTitle = isCadet && decision.cadetTitle ? decision.cadetTitle : decision.title;
  const displayedContext = isCadet && decision.cadetContext ? decision.cadetContext : decision.context;

  return (
    <section className="flex min-h-0 flex-col">
      <div
        className="decision-scroll min-h-0 overflow-y-auto px-1 pb-4 scrollbar-thin"
        tabIndex={0}
        role="region"
        aria-label={lang === 'az' ? 'Qərar variantları və proqnozlar' : 'Decision options and forecasts'}
      >
        <div className="flex flex-col gap-3 px-1">
          {/* Header with Step Title + Cadet/Engineer Switch + Hints + Prev/Next */}
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                {t('decision')} {decision.id} / 6 · {tr(decision.phase.label)}
                {mode === 'branch' && (
                  <span className="ml-2 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-fuchsia-200">{t('runB')}</span>
                )}
              </p>
              <h2 className="mt-0.5 text-xl font-semibold text-slate-50">{tr(displayedTitle)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {onToggleTrainingMode && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.play('uiClick');
                    onToggleTrainingMode();
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    isCadet
                      ? 'border-amber-400/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                      : 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                  }`}
                  title={
                    lang === 'az'
                      ? 'Gənc Kadet (7–12 yaş) və Uçuş Mühəndisi rejimi arasında keçid'
                      : 'Switch between Junior Cadet (Ages 7–12) and Flight Engineer telemetry'
                  }
                >
                  {isCadet ? <Rocket size={13} /> : <GraduationCap size={13} />}
                  <span>
                    {isCadet
                      ? lang === 'az'
                        ? 'Kadet Rejimi'
                        : 'Cadet Mode'
                      : lang === 'az'
                        ? 'Mühəndis Rejimi'
                        : 'Engineer Mode'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundFX.play('uiClick');
                  setCopilotEnabled((v) => !v);
                }}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  copilotEnabled
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={copilotEnabled}
              >
                <Bot size={13} className={copilotEnabled ? 'text-emerald-300' : 'text-slate-400'} />
                <span>
                  {copilotEnabled
                    ? lang === 'az'
                      ? 'İpucu: Açıq'
                      : 'Hints on'
                    : lang === 'az'
                      ? 'İpucu: Qapalı'
                      : 'Hints off'}
                </span>
              </button>

              <button
                onClick={onPrev}
                disabled={step === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t('prev')}
              </button>
              <button
                onClick={onNext}
                disabled={activeChoice === undefined}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                {step === 6 ? t('viewResults') : t('next')} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          {/* Top-of-Console Scenario Story + Crew Radio Call + NASA Crisis Trigger */}
          <div className="grid gap-2.5 rounded-xl border border-[#4c6b68] bg-[#13252d] p-3">
            <div className="flex items-start gap-3">
              <CrewAvatar step={step} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-sky-300">
                    <Radio className="h-3 w-3 text-emerald-400" />
                    {tr(advisory.speaker)}
                  </p>
                  <button
                    type="button"
                    onClick={() => soundFX.speakRadio(tr(advisory.tip), lang)}
                    className="inline-flex items-center gap-1 rounded-md border border-sky-400/35 bg-sky-500/15 px-2 py-0.5 text-[10.5px] font-medium text-sky-100 hover:bg-sky-500/25"
                    title={lang === 'az' ? 'Radio məsləhətinə qulaq asın' : 'Listen to the crew radio call'}
                  >
                    <Volume2 size={11} className="text-sky-300" />
                    <span>{lang === 'az' ? 'Rabitəni Dinlə' : 'Radio Call'}</span>
                  </button>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#d9eed0]">{tr(advisory.tip)}</p>
              </div>
            </div>

            <p className="border-t border-white/10 pt-2 text-sm leading-relaxed text-slate-200">
              {tr(displayedContext)}
            </p>

            {trigger && (
              <div
                className={`rounded-xl border px-3 py-2 ${
                  trigger.source === 'LRO_SHADOW'
                    ? 'border-amber-400/45 bg-amber-500/12'
                    : 'border-rose-400/50 bg-rose-500/12'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`flex items-center gap-1.5 text-xs font-bold ${
                      trigger.source === 'LRO_SHADOW' ? 'text-amber-200' : 'text-rose-200'
                    }`}
                  >
                    {trigger.source === 'LRO_SHADOW' ? <SunDim className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    {trigger.source === 'DONKI_SEP'
                      ? lang === 'az' ? `Təlim fırtınası · ssenari piki ${runInput.scenario.stormPeakPfu} pfu`
                        : `Training storm · scenario peak ${runInput.scenario.stormPeakPfu} pfu`
                      : tr(trigger.headline)}
                  </p>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-slate-300">
                    <Satellite className="h-3 w-3" /> {t('nasaDataTrigger')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-200">{tr(trigger.detail)}</p>
                {!isCadet && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    {t('source')}: {trigger.citationIds.map((id) => CITATIONS[id]?.short).join(' · ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {step === 3 && (mode === 'baseline' || props.shadowPrediction) && (
            <ShadowPredictionInput
              value={shadowGuess}
              onChange={setShadowGuess}
              locked={mode === 'branch' || !canChoose}
            />
          )}

          {/* Choice Cards A / B / C */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-300">
              {isCadet
                ? lang === 'az'
                  ? 'A, B və ya C planını seçin — rəngli nişanlar batareya, həyat təminatı, radiasiya və elm dəyişikliyini göstərir:'
                  : 'Pick Plan A, B, or C — color badges show how battery, life support, radiation, and science change:'
                : lang === 'az'
                  ? 'Model üzrə mərhələnin əvvəlindən sonuna dəyişiklik (əvvəlki qərarlar və stansiya bonusları daxil olmaqla):'
                  : 'Modeled delta from start to end of this phase (including prior flags and active station bonuses):'}
            </p>
            {((step === 4 && inspectedIdx === 0 && (minedCount ?? 0) > 0) || newSamples > 0) && (
              <span className="inline-flex items-center gap-2 font-mono text-[10.5px] text-emerald-200">
                {step === 4 && inspectedIdx === 0 && (minedCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded border border-sky-400/35 bg-sky-500/15 px-1.5 py-0.5">
                    <Snowflake size={11} className="text-sky-300" /> +{(minedCount ?? 0) * 3} {kg} {lang === 'az' ? 'buzlu reqolit xammalı' : 'icy regolith feedstock'}
                  </span>
                )}
                {newSamples > 0 && (
                  <span className="inline-flex items-center gap-1 rounded border border-amber-400/35 bg-amber-500/15 px-1.5 py-0.5">
                    <Sparkles size={11} className="text-amber-300" /> {lang === 'az' ? 'Yeni nümunələr: ən çox' : 'New samples: up to'} +{newSamples * 2} {t('unitPts')}
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="grid gap-2.5 md:grid-cols-3">
            {decision.choices.map((c, i) => {
              const forecast = forecasts[i];
              const isA = choiceA === i;
              const isB = mode === 'branch' && choiceB === i;
              const selected = mode === 'branch' ? isB : isA;
              const inspected = inspectedIdx === i;
              const labelText = isCadet && c.cadetLabel ? tr(c.cadetLabel) : tr(c.label);

              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={inspected}
                  onClick={() => setInspectedChoice(i)}
                  className={`relative flex flex-col gap-2 rounded-xl border p-3.5 text-left transition ${
                    inspected
                      ? 'border-sky-300 bg-sky-950/50 ring-1 ring-sky-400/60'
                      : 'border-slate-700 bg-slate-950/55 hover:border-sky-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${
                        selected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {CHOICE_LETTERS[i]}
                    </span>
                    <span className="flex items-center gap-1">
                      {isA && (
                        <span className="rounded bg-slate-200 px-1.5 text-[10px] font-bold text-slate-900">
                          {t('runA')}
                        </span>
                      )}
                      {isB && (
                        <span className="rounded border border-dashed border-fuchsia-300 px-1.5 text-[10px] font-bold text-fuchsia-200">
                          {t('runB')}
                        </span>
                      )}
                    </span>
                  </div>

                  <span className="text-sm font-semibold leading-snug text-white">{labelText}</span>

                  {isCadet && c.cadetSummary && (
                    <p className="text-xs leading-snug text-slate-300">{tr(c.cadetSummary)}</p>
                  )}

                  {forecast && (
                    <span className="mt-auto grid w-full gap-1 border-t border-white/10 pt-2 text-[12px]">
                      {METRICS.map((metric) => (
                        <span key={metric.key} className="flex items-center justify-between gap-2">
                          <span className="text-slate-300">{t(metric.labelKey)}</span>
                          <span
                            className={`shrink-0 rounded px-1 font-mono tabular-nums ${deltaTone(
                              forecast.delta[metric.key],
                              metric.higherIsBetter,
                            )}`}
                          >
                            {signed(forecast.delta[metric.key])}{' '}
                            {metric.key === 'lifeSupportPct' ? pp : t(metric.unitKey)}
                          </span>
                        </span>
                      ))}
                      {step === 4 && i === 0 && (
                        <span className="flex items-center justify-between gap-2 text-sky-200">
                          {lang === 'az' ? 'Təmiz su' : 'Treated water'}
                          <span className="shrink-0 font-mono font-semibold">
                            {fmt(forecast.resourceFlows.waterExtractedKg, 2)} {kg}
                          </span>
                        </span>
                      )}
                    </span>
                  )}

                  {copilotEnabled && c.copilotTip && (
                    <p className="mt-0.5 border-t border-white/10 pt-1 text-[10.5px] italic leading-tight text-emerald-200/90">
                      💡 {tr(c.copilotTip)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hands-On Station Mini-Game & Simulation Bonus Card (All 6 Steps) */}
          {taskExercise && (
            <div className="rounded-xl border border-amber-300/35 bg-slate-950/65 p-3 text-xs text-slate-200">
              <details open={!stepTaskEnabled && isCadet}>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-semibold text-amber-200">
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench size={14} className="text-amber-300" />
                    {tr(stationMeta.title)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10.5px] ${
                      stepTaskEnabled
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                        : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    {stepTaskEnabled ? '✓ ' : ''}
                    {tr(stationMeta.badge)}
                  </span>
                </summary>
                <div className="mt-2.5">{taskExercise}</div>
              </details>

              {(taskAvailable || currentStepDefault || taskOverride !== null) && (
                <label className="mt-2 flex items-center gap-2 font-medium text-emerald-200">
                  <input
                    type="checkbox"
                    checked={stepTaskEnabled && (step !== 4 || inspectedIdx === 0)}
                    disabled={!canChoose || (step === 4 && inspectedIdx !== 0)}
                    onChange={(event) => setTaskOverride(event.target.checked)}
                    className="accent-emerald-400"
                  />
                  {lang === 'az'
                    ? `Bu gedişdə stansiya bonusunu tətbiq et (${tr(stationMeta.badge)})`
                    : `Apply station calibration bonus in this run (${tr(stationMeta.badge)})`}
                </label>
              )}
              <p className="mt-1 text-[11.5px] text-slate-300">{tr(stationMeta.detail)}</p>
            </div>
          )}

          {/* Cause & Effect Explanation Card */}
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                <Info className="h-3.5 w-3.5" /> {t('causeEffect')} ({CHOICE_LETTERS[inspectedIdx]})
              </p>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
              {tr(decision.choices[inspectedIdx].causeAndEffectExplanation)}
            </p>
            {conditionals.map(({ flag, active, note }) => (
              <p key={flag} className={`mt-2 text-xs ${active ? 'text-emerald-200' : 'text-slate-300'}`}>
                {t('ifEarlier')} ({active ? t('active') : t('inactive')}) · {tr(note)}
              </p>
            ))}
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
              <BookMarked className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {lang === 'az' ? 'Elmi istinad' : 'Scientific reference'} ·{' '}
                {tr(decision.choices[inspectedIdx].nasaSourceCitation)}
              </span>
            </p>
          </div>

          {/* Procedural teaching illustration and separate published planner at Decision 1 */}
          {step === 1 && <LunarSiteIntelligence />}

          {/* Deterministic Forecast for Selected Option (Auto-open in Engineer Mode) */}
          {forecastStep && (
            <details open={!isCadet} className="rounded-xl border border-sky-500/35 bg-slate-950/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-sky-200">
                {lang === 'az' ? 'Ətraflı mühəndis proqnozu' : 'Detailed engineering forecast'} ·{' '}
                {CHOICE_LETTERS[inspectedIdx]}
              </summary>

              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {/* Power Forecast */}
                <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2">
                  <div className="flex items-center justify-between text-[10px] text-amber-200">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {t('power')}
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {signed(forecastStep.delta.powerKwh)} {t('unitKwh')}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs font-semibold text-white">
                    {fmt(forecastStep.before.powerKwh)} →{' '}
                    <span
                      className={
                        forecastStep.after.powerKwh < GAME_CONSTANTS.brownoutThresholdKwh
                          ? 'font-bold text-rose-400'
                          : 'text-amber-200'
                      }
                    >
                      {fmt(forecastStep.after.powerKwh)}
                    </span>{' '}
                    <small className="text-slate-400">{t('unitKwh')}</small>
                  </div>
                </div>

                {/* Life Support Forecast */}
                <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-2">
                  <div className="flex items-center justify-between text-[10px] text-emerald-200">
                    <span className="flex items-center gap-1">
                      <HeartPulse className="h-3 w-3" /> {t('lifeSupport')}
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {signed(forecastStep.delta.lifeSupportPct)} {pp}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs font-semibold text-white">
                    {fmt(forecastStep.before.lifeSupportPct)}% →{' '}
                    <span
                      className={
                        forecastStep.after.lifeSupportPct < GAME_CONSTANTS.survivalFocusThresholdPct
                          ? 'font-bold text-rose-400'
                          : 'text-emerald-200'
                      }
                    >
                      {fmt(forecastStep.after.lifeSupportPct)}%
                    </span>
                  </div>
                </div>

                {/* Radiation Forecast */}
                <div
                  className={`rounded-lg border p-2 ${
                    forecastStep.after.radiationMsv >= RADIATION_LIMITS.missionWarningMsv
                      ? 'border-rose-400/40 bg-rose-500/15'
                      : 'border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {t('radiation')}
                    </span>
                    <span className="font-mono font-bold text-rose-300">
                      {signed(forecastStep.delta.radiationMsv)} {t('unitMsv')}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs font-semibold text-white">
                    {fmt(forecastStep.before.radiationMsv)} →{' '}
                    <span
                      className={
                        forecastStep.after.radiationMsv >= RADIATION_LIMITS.missionWarningMsv
                          ? 'font-bold text-rose-400'
                          : 'text-slate-200'
                      }
                    >
                      {fmt(forecastStep.after.radiationMsv)}
                    </span>{' '}
                    <small className="text-slate-400">{t('unitMsv')}</small>
                  </div>
                </div>

                {/* Science Points Forecast */}
                <div className="rounded-lg border border-purple-400/25 bg-purple-500/10 p-2">
                  <div className="flex items-center justify-between text-[10px] text-purple-200">
                    <span className="flex items-center gap-1">
                      <FlaskConical className="h-3 w-3" /> {t('science')}
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      {signed(forecastStep.delta.sciencePoints)}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs font-semibold text-white">
                    {fmt(forecastStep.before.sciencePoints)} →{' '}
                    <span className="text-purple-200">{fmt(forecastStep.after.sciencePoints)}</span>{' '}
                    <small className="text-slate-400">{t('unitPts')}</small>
                  </div>
                </div>
              </div>

              <dl className="mt-2.5 grid grid-cols-2 gap-1 border-t border-white/10 pt-2 font-mono text-[11px] text-slate-300 sm:grid-cols-3">
                {[
                  [
                    lang === 'az' ? 'Günəş + ehtiyat' : 'Solar + backup',
                    `${fmt(forecastStep.env.generationKwh)} + ${fmt(forecastStep.env.supplementalGenerationKwh)} ${t('unitKwh')}`,
                  ],
                  [
                    lang === 'az' ? 'Baza + isitmə' : 'Base + heaters',
                    `${fmt(forecastStep.env.loadKwh - forecastStep.env.loadReductionKwh)} + ${fmt(forecastStep.env.heaterKwh)} ${t('unitKwh')}`,
                  ],
                  [
                    lang === 'az' ? 'Tapşırıq + istixana' : 'Task + greenhouse',
                    `${fmt(forecastStep.env.taskLoadKwh)} + ${fmt(forecastStep.env.greenhouseLoadKwh)} ${t('unitKwh')}`,
                  ],
                  [
                    lang === 'az' ? 'Oksigen ehtiyatı' : 'Oxygen reserve',
                    `${fmt(forecastStep.resourcesAfter.oxygenKg)} ${kg}`,
                  ],
                  [
                    lang === 'az' ? 'Su ehtiyatı' : 'Water reserve',
                    `${fmt(forecastStep.resourcesAfter.waterKg)} ${kg}`,
                  ],
                  [
                    lang === 'az' ? 'Qida ehtiyatı' : 'Food reserve',
                    `${fmt(forecastStep.resourcesAfter.foodKg)} ${kg}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-400">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              {forecastStep.resourcesAfter.cropGrowthDays > 0 && (
                <p className="mt-2 text-xs text-emerald-200">
                  {lang === 'az'
                    ? `İstixana · ${fmt(forecastStep.resourcesAfter.cropGrowthDays)} / 30 yetişmə günü · ${fmt(forecastStep.resourcesAfter.harvestedFoodKg)} kq məhsul`
                    : `Greenhouse · ${fmt(forecastStep.resourcesAfter.cropGrowthDays)} / 30 growing days · ${fmt(forecastStep.resourcesAfter.harvestedFoodKg)} kg harvested`}
                </p>
              )}
              {forecastStep.resourceFlows.waterExtractedKg > 0 && (
                <p className="mt-2 text-xs text-sky-200">
                  {lang === 'az'
                    ? `Ssenari nümunəsindən alınan təmiz su · ${fmt(forecastStep.resourceFlows.waterExtractedKg, 2)} kq`
                    : `Treated water from the training sample · ${fmt(forecastStep.resourceFlows.waterExtractedKg, 2)} kg`}
                </p>
              )}
              {forecastStep.rulesTriggered.length > 0 && (
                <p className="mt-2 rounded border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-xs text-rose-200">
                  {forecastStep.rulesTriggered.map((rule) => tr(RULE_LABELS[rule])).join(' · ')}
                </p>
              )}
            </details>
          )}

          {step !== 3 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-500/25 bg-sky-950/30 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-sky-300" />
                <div>
                  <strong className="font-mono text-[11px] uppercase tracking-wider text-sky-200">
                    {t('hypothesisTitle')}
                  </strong>
                  <p className="mt-0.5 text-[11.5px] text-slate-300">{t('hypothesisPrompt')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHypothesis('safe')}
                  aria-pressed={hypothesis === 'safe'}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    hypothesis === 'safe'
                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {t('hypothesisYes')}
                </button>
                <button
                  type="button"
                  onClick={() => setHypothesis('drain')}
                  aria-pressed={hypothesis === 'drain'}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    hypothesis === 'drain'
                      ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {t('hypothesisNo')}
                </button>
              </div>
              {hypothesis !== null && forecastStep && (
                <div
                  className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1 font-mono text-[11px] ${
                    hypothesisMatches
                      ? 'border-emerald-400/50 bg-emerald-950/40 text-emerald-200'
                      : 'border-amber-400/50 bg-amber-950/40 text-amber-200'
                  }`}
                >
                  <span>
                    {hypothesisMatches ? `✓ ${t('hypothesisCorrect')}` : `ℹ️ ${t('hypothesisIncorrect')}`}
                  </span>
                  <span>
                    {fmt(forecastStep.env.lowPowerHours)}{' '}
                    {lang === 'az' ? 'saat aşağı ehtiyatda' : 'hours on low reserve'}
                  </span>
                </div>
              )}
            </div>
          )}

          {ledgerRecord && (
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t('stepBreakdown')}
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {ledgerRecord.contributions.map((c, i) => (
                  <li key={i} className="flex flex-col gap-0.5 border-b border-slate-800/80 pb-1.5 last:border-0">
                    <span className="text-[11px] text-slate-400">
                      <span className="mr-1 rounded bg-slate-800 px-1 text-[9px] font-semibold uppercase text-slate-300">
                        {t(
                          c.source === 'environment'
                            ? 'envLabel'
                            : c.source === 'choice'
                              ? 'choiceLabel'
                              : c.source === 'conditional'
                                ? 'conditionalLabel'
                                : 'ruleLabel',
                        )}
                      </span>
                      {tr(c.label)}
                    </span>
                    <DeltaChips delta={c.delta} size="xs" />
                  </li>
                ))}
                <li className="flex flex-col gap-0.5 pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-200">{t('result')}</span>
                  <DeltaChips delta={ledgerRecord.delta} size="xs" />
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {canChoose && (
        <footer className="decision-footer">
          <div className="min-w-0" role="status">
            <p className="text-sm font-semibold text-white">
              {lang === 'az'
                ? `Seçilmiş variant · ${CHOICE_LETTERS[inspectedIdx]}`
                : `Selected option ${CHOICE_LETTERS[inspectedIdx]}`}
            </p>
            <p className="text-xs text-slate-300">
              {lang === 'az' ? 'Tətbiq etdikdə missiya irəliləyir.' : 'Apply this option to advance the mission.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChoose(
                inspectedIdx,
                {
                  ...effectiveTasks,
                  icePrepared: step === 4 ? inspectedIdx === 0 && stepTaskEnabled : effectiveTasks.icePrepared,
                },
                shadowGuess,
              )
            }
            className="shrink-0 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-200"
          >
            {lang === 'az'
              ? `${CHOICE_LETTERS[inspectedIdx]} variantını tətbiq et`
              : `Apply option ${CHOICE_LETTERS[inspectedIdx]}`}
          </button>
        </footer>
      )}
    </section>
  );
}
