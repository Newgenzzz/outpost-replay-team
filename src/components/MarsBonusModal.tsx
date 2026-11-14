import { useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Clock,
  FlaskConical,
  Radio,
  RotateCcw,
  Sparkles,
  SunDim,
  Wind,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  MARS_DECISIONS,
  MARS_START,
  runMarsSimulation,
} from '../engine/marsMission';
import type { TrainingMode } from '../types';
import { playSfx } from '../utils/soundEffects';

interface MarsBonusModalProps {
  trainingMode: TrainingMode;
  choices: number[];
  onChangeChoices: (choices: number[]) => void;
  onCompleteSuccess: () => void;
  onClose: () => void;
}

export function MarsBonusModal({
  trainingMode,
  choices,
  onChangeChoices: setChoices,
  onCompleteSuccess,
  onClose,
}: MarsBonusModalProps) {
  const { lang, tr } = useI18n();
  const az = lang === 'az';
  const [pingState, setPingState] = useState<'idle' | 'transmitting' | 'delayed'>('idle');

  const partial = runMarsSimulation(choices);
  const currentSolIdx = choices.length;
  const isFinished = choices.length >= MARS_DECISIONS.length || partial.outcome === 'abort';
  const decision = !isFinished ? MARS_DECISIONS[currentSolIdx] : null;

  const chooseOption = (idx: number) => {
    playSfx('confirm');
    const next = [...choices, idx];
    setChoices(next);
    setPingState('idle');
    const res = runMarsSimulation(next);
    if (next.length >= MARS_DECISIONS.length && res.outcome === 'success') {
      onCompleteSuccess();
    }
  };

  const pingHouston = () => {
    playSfx('radio');
    setPingState('transmitting');
    setTimeout(() => {
      setPingState('delayed');
    }, 900);
  };

  const resetMars = () => {
    playSfx('click');
    setChoices([]);
    setPingState('idle');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#090404]/85 p-3 sm:p-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={az ? 'Missiya 2: Mars Yezero Toz Fırtınası' : 'Mission 2: Mars Jezero Dust Storm'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[93dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-orange-400/55 bg-gradient-to-b from-[#23110d] via-[#1a0e0d] to-[#111722] p-5 sm:p-6 text-slate-100 shadow-2xl scrollbar-thin">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-orange-300/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-orange-400/50 bg-orange-500/20 text-orange-300">
              <Wind size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-400/40 bg-orange-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-orange-200">
                  {az ? 'MARS BONUS MİSSİYASI · ARTEMİS → MARS' : 'MARS TRANSFER MODULE · ARTEMIS → JEZERO'}
                </span>
                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] text-amber-200">
                  14m {az ? 'İşıq Gecikməsi' : 'One-Way Radio Delay'}
                </span>
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
                {az
                  ? 'Missiya 2: Yezero Qlobal Toz Fırtınası (3 Sol)'
                  : 'Mission 2: Jezero Global Dust Storm (3 Sols)'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label={az ? 'Mars bonus missiyasını bağla' : 'Close Mars Bonus Mission'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Jezero Crater Dust Storm Visual Panorama + 3-Sol Rewind Stepper */}
        <div className="mt-3.5 overflow-hidden rounded-xl border border-orange-300/25 bg-[#160a07]">
          <svg viewBox="0 0 760 110" className="h-24 sm:h-28 w-full object-cover" aria-hidden="true">
            <defs>
              <linearGradient id="mars-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={decision?.opticalDepthTau && decision.opticalDepthTau > 3.5 ? '#3b150c' : '#572213'} />
                <stop offset="65%" stopColor="#8c3b1e" />
                <stop offset="100%" stopColor="#451a0d" />
              </linearGradient>
              <radialGradient id="mars-sun" cx="0.24" cy="0.38" r="0.32">
                <stop offset="0%" stopColor="#fed7aa" stopOpacity={decision ? Math.max(0.22, (100 - decision.solarAttenuationPct) / 100) : 0.65} />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="760" height="110" fill="url(#mars-sky)" />
            {/* Attenuated Martian Sun */}
            <circle cx="182" cy="42" r="56" fill="url(#mars-sun)" />
            <circle
              cx="182"
              cy="42"
              r="11"
              fill="#ffedd5"
              opacity={decision ? Math.max(0.25, (100 - decision.solarAttenuationPct) / 100) : 0.75}
            />
            {/* Dust Storm Wind Streaks */}
            <line x1="40" y1="28" x2="290" y2="34" stroke="#fdba74" strokeWidth="1" opacity="0.22" strokeDasharray="18 10" />
            <line x1="210" y1="54" x2="540" y2="62" stroke="#fdba74" strokeWidth="1.2" opacity="0.26" strokeDasharray="24 12" />
            <line x1="390" y1="24" x2="710" y2="32" stroke="#fdba74" strokeWidth="1" opacity="0.2" strokeDasharray="16 8" />
            {/* Jezero Delta Rim Silhouette */}
            <path
              d="M0 84 L110 68 L220 75 L340 60 L470 74 L610 64 L760 72 L760 110 L0 110 Z"
              fill="#36150b"
            />
            {/* Mars Habitat Dome, Solar Array & MOXIE Unit */}
            <g transform="translate(495 72)">
              <path d="M-26 14 A26 22 0 0 1 26 14 Z" fill="#cbd5e1" stroke="#f97316" strokeWidth="1.5" />
              <rect x="-10" y="4" width="20" height="6" rx="2" fill="#38bdf8" opacity="0.85" />
              {/* Dust-coated Solar Wing */}
              <line x1="-44" y1="14" x2="-44" y2="-8" stroke="#fde047" strokeWidth="2" />
              <rect x="-60" y="-8" width="32" height="8" rx="1" fill="#0284c7" stroke="#fb923c" strokeWidth="1" />
              {/* MOXIE O2 Tower */}
              <rect x="36" y="-4" width="14" height="18" rx="2" fill="#fb923c" />
              <circle cx="43" cy="-9" r="3.5" fill="#22d3ee" />
            </g>
            {/* Earth-Mars 252M km DSN Radio Wave */}
            <text x="16" y="20" fill="#fed7aa" fontSize="9.5" fontFamily="monospace">
              {decision
                ? `SOL ${decision.sol} · τ=${decision.opticalDepthTau.toFixed(1)} · SUN ${100 - decision.solarAttenuationPct}%`
                : 'SOL 1–3 COMPLETE · JEZERO DELTA'}
            </text>
          </svg>

          {/* Interactive 3-Sol Stepper (Click any earlier Sol to rewind!) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-orange-300/20 bg-black/45 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              {MARS_DECISIONS.map((d, idx) => {
                const chosen = choices[idx];
                const isCurrent = idx === currentSolIdx && !isFinished;
                const canRewind = idx < choices.length;
                return (
                  <button
                    key={d.sol}
                    type="button"
                    disabled={!canRewind}
                    onClick={() => {
                      playSfx('click');
                      setChoices(choices.slice(0, idx));
                      setPingState('idle');
                    }}
                    title={
                      canRewind
                        ? az
                          ? `Sol ${d.sol} qərarını dəyişmək üçün geri sar`
                          : `Click to rewind to Sol ${d.sol}`
                        : `Sol ${d.sol}`
                    }
                    className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                      isCurrent
                        ? 'border-orange-300 bg-orange-500/30 text-white'
                        : canRewind
                          ? 'border-emerald-400/45 bg-emerald-950/45 text-emerald-200 hover:bg-emerald-900/60'
                          : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    Sol {d.sol}
                    {chosen !== undefined ? ` · ${String.fromCharCode(65 + chosen)}` : ''}
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-[10px] text-orange-200/80">
              {choices.length > 0
                ? az
                  ? 'Əvvəlki Sol-a klikləyərək qərarı dəyişə bilərsiniz'
                  : 'Click a completed Sol pill to rewind & test another option'
                : az
                  ? '3 Sol sağqalma ardıcıllığı'
                  : '3-Sol autonomous survival sequence'}
            </span>
          </div>
        </div>

        {/* Live Telemetry Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-orange-300/20 bg-black/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-orange-200/80">
              <BatteryCharging size={14} className="text-amber-300" />
              <span>{az ? 'Batareya Ehtiyatı' : 'Battery Bus'}</span>
            </div>
            <p className="mt-0.5 font-mono text-lg font-bold text-white">
              {partial.powerKwh.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ {MARS_START.powerKwh} kWh</span>
            </p>
          </div>
          <div className="rounded-xl border border-orange-300/20 bg-black/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-orange-200/80">
              <Sparkles size={14} className="text-cyan-300" />
              <span>{az ? 'Nəfəs O₂ (MOXIE)' : 'Cabin O₂ (MOXIE)'}</span>
            </div>
            <p className="mt-0.5 font-mono text-lg font-bold text-white">
              {partial.oxygenKg.toFixed(2)} <span className="text-xs font-normal text-slate-400">kg</span>
            </p>
          </div>
          <div className="rounded-xl border border-orange-300/20 bg-black/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-orange-200/80">
              <SunDim size={14} className="text-orange-300" />
              <span>{az ? 'Toz Qalınlığı (Tau)' : 'Dust Opacity (τ)'}</span>
            </div>
            <p className="mt-0.5 font-mono text-lg font-bold text-orange-200">
              {decision ? `τ = ${decision.opticalDepthTau.toFixed(1)} (−${decision.solarAttenuationPct}%)` : 'τ = 0.8'}
            </p>
          </div>
          <div className="rounded-xl border border-orange-300/20 bg-black/30 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-orange-200/80">
              <FlaskConical size={14} className="text-emerald-300" />
              <span>{az ? 'Mars Elmi' : 'Mars Science'}</span>
            </div>
            <p className="mt-0.5 font-mono text-lg font-bold text-emerald-300">
              {partial.sciencePoints} <span className="text-xs font-normal text-slate-400">pts</span>
            </p>
          </div>
        </div>

        {/* Moon vs Mars Physics Bridge Note */}
        <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-100">
          <strong>{az ? 'Ay → Mars Fərqi:' : 'Moon → Mars Physics Shift:'}</strong>{' '}
          {az
            ? 'Ayda 1,3 saniyəlik rabitə gecikməsi və krater kölgələri var idi; Marsda isə qlobal toz fırtınaları günəşi 82% udur, gecələr −68 °C olur və Hyustonla 28 dəqiqəlik gediş-gəliş gecikməsi ekipajı tam müstəqil qərar verməyə məcbur edir!'
            : 'On the Moon, signals take 1.3 seconds and ridges cast sharp shadows. On Mars, global dust storms swallow 82% of sunlight, −68 °C winds chill the hab, and a 28-minute round-trip light delay means Houston cannot rescue you in real time!'}
        </div>

        {/* Active Sol Decision OR Final Debrief */}
        {!isFinished && decision ? (
          <div className="mt-4 space-y-3.5">
            <div className="rounded-xl border border-orange-300/30 bg-[#2a1510]/90 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-orange-100">
                  {tr(decision.title)}
                </h3>
                <span className="font-mono text-xs text-orange-200/90">
                  {az ? `Gecə temperaturu: ${decision.ambientNightTempC} °C` : `Night temp: ${decision.ambientNightTempC} °C`}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {tr(decision.context)}
              </p>

              {/* 14-Minute Light-Time Delay Simulator */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-200/20 bg-black/35 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-orange-100">
                  <Clock size={14} className="shrink-0 text-amber-300" />
                  {pingState === 'idle' && (
                    <span>
                      {az
                        ? 'Hyustondan məsləhət istəmək 28 dəqiqə çəkir (14 dəq gediş + 14 dəq qayıdış).'
                        : 'Asking Mission Control in Houston takes 28 min round-trip at light speed.'}
                    </span>
                  )}
                  {pingState === 'transmitting' && (
                    <span className="font-mono text-amber-200 animate-pulse">
                      {az ? '📡 DSN Dalğası Marsdan Yerə uçur (252 milyon km)...' : '📡 Deep Space Network signal crossing 252M km at light speed...'}
                    </span>
                  )}
                  {pingState === 'delayed' && (
                    <span className="text-amber-200">{tr(decision.earthRadioDelayedMsg)}</span>
                  )}
                </div>
                {pingState === 'idle' && (
                  <button
                    type="button"
                    onClick={pingHouston}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-400/25"
                  >
                    <Radio size={13} />
                    {az ? 'Hyustona Sorğu Göndər (+28 dəq)' : 'Ping Houston (+28m Delay)'}
                  </button>
                )}
              </div>

              <p className="mt-2 font-mono text-[11px] text-orange-200/70">
                NASA Ref: {decision.nasaCitation}
              </p>
            </div>

            {/* Choices */}
            <div className="grid gap-2.5">
              {decision.choices.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => chooseOption(idx)}
                  className="group rounded-xl border border-orange-200/25 bg-[#1b1418]/90 p-3.5 text-left transition hover:border-orange-300 hover:bg-[#281b1e]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-sm sm:text-base text-white group-hover:text-orange-200">
                      <span className="mr-2 rounded bg-orange-500/25 px-1.5 py-0.5 font-mono text-xs text-orange-200">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {tr(c.label)}
                    </span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      <span className={c.powerDeltaKwh >= 0 ? 'text-emerald-300' : 'text-amber-300'}>
                        {c.powerDeltaKwh >= 0 ? '+' : ''}{c.powerDeltaKwh} kWh
                      </span>
                      <span className={c.oxygenDeltaKg >= 0 ? 'text-cyan-300' : 'text-slate-300'}>
                        · {c.oxygenDeltaKg >= 0 ? '+' : ''}{c.oxygenDeltaKg} kg O₂
                      </span>
                      <span className="text-emerald-300">· +{c.scienceDelta} Sci</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    {trainingMode === 'cadet' ? tr(c.cadetSummary) : tr(c.engineerNote)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Final Mars Debrief + Instant Replay */
          <div className="mt-4 space-y-4 rounded-xl border border-orange-300/35 bg-black/35 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {partial.outcome === 'success' ? (
                  <CheckCircle2 size={26} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={26} className="text-amber-400" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {partial.outcome === 'success'
                      ? az ? 'Yezero Fırtınasından Sağ Çıxdınız!' : 'Jezero Storm Survived — Autonomous Success!'
                      : partial.outcome === 'degraded'
                      ? az ? 'Missiya Çətinliklə Tamamlandı (Aşağı Ehtiyat)' : 'Degraded Survival — Reserves Critically Low'
                      : az ? 'Fövqəladə Dayandırma (Mars Baza Qəzası)' : 'Emergency Mars Abort'}
                  </h3>
                  {partial.abortReason && (
                    <p className="text-xs text-rose-300 mt-0.5">{tr(partial.abortReason)}</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-orange-300/40 bg-orange-500/15 px-3.5 py-1.5 font-mono text-sm font-bold text-orange-100">
                {az ? 'Yekun Xal' : 'Autonomy Score'}: {partial.score} / 100
              </div>
            </div>

            <div className="space-y-2">
              {partial.steps.map((s) => (
                <div
                  key={s.sol}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                >
                  <span className="font-mono font-semibold text-orange-200">
                    Sol {s.sol} · {s.choiceId}
                  </span>
                  <span className="font-mono text-slate-200">
                    {s.powerAfterKwh} kWh · {s.oxygenAfterKg} kg O₂ · {s.scienceAfter} pts
                  </span>
                  {s.bonusTriggered && (
                    <span className="w-full text-[11px] text-emerald-300">
                      ★ {tr(s.bonusTriggered)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetMars}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-300/40 bg-orange-400/15 px-4 py-2 text-xs font-bold text-orange-100 hover:bg-orange-400/25"
              >
                <RotateCcw size={14} />
                {az ? 'Mars Ssenarisini Yenidən Oyna' : 'Replay Mars Storm'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
              >
                {az ? 'Şeklton Ay Bazasına Qayıt' : 'Return to Shackleton Outpost'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
