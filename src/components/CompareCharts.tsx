import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useI18n } from '../i18n/LanguageContext';
import type { SimulationResult } from '../engine/simulation';
import { GAME_CONSTANTS, RADIATION_LIMITS } from '../data/nasaTelemetry';
import { METRICS, fmt } from './metricMeta';

export default function CompareCharts({
  a,
  b,
  comparisonStep,
}: {
  a: SimulationResult;
  b: SimulationResult | null;
  comparisonStep: number | null;
}) {
  const { t, lang } = useI18n();
  const az = lang === 'az';
  const [resolution, setResolution] = useState<'hourly' | 'phase'>('hourly');

  const runs = b ? [a, b] : [a];
  const hours = new Map<number, Record<string, number>>();

  if (resolution === 'hourly' && a.hourlyHistory?.length) {
    runs.forEach((run, index) => {
      const prefix = index === 0 ? 'A' : 'B';
      (run.hourlyHistory ?? []).forEach((pt) => {
        const row = hours.get(pt.hour) ?? { hour: pt.hour };
        row[`${prefix}_powerKwh`] = pt.powerKwh;
        row[`${prefix}_lifeSupportPct`] = pt.lifeSupportPct;
        row[`${prefix}_radiationMsv`] = pt.radiationMsv;
        row[`${prefix}_sciencePoints`] = pt.sciencePoints;
        row[`${prefix}_oxygenKg`] = pt.oxygenKg;
        row[`${prefix}_waterKg`] = pt.waterKg;
        row[`${prefix}_tempK`] = pt.surfaceTempK;
        hours.set(pt.hour, row);
      });
    });
  } else {
    hours.set(0, { hour: 0 });
    runs.forEach((run, index) => {
      const prefix = index === 0 ? 'A' : 'B';
      run.history.forEach((metrics, phase) => {
        const hour = phase === 0 ? 0 : run.steps[phase - 1].endHour;
        const row = hours.get(hour) ?? { hour };
        for (const metric of METRICS) row[`${prefix}_${metric.key}`] = metrics[metric.key];
        hours.set(hour, row);
      });
    });
  }

  const data = [...hours.values()].sort((left, right) => left.hour - right.hour);
  const index = (comparisonStep ?? 0) - 1;
  const hourA = a.steps[index]?.endHour;
  const comparedHour = hourA === b?.steps[index]?.endHour ? hourA : undefined;

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      aria-label={az ? 'Missiya qrafikləri' : 'Mission trend charts'}
    >
      <div className="col-span-full flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-[#aac9e2]" />
            {t('runA')}
          </span>
          {b && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 border-t-2 border-dashed border-[#b6efcf]" />
              {t('runB')}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-amber-500/50" />
            {t('shadowBand')} (D3 · 48–120h)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-rose-500/50" />
            {t('stormBand')} (D5 · 144–192h)
          </span>
          {comparedHour !== undefined && (
            <span className="inline-flex items-center gap-1.5 text-sky-100">
              <span className="h-3 border-l-2 border-dotted border-sky-200" aria-hidden="true" />
              {az
                ? `D${comparisonStep} nəticəsi · saat ${comparedHour}`
                : `D${comparisonStep} result · hour ${comparedHour}`}
            </span>
          )}
        </div>

        <div className="inline-flex rounded-lg border border-white/15 bg-slate-950/60 p-0.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setResolution('hourly')}
            className={`rounded-md px-2 py-1 ${
              resolution === 'hourly' ? 'bg-sky-500/25 text-sky-200 font-bold' : 'text-slate-400'
            }`}
          >
            {az ? '216 Saatlıq' : '216h Hourly'}
          </button>
          <button
            type="button"
            onClick={() => setResolution('phase')}
            className={`rounded-md px-2 py-1 ${
              resolution === 'phase' ? 'bg-sky-500/25 text-sky-200 font-bold' : 'text-slate-400'
            }`}
          >
            {az ? 'Mərhələlər' : '6 Phases'}
          </button>
        </div>
      </div>

      {METRICS.map((m) => {
        const maxValue = Math.max(
          ...runs.flatMap((run) => run.history.map((point) => point[m.key])),
          ...(runs.flatMap((run) => (run.hourlyHistory ?? []).map((pt) => pt[m.key]))),
        );
        const yMax = m.key === 'radiationMsv' ? Math.max(60, Math.ceil(maxValue / 10) * 10) : 100;
        const showDots = resolution === 'phase';

        return (
          <figure
            key={m.key}
            className="min-w-0 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3"
          >
            <figcaption className={`mb-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold ${m.text}`}>
              <m.icon className="h-3.5 w-3.5" />
              {t(m.labelKey)} <span className="text-slate-400">({t(m.unitKey)})</span>
              {m.key === 'powerKwh' && (
                <span className="inline-flex items-center gap-1.5 font-normal text-amber-200">
                  <span className="w-4 border-t border-dashed border-amber-200" aria-hidden="true" />
                  {az ? 'Qəza həddi' : 'Brownout'} · {GAME_CONSTANTS.brownoutThresholdKwh} {t('unitKwh')}
                </span>
              )}
            </figcaption>
            <div className="h-40" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="#253548" strokeDasharray="2 4" />
                  <ReferenceArea x1={48} x2={120} fill="#f59e0b" fillOpacity={0.13} />
                  <ReferenceArea x1={144} x2={192} fill="#f43f5e" fillOpacity={0.14} />
                  <XAxis
                    dataKey="hour"
                    type="number"
                    domain={[0, 216]}
                    ticks={[0, 24, 48, 120, 144, 192, 216]}
                    stroke="#94a3b8"
                    tickLine={false}
                  />
                  <YAxis domain={[0, yMax]} stroke="#94a3b8" tickLine={false} width={39} />
                  {comparedHour !== undefined && (
                    <ReferenceLine x={comparedHour} stroke="#a5d6e8" strokeDasharray="2 4" />
                  )}
                  {m.key === 'powerKwh' && (
                    <ReferenceLine
                      y={GAME_CONSTANTS.brownoutThresholdKwh}
                      stroke="#fde68a"
                      strokeDasharray="4 3"
                    />
                  )}
                  {m.key === 'radiationMsv' && (
                    <ReferenceLine
                      y={RADIATION_LIMITS.missionWarningMsv}
                      stroke="#fda4af"
                      strokeDasharray="4 3"
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#cbd5e1', fontFamily: 'monospace' }}
                    labelFormatter={(hour: number) => `${az ? 'Saat' : 'Hour'} ${hour} / 216h`}
                    formatter={(value: number, key: string) => [
                      `${fmt(value)} ${t(m.unitKey)}`,
                      key.startsWith('A_') ? t('runA') : t('runB'),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey={`A_${m.key}`}
                    stroke="#aac9e2"
                    strokeWidth={2.3}
                    dot={showDots ? { r: 3 } : false}
                    isAnimationActive={false}
                    connectNulls
                  />
                  {b && (
                    <Line
                      type="monotone"
                      dataKey={`B_${m.key}`}
                      stroke="#b6efcf"
                      strokeWidth={2.2}
                      strokeDasharray="5 4"
                      dot={showDots ? { r: 3, fill: '#0f172a' } : false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </figure>
        );
      })}

      <p className="col-span-full text-xs text-slate-400">
        {az
          ? '216 saatlıq rejim hər saatın enerji balansını, 72 saatlıq kölgəni (D3) və 48 saatlıq proton fırtınasını (D5) dəqiq əks etdirir.'
          : '216h Hourly mode traces every simulated hour across the scripted 72h terrain shadow (D3) and fictional 48h particle storm (D5).'}
      </p>

      <details className="col-span-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
        <summary className="cursor-pointer font-semibold">
          {az ? 'Mərhələ cədvəli və ekipaj ehtiyatları (O₂, H₂O, Qida)' : 'Phase audit table & crew consumables (O₂, H₂O, Food)'}
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-700">
                <th scope="col" className="p-2">{az ? 'Saat' : 'Hour'}</th>
                <th scope="col" className="p-2">{az ? 'Gediş' : 'Run'}</th>
                {METRICS.map((m) => (
                  <th key={m.key} scope="col" className="p-2">
                    {t(m.labelKey)} ({t(m.unitKey)})
                  </th>
                ))}
                <th scope="col" className="p-2">O₂ ({az ? 'kq' : 'kg'})</th>
                <th scope="col" className="p-2">H₂O ({az ? 'kq' : 'kg'})</th>
                <th scope="col" className="p-2">{az ? 'Qida (kq)' : 'Food (kg)'}</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {runs.flatMap((run, idx) =>
                run.history.map((metrics, phase) => {
                  const reserves = run.resourceHistory[phase];
                  return (
                    <tr key={`${idx}-${phase}`} className="border-b border-slate-800">
                      <th scope="row" className="p-2 font-normal">
                        {phase === 0 ? 0 : run.steps[phase - 1].endHour}
                      </th>
                      <td className="p-2">{idx === 0 ? t('runA') : t('runB')}</td>
                      {METRICS.map((m) => (
                        <td key={m.key} className="p-2">{fmt(metrics[m.key])}</td>
                      ))}
                      <td className="p-2">{fmt(reserves.oxygenKg)}</td>
                      <td className="p-2">{fmt(reserves.waterKg)}</td>
                      <td className="p-2">{fmt(reserves.foodKg)}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
