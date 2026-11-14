import { evaluateShadowPrediction, type ShadowPrediction } from '../engine/shadowPrediction';
import type { SimulationResult } from '../engine/simulation';
import { useI18n } from '../i18n/LanguageContext';
import { fmt } from './metricMeta';

export function ShadowPredictionResult({ prediction, a, b }: {
  prediction: ShadowPrediction; a: SimulationResult; b: SimulationResult | null;
}) {
  const { lang, t } = useI18n();
  const az = lang === 'az';
  const result = evaluateShadowPrediction(prediction, a, b);
  const evaluated = result.status === 'supported' || result.status === 'contradicted';
  const expected = {
    backup: az ? 'Ehtiyat yanacaq elementləri (B variantı)' : 'Backup fuel cells (Option B)',
    drill: az ? 'Qazmanı davam etdir (C variantı)' : 'Keep drilling (Option C)',
    tie: az ? 'Eyni ehtiyat' : 'Same reserve',
  }[prediction.expected];

  const backupRun = a.steps[2]?.choiceId === 'D3-B' ? t('runA') : b?.steps[2]?.choiceId === 'D3-B' ? t('runB') : null;
  const drillRun = a.steps[2]?.choiceId === 'D3-C' ? t('runA') : b?.steps[2]?.choiceId === 'D3-C' ? t('runB') : null;

  const messages = {
    changed: az
      ? 'İlkin plan, hazırlıq, sahə işi və ya fırtına ssenarisi dəyişib. Bu proqnoz əvvəlki sınağa aiddir.'
      : 'The starting plan, preparation, fieldwork or storm scenario changed. This prediction belongs to the earlier experiment.',
    pending: az
      ? 'D3-də həm Ehtiyat yanacaq elementləri (B variantı), həm də Qazmanı davam etdir (C variantı) seçimlərini sınayıb nəticələri müqayisə edin.'
      : 'Test both Backup fuel cells (Option B) and Keep drilling (Option C) at D3, then compare the results.',
    incomplete: az
      ? 'Gedişlərdən biri 120-ci saata çatmadı. Bu proqnoz qiymətləndirilmir.'
      : 'One strategy did not reach hour 120. This prediction cannot be evaluated.',
    supported: az ? 'Proqnoz nəticə ilə uyğun gəldi.' : 'The result supported your prediction.',
    contradicted: az ? 'Nəticə proqnozunuza zidd oldu.' : 'The result contradicted your prediction.',
  };

  return (
    <section className="mb-4 rounded-xl border border-amber-200/35 bg-[#29352c] p-3 text-sm text-slate-100" aria-label={az ? 'D3 proqnozunun nəticəsi' : 'D3 prediction result'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-amber-100">{az ? 'Sizin proqnozunuz' : 'Your prediction'} · {expected}</h3>
        {evaluated && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              result.status === 'supported'
                ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-300/50 bg-amber-500/15 text-amber-200'
            }`}
          >
            {result.status === 'supported'
              ? az ? 'Proqnoz təsdiqləndi' : 'Prediction confirmed'
              : az ? 'Fərqli nəticə — səbəbini müqayisə edin' : 'Outcome differed — compare why'}
          </span>
        )}
      </div>
      <p className="mt-1">{messages[result.status]}</p>
      {evaluated && (
        <p className="mt-1.5 rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 font-mono text-xs text-slate-100">
          {az ? '120-ci saat' : 'Hour 120'} ·{' '}
          <span className="text-emerald-200">
            {az ? 'Ehtiyat yanacaq elementləri (B variantı' : 'Backup fuel cells (Option B'}
            {backupRun ? `, ${backupRun}` : ''}): {fmt(result.backupKwh)} {t('unitKwh')}
          </span>
          {' · '}
          <span className="text-amber-200">
            {az ? 'Qazmanı davam etdir (C variantı' : 'Keep drilling (Option C'}
            {drillRun ? `, ${drillRun}` : ''}): {fmt(result.drillKwh)} {t('unitKwh')}
          </span>
        </p>
      )}
      {evaluated && (
        <p className="mt-1.5 text-xs text-slate-200">
          {az
            ? 'İşıq və temperatur eyni idi. Yanacaq elementləri enerji verdi, qazma isə elmi iş üçün enerji sərf etdi.'
            : 'Sunlight and temperature were the same. Fuel cells supplied power, while drilling used power for science.'}
        </p>
      )}
    </section>
  );
}
