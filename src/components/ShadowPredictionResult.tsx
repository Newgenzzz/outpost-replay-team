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
  const expected = { backup: az ? 'ehtiyat yanacaq elementləri' : 'backup fuel cells', drill: az ? 'qazma' : 'drilling', tie: az ? 'eyni ehtiyat' : 'the same reserve' }[prediction.expected];
  const messages = {
    changed: az ? 'İlkin plan və ya kalibrləmə dəyişib. Bu proqnoz həmin yeni sınağa aid deyil.' : 'The starting plan or calibration changed. This prediction belongs to the earlier setup.',
    pending: az ? 'D3-də həm B, həm də C variantını sınayıb nəticələri müqayisə edin.' : 'Test both B and C at D3, then compare the results.',
    incomplete: az ? 'Gedişlərdən biri 120-ci saata çatmadı. Bu proqnoz qiymətləndirilmir.' : 'One strategy did not reach hour 120. This prediction cannot be evaluated.',
    supported: az ? 'Proqnoz nəticə ilə uyğun gəldi.' : 'The result supported your prediction.',
    contradicted: az ? 'Nəticə proqnozunuza zidd oldu.' : 'The result contradicted your prediction.',
  };
  return (
    <section className="mb-4 rounded-xl border border-amber-200/35 bg-[#29352c] p-3 text-sm text-slate-100" aria-label={az ? 'D3 proqnozunun nəticəsi' : 'D3 prediction result'}>
      <h3 className="font-semibold text-amber-100">{az ? 'Sizin proqnozunuz' : 'Your prediction'} · {expected}</h3>
      <p className="mt-1">{messages[result.status]}</p>
      {evaluated && <p className="mt-1 font-mono text-xs">{az ? '120-ci saat' : 'Hour 120'} · B {fmt(result.backupKwh)} {t('unitKwh')} · C {fmt(result.drillKwh)} {t('unitKwh')}</p>}
      {evaluated && <p className="mt-1 text-xs text-slate-200">{az
        ? 'İşıq və temperatur eyni idi. Yanacaq elementləri enerji verdi, qazma isə elmi iş üçün enerji sərf etdi.'
        : 'Sunlight and temperature were the same. Fuel cells supplied power, while drilling used power for science.'}</p>}
    </section>
  );
}
