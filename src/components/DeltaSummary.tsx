import { ArrowRightLeft, Droplet, GitCompareArrows, ShieldAlert, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import { RULE_LABELS, compareRuns, type ComparisonReason, type SimulationResult } from '../engine/simulation';
import { CHOICE_LETTERS, METRICS, deltaTone, fmt, signed } from './metricMeta';

export default function DeltaSummary({ a, b }: { a: SimulationResult; b: SimulationResult }) {
  const { t, tr, lang } = useI18n();
  const cmp = compareRuns(a, b);
  const sameEndpoint = a.elapsedHours === b.elapsedHours;
  const firstChange = cmp.changedSteps[0];
  const phaseA = a.steps[firstChange - 1];
  const phaseB = b.steps[firstChange - 1];

  if (!cmp.changedSteps.length) {
    return <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">{t('noDifference')}</p>;
  }

  const inputChanges = cmp.reasons.filter((reason) => reason.kind === 'choiceChanged' || reason.kind === 'solarCalibrationChanged' || reason.kind === 'icePreparationChanged');
  const downstreamEffects = cmp.reasons.filter((reason) => reason.kind !== 'choiceChanged' && reason.kind !== 'solarCalibrationChanged' && reason.kind !== 'icePreparationChanged');
  const lowReserveHours = (run: SimulationResult) =>
    run.steps.reduce((hours, step) => hours + step.env.lowPowerHours, 0);
  const lowReserveA = lowReserveHours(a);
  const lowReserveB = lowReserveHours(b);
  const waterA = phaseA?.resourceFlows.waterExtractedKg ?? 0;
  const waterB = phaseB?.resourceFlows.waterExtractedKg ?? 0;
  const showWaterYield = fmt(waterA, 2) !== fmt(waterB, 2);
  const waterUnit = lang === 'az' ? 'kq' : 'kg';
  const phaseUnit = showWaterYield ? waterUnit : t('unitKwh');
  const waterDifference = b.resources.waterKg - a.resources.waterKg;
  const finalWaterDelta = Math.sign(waterDifference) * Math.round(Math.abs(waterDifference) * 100) / 100;

  const stepLabel = (s: number | null) => (s === null ? t('never') : t('atStep', { step: s }));

  const render = (r: ComparisonReason) => {
    switch (r.kind) {
      case 'solarCalibrationChanged':
        return {
          Icon: ArrowRightLeft,
          cls: 'text-amber-200',
          text: r.to
            ? lang === 'az' ? 'D1 · B gedişi panel kalibrləməsini istifadə etdi.' : 'D1 · Run B used solar calibration.'
            : lang === 'az' ? 'D1 · B gedişi panel kalibrləməsini istifadə etmədi.' : 'D1 · Run B omitted solar calibration.',
        };
      case 'icePreparationChanged':
        return {
          Icon: ArrowRightLeft,
          cls: 'text-sky-200',
          text: r.to
            ? lang === 'az' ? 'D4 · B gedişi hazırlanmış buz emal qurğusundan istifadə etdi.' : 'D4 · Run B used the prepared ice extractor.'
            : lang === 'az' ? 'D4 · B gedişi hazırlanmış buz emal qurğusundan istifadə etmədi.' : 'D4 · Run B omitted extractor preparation.',
        };
      case 'choiceChanged': {
        const d = MISSION_DECISIONS[r.step - 1];
        return {
          Icon: ArrowRightLeft,
          cls: 'text-fuchsia-200',
          text: t('reasonChoice', {
            step: r.step,
            from: `${CHOICE_LETTERS[r.fromIndex]} · ${tr(d.choices[r.fromIndex].label)}`,
            to: `${CHOICE_LETTERS[r.toIndex]} · ${tr(d.choices[r.toIndex].label)}`,
          }),
        };
      }
      case 'ruleAvoided':
        return { Icon: ShieldCheck, cls: 'text-emerald-300', text: t('reasonRuleAvoided', { step: r.step, rule: tr(RULE_LABELS[r.rule]) }) };
      case 'ruleTriggered':
        return { Icon: ShieldAlert, cls: 'text-rose-300', text: t('reasonRuleTriggered', { step: r.step, rule: tr(RULE_LABELS[r.rule]) }) };
      case 'conditionalGained':
        return { Icon: Sparkles, cls: 'text-sky-300', text: t('reasonCondGained', { step: r.step, note: tr(r.note) }) };
      case 'conditionalLost':
        return { Icon: Sparkles, cls: 'text-slate-400', text: t('reasonCondLost', { step: r.step, note: tr(r.note) }) };
      case 'doseWarning':
        return {
          Icon: (r.stepB ?? 99) > (r.stepA ?? 99) || r.stepB === null ? ShieldCheck : ShieldAlert,
          cls: r.stepB === null ? 'text-emerald-300' : 'text-rose-300',
          text: t('reasonDose', { a: stepLabel(r.stepA), b: stepLabel(r.stepB) }),
        };
    }
  };

  return (
    <section className="space-y-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
          <GitCompareArrows className="h-4 w-4" /> {t(a.outcome === b.outcome ? 'deltaSameOutcome' : 'deltaTitle')}
        </p>
        {sameEndpoint && cmp.scoreDelta !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${deltaTone(cmp.scoreDelta, true)}`}
          >
            {cmp.scoreDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {t('score')} {signed(cmp.scoreDelta)}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-300">
        {lang === 'az'
          ? 'İlkin ehtiyatlar və xarici hadisələrin cədvəli hər iki gedişdə eynidir.'
          : 'Both runs share their starting reserves and the same schedule of external events.'}
      </p>
      <ul className="space-y-1 rounded-lg border border-white/10 bg-slate-950/45 p-2">
        {inputChanges.map((change) => {
          const { Icon, cls, text } = render(change);
          return (
            <li key={change.kind === 'choiceChanged' ? change.step : change.kind} className="flex gap-1.5 text-xs text-slate-200">
              <Icon className={`h-4 w-4 shrink-0 ${cls}`} />
              {text}
            </li>
          );
        })}
      </ul>
      {phaseA && phaseB && phaseA.endHour === phaseB.endHour && (
        <div className="rounded-lg border border-fuchsia-500/25 bg-slate-950/45 p-2 text-xs text-slate-200">
          <p className="font-semibold text-fuchsia-100">
            D{firstChange} · {showWaterYield
              ? lang === 'az' ? 'Nümunədən alınan təmiz su' : 'Treated water from the sample'
              : t('power')} · {lang === 'az' ? `Saat ${phaseA.endHour}` : `Hour ${phaseA.endHour}`}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
            <span>{t('runA')} · {showWaterYield ? fmt(waterA, 2) : fmt(phaseA.after.powerKwh)} {phaseUnit}</span>
            <span>{t('runB')} · {showWaterYield ? fmt(waterB, 2) : fmt(phaseB.after.powerKwh)} {phaseUnit}</span>
          </p>
        </div>
      )}
      {sameEndpoint ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">{t('deltaFinal')}:</span>
          {METRICS.map((m) => (
            <span key={m.key} className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] tabular-nums ${deltaTone(cmp.finalDelta[m.key], m.higherIsBetter)}`}>
              <m.icon className="h-3 w-3" aria-hidden="true" /> {t(m.labelKey)} {signed(cmp.finalDelta[m.key])}{' '}
              {m.key === 'lifeSupportPct' ? (lang === 'az' ? 'faiz b.' : 'pp') : t(m.unitKey)}
            </span>
          ))}
          {finalWaterDelta !== 0 && (
            <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] tabular-nums ${deltaTone(finalWaterDelta, true)}`}>
              <Droplet className="h-3 w-3" aria-hidden="true" /> {lang === 'az' ? 'Su' : 'Water'} {finalWaterDelta > 0 ? '+' : ''}{fmt(finalWaterDelta, 2)} {waterUnit}
            </span>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-white/5 p-2 text-xs text-slate-300">
          {lang === 'az'
            ? `A gedişi ${a.elapsedHours}, B gedişi isə ${b.elapsedHours} saat davam etdi. Eyni saatdakı nəticələri qrafikdən müqayisə edin.`
            : `Run A reached hour ${a.elapsedHours} and Run B reached hour ${b.elapsedHours}. Compare their values at matching times in the charts.`}
        </p>
      )}

      {sameEndpoint && lowReserveA !== lowReserveB && (
        <p className="text-xs leading-relaxed text-amber-200">
          {lang === 'az'
            ? `A gedişində ${lowReserveA}, B gedişində isə ${lowReserveB} saat batareya ehtiyatı aşağı qaldı. Aşağı ehtiyat suyun təkrar emalını zəiflədir.`
            : `Run A spent ${lowReserveA} h on low battery reserve and Run B spent ${lowReserveB} h. Low reserve reduces water recovery.`}
        </p>
      )}
      {downstreamEffects.length > 0 && <details className="text-xs text-fuchsia-100">
        <summary className="cursor-pointer py-1 font-semibold">
          {lang === 'az' ? 'Qərarlar və baş verən nəticələr' : 'Decisions and downstream effects'}
        </summary>
        <ul className="scrollbar-thin mt-1 max-h-48 space-y-1 overflow-y-auto pr-1">
          {downstreamEffects.map((r, i) => {
            const { Icon, cls, text } = render(r);
            return (
              <li key={i} className="flex items-start gap-1.5 text-xs leading-snug text-slate-300">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cls}`} />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      </details>}
    </section>
  );
}
