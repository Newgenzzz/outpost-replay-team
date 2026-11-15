import { AlertTriangle, CheckCircle2, CircleDashed, XOctagon } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { Outcome, SimulationResult } from '../engine/simulation';

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
