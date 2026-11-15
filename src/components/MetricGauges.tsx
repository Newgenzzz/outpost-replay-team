import { AlertTriangle, CheckCircle2, CircleDashed, XOctagon } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { Outcome, SimulationResult } from '../engine/simulation';
import { RADIATION_LIMITS } from '../data/nasaTelemetry';
import { METRICS, fmt, signed, deltaTone } from './metricMeta';

const OUTCOME_STYLE: Record<Outcome, { cls: string; Icon: typeof CheckCircle2 }> = {
  'in-progress': { cls: 'border-slate-700 bg-slate-800/60 text-slate-300', Icon: CircleDashed },
  success: { cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', Icon: CheckCircle2 },
  warning: { cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300', Icon: AlertTriangle },
  abort: { cls: 'border-rose-500/40 bg-rose-500/10 text-rose-300', Icon: XOctagon },
};

export function OutcomeBadge({ result, label }: { result: SimulationResult; label: string }) {
  const { t } = useI18n();
  const { cls, Icon } = OUTCOME_STYLE[result.outcome];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}: {t(`outcome.${result.outcome}`)}
      {result.score !== null && <span className="opacity-80">· {t('score')} {result.score}</span>}
    </span>
  );
}

export default function MetricGauges({ a, b }: { a: SimulationResult; b: SimulationResult | null }) {
  const { t } = useI18n();
  return (
    <section className="panel p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <OutcomeBadge result={a} label={t('runA')} />
        {b && <OutcomeBadge result={b} label={t('runB')} />}
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {METRICS.map((m) => {
          const va = a.final[m.key];
          const vb = b?.final[m.key];
          const pctA = Math.min(100, (va / m.max) * 100);
          const pctB = vb !== undefined ? Math.min(100, (vb / m.max) * 100) : 0;
          const overDose = m.key === 'radiationMsv' && (va >= RADIATION_LIMITS.missionWarningMsv || (vb ?? 0) >= RADIATION_LIMITS.missionWarningMsv);
          return (
            <div key={m.key} className={`rounded-xl border bg-slate-950/50 p-2.5 ${overDose ? 'border-rose-500/60' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <m.icon className={`h-3.5 w-3.5 ${m.text}`} />
                  {t(m.labelKey)}
                </span>
                <span>{t(m.unitKey)}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-xl font-semibold tabular-nums ${m.text}`}>{fmt(va)}</span>
                {vb !== undefined && (
                  <>
                    <span className="text-sm tabular-nums text-slate-300">→ {fmt(vb)}</span>
                    <span className={`rounded border px-1 text-[10px] tabular-nums ${deltaTone(vb - va, m.higherIsBetter)}`}>
                      {signed(Math.round((vb - va) * 10) / 10)}
                    </span>
                  </>
                )}
              </div>
              <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className={`absolute inset-y-0 left-0 ${m.bar}`} style={{ width: `${pctA}%` }} />
                {m.key === 'radiationMsv' && (
                  <div
                    className="absolute inset-y-0 w-0.5 bg-white/80"
                    style={{ left: `${(RADIATION_LIMITS.missionWarningMsv / m.max) * 100}%` }}
                    title={t('doseWarning')}
                  />
                )}
              </div>
              {vb !== undefined && (
                <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`absolute inset-y-0 left-0 ${m.bar} opacity-60`}
                    style={{ width: `${pctB}%`, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 4px, rgba(2,6,23,.7) 4px 6px)' }}
                  />
                </div>
              )}
              {m.key === 'radiationMsv' && <p className="mt-1 text-[10px] text-slate-500">▏{t('doseWarning')}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
