import { CheckCircle2, Sparkles, TriangleAlert, X } from 'lucide-react';
import { ENGINEERING_LESSONS } from '../data/engineeringLessons';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import { RULE_LABELS, type StepRecord } from '../engine/simulation';
import { useI18n } from '../i18n/LanguageContext';
import { CHOICE_LETTERS, fmt, signed } from './metricMeta';

export function DecisionDebrief({ step, onDismiss }: { step: StepRecord; onDismiss: () => void }) {
  const { lang, t, tr } = useI18n();
  const az = lang === 'az';
  const kg = az ? 'kq' : 'kg';
  const option = CHOICE_LETTERS[step.choiceIndex];
  const choice = MISSION_DECISIONS[step.step - 1].choices[step.choiceIndex];

  let result = az
    ? `Batareya · ${fmt(step.after.powerKwh)} ${t('unitKwh')} qalıb`
    : `Battery · ${fmt(step.after.powerKwh)} ${t('unitKwh')} left`;
  if (step.resourceFlows.oxygenAddedKg > 0) {
    result = az ? `Oksigen əlavə edildi · ${fmt(step.resourceFlows.oxygenAddedKg)} ${kg}`
      : `Oxygen added · ${fmt(step.resourceFlows.oxygenAddedKg)} ${kg}`;
  } else if (step.choiceId === 'D2-C') {
    result = az ? 'İstixana sınağı başladı' : 'Greenhouse trial started';
  } else if (step.choiceId === 'D4-A') {
    result = az ? `Emaldan alınan su · ${fmt(step.resourceFlows.waterExtractedKg, 2)} ${kg}`
      : `Water recovered · ${fmt(step.resourceFlows.waterExtractedKg, 2)} ${kg}`;
  } else if (step.step === 5) {
    result = az ? `Mərhələnin model dozası · ${fmt(step.delta.radiationMsv)} mSv`
      : `Modeled dose this phase · ${fmt(step.delta.radiationMsv)} mSv`;
  }

  const consequenceBanner =
    step.env.lowPowerHours > 0
      ? {
          warn: true,
          text: az
            ? `${fmt(step.env.lowPowerHours)} saat 20 kVt·s-dən aşağı — yaşayış modulu işıqları zəiflədi`
            : `Dipped below 20 kWh for ${fmt(step.env.lowPowerHours)} h — habitat lights dimmed`,
        }
      : step.choiceId === 'D3-B'
        ? {
            warn: false,
            text: az
              ? 'Ehtiyat yanacaq elementləri aktivləşdi (+16 kVt·s) · qızdırıcılar qorundu'
              : 'Backup fuel cells activated (+16 kWh) · heaters stayed powered',
          }
        : step.choiceId === 'D1-A'
          ? {
              warn: false,
              text: az
                ? '10 m şaquli dirək · kölgədə 40% günəş enerjisi təmin edəcək'
                : '10 m tall mast locked · sustains 40% solar output during shadow',
            }
          : step.choiceId === 'D5-C'
            ? {
                warn: false,
                text: az
                  ? 'Fırtına sığınacağı aktiv · ekipaj model dozasından 94% qorundu'
                  : 'Storm shelter active · shielded 94% of modeled proton storm dose',
              }
            : {
                warn: false,
                text: az
                  ? 'Batareya 20 kVt·s təhlükəsizlik həddindən yuxarı qaldı'
                  : 'Battery reserve held safely above the 20 kWh floor',
              };

  return (
    <section className="decision-debrief">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold text-[#c5e2b3]">
          <CheckCircle2 size={14} aria-hidden="true" />
          {az ? `D${step.step} · ${option} variantı tətbiq edildi` : `D${step.step} · Option ${option} applied`}
        </h2>
        <button type="button" onClick={onDismiss} aria-label={az ? 'Nəticəni gizlət' : 'Dismiss result'}
          className="shrink-0 rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white">
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div role="status" aria-atomic="true">
        <p className="mt-0.5 text-xs font-medium text-amber-100">{tr(choice.label)}</p>
        <strong className="mt-1 block text-sm leading-snug text-white">{result}</strong>
        <p
          className={`mt-1.5 inline-flex w-full items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-medium ${
            consequenceBanner.warn
              ? 'border-amber-400/45 bg-amber-950/60 text-amber-100'
              : 'border-emerald-400/35 bg-emerald-950/45 text-emerald-100'
          }`}
        >
          {consequenceBanner.warn ? (
            <TriangleAlert size={12} className="shrink-0 text-amber-300" aria-hidden="true" />
          ) : (
            <Sparkles size={12} className="shrink-0 text-emerald-300" aria-hidden="true" />
          )}
          <span>{consequenceBanner.text}</span>
        </p>
        <p className="mt-1">{tr(ENGINEERING_LESSONS[step.step - 1])}</p>
        <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px]">
          <span className="rounded bg-black/35 px-1.5 py-0.5 text-amber-200">
            ⚡ {signed(step.delta.powerKwh)} {t('unitKwh')}
          </span>
          <span className="rounded bg-black/35 px-1.5 py-0.5 text-teal-200">
            🫁 {signed(step.delta.lifeSupportPct)} {az ? 'f.b.' : 'pp'}
          </span>
          <span className="rounded bg-black/35 px-1.5 py-0.5 text-rose-200">
            ☢️ {signed(step.delta.radiationMsv)} mSv
          </span>
          <span className="rounded bg-black/35 px-1.5 py-0.5 text-sky-200">
            🔬 {signed(step.delta.sciencePoints)} {t('unitPts')}
          </span>
        </div>
      </div>
      <details className="mt-1.5 text-xs text-slate-200">
        <summary className="cursor-pointer font-medium text-sky-200">{az ? 'Qərarın təsiri' : 'Why it changed'}</summary>
        <p className="mt-1.5 font-semibold">{tr(choice.label)}</p>
        <p className="mt-1">{tr(choice.causeAndEffectExplanation)}</p>
        <dl className="mt-2 grid grid-cols-2 gap-1.5 border-t border-white/15 pt-2">
          <div><dt>{t('power')}</dt><dd className="font-mono">{signed(step.delta.powerKwh)} {t('unitKwh')}</dd></div>
          <div><dt>{t('lifeSupport')}</dt><dd className="font-mono">{signed(step.delta.lifeSupportPct)} {az ? 'faiz b.' : 'pp'}</dd></div>
          <div><dt>{t('radiation')}</dt><dd className="font-mono">{signed(step.delta.radiationMsv)} mSv</dd></div>
          <div><dt>{t('science')}</dt><dd className="font-mono">{signed(step.delta.sciencePoints)} {t('unitPts')}</dd></div>
        </dl>
        {step.rulesTriggered.length > 0 && (
          <p className="mt-2 text-amber-100">{step.rulesTriggered.map((rule) => tr(RULE_LABELS[rule])).join(' · ')}</p>
        )}
      </details>
    </section>
  );
}
