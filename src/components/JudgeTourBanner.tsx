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
    title: { en: 'One decision. Two possible outcomes.', az: 'Bir qərar. İki mümkün nəticə.' },
    instruction: {
      en: 'How much science would you trade for more battery reserve? Start with low panels and a protective regolith berm, try a plan for the shadow, then rewind it. Other planned decisions stay fixed.',
      az: 'Daha çox batareya ehtiyatı üçün nə qədər elmi qazancdan keçərdiniz? Alçaq panellər və qoruyucu reqolit səddi ilə başlayın, kölgə üçün bir planı sınayın, sonra geri sarın. Digər planlaşdırılmış qərarlar sabit qalır.',
    },
    action: { en: 'Apply the starting plan', az: 'İlkin planı tətbiq et' },
  },
  shadow: {
    number: 2,
    title: { en: 'Choose a plan for the shadow', az: 'Kölgə mərhələsi üçün plan seçin' },
    instruction: {
      en: 'For 72 scenario hours, sunlight drops and heaters draw more power. Keep drilling for science, or use backup fuel cells and pause drilling to protect the battery reserve.',
      az: 'Ssenaridə 72 saat ərzində işıq azalır, qızdırıcıların enerji tələbi isə artır. Elm üçün qazmanı davam etdirin və ya batareya ehtiyatını qorumaq üçün ehtiyat yanacaq elementlərini işə salıb qazmanı dayandırın.',
    },
    action: { en: 'Keep drilling', az: 'Qazmanı davam etdir' },
  },
  rewind: {
    number: 3,
    title: { en: 'Change one decision', az: 'Bir qərarı dəyişdirin' },
    instruction: {
      en: 'This is your first result. Try the other strategy with the same starting reserves, environment and other planned decisions. Compare both battery reserve and science: what did the benefit cost?',
      az: 'Bu, ilk nəticənizdir. Eyni ilkin ehtiyatlar, mühit və digər planlaşdırılmış qərarlarla başqa strategiyanı sınayın. Həm batareyanı, həm də elmi qazancı müqayisə edin: faydanın əvəzi nə oldu?',
    },
    action: { en: 'Rewind D3 and compare', az: 'D3-ə qayıt və müqayisə et' },
  },
} as const;

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
                  { id: 'backup' as const, label: az ? 'Ehtiyat yanacaq elementləri' : 'Backup fuel cells' },
                  { id: 'drill' as const, label: az ? 'Qazmanı davam etdir' : 'Keep drilling' },
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
              <dt>{az ? 'D3 sonunda batareya' : 'Battery after D3'}</dt>
              <dd className="text-right">{fmt(shadow.after.powerKwh)} {t('unitKwh')}</dd>
              <dt>{az ? 'D3-də elmi qazanc' : 'Science earned during D3'}</dt>
              <dd className="text-right">{fmt(shadow.after.sciencePoints - shadow.before.sciencePoints)} {az ? 'xal' : 'pts'}</dd>
              <dt>{az ? 'D3-də aşağı ehtiyat' : 'Low reserve during D3'}</dt>
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
        <button type="button" onClick={() => onAdvance(false, prediction)} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
          {stage === 'rewind' ? <GitBranch size={16} /> : <ArrowRight size={16} />}
          {tr(scene.action)}
        </button>
        {stage === 'shadow' && (
          <button type="button" onClick={() => onAdvance(true, prediction)} className="inline-flex items-center gap-2 rounded-lg border border-amber-300/45 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/15">
            {backupLabel}
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
