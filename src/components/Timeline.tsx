import { GitBranch, Lock, SunDim, Zap } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import type { SimulationResult } from '../engine/simulation';
import { CHOICE_LETTERS } from './metricMeta';

interface TimelineProps {
  a: SimulationResult;
  b: SimulationResult | null;
  viewStep: number;
  onSelectStep: (step: number) => void;
}

export default function Timeline({ a, b, viewStep, onSelectStep }: TimelineProps) {
  const { t, tr } = useI18n();
  const complete = a.complete;
  const hint = b ? t('timelineHintBranch') : complete ? t('timelineHintComplete') : t('timelineHintPlaying');

  return (
    <section className="panel p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{t('timeline')}</h2>
        {complete && (
          <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] text-fuchsia-200">
            <GitBranch className="h-3 w-3" /> {t('rewindBranch')}
          </span>
        )}
      </div>

      <ol className="grid grid-cols-6 gap-1.5">
        {MISSION_DECISIONS.map((d) => {
          const idx = d.id - 1;
          const choiceA = a.choices[idx];
          const choiceB = b?.choices[idx];
          const reachable = complete || d.id <= a.choices.length + 1;
          const isView = viewStep === d.id;
          const changed = b !== null && choiceB !== undefined && choiceB !== choiceA;
          const trigger = d.nasaDataTrigger?.source;
          return (
            <li key={d.id}>
              <button
                disabled={!reachable}
                onClick={() => onSelectStep(d.id)}
                title={complete ? `${t('rewindBranch')} → ${t('decision')} ${d.id}` : tr(d.title)}
                className={`group relative flex h-full w-full flex-col items-start gap-1 rounded-xl border p-2 text-left transition ${
                  isView
                    ? 'border-sky-400 bg-sky-500/10 ring-1 ring-sky-400/40'
                    : changed
                      ? 'border-fuchsia-500/60 bg-fuchsia-500/5 hover:bg-fuchsia-500/10'
                      : reachable
                        ? 'border-slate-700 bg-slate-950/40 hover:border-slate-500'
                        : 'cursor-not-allowed border-slate-800 bg-slate-950/20 opacity-50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-slate-500">
                    {t('decision')} {d.id}
                  </span>
                  {trigger === 'LRO_SHADOW' && <SunDim className="h-3.5 w-3.5 text-amber-300" aria-label="LRO" />}
                  {trigger === 'DONKI_SEP' && <Zap className="h-3.5 w-3.5 text-rose-300" aria-label="DONKI" />}
                  {!reachable && <Lock className="h-3 w-3 text-slate-600" />}
                </div>
                <span className="line-clamp-2 text-[11px] leading-tight text-slate-300">{tr(d.title)}</span>
                <div className="mt-auto flex items-center gap-1 pt-1">
                  {choiceA !== undefined && (
                    <span className="rounded bg-slate-200 px-1.5 text-[10px] font-bold text-slate-900" title={t('runA')}>
                      A:{CHOICE_LETTERS[choiceA]}
                    </span>
                  )}
                  {choiceB !== undefined && (
                    <span
                      className={`rounded border border-dashed px-1.5 text-[10px] font-bold ${
                        changed ? 'border-fuchsia-300 text-fuchsia-200' : 'border-slate-500 text-slate-400'
                      }`}
                      title={t('runB')}
                    >
                      B:{CHOICE_LETTERS[choiceB]}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </section>
  );
}
