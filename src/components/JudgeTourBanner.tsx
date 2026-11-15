import { useState } from 'react';
import { ArrowRight, BookOpen, GitBranch, Orbit, Sparkles, X } from 'lucide-react';
import { MISSION_DEMO } from '../data/missionDecisions';
import type { ShadowStrategy } from '../engine/shadowPrediction';
import type { SimulationResult } from '../engine/simulation';
import { useI18n } from '../i18n/LanguageContext';
import { fmt } from './metricMeta';

export type DemoStage = 'setup' | 'shadow' | 'rewind';

const DEMO_STAGES = {
  setup: {
    number: 1,
    title: { en: 'Keep your crew powered', az: 'Ekipajı enerjisiz qoymayın' },
    instruction: {
      en: 'Your crew needs power for heat and air. We’ll set up low solar panels and a protective soil wall, then jump to three days of reduced sunlight.',
      az: 'Ekipaja istilik və hava üçün enerji lazımdır. Alçaq günəş panelləri və qoruyucu torpaq səddi qurub üç günlük az işıqlı mərhələyə keçəcəyik.',
    },
    action: { en: 'Start the shadow test', az: 'Kölgə sınağına keç' },
  },
  shadow: {
    number: 2,
    title: { en: 'Choose a plan for the shadow', az: 'Kölgə mərhələsi üçün plan seçin' },
    instruction: {
      en: 'For three training days, sunlight drops and heaters use the battery. Drill for science, or use backup fuel cells for power. Predict first, then choose a plan.',
      az: 'Üç təlim günü işıq azalır, qızdırıcılar batareyanı işlədir. Elm üçün qazın, ya da enerji üçün ehtiyat yanacaq elementlərini açın. Əvvəl proqnoz verin, sonra plan seçin.',
    },
    action: { en: 'Keep drilling', az: 'Qazmanı davam etdir' },
  },
  rewind: {
    number: 3,
    title: { en: 'Observe your first result', az: 'İlk nəticənizə baxın' },
    instruction: {
      en: 'This is Run A. Rewind to try the other plan from the same starting point. All your other choices stay the same.',
      az: 'Bu, A sınağıdır. Geri qayıdıb digər planı eyni başlanğıcdan sınayın. Qalan seçimləriniz eyni qalır.',
    },
    action: { en: 'Rewind & try the other plan', az: 'Geri qayıt, digər planı sına' },
  },
} as const;

const TOUR_STEPS: Array<{ id: DemoStage; num: number; en: string; az: string }> = [
  { id: 'setup', num: 1, en: 'Predict & Plan', az: 'Proqnoz və Plan' },
  { id: 'shadow', num: 2, en: 'Decide & Observe', az: 'Qərar və Müşahidə' },
  { id: 'rewind', num: 3, en: 'Rewind, Compare & Learn', az: 'Geri Sar, Müqayisə və Öyrən' },
];

export function JudgeTourBanner({
  stage,
  baseline,
  onAdvance,
  onOpenScience,
  onClose,
}: {
  stage: DemoStage;
  baseline: SimulationResult;
  onAdvance: (useBackup?: boolean, prediction?: ShadowStrategy | null) => void;
  onOpenScience: () => void;
  onClose: () => void;
}) {
  const { t, tr, lang } = useI18n();
  const az = lang === 'az';
  const [prediction, setPrediction] = useState<ShadowStrategy | null>(null);
  const scene = DEMO_STAGES[stage];
  const shadowIndex = MISSION_DEMO.rewindStep - 1;
  const shadow = baseline.steps[shadowIndex];
  const backupLabel = lang === 'az' ? 'Ehtiyat yanacaq elementlərini işə sal' : 'Use backup fuel cells';
  const alternateLabel = shadow?.choiceIndex === MISSION_DEMO.branch[shadowIndex]
    ? tr(DEMO_STAGES.shadow.action)
    : backupLabel;

  return (
    <aside className="judge-demo" aria-label={t('judgeTourButton')}>
      <div className="flex items-center gap-2 border-b border-white/15 pb-2">
        <Orbit size={17} className="text-amber-300" />
        <strong className="flex-1 font-mono text-xs font-semibold uppercase tracking-widest text-amber-200">
          {az ? 'Bələdçili sınaq' : 'Guided experiment'} · {scene.number}/3
        </strong>
        <button type="button" onClick={onClose} aria-label={t('close')} className="rounded p-1.5 hover:bg-white/10">
          <X size={16} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5" role="list" aria-label={az ? 'Sınaq mərhələləri' : 'Experiment steps'}>
        {TOUR_STEPS.map((item) => {
          const done = item.num < scene.number;
          const active = item.num === scene.number;
          return (
            <div
              key={item.id}
              role="listitem"
              aria-current={active ? 'step' : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-md border px-1 py-1 text-[10.5px] font-semibold ${
                active
                  ? 'border-amber-300/70 bg-amber-400/20 text-amber-100'
                  : done
                    ? 'border-emerald-400/45 bg-emerald-400/15 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9.5px] font-bold ${
                  active
                    ? 'bg-amber-300 text-slate-950'
                    : done
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-white/15 text-slate-300'
                }`}
              >
                {done ? '✓' : item.num}
              </span>
              <span className="w-full text-center leading-tight">{az ? item.az : item.en}</span>
            </div>
          );
        })}
      </div>
      <div className="my-3" aria-live="polite">
        <h2 className="font-semibold text-white">{tr(scene.title)}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{tr(scene.instruction)}</p>
        {stage === 'shadow' && (
          <div className="mt-2.5 rounded-lg border border-amber-300/30 bg-amber-950/25 p-2.5 text-xs">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
              <Sparkles size={11} className="text-amber-300" />
              {az
                ? 'Proqnoz (könüllü): 120-ci saatda hansı plan daha çox batareya saxlayacaq?'
                : 'Predict first (optional): Which leaves more battery at hour 120?'}
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'backup' as const, label: az ? 'Proqnoz: Ehtiyat yanacaq elementləri' : 'Predict: Backup fuel cells' },
                  { id: 'drill' as const, label: az ? 'Proqnoz: Qazmanı davam etdir' : 'Predict: Keep drilling' },
                ] as const
              ).map((opt) => {
                const active = prediction === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPrediction(active ? null : opt.id)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                      active
                        ? 'border-amber-300 bg-amber-400/25 text-amber-100'
                        : 'border-white/15 bg-slate-900/70 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {stage === 'rewind' && shadow && (
          <div className="mt-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <strong className="mb-1 block">{t('runA')} · {shadow.choiceIndex === MISSION_DEMO.branch[shadowIndex] ? backupLabel : tr(DEMO_STAGES.shadow.action)}</strong>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 font-mono">
              <dt>{az ? `${shadow.endHour}-ci saatda batareya` : `Battery at hour ${shadow.endHour}`}</dt>
              <dd className="whitespace-nowrap text-right text-lg font-bold text-white">
                {fmt(shadow.after.powerKwh)} <span className="text-[11px] font-medium">{t('unitKwh')}</span>
              </dd>
              <dt>{az ? 'Kölgədə elm' : 'Science during shadow'}</dt>
              <dd className="text-right">{fmt(shadow.after.sciencePoints - shadow.before.sciencePoints)} {az ? 'xal' : 'pts'}</dd>
              <dt>{az ? 'Kölgədə aşağı ehtiyat' : 'Low reserve in shadow'}</dt>
              <dd className="text-right">{fmt(shadow.env.lowPowerHours)} {az ? 'saat' : 'h'}</dd>
            </dl>
          </div>
        )}
        {stage === 'rewind' && (
          <p className="mt-2 text-sm text-slate-200">
            {lang === 'az' ? 'Növbəti sınaq' : 'Next experiment'}: {t('runB')} · {alternateLabel}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAdvance(false, prediction)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
        >
          {stage === 'rewind' ? <GitBranch size={16} /> : <ArrowRight size={16} />}
          <span>{tr(scene.action)}</span>
        </button>
        {stage === 'shadow' && (
          <button
            type="button"
            onClick={() => onAdvance(true, prediction)}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
          >
            <span>{backupLabel}</span>
          </button>
        )}
        {stage === 'setup' && (
          <button
            type="button"
            onClick={onOpenScience}
            className="inline-flex items-center gap-2 rounded-lg border border-sky-400/35 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/15"
          >
            <BookOpen size={15} aria-hidden="true" />
            {lang === 'az' ? 'Ay məkanlarını müqayisə et' : 'Compare lunar sites'}
          </button>
        )}
      </div>
    </aside>
  );
}
