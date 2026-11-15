import { ArrowRight, BookOpen, GitBranch, Orbit, X } from 'lucide-react';
import type { SimulationResult } from '../engine/simulation';
import { useI18n } from '../i18n/LanguageContext';
import { fmt } from './metricMeta';

export type DemoStage = 'setup' | 'shadow' | 'rewind';

const DEMO_STAGES = {
  setup: {
    number: 1,
    title: { en: 'Prepare the outpost', az: 'Bazanı hazırlayın' },
    instruction: {
      en: 'Your crew has nine days at the lunar south pole. Start with aligned low panels and a protective regolith berm. See how that plan handles a long shadow.',
      az: 'Ekipajın Ayın cənub qütbündə doqquz günü var. Günəşə yönəlmiş alçaq panellər və qoruyucu reqolit səddi ilə başlayın. Bu planın uzun kölgədə necə işlədiyinə baxın.',
    },
    action: { en: 'Apply the starting plan', az: 'İlkin planı tətbiq et' },
  },
  shadow: {
    number: 2,
    title: { en: 'Test the battery-only plan', az: 'Yalnız batareyadan istifadəni sınayın' },
    instruction: {
      en: 'For 72 scenario hours, sunlight drops and heaters draw more power. Run the mission with the crew’s planned workload and no backup power during the shadow.',
      az: 'Ssenaridə 72 saat ərzində işıq azalır, qızdırıcıların enerji tələbi isə artır. Missiyanı planlaşdırılmış iş yükü ilə və kölgədə ehtiyat enerji işlətmədən başladın.',
    },
    action: { en: 'Simulate Run A', az: 'A gedişini simulyasiya et' },
  },
  rewind: {
    number: 3,
    title: { en: 'Change one decision', az: 'Bir qərarı dəyişdirin' },
    instruction: {
      en: 'Rewind to the shadow and start the fuel cells. Both runs share the same initial reserves, sunlight, temperature, storm and other planned decisions.',
      az: 'Kölgə mərhələsinə qayıdın və yanacaq elementlərini işə salın. İlkin ehtiyatlar, işıq, temperatur, fırtına və digər planlaşdırılmış qərarlar hər iki gedişdə eynidir.',
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
  onAdvance: () => void;
  onOpenScience: () => void;
  onClose: () => void;
}) {
  const { t, tr, lang } = useI18n();
  const scene = DEMO_STAGES[stage];
  const shadow = baseline.steps[2];

  return (
    <aside className="judge-demo" aria-label={t('judgeTourButton')}>
      <div className="flex items-center gap-2 border-b border-white/15 pb-2">
        <Orbit size={17} className="text-amber-300" />
        <strong className="flex-1 font-mono text-xs font-semibold uppercase tracking-widest text-amber-200">
          {t('judgeTourButton')} · {scene.number}/3
        </strong>
        <button type="button" onClick={onClose} aria-label={t('close')} className="rounded p-1.5 hover:bg-white/10">
          <X size={16} />
        </button>
      </div>
      <div className="my-3" aria-live="polite">
        <h2 className="font-semibold text-white">{tr(scene.title)}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{tr(scene.instruction)}</p>
        {stage === 'rewind' && shadow && (
          <p className="mt-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100">
            {t(`outcome.${baseline.outcome}`)} · D3 {fmt(shadow.before.powerKwh)} → {fmt(shadow.after.powerKwh)} {t('unitKwh')}
            {' · '}{fmt(shadow.env.lowPowerHours)} {lang === 'az' ? 'saat aşağı gücdə' : 'h on low reserve'}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAdvance} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
          {stage === 'rewind' ? <GitBranch size={16} /> : <ArrowRight size={16} />}
          {tr(scene.action)}
        </button>
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
