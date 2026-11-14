import { ArrowRightLeft, Droplet, GitCompareArrows, Lightbulb, ShieldAlert, ShieldCheck, Sparkles, Utensils, Wind } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { ENGINEERING_LESSONS } from '../data/engineeringLessons';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import { RULE_LABELS, compareRuns, type ComparisonReason, type SimulationResult } from '../engine/simulation';
import { OutcomeBadge } from './MetricGauges';
import { ABORT_CAUSES } from './MissionResults';
import { CHOICE_LETTERS, METRICS, deltaTone, fmt, signed } from './metricMeta';

export default function DeltaSummary({ a, b }: { a: SimulationResult; b: SimulationResult }) {
  const { t, tr, lang } = useI18n();
  const az = lang === 'az';
  const cmp = compareRuns(a, b);
  const firstChange = cmp.firstDivergence;
  if (firstChange === null) {
    return <p className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-300">{a.elapsedHours === b.elapsedHours
      ? t('noDifference')
      : az ? `Ortaq mərhələlərdə girişlər eynidir. A gedişi ${a.elapsedHours}, B gedişi ${b.elapsedHours} saata çatıb. Qrafikdə eyni saatları müqayisə edin.`
        : `Inputs match at the shared phases. Run A reached hour ${a.elapsedHours} and Run B reached hour ${b.elapsedHours}. Compare matching hours in the charts.`}</p>;
  }

  const decision = MISSION_DECISIONS[firstChange - 1];
  const sameEndpoint = a.elapsedHours === b.elapsedHours;
  const phaseA = a.steps[firstChange - 1];
  const phaseB = b.steps[firstChange - 1];
  const samePhaseEnd = phaseA.endHour === phaseB.endHour;
  const lowReserveHours = (run: SimulationResult) =>
    run.steps.reduce((hours, step) => hours + step.env.lowPowerHours, 0);
  const lowReserveA = lowReserveHours(a);
  const lowReserveB = lowReserveHours(b);
  const showWaterYield = phaseA.choiceId === 'D4-A' || phaseB.choiceId === 'D4-A';
  const primaryKey = firstChange === 5 ? 'radiationMsv' : firstChange === 2 ? 'lifeSupportPct' : 'powerKwh';
  const primary = METRICS.find(({ key }) => key === primaryKey)!;
  const waterUnit = az ? 'kq' : 'kg';
  const phaseUnit = showWaterYield ? waterUnit : t(primary.unitKey);
  const phaseLabel = showWaterYield ? (az ? 'Nümunədən alınan təmiz su' : 'Treated water from the sample') : t(primary.labelKey);
  const comparison = [
    { label: t('runA'), run: a, phase: phaseA },
    { label: t('runB'), run: b, phase: phaseB },
  ];
  const waterDifference = b.resources.waterKg - a.resources.waterKg;
  const finalWaterDelta = Math.sign(waterDifference) * Math.round(Math.abs(waterDifference) * 100) / 100;
  const oxygenDifference = b.resources.oxygenKg - a.resources.oxygenKg;
  const finalOxygenDelta = Math.sign(oxygenDifference) * Math.round(Math.abs(oxygenDifference) * 100) / 100;
  const foodDifference = b.resources.foodKg - a.resources.foodKg;
  const finalFoodDelta = Math.sign(foodDifference) * Math.round(Math.abs(foodDifference) * 100) / 100;
  const finalChanges = METRICS.map((metric) => ({
    label: t(metric.labelKey), Icon: metric.icon, value: cmp.finalDelta[metric.key],
    unit: metric.key === 'lifeSupportPct' ? (az ? 'faiz b.' : 'pp') : t(metric.unitKey),
    higherIsBetter: metric.higherIsBetter, digits: 1,
  })).filter(({ value }) => value !== 0);
  if (finalWaterDelta !== 0) {
    finalChanges.push({ label: az ? 'Su ehtiyatı' : 'Water reserve', Icon: Droplet,
      value: finalWaterDelta, unit: waterUnit, higherIsBetter: true, digits: 2 });
  }
  if (finalOxygenDelta !== 0) {
    finalChanges.push({ label: az ? 'Oksigen ehtiyatı' : 'Oxygen reserve', Icon: Wind,
      value: finalOxygenDelta, unit: waterUnit, higherIsBetter: true, digits: 2 });
  }
  if (finalFoodDelta !== 0) {
    finalChanges.push({ label: az ? 'Qida ehtiyatı' : 'Food reserve', Icon: Utensils,
      value: finalFoodDelta, unit: waterUnit, higherIsBetter: true, digits: 2 });
  }
  const unchangedNotes: string[] = [];
  if (sameEndpoint && finalOxygenDelta === 0) {
    unchangedNotes.push(`O₂ ${fmt(b.resources.oxygenKg)} ${waterUnit}`);
  }
  if (sameEndpoint && finalFoodDelta === 0) {
    unchangedNotes.push(`${az ? 'Qida' : 'Food'} ${fmt(b.resources.foodKg)} ${waterUnit}`);
  }
  if (sameEndpoint && finalWaterDelta === 0) {
    unchangedNotes.push(`H₂O ${fmt(b.resources.waterKg)} ${waterUnit}`);
  }

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
      case 'stationTaskChanged':
        return {
          Icon: Sparkles,
          cls: 'text-emerald-200',
          text: tr(r.label),
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
    <section className="space-y-3 rounded-2xl border border-[#648981] bg-[#142a31] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#c5e2b3]">
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" /> {t(a.outcome === b.outcome ? 'deltaSameOutcome' : 'deltaTitle')}
          </p>
          <h3 className="mt-1 text-xl font-semibold leading-tight text-white">D{firstChange} · {tr(decision.title)}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {a.outcome !== b.outcome && (
            <span className="rounded-full border border-amber-300/45 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-100">
              {t(`outcome.${a.outcome}`)} → {t(`outcome.${b.outcome}`)}
            </span>
          )}
          {sameEndpoint && cmp.scoreDelta !== null && (
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${deltaTone(cmp.scoreDelta, true)}`}>
              {t('score')} {signed(cmp.scoreDelta)}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-200">
        {a.input.scenario.stormPeakPfu !== b.input.scenario.stormPeakPfu
          ? az ? 'Fırtına parametrləri fərqlidir. Bu müqayisə yalnız bir qərarın təsirini təcrid etmir.'
            : 'Storm settings differ. This comparison does not isolate the effect of a single decision.'
          : az
          ? 'Hər iki gedişdə ilkin ehtiyatlar, işıq, temperatur və fırtına cədvəli eynidir.'
          : 'Both runs share the same starting reserves and schedule for sunlight, temperature, and the storm.'}
      </p>
      {cmp.changedSteps.length > 1 && (
        <p className="text-xs text-amber-100">
          {az
            ? `Girişlər ${cmp.changedSteps.map((step) => `D${step}`).join(', ')} mərhələlərində fərqlənir. Bir neçə mərhələ dəyişdirilib.`
            : `Inputs differ at ${cmp.changedSteps.map((step) => `D${step}`).join(', ')}. More than one phase changed.`}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {comparison.map(({ label, run, phase }, index) => {
          const calibration = firstChange === 1 && a.solarCalibrated !== b.solarCalibrated;
          const preparation = phase.choiceId === 'D4-A' && a.icePrepared !== b.icePrepared;
          const value = showWaterYield ? phase.resourceFlows.waterExtractedKg : phase.after[primaryKey];
          const choice = decision.choices[phase.choiceIndex];
          return (
            <article key={label} className={`flex flex-col gap-2 rounded-xl border p-3 ${index === 0
              ? 'border-[#546879] bg-[#16242f]' : 'border-[#668f82] bg-[#193433]'}`}>
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <OutcomeBadge result={run} label={label} />
                <span className="font-mono text-xs text-slate-300">{az ? `Saat ${run.elapsedHours}` : `Hour ${run.elapsedHours}`}</span>
              </div>
              {run.abortCause && <p className="text-xs font-semibold text-rose-200">{tr(ABORT_CAUSES[run.abortCause])}</p>}
              <p className="flex items-start gap-2 text-sm font-medium text-slate-100">
                <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-slate-200">
                  {az ? 'Var.' : 'Opt'} {CHOICE_LETTERS[phase.choiceIndex]}
                </span>
                <span>
                  <span className="block">{tr(choice.label)}</span>
                  {choice.cadetLabel && (
                    <span className="mt-0.5 block text-xs font-normal text-slate-300">
                      {tr(choice.cadetLabel)}
                    </span>
                  )}
                </span>
              </p>
              {calibration && <p className="text-xs text-amber-100">{run.solarCalibrated
                ? az ? 'Kalibrləmə tətbiq edildi' : 'Calibration applied'
                : az ? 'Standart yönəltmə' : 'Standard pointing'}</p>}
              {preparation && <p className="text-xs text-sky-100">{run.icePrepared
                ? az ? 'Hazırlanmış qurğu' : 'Prepared extractor'
                : az ? 'Standart qurğu' : 'Standard extractor'}</p>}
              {samePhaseEnd && (() => {
                const maxScale = showWaterYield
                  ? Math.max(0.5, phaseA.resourceFlows.waterExtractedKg, phaseB.resourceFlows.waterExtractedKg)
                  : primaryKey === 'radiationMsv'
                    ? 60
                    : 100;
                const pct = Math.min(100, Math.max(4, Math.round((value / maxScale) * 100)));
                const isRisk =
                  !showWaterYield &&
                  ((primaryKey === 'powerKwh' && value < 20) ||
                    (primaryKey === 'lifeSupportPct' && value < 40) ||
                    (primaryKey === 'radiationMsv' && value >= 50));
                const barCls = isRisk
                  ? 'bg-rose-400'
                  : index === 0
                    ? 'bg-amber-300'
                    : 'bg-emerald-400';
                return (
                  <div className="mt-auto border-t border-white/15 pt-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs text-slate-300">{phaseLabel} · {az ? `Saat ${phase.endHour}` : `Hour ${phase.endHour}`}</p>
                      {!showWaterYield && primaryKey === 'powerKwh' && (
                        <span className={`font-mono text-[10px] font-semibold ${value < 20 ? 'text-rose-200' : 'text-emerald-200'}`}>
                          {value < 20
                            ? (az ? '<20 kVt·s riski' : '<20 kWh brownout')
                            : (az ? '≥20 kVt·s təhlükəsiz' : '≥20 kWh safe')}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-2xl font-semibold tracking-tight text-white">
                      {fmt(value, showWaterYield ? 2 : 1)} <span className="text-sm text-slate-300">{phaseUnit}</span>
                    </p>
                    <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/45">
                      <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width: `${pct}%` }} />
                      {!showWaterYield && primaryKey === 'powerKwh' && (
                        <span
                          aria-hidden="true"
                          title={az ? '20 kVt·s həddi' : '20 kWh brownout threshold'}
                          className="absolute bottom-0 top-0 w-0.5 bg-white/80"
                          style={{ left: '20%' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
            </article>
          );
        })}
      </div>

      <div className="flex gap-2 rounded-lg border border-amber-200/25 bg-[#29352c] px-3 py-2.5 text-sm text-[#f0efde]">
        <Lightbulb size={17} className="mt-0.5 shrink-0 text-amber-200" aria-hidden="true" />
        <div>
          <p className="mb-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
            {az ? 'ÖYRƏN · Mühəndislik prinsipi' : 'LEARN · Engineering principle'}
          </p>
          <p>{tr(ENGINEERING_LESSONS[firstChange - 1])}</p>
          {sameEndpoint && lowReserveA !== lowReserveB && (
            <p className="mt-0.5 text-xs text-amber-100">
              {az
                ? `A gedişində aşağı batareya ehtiyatı ${lowReserveA}, B gedişində isə ${lowReserveB} saat davam etdi.`
                : `Run A spent ${lowReserveA} h on low battery reserve. Run B spent ${lowReserveB} h.`}
            </p>
          )}
        </div>
      </div>

      {sameEndpoint ? finalChanges.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-200">{t('deltaFinal')} · {az ? `Saat ${a.elapsedHours}` : `Hour ${a.elapsedHours}`}</p>
          <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {finalChanges.map(({ label, Icon, value, unit, higherIsBetter, digits }) => {
              const isBenefit = higherIsBetter ? value > 0 : value < 0;
              return (
                <li key={label} className={`flex min-w-0 flex-col justify-between rounded-lg border px-2.5 py-2 sm:min-w-[168px] sm:flex-[1_1_168px] ${deltaTone(value, higherIsBetter)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs leading-snug"><Icon size={13} className="shrink-0" aria-hidden="true" />{label}</span>
                    <span className="shrink-0 whitespace-nowrap rounded bg-black/25 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                      {isBenefit ? (az ? 'Üstünlük' : 'Benefit') : (az ? 'Kompromis' : 'Trade-off')}
                    </span>
                  </div>
                  <strong className="mt-1 whitespace-nowrap font-mono text-sm">{value > 0 ? '+' : ''}{fmt(value, digits)} {unit}</strong>
                </li>
              );
            })}
          </ul>
          {unchangedNotes.length > 0 && (
            <p className="mt-1.5 text-[11px] text-slate-300">
              {az ? 'Hər iki gedişdə eyni qalıb: ' : 'Unchanged across both runs: '}
              {unchangedNotes.join(' · ')}
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-white/5 p-2 text-sm text-slate-200">
          {az
            ? `A gedişi ${a.elapsedHours}, B gedişi isə ${b.elapsedHours} saat davam etdi. Eyni saatdakı nəticələri qrafikdən müqayisə edin.`
            : `Run A reached hour ${a.elapsedHours} and Run B reached hour ${b.elapsedHours}. Compare their values at matching times in the charts.`}
        </p>
      )}

      {cmp.reasons.length > 0 && (
        <details className="text-xs text-sky-100">
          <summary className="cursor-pointer py-1 font-semibold">{az ? 'Qərarlar və baş verən nəticələr' : 'Decisions and downstream effects'}</summary>
          <ul className="scrollbar-thin mt-1 max-h-48 space-y-1 overflow-y-auto pr-1">
            {cmp.reasons.map((reason, i) => {
              const { Icon, cls, text } = render(reason);
              return (
                <li key={i} className="flex items-start gap-1.5 text-xs leading-snug text-slate-200">
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cls}`} aria-hidden="true" />
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
