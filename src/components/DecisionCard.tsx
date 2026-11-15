import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Bot,
  CheckCircle2,
  FlaskConical,
  HeartPulse,
  HelpCircle,
  Info,
  Radio,
  Satellite,
  ShieldAlert,
  SunDim,
  Volume2,
  Zap,
} from 'lucide-react';
import { CALIBRATED_INCIDENCE_LIMIT_DEG } from '../engine/power';
import { ICE_TREATMENT_RECOVERY } from '../engine/resources';
import { useI18n } from '../i18n/LanguageContext';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import { CITATIONS, RADIATION_LIMITS } from '../data/nasaTelemetry';
import { soundFX } from '../utils/soundEffects';
import {
  METRIC_KEYS,
  RULE_LABELS,
  previewChoiceEffects,
  runSimulation,
  type StepRecord,
} from '../engine/simulation';
import type { Bilingual, FlagId, MetricDelta, MissionTaskSettings } from '../types';
import LunarSiteIntelligence from './LunarSiteIntelligence';
import { CHOICE_LETTERS, METRICS, deltaTone, fmt, signed } from './metricMeta';

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
  choiceA: number | undefined;
  choiceB: number | undefined;
  record: StepRecord | undefined;
  flagsBefore: FlagId[];
  priorChoices?: number[];
  canChoose: boolean;
  taskSettings: MissionTaskSettings;
  taskAvailable: boolean;
  taskExercise?: ReactNode;
  onChoose: (index: number, tasks: MissionTaskSettings) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function DecisionCard(props: DecisionCardProps) {
  const {
    step,
    mode,
    choiceA,
    choiceB,
    record,
    flagsBefore,
    priorChoices = [],
    canChoose,
    taskSettings,
    taskAvailable,
    taskExercise,
    onChoose,
    onPrev,
    onNext,
  } = props;
  const { lang, t, tr } = useI18n();
  const [inspectedChoice, setInspectedChoice] = useState<number | null>(null);
  const [hypothesis, setHypothesis] = useState<'safe' | 'drain' | null>(null);
  const [copilotEnabled, setCopilotEnabled] = useState(false);
  const [taskOverride, setTaskOverride] = useState<boolean | null>(null);
  const isSolar = step === 1;
  const solarCalibrated = isSolar ? taskOverride ?? taskSettings.solarCalibrated : taskSettings.solarCalibrated;
  const icePrepared = step === 4 ? taskOverride ?? taskSettings.icePrepared : taskSettings.icePrepared;
  const taskEnabled = isSolar ? solarCalibrated : icePrepared;

  const decision = MISSION_DECISIONS[step - 1];
  const activeChoice = mode === 'branch' ? choiceB : choiceA;
  const trigger = decision.nasaDataTrigger;
  const advisory = CREW_ADVISORY[step] ?? CREW_ADVISORY[1];

  const inspectedIdx = inspectedChoice ?? activeChoice ?? 0;
  const forecasts = useMemo(() => {
    const prefix = priorChoices.slice(0, step - 1);
    if (prefix.length !== step - 1) return [];
    return decision.choices.map((_, index) => runSimulation([...prefix, index], { solarCalibrated, icePrepared }).steps[step - 1]);
  }, [decision, priorChoices, step, solarCalibrated, icePrepared]);
  const forecastStep = forecasts[inspectedIdx];

  const willBeSafe = (forecastStep?.env.lowPowerHours ?? 0) === 0;
  const hypothesisMatches =
    hypothesis !== null ? (hypothesis === 'safe' && willBeSafe) || (hypothesis === 'drain' && !willBeSafe) : null;

  return (
    <section className="panel flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
            {t('decision')} {decision.id} / 6 · {tr(decision.phase.label)}
            {mode === 'branch' && (
              <span className="ml-2 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-fuchsia-200">{t('runB')}</span>
            )}
          </p>
          <h2 className="mt-0.5 text-xl font-semibold text-slate-50">{tr(decision.title)}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
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
                  ? 'CapCom Köməkçisi: Açıq'
                  : 'Hints on'
                : lang === 'az'
                  ? 'Köməkçi: Qapalı'
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
            className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-40"
          >
            {step === 6 ? t('viewResults') : t('next')} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* RPG Crew Radio Comms Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-slate-950/75 p-2.5">
        <img
          src={step === 4 ? `${import.meta.env.BASE_URL}assets/rover_viper.svg` : `${import.meta.env.BASE_URL}assets/astronaut_companion.svg`}
          alt="Crew Advisor"
          className="h-12 w-12 shrink-0 rounded-xl border border-sky-400/50 bg-slate-900 p-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300">
              <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
              {tr(advisory.speaker)}
            </p>
            <button
              type="button"
              onClick={() => soundFX.speakRadio(tr(advisory.tip), lang)}
              className="inline-flex items-center gap-1 rounded border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200 hover:bg-sky-500/20"
              title="Listen to Radio Broadcast (Web Speech)"
            >
              <Volume2 size={11} className="text-sky-300" />
              <span className="hidden sm:inline">
                {lang === 'az' ? 'Rabitəni Dinlə' : 'Radio Call'}
              </span>
            </button>
          </div>
          <p className="mt-0.5 text-xs italic leading-relaxed text-slate-200">{tr(advisory.tip)}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-300">{tr(decision.context)}</p>

      {step === 1 && <LunarSiteIntelligence />}

      {trigger && (
        <div
          className={`rounded-xl border p-3 ${
            trigger.source === 'LRO_SHADOW'
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-rose-500/40 bg-rose-500/10'
          }`}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <Satellite className="h-3.5 w-3.5" /> {t('nasaDataTrigger')}
          </p>
          <p
            className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${
              trigger.source === 'LRO_SHADOW' ? 'text-amber-200' : 'text-rose-200'
            }`}
          >
            {trigger.source === 'LRO_SHADOW' ? <SunDim className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {tr(trigger.headline)}
          </p>
          <p className="mt-1 text-xs text-slate-300">{tr(trigger.detail)}</p>
          <p className="mt-1.5 text-[10px] text-slate-400">
            {t('source')}: {trigger.citationIds.map((id) => CITATIONS[id]?.short).join(' · ')}
          </p>
        </div>
      )}

      {taskExercise && (
        <div className="rounded-lg border border-amber-300/25 bg-slate-950/50 px-3 py-2 text-xs text-slate-200">
          <details>
            <summary className="cursor-pointer font-semibold text-amber-200">
              {isSolar
                ? lang === 'az' ? 'Günəş panelini kalibrlə · könüllü' : 'Calibrate the solar array · optional'
                : lang === 'az' ? 'Buz emal qurğusunu hazırla · könüllü' : 'Prepare the ice extractor · optional'}
            </summary>
            <div className="mt-2">{taskExercise}</div>
          </details>
          {(taskAvailable || taskEnabled) && (
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={taskEnabled && (isSolar || inspectedIdx === 0)}
                disabled={!canChoose || (!isSolar && inspectedIdx !== 0)}
                onChange={(event) => setTaskOverride(event.target.checked)}
                className="accent-amber-300"
              />
              {isSolar
                ? lang === 'az' ? 'Bu gedişdə kalibrləməni istifadə et' : 'Use calibration in this run'
                : lang === 'az' ? 'A variantında hazırlanmış emal qurğusundan istifadə et' : 'Use the prepared extractor with option A'}
            </label>
          )}
          <p className="mt-1 text-slate-300">
            {isSolar
              ? lang === 'az'
                ? `Təlim modelində kalibrləmə panelin yönəlmə xətasını ən çox ${CALIBRATED_INCIDENCE_LIMIT_DEG}° edir. Relyef kölgəsi dəyişmir.`
                : `The training model caps panel pointing error at ${CALIBRATED_INCIDENCE_LIMIT_DEG}° after calibration. The ridge still blocks the same sunlight.`
              : lang === 'az'
                ? `Hazırlıq A variantında model üzrə buzdan su əldəetməni ${ICE_TREATMENT_RECOVERY.standard * 100}%-dən ${ICE_TREATMENT_RECOVERY.prepared * 100}%-ə artırır. Nümunə kütləsi və enerji büdcəsi eyni qalır.`
                : `Preparation raises modeled recovery from ${ICE_TREATMENT_RECOVERY.standard * 100}% to ${ICE_TREATMENT_RECOVERY.prepared * 100}% in option A. Sample mass and power budget stay fixed.`}
          </p>
        </div>
      )}

      <p className="text-xs text-slate-300">
        {lang === 'az'
          ? 'Model üzrə mərhələnin əvvəlindən sonuna dəyişiklik. Mühit və əvvəlki qərarlar nəzərə alınır. Həyat təminatındakı dəyişiklik faiz bəndi ilə göstərilir.'
          : 'Modeled change from the start to the end of this phase, including the environment and earlier decisions. Life support changes are in percentage points (pp).'}
      </p>
      <div className="grid gap-2.5 md:grid-cols-3">
        {decision.choices.map((c, i) => {
          const preview = previewChoiceEffects(step, i, flagsBefore);
          const forecast = forecasts[i];
          const isA = choiceA === i;
          const isB = mode === 'branch' && choiceB === i;
          const selected = mode === 'branch' ? isB : isA;
          const inspected = inspectedIdx === i;

          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={inspected}
              onClick={() => setInspectedChoice(i)}
              className={`relative flex flex-col gap-2 rounded-xl border p-3.5 text-left transition ${
                inspected
                  ? 'border-sky-300 bg-sky-950/45 ring-1 ring-sky-400/60'
                  : 'border-slate-700 bg-slate-950/50 hover:border-sky-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${
                    selected
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-200'
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

              <span className="text-sm font-semibold leading-snug text-white">{tr(c.label)}</span>
              {forecast && (
                <span className="grid w-full gap-1 border-t border-white/10 pt-2 text-[11px]">
                  {METRICS.map((metric) => (
                    <span key={metric.key} className="flex items-center justify-between gap-2">
                      <span className="text-slate-300">{t(metric.labelKey)}</span>
                      <span className={`shrink-0 rounded px-1 font-mono tabular-nums ${deltaTone(forecast.delta[metric.key], metric.higherIsBetter)}`}>
                        {signed(forecast.delta[metric.key])}{' '}
                        {metric.key === 'lifeSupportPct' ? (lang === 'az' ? 'faiz b.' : 'pp') : t(metric.unitKey)}
                      </span>
                    </span>
                  ))}
                </span>
              )}

              {/* Plain-Language Copilot Guidance */}
              {copilotEnabled && c.copilotTip && (
                <p className="mt-0.5 border-t border-white/10 pt-1 text-[10.5px] italic leading-tight text-slate-300">
                  💡 {tr(c.copilotTip)}
                </p>
              )}

              {preview.conditionals.map((cd) => (
                <span
                  key={cd.flag}
                  className={`rounded-md border px-1.5 py-1 text-[10px] leading-snug ${
                    cd.active
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-700 text-slate-500'
                  }`}
                >
                  {t('ifEarlier')} ({cd.active ? t('active') : t('inactive')}): {tr(cd.note)}
                </span>
              ))}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
            <Info className="h-3.5 w-3.5" /> {t('causeEffect')} ({CHOICE_LETTERS[inspectedIdx]})
          </p>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
          {tr(decision.choices[inspectedIdx].causeAndEffectExplanation)}
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
          <BookMarked className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {lang === 'az' ? 'Elmi istinad' : 'Scientific reference'} · {decision.choices[inspectedIdx].nasaSourceCitation}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-400/25 bg-sky-950/30 px-3 py-2">
        <p className="text-xs text-slate-300">
          {lang === 'az'
            ? 'İzahı və ətraflı proqnozu görmək üçün variant seçin. Tətbiq etdikdə missiya irəliləyir.'
            : 'Select an option for its explanation and detailed forecast. Apply it to advance the mission.'}
        </p>
        {canChoose && (
          <button type="button" onClick={() => onChoose(inspectedIdx, { solarCalibrated, icePrepared: step === 4 ? inspectedIdx === 0 && icePrepared : icePrepared })} className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-200">
            {lang === 'az' ? `${CHOICE_LETTERS[inspectedIdx]} variantını tətbiq et` : `Apply option ${CHOICE_LETTERS[inspectedIdx]}`}
          </button>
        )}
      </div>

      {/* Deterministic forecast for the selected option. */}
      {forecastStep && (
        <div className="rounded-xl border border-sky-500/35 bg-slate-950/70 p-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              {t('whatIfForecast')} · {CHOICE_LETTERS[inspectedIdx]}
            </span>
            <div className="text-[10px] font-mono text-slate-400">
              {tr(decision.choices[inspectedIdx].label)}
            </div>
          </div>

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
                  className={forecastStep.after.powerKwh < 20 ? 'text-rose-400 font-bold' : 'text-amber-200'}
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
                  {signed(forecastStep.delta.lifeSupportPct)} %
                </span>
              </div>
              <div className="mt-1 font-mono text-xs font-semibold text-white">
                {fmt(forecastStep.before.lifeSupportPct)}% →{' '}
                <span
                  className={forecastStep.after.lifeSupportPct < 40 ? 'text-rose-400 font-bold' : 'text-emerald-200'}
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
                      ? 'text-rose-400 font-bold'
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
              [lang === 'az' ? 'Günəş + ehtiyat' : 'Solar + backup', `${fmt(forecastStep.env.generationKwh)} + ${fmt(forecastStep.env.supplementalGenerationKwh)} ${t('unitKwh')}`],
              [lang === 'az' ? 'Baza + isitmə' : 'Base + heaters', `${fmt(forecastStep.env.loadKwh - forecastStep.env.loadReductionKwh)} + ${fmt(forecastStep.env.heaterKwh)} ${t('unitKwh')}`],
              [lang === 'az' ? 'Tapşırıq + istixana' : 'Task + greenhouse', `${fmt(forecastStep.env.taskLoadKwh)} + ${fmt(forecastStep.env.greenhouseLoadKwh)} ${t('unitKwh')}`],
              [lang === 'az' ? 'Oksigen ehtiyatı' : 'Oxygen reserve', `${fmt(forecastStep.resourcesAfter.oxygenKg)} O₂`],
              [lang === 'az' ? 'Su ehtiyatı' : 'Water reserve', `${fmt(forecastStep.resourcesAfter.waterKg)} H₂O`],
              [lang === 'az' ? 'Qida ehtiyatı' : 'Food reserve', `${fmt(forecastStep.resourcesAfter.foodKg)} ${lang === 'az' ? 'kq' : 'kg'}`],
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
        </div>
      )}

      {/* Interactive Commander Hypothesis / Prediction Card (NASA Scientific Method) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-500/25 bg-sky-950/30 p-2.5 text-xs">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-sky-300 shrink-0" />
          <div>
            <strong className="text-sky-200 font-mono text-[11px] uppercase tracking-wider">
              {t('hypothesisTitle')}
            </strong>
            <p className="text-slate-300 text-[11.5px] mt-0.5">{t('hypothesisPrompt')}</p>
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
            className={`w-full rounded-lg border px-2.5 py-1 text-[11px] font-mono flex items-center justify-between ${
              hypothesisMatches
                ? 'border-emerald-400/50 bg-emerald-950/40 text-emerald-200'
                : 'border-amber-400/50 bg-amber-950/40 text-amber-200'
            }`}
          >
            <span>
              {hypothesisMatches ? `✓ ${t('hypothesisCorrect')}` : `ℹ️ ${t('hypothesisIncorrect')}`}
            </span>
            <span>
              {fmt(forecastStep.env.lowPowerHours)} {lang === 'az' ? 'saat aşağı ehtiyatda' : 'hours on low reserve'}
            </span>
          </div>
        )}
      </div>

      {record && (
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t('stepBreakdown')}
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {record.contributions.map((c, i) => (
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
              <DeltaChips delta={record.delta} size="xs" />
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}
