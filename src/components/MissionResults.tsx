import { useI18n } from '../i18n/LanguageContext';
import type { SimulationResult } from '../engine/simulation';
import { OutcomeBadge } from './MetricGauges';
import { fmt } from './metricMeta';

const ABORT_CAUSES = {
  oxygen: { en: 'Oxygen reserve depleted', az: 'Oksigen ehtiyatı tükəndi' },
  water: { en: 'Water reserve depleted', az: 'Su ehtiyatı tükəndi' },
  food: { en: 'Food reserve depleted', az: 'Qida ehtiyatı tükəndi' },
  equipment: { en: 'Life support equipment failed', az: 'Həyat təminatı avadanlığı sıradan çıxdı' },
};

export default function MissionResults({ a, b }: { a: SimulationResult; b: SimulationResult | null }) {
  const { lang, t, tr } = useI18n();
  const runs = b ? [a, b] : [a];
  const kg = lang === 'az' ? 'kq' : 'kg';
  return (
    <section aria-label={lang === 'az' ? 'Missiyanın yekunu' : 'Mission outcomes'} className="grid gap-3 sm:grid-cols-2">
      {runs.map((run, index) => {
        const lowPowerHours = run.steps.reduce((sum, step) => sum + step.env.lowPowerHours, 0);
        const outageHours = run.steps.reduce((sum, step) => sum + step.env.outageHours, 0);
        const { oxygenKg, waterKg, foodKg, cropGrowthDays, harvestedFoodKg } = run.resources;
        return (
          <article key={index} className="rounded-xl border border-white/15 bg-[#0e1a22] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <OutcomeBadge result={run} label={index === 0 ? t('runA') : t('runB')} />
              <span className="font-mono text-xs text-slate-300">{fmt(run.elapsedHours)} / 216 h</span>
            </div>
            {run.abortCause && <p className="mt-2 text-xs font-semibold text-rose-200">{tr(ABORT_CAUSES[run.abortCause])}</p>}
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {[
                ['O₂', `${fmt(oxygenKg)} ${kg}`],
                ['H₂O', `${fmt(waterKg)} ${kg}`],
                [lang === 'az' ? 'Qida' : 'Food', `${fmt(foodKg)} ${kg}`],
                [lang === 'az' ? 'Aşağı ehtiyat' : 'Low battery', `${lowPowerHours} h`],
                [lang === 'az' ? 'Enerji kəsintisi' : 'Power outage', `${outageHours} h`],
                [lang === 'az' ? 'Həyat təminatı' : 'Life support', `${fmt(run.final.lifeSupportPct)}%`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-mono text-slate-100">{value}</dd>
                </div>
              ))}
            </dl>
            {run.flags.includes('greenhouse') && (
              <p className="mt-3 border-t border-white/10 pt-2 text-xs text-emerald-200">
                {lang === 'az'
                  ? `İstixana · ${fmt(cropGrowthDays)} yetişmə günü · ${fmt(harvestedFoodKg)} ${kg} təzə məhsul`
                  : `Greenhouse · ${fmt(cropGrowthDays)} growing days · ${fmt(harvestedFoodKg)} ${kg} fresh harvest`}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
