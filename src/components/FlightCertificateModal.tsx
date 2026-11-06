import { useState } from 'react';
import { Award, Copy, Orbit, Printer, X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import { RADIATION_LIMITS } from '../data/nasaTelemetry';
import { CHOICE_LETTERS, fmt } from './metricMeta';
import type { SimulationResult } from '../engine/simulation';

interface FlightCertificateModalProps {
  run: SimulationResult;
  runLabel: string;
  onClose: () => void;
}

export function FlightCertificateModal({ run, runLabel, onClose }: FlightCertificateModalProps) {
  const { lang, t, tr } = useI18n();
  const az = lang === 'az';
  const title = az ? 'Outpost Replay təlim hesabatı' : 'Outpost Replay training report';
  const commander = az ? 'Komandir' : 'Commander';
  const location = az ? 'Şeklton kənarı təlim bazası' : 'Shackleton rim training site';
  const elapsed = az ? 'Keçən missiya saatları' : 'Mission hours elapsed';
  const crewName = az ? 'Gənc astronavt' : 'Junior Astronaut';
  const [commanderName, setCommanderName] = useState('');
  const [copyStatus, setCopyStatus] = useState<'ready' | 'copied' | 'failed'>('ready');

  const isSuccess = run.outcome === 'success';
  const isAbort = run.outcome === 'abort';
  const score = run.score ?? '—';

  function handlePrint() {
    window.print();
  }

  async function handleCopySummary() {
    const warning = az ? 'təlim xəbərdarlığı' : 'training warning';
    const text = `${title} · ${runLabel}
${commander}: ${commanderName.trim() || crewName}
${location} · ${elapsed}: ${run.elapsedHours}
${t('result')}: ${t(`outcome.${run.outcome}`)} (${t('score')}: ${score})
${t('power')}: ${fmt(run.final.powerKwh)} ${t('unitKwh')}
${t('lifeSupport')}: ${fmt(run.final.lifeSupportPct)}%
${t('radiation')}: ${fmt(run.final.radiationMsv)} mSv (${warning}: ${RADIATION_LIMITS.missionWarningMsv} mSv)
${t('science')}: ${fmt(run.final.sciencePoints)} ${t('unitPts')}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  return (
    <div
      className="training-report fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/85 p-4 backdrop-blur-md print:static print:block print:bg-white print:backdrop-blur-none"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#c0e6aa]/60 bg-[#0e1d26] p-6 shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none scrollbar-thin">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 print:hidden">
          <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#c0e6aa]">
            <Award size={15} />
            <span>{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
            >
              <Copy size={13} />
              {copyStatus === 'copied' ? (az ? 'Kopyalandı' : 'Copied') : (az ? 'Kopyala' : 'Copy')}
            </button>
            {copyStatus === 'failed' && <span role="status" className="text-xs text-rose-200">
              {az ? 'Kopyalama mümkün olmadı' : 'Could not copy'}
            </span>}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#c0e6aa] px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-[#d5f5c2]"
            >
              <Printer size={13} />
              {lang === 'az' ? 'Çap Et / PDF Saxla' : 'Print / Save PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ================= Printable Certificate Body ================= */}
        <div className="rounded-xl border border-[#c0e6aa]/40 bg-[#12242f]/90 p-6 text-center print:border-black print:bg-white print:p-2">
          {/* Header Seals */}
          <div className="flex items-center justify-between border-b border-white/15 pb-4 print:border-black">
            <div className="text-left font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
              <span>OUTPOST REPLAY</span>
              <br />
              <span className="font-semibold text-[#c0e6aa] print:text-black">{runLabel}</span>
              <br />
              <span>{location}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#c0e6aa] bg-[#c0e6aa]/10 text-[#c0e6aa] print:border-black print:bg-white print:text-black">
                <Orbit size={26} />
              </div>
              <span className="mt-1 font-mono text-[8px] uppercase tracking-widest text-[#c0e6aa] print:text-black">
                {az ? 'Ayın cənub qütbü' : 'Lunar south pole'}
              </span>
            </div>
            <div className="text-right font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
              <span>{elapsed} · {run.elapsedHours}</span>
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white print:text-black">
            {title}
          </h1>
          <p className="mt-1 text-xs text-slate-300 print:text-gray-700">
            {az
              ? 'Həyat təminatı, enerji, radiasiya və elmi nəticələr üzrə simulyasiya hesabatı'
              : 'Simulated life support, energy, radiation, and science outcomes'}
          </p>

          {/* Commander Input Field */}
          <div className="my-5 inline-flex items-center justify-center gap-2 border-b-2 border-[#c0e6aa]/70 pb-1 print:border-black">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 print:text-black">
              {commander}
            </span>
            <input
              type="text"
              value={commanderName}
              onChange={(e) => {
                setCommanderName(e.target.value);
                setCopyStatus('ready');
              }}
              className="bg-transparent text-center font-serif text-lg font-bold text-amber-200 outline-none print:text-black"
              aria-label={commander}
              placeholder={crewName}
            />
          </div>

          {/* Large Outcome Ribbon */}
          <div
            className={`my-4 inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 font-mono text-sm font-bold uppercase tracking-wider ${
              isSuccess
                ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 print:border-black print:bg-white print:text-black'
                : isAbort
                  ? 'border-rose-400/50 bg-rose-500/15 text-rose-200 print:border-black print:bg-white print:text-black'
                  : 'border-amber-400/50 bg-amber-500/15 text-amber-200 print:border-black print:bg-white print:text-black'
            }`}
          >
            <Award size={18} />
            <span>
              {t(`outcome.${run.outcome}`)} · {t('score')} {score}
            </span>
          </div>

          {/* 4 Final Telemetry Gauges Matrix */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 my-4">
            <div className="rounded-lg border border-amber-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('power')}
              </span>
              <p className="mt-0.5 text-lg font-bold font-mono text-amber-300 print:text-black">
                {fmt(run.final.powerKwh)} {t('unitKwh')}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('lifeSupport')}
              </span>
              <p className="mt-0.5 text-lg font-bold font-mono text-emerald-300 print:text-black">
                {fmt(run.final.lifeSupportPct)} %
              </p>
            </div>
            <div className="rounded-lg border border-rose-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('radiation')}
              </span>
              <p className="mt-0.5 text-lg font-bold font-mono text-rose-300 print:text-black">
                {fmt(run.final.radiationMsv)} {t('unitMsv')}
              </p>
            </div>
            <div className="rounded-lg border border-purple-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('science')}
              </span>
              <p className="mt-0.5 text-lg font-bold font-mono text-purple-300 print:text-black">
                {fmt(run.final.sciencePoints)} {t('unitPts')}
              </p>
            </div>
          </div>

          {/* 6-Phase Decision Audit Table */}
          <div className="mt-5 overflow-x-auto text-left">
            <table className="w-full text-left font-mono text-[10px] text-slate-300 print:text-black">
              <thead>
                <tr className="border-b border-white/15 pb-1 uppercase text-[#c0e6aa] print:border-black print:bg-white print:text-black">
                  <th className="py-1 px-1">{t('step')}</th>
                  <th className="py-1 px-2">{az ? 'Mərhələ' : 'Phase'}</th>
                  <th className="py-1 px-2">{az ? 'Seçim' : 'Choice'}</th>
                  <th className="py-1 px-2 text-right">{t('power')}</th>
                  <th className="py-1 px-2 text-right">{t('lifeSupport')}</th>
                  <th className="py-1 px-2 text-right">{t('radiation')}</th>
                  <th className="py-1 px-2 text-right">{t('science')}</th>
                </tr>
              </thead>
              <tbody>
                {run.steps.map((s) => {
                  const d = MISSION_DECISIONS[s.step - 1];
                  return (
                    <tr key={s.step} className="border-b border-white/5 py-1 print:border-gray-300">
                      <td className="py-1.5 px-1 font-bold">D{s.step}</td>
                      <td className="py-1.5 px-2">{tr(d.title)}</td>
                      <td className="py-1.5 px-2 text-amber-200 print:text-black">
                        [{CHOICE_LETTERS[s.choiceIndex]}] {tr(d.choices[s.choiceIndex].label)}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(s.after.powerKwh)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(s.after.lifeSupportPct)}%</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(s.after.radiationMsv)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">+{fmt(s.after.sciencePoints)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-white/15 pt-3 font-mono text-[9px] text-slate-400 print:border-black print:text-gray-700">
            <span>{az ? 'Təlim simulyasiyası · NASA və NOAA mənbələri' : 'Educational simulation · NASA and NOAA references'}</span>
            <span>OUTPOST REPLAY · SPACE APPS 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
