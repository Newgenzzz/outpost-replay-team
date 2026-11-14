import { useState } from 'react';
import { Award, Copy, Download, Link2, Orbit, Printer, X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { MISSION_DECISIONS } from '../data/missionDecisions';
import { RADIATION_LIMITS } from '../data/nasaTelemetry';
import { CHOICE_LETTERS, fmt } from './metricMeta';
import type { SimulationResult } from '../engine/simulation';

interface FlightCertificateModalProps {
  run: SimulationResult;
  runLabel: string;
  defaultCallsign?: string;
  shareUrl?: string;
  onClose: () => void;
}

export function FlightCertificateModal({
  run,
  runLabel,
  defaultCallsign = '',
  shareUrl,
  onClose,
}: FlightCertificateModalProps) {
  const { lang, t, tr } = useI18n();
  const az = lang === 'az';
  const title = az ? 'Outpost Replay Uçuş və Missiya Sertifikatı' : 'Outpost Replay Mission Certificate';
  const commander = az ? 'Komandir' : 'Commander';
  const location = az ? 'Şeklton kənarı yaxınlığında uydurma təlim bazası' : 'Fictional outpost near Shackleton’s rim';
  const elapsed = az ? 'Keçən missiya saatları' : 'Mission hours elapsed';
  const crewName = az ? 'Gənc Astronavt' : 'Junior Astronaut';
  const [commanderName, setCommanderName] = useState(defaultCallsign);
  const [copyStatus, setCopyStatus] = useState<'ready' | 'copied' | 'linkCopied' | 'failed'>('ready');
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);

  const isSuccess = run.outcome === 'success';
  const isAbort = run.outcome === 'abort';
  const score = run.score ?? '—';
  const resolvedName = commanderName.trim() || crewName;

  function handlePrint() {
    window.print();
  }

  async function copyToClipboard(text: string, success: 'copied' | 'linkCopied') {
    setManualCopyText(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(success);
    } catch {
      setCopyStatus('failed');
      setManualCopyText(text);
    }
  }

  async function handleCopySummary() {
    const warning = az ? 'təlim xəbərdarlığı' : 'training warning';
    const text = `${title} · ${runLabel}
${commander}: ${resolvedName}
${location} · ${elapsed}: ${run.elapsedHours} / 216h
${t('result')}: ${t(`outcome.${run.outcome}`)} (${t('score')}: ${score})
${t('power')}: ${fmt(run.final.powerKwh)} ${t('unitKwh')}
${t('lifeSupport')}: ${fmt(run.final.lifeSupportPct)}%
${t('radiation')}: ${fmt(run.final.radiationMsv)} mSv (${warning}: ${RADIATION_LIMITS.missionWarningMsv} mSv)
${t('science')}: ${fmt(run.final.sciencePoints)} ${t('unitPts')}${shareUrl ? `\nReplay URL: ${shareUrl}` : ''}`;

    await copyToClipboard(text, 'copied');
  }

  async function handleCopyShareLink() {
    if (!shareUrl) return;
    await copyToClipboard(shareUrl, 'linkCopied');
  }

  function handleDownloadPngBadge() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Space gradient background
    const bg = ctx.createLinearGradient(0, 0, 1200, 680);
    bg.addColorStop(0, '#07131e');
    bg.addColorStop(0.55, '#102432');
    bg.addColorStop(1, '#091620');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 680);

    // Outer Gold/Mint Frame
    ctx.strokeStyle = isSuccess ? '#c0e6aa' : isAbort ? '#fda4af' : '#fde047';
    ctx.lineWidth = 5;
    ctx.strokeRect(28, 28, 1144, 624);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(42, 42, 1116, 596);

    // Mission Patch Emblem Circle (Left)
    ctx.save();
    ctx.translate(185, 225);
    ctx.beginPath();
    ctx.arc(0, 0, 98, 0, Math.PI * 2);
    ctx.fillStyle = '#07111a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#c0e6aa';
    ctx.stroke();

    // Grazing Sun & Shackleton Rim inside Mission Patch
    ctx.beginPath();
    ctx.arc(-28, 14, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-88, 38);
    ctx.lineTo(-35, 18);
    ctx.lineTo(15, 28);
    ctx.lineTo(52, 8);
    ctx.lineTo(88, 34);
    ctx.lineTo(88, 68);
    ctx.lineTo(-88, 68);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();

    // 10m Mast & Sightline Rays in patch
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-28, 14);
    ctx.lineTo(52, -26);
    ctx.stroke();
    ctx.strokeStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(-28, 14);
    ctx.lineTo(15, 26);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(52, 8);
    ctx.lineTo(52, -32);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(40, -28, 10, 20);
    ctx.fillRect(54, -28, 10, 20);
    ctx.restore();

    // Title & Commander Callsign
    ctx.fillStyle = '#c0e6aa';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('OUTPOST REPLAY · FICTIONAL SHACKLETON RIM EXPEDITION', 330, 105);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(title, 330, 158);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 30px serif';
    ctx.fillText(`${commander}: ${resolvedName}`, 330, 212);

    ctx.fillStyle = isSuccess ? '#86efac' : isAbort ? '#fda4af' : '#fde047';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(
      `${t(`outcome.${run.outcome}`).toUpperCase()}  ·  SCORE: ${score}  ·  ${run.elapsedHours} / 216 HOURS (${runLabel})`,
      330,
      262,
    );

    // 4 Metric Cards
    const cards = [
      { label: t('power'), val: `${fmt(run.final.powerKwh)} kWh`, col: '#fde047' },
      { label: t('lifeSupport'), val: `${fmt(run.final.lifeSupportPct)}%`, col: '#6ee7b7' },
      { label: t('radiation'), val: `${fmt(run.final.radiationMsv)} mSv`, col: '#fda4af' },
      { label: t('science'), val: `${fmt(run.final.sciencePoints)} pts`, col: '#d8b4fe' },
    ];
    cards.forEach((c, idx) => {
      const cx = 75 + idx * 270;
      const cy = 365;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(cx, cy, 248, 115);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.strokeRect(cx, cy, 248, 115);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(c.label.toUpperCase(), cx + 20, cy + 36);
      ctx.fillStyle = c.col;
      ctx.font = 'bold 32px monospace';
      ctx.fillText(c.val, cx + 20, cy + 84);
    });

    // Choice Trail & Crew Stores Footer
    const routeText = run.steps
      .map((s) => `D${s.step}:${CHOICE_LETTERS[s.choiceIndex]}`)
      .join('  →  ');
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '18px monospace';
    ctx.fillText(`Causal Decision Route:  ${routeText || 'In Progress'}`, 75, 535);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText(
      `Crew Reserves:  O₂ ${fmt(run.resources.oxygenKg)} kg  ·  H₂O ${fmt(run.resources.waterKg)} kg  ·  Food ${fmt(run.resources.foodKg)} kg`,
      75,
      568,
    );

    ctx.fillStyle = '#64748b';
    ctx.font = '14px monospace';
    ctx.fillText(
      'Educational assumptions with NASA LRO, LCROSS, BVAD and NOAA references · Space Apps 2026',
      75,
      605,
    );

    const link = document.createElement('a');
    link.download = `outpost-replay-${resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
      <div className="relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#c0e6aa]/60 bg-[#0e1d26] p-5 sm:p-6 shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none scrollbar-thin">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 print:hidden">
          <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#c0e6aa]">
            <Award size={15} />
            <span>{title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {shareUrl && (
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/15 px-2.5 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
              >
                <Link2 size={13} />
                {copyStatus === 'linkCopied'
                  ? az ? 'Link Kopyalandı!' : 'Replay Link Copied!'
                  : az ? 'Təkrar Linki' : 'Share Replay URL'}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
            >
              <Copy size={13} />
              {copyStatus === 'copied' ? (az ? 'Kopyalandı' : 'Copied') : az ? 'Mətni Kopyala' : 'Copy Text'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPngBadge}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/50 bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-400/30"
            >
              <Download size={13} />
              {az ? 'PNG Emblemi Yüklə' : 'Download PNG Patch'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#c0e6aa] px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-[#d5f5c2]"
            >
              <Printer size={13} />
              {az ? 'Çap / PDF' : 'Print / PDF'}
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

        {/* Printable Certificate Body */}
        <div className="rounded-xl border border-[#c0e6aa]/40 bg-[#12242f]/90 p-5 sm:p-6 text-center print:border-black print:bg-white print:p-2">
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
              <span>{elapsed} · {run.elapsedHours} / 216h</span>
            </div>
          </div>

          {copyStatus === 'failed' && manualCopyText !== null && (
            <div className="mb-4 rounded-lg border border-amber-300/40 bg-amber-400/10 p-3 text-xs text-amber-100 print:hidden">
              <p role="alert">
                {az
                  ? 'Avtomatik kopyalama mümkün olmadı. Aşağıdakı mətni seçib klaviatura və ya cihaz menyusu ilə kopyalayın.'
                  : 'Automatic copying was blocked. Select the text below and copy it using your keyboard or device menu.'}
              </p>
              <label className="mt-2 block font-semibold">
                {az ? 'Əl ilə kopyalanacaq mətn' : 'Text to copy manually'}
                <textarea
                  readOnly
                  tabIndex={0}
                  rows={3}
                  value={manualCopyText}
                  onFocus={event => event.currentTarget.select()}
                  className="mt-1 block w-full rounded border border-amber-200/30 bg-slate-950 p-2 font-mono text-xs font-normal text-slate-100 focus-visible:outline-2 focus-visible:outline-amber-300"
                />
              </label>
            </div>
          )}

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white print:text-black">
            {title}
          </h1>
          <p className="mt-1 text-xs text-slate-300 print:text-gray-700">
            {az
              ? 'Həyat təminatı, enerji, radiasiya və elmi nəticələr üzrə deterministik simulyasiya hesabatı'
              : 'Deterministic simulation record across power, life support, radiation & science'}
          </p>

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
                setManualCopyText(null);
              }}
              className="bg-transparent text-center font-serif text-lg font-bold text-amber-200 outline-none print:text-black"
              aria-label={commander}
              placeholder={crewName}
            />
          </div>

          <div
            className={`my-3 inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 font-mono text-sm font-bold uppercase tracking-wider ${
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

          <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-amber-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('power')}
              </span>
              <p className="mt-0.5 font-mono text-lg font-bold text-amber-300 print:text-black">
                {fmt(run.final.powerKwh)} {t('unitKwh')}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('lifeSupport')}
              </span>
              <p className="mt-0.5 font-mono text-lg font-bold text-emerald-300 print:text-black">
                {fmt(run.final.lifeSupportPct)} %
              </p>
            </div>
            <div className="rounded-lg border border-rose-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('radiation')}
              </span>
              <p className="mt-0.5 font-mono text-lg font-bold text-rose-300 print:text-black">
                {fmt(run.final.radiationMsv)} {t('unitMsv')}
              </p>
            </div>
            <div className="rounded-lg border border-purple-400/25 bg-black/20 p-2.5 print:border-black print:bg-white">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 print:text-black">
                {t('science')}
              </span>
              <p className="mt-0.5 font-mono text-lg font-bold text-purple-300 print:text-black">
                {fmt(run.final.sciencePoints)} {t('unitPts')}
              </p>
            </div>
          </div>

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
            <span>
              {az
                ? 'Təlim fərziyyələri · NASA LRO, LCROSS, BVAD və NOAA mənbələri'
                : 'Educational assumptions · NASA LRO, LCROSS, BVAD & NOAA references'}
            </span>
            <span>OUTPOST REPLAY · SPACE APPS 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
