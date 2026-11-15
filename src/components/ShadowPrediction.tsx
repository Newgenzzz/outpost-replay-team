import type { ShadowStrategy } from '../engine/shadowPrediction';
import { useI18n } from '../i18n/LanguageContext';

export function ShadowPredictionInput({ value, onChange, locked }: {
  value: ShadowStrategy | null;
  onChange: (value: ShadowStrategy | null) => void;
  locked: boolean;
}) {
  const { lang } = useI18n();
  const az = lang === 'az';
  return (
    <details className="rounded-lg border border-amber-200/30 bg-amber-950/20 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-amber-100">
        {az ? 'Proqnoz → Sınaq → Müqayisə · könüllü' : 'Predict → Experiment → Compare · optional'}
      </summary>
      <p className="mt-2 text-sm text-slate-200">{az
        ? '120-ci saatda hansı strategiya daha çox batareya ehtiyatı saxlayacaq? Eyni D1 və D2 planı ilə ehtiyat yanacaq elementlərini və qazmanı sınayın.'
        : 'Which strategy will leave more battery at hour 120? Test backup fuel cells and drilling with the same D1 and D2 plan.'}</p>
      <label className="mt-2 block text-xs text-slate-200">
        {az ? 'Sizin proqnozunuz' : 'Your prediction'}
        <select className="mt-1 block w-full rounded border border-slate-600 bg-slate-900 p-2 text-sm text-white"
          value={value ?? ''} disabled={locked} onChange={(event) => onChange(event.target.value as ShadowStrategy || null)}>
          <option value="">{az ? 'Proqnozu keç' : 'Skip prediction'}</option>
          <option value="backup">{az ? 'B · Ehtiyat yanacaq elementləri' : 'B · Backup fuel cells'}</option>
          <option value="drill">{az ? 'C · Qazmanı davam etdir' : 'C · Keep drilling'}</option>
          <option value="tie">{az ? 'Eyni ehtiyat' : 'Same reserve'}</option>
        </select>
      </label>
      <p className="mt-2 text-xs text-slate-300">{locked && value === null
        ? az ? 'Bu gediş üçün proqnoz qeydə alınmayıb.' : 'No prediction was recorded for this run.'
        : locked
        ? az ? 'Proqnoz A gedişində qeydə alınıb. Nəticəni Geri Sar və Müqayisə Et bölməsində yoxlayın.' : 'Recorded with Run A. Check the result in Rewind & Compare.'
        : az ? 'A variantını, B variantını və ya C variantını tətbiq etdikdə proqnoz da saxlanılır. Sonra D3-ü geri sarıb digər strategiyanı sınayın.' : 'Your prediction is saved when you apply a choice. Then rewind D3 and test the other strategy.'}</p>
    </details>
  );
}
