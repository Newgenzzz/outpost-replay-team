import { useId, useState } from 'react';
import { Sun } from 'lucide-react';
import { LUNAR_PLANNING_SITES, LUNAR_SITE_SOURCE } from '../data/lunarSiteIntelligence';
import { GAME_CONSTANTS } from '../data/nasaTelemetry';
import { estimateSitePower } from '../engine/sitePowerPlanning';
import { useI18n } from '../i18n/LanguageContext';
import { Shackleton3DHologram } from './ShackletonHologram';

export default function LunarSiteIntelligence({ hide3D = false }: { hide3D?: boolean }) {
  const { lang, t, tr } = useI18n();
  const [reserve, setReserve] = useState(35);
  const [evidence, setEvidence] = useState(0);
  const reserveId = useId();
  const az = lang === 'az';
  const kwh = t('unitKwh');
  const hour = az ? 'saat' : 'h';
  const day = az ? 'gün' : 'day';
  const number = (value: number, digits = 1) => value.toLocaleString(az ? 'az-AZ' : 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const { panelHeightMeters, startYear, endYear, url } = LUNAR_SITE_SOURCE;

  return (
    <details className="rounded-lg border border-sky-400/25 bg-sky-950/35 px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-sky-200">
        <Sun className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        {az ? 'Ay məkanlarının təhlili · Günəş enerjisi planı' : 'Lunar Site Intelligence · Solar power planning'}
      </summary>

      <div className="mt-3 space-y-3 text-xs text-slate-300">
        {!hide3D && <Shackleton3DHologram compact />}
        <div className="rounded-lg border border-white/15 bg-slate-950/50 p-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={az ? 'Elmi sübutun yolunu izlə' : 'Trace the evidence'}>
            {(az ? ['1 · Ölçmələr', '2 · Tədqiqat modeli', '3 · Sizin qərarınız'] : ['1 · Measurements', '2 · Research model', '3 · Your decision']).map((label, index) => (
              <button type="button" key={label} aria-pressed={evidence === index} onClick={() => setEvidence(index)}
                className={`rounded border px-2 py-1.5 ${evidence === index ? 'border-sky-200 bg-sky-800/40 text-white' : 'border-slate-600 text-slate-200 hover:bg-white/5'}`}>{label}</button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-100" aria-live="polite">{(az ? [
            'LRO-nun LOLA cihazı səthdən əks olunan lazer impulslarının qayıtma vaxtını ölçdü. Bu məlumatlar relyef modelləri qurmağa kömək edir.',
            'Tədqiqatçılar LOLA relyefi ilə bu iki nöqtədə 2017–2037-ci illərin işıqlanmasını modelləşdirdilər. 66 və 112 saat ən uzun model kölgələridir.',
            'Sürgü ilə ehtiyatı dəyişin. Bu hesab sabit yük və kölgədə sıfır istehsal fərz edir. Oyunun doqquz günlük missiyası ayrıca 72 saatlıq azalmış işıq ssenarisidir.',
          ] : [
            'LRO’s LOLA instrument measured the return times of laser pulses reflected by the surface. Those measurements help build terrain models.',
            'Researchers used LOLA terrain to model illumination at these two points over 2017–2037. The 66 h and 112 h values are the longest modeled shadows.',
            'Move the reserve slider. This calculation assumes a constant load and no generation in shadow. The game’s nine-day mission has a separate, scripted 72-hour period of reduced light.',
          ])[evidence]}</p>
        </div>
        <p>
          {az
            ? `LOLA relyefindən modelləşdirilib · səthdən ${panelHeightMeters} m yuxarı · ${startYear}–${endYear}. Batareya ehtiyatını dəyişib hansı məkanın ən uzun kölgə dövründə baza yükünü qarşıladığını yoxlayın.`
            : `Modeled from LOLA terrain · ${panelHeightMeters} m above ground · ${startYear}–${endYear}. Adjust the battery reserve to see which site could cover the base load during its longest modeled shadow.`}
        </p>
        <div>
          <label htmlFor={reserveId} className="flex justify-between gap-2 font-semibold text-slate-100">
            {az ? 'Kölgə başlayanda istifadə edilə bilən ehtiyat' : 'Usable battery reserve at shadow entry'}
            <span className="shrink-0 font-mono text-sky-200">{reserve} {kwh}</span>
          </label>
          <input
            id={reserveId}
            type="range"
            min={0}
            max={60}
            value={reserve}
            aria-valuetext={`${reserve} ${kwh}`}
            onChange={(event) => setReserve(Number(event.target.value))}
            className="mt-2 w-full accent-sky-300"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {LUNAR_PLANNING_SITES.map((site) => {
            const { meanGenerationKwhPerDay, shadowEnergyKwh, reserveMarginKwh } = estimateSitePower(site, reserve);
            const coversShadow = reserveMarginKwh >= 0;
            return (
              <section key={site.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2.5">
                <h3 className="font-semibold text-white">{tr(site.name)}</h3>
                <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1">
                  <dt>{az ? 'Günəş diskinin orta görünən hissəsi' : 'Mean visible solar disk'}</dt>
                  <dd className="text-right tabular-nums">{number(site.meanIlluminationPct)}%</dd>
                  <dt>{az ? 'Ən uzun kölgə' : 'Longest shadow'}</dt>
                  <dd className="text-right tabular-nums">{site.longestShadowHours} {hour}</dd>
                  <dt>{az ? 'Orta enerji təxmini' : 'Mean energy estimate'}</dt>
                  <dd className="text-right tabular-nums">{number(meanGenerationKwhPerDay, 2)} {kwh}/{day}</dd>
                  <dt>{az ? 'Kölgədə enerji tələbi' : 'Shadow energy needed'}</dt>
                  <dd className="text-right tabular-nums">{number(shadowEnergyKwh)} {kwh}</dd>
                </dl>
                <p className={`mt-2 border-t border-white/10 pt-2 font-semibold ${coversShadow ? 'text-emerald-200' : 'text-amber-200'}`}>
                  {coversShadow
                    ? az ? 'Qalan ehtiyat' : 'Reserve left'
                    : az ? 'Çatışmayan ehtiyat' : 'Reserve shortfall'}
                  {' · '}{number(Math.abs(reserveMarginKwh))} {kwh}
                </p>
              </section>
            );
          })}
        </div>
        <p className="font-medium text-sky-100">
          {az
            ? 'C1-də orta işıqlanma daha yüksəkdir, amma ən uzun kölgə dövrü daha çox batareya ehtiyatı tələb edir.'
            : 'C1 gets more sunlight on average. Its longer shadow still calls for a bigger battery reserve.'}
        </p>
        <p>
          {az
            ? `Plan fərziyyələri · tam işıqda ${GAME_CONSTANTS.generationKwhPerDay} ${kwh}/gün istehsal, sabit ${GAME_CONSTANTS.baseLoadKwhPerDay} ${kwh}/gün yük və kölgədə sıfır istehsal. Bu plan hesabı ayrıca aparılır. Missiya öz saatlıq işıq ssenarisindən istifadə edir.`
            : `Planning assumptions · ${GAME_CONSTANTS.generationKwhPerDay} ${kwh}/day in full light, a constant ${GAME_CONSTANTS.baseLoadKwhPerDay} ${kwh}/day base load and zero solar output in shadow. The training mission uses its own hourly light profile.`}
        </p>
        <a className="inline-block text-sky-200 underline underline-offset-2" href={url} target="_blank" rel="noreferrer">
          {az ? 'NASA NTRS · Gläser və b., Cədvəl 2' : 'NASA NTRS · Gläser et al., Table 2'}
        </a>
      </div>
    </details>
  );
}
