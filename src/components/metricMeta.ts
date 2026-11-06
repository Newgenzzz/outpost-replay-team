import { Atom, BatteryCharging, HeartPulse, Radiation, type LucideIcon } from 'lucide-react';
import type { MetricKey } from '../types';
import type { StringKey } from '../i18n/strings';

export interface MetricMeta {
  key: MetricKey;
  labelKey: StringKey;
  unitKey: StringKey;
  icon: LucideIcon;
  color: string;
  text: string;
  bar: string;
  /** true when a higher value is better (radiation is the exception). */
  higherIsBetter: boolean;
  max: number;
}

export const METRICS: MetricMeta[] = [
  { key: 'powerKwh', labelKey: 'power', unitKey: 'unitKwh', icon: BatteryCharging, color: '#f59e0b', text: 'text-amber-400', bar: 'bg-amber-400', higherIsBetter: true, max: 100 },
  { key: 'lifeSupportPct', labelKey: 'lifeSupport', unitKey: 'unitPct', icon: HeartPulse, color: '#10b981', text: 'text-emerald-400', bar: 'bg-emerald-400', higherIsBetter: true, max: 100 },
  { key: 'radiationMsv', labelKey: 'radiation', unitKey: 'unitMsv', icon: Radiation, color: '#f43f5e', text: 'text-rose-400', bar: 'bg-rose-400', higherIsBetter: false, max: 60 },
  { key: 'sciencePoints', labelKey: 'science', unitKey: 'unitPts', icon: Atom, color: '#38bdf8', text: 'text-sky-400', bar: 'bg-sky-400', higherIsBetter: true, max: 100 },
];

export const CHOICE_LETTERS = ['A', 'B', 'C'] as const;

export const fmt = (n: number, digits = 1) => (Number.isInteger(n) ? String(n) : n.toFixed(digits));
export const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));

/** Tailwind classes for a delta given whether higher is better. */
export function deltaTone(delta: number, higherIsBetter: boolean): string {
  if (delta === 0) return 'text-slate-400 bg-slate-800/60 border-slate-700';
  const good = higherIsBetter ? delta > 0 : delta < 0;
  return good
    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
    : 'text-rose-300 bg-rose-500/10 border-rose-500/30';
}
