import { Sparkles, Check } from 'lucide-react';
import type { ShadowStrategy } from '../engine/shadowPrediction';
import { useI18n } from '../i18n/LanguageContext';

export function ShadowPredictionInput({ value, onChange, locked }: {
  value: ShadowStrategy | null;
  onChange: (value: ShadowStrategy | null) => void;
  locked: boolean;
}) {
  const { lang } = useI18n();
  const az = lang === 'az';

  const options: { id: ShadowStrategy; label: string; badge: string }[] = [
    {
      id: 'backup',
      badge: 'B',
      label: az ? 'B · Ehtiyat yanacaq elementləri' : 'B · Backup fuel cells',
    },
    {
      id: 'drill',
      badge: 'C',
      label: az ? 'C · Qazmanı davam etdir' : 'C · Keep drilling',
    },
    {
      id: 'tie',
      badge: '=',
      label: az ? 'Eyni ehtiyat' : 'Same reserve',
    },
  ];

  return (
    <section
      className="rounded-xl border border-amber-300/35 bg-amber-950/25 p-3"
      aria-label={az ? 'D3 batareya proqnozu' : 'D3 battery prediction'}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-200">
          <Sparkles size={13} className="text-amber-300" />
          {az ? 'Proqnoz → Sınaq → Müqayisə · könüllü' : 'Predict → Experiment → Compare · optional'}
        </span>
        {value !== null && !locked && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-white/10"
          >
            {az ? 'Proqnozu keç' : 'Skip prediction'}
          </button>
        )}
      </div>

      <p className="mt-1.5 text-xs sm:text-sm text-slate-200">
        {az
          ? '120-ci saatda hansı strategiya daha çox batareya ehtiyatı saxlayacaq? Eyni D1 və D2 planı ilə ehtiyat yanacaq elementlərini və qazmanı sınayın.'
          : 'Which strategy will leave more battery at hour 120? Test backup fuel cells and drilling with the same D1 and D2 plan.'}
      </p>

      <div
        className="mt-2.5 grid gap-1.5 sm:grid-cols-3"
        role="group"
        aria-label={az ? 'Sizin proqnozunuz' : 'Your prediction'}
      >
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={locked}
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : opt.id)}
              className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition ${
                selected
                  ? 'border-amber-300 bg-amber-400/20 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.18)]'
                  : 'border-white/15 bg-slate-900/75 text-slate-200 hover:border-amber-300/40 hover:bg-slate-800/80'
              } ${locked ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <span>{opt.label}</span>
              {selected && <Check size={13} className="shrink-0 text-amber-300" />}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-slate-300">
        {locked && value === null
          ? az
            ? 'Bu gediş üçün proqnoz qeydə alınmayıb.'
            : 'No prediction was recorded for this run.'
          : locked
            ? az
              ? 'Proqnoz A gedişində qeydə alınıb. Nəticəni Geri Sar və Müqayisə Et bölməsində yoxlayın.'
              : 'Recorded with Run A. Check the result in Rewind & Compare.'
            : az
              ? 'A variantını, B variantını və ya C variantını tətbiq etdikdə proqnoz da saxlanılır. Sonra D3-ü geri sarıb digər strategiyanı sınayın.'
              : 'Your prediction is saved when you apply a choice. Then rewind D3 and test the other strategy.'}
      </p>
    </section>
  );
}
