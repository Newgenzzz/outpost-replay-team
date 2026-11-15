import { GraduationCap, Orbit, Play, Rocket, Sparkles, Volume2, Wind } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { TrainingMode } from '../types';
import { soundFX } from '../utils/soundEffects';

interface MissionLaunchScreenProps {
  callsign: string;
  onChangeCallsign: (name: string) => void;
  trainingMode: TrainingMode;
  hasMissionProgress: boolean;
  hasMarsProgress: boolean;
  missionSaveStatus: 'saved' | 'unavailable' | null;
  onOpenAudioSettings: () => void;
  onChangeTrainingMode: (mode: TrainingMode) => void;
  onLaunchMission: () => void;
  onStartJudgeTour: () => void;
  onOpenMarsBonus: () => void;
  onOpen3DNasaDeck: () => void;
}

export function MissionLaunchScreen({
  callsign,
  onChangeCallsign,
  trainingMode,
  hasMissionProgress,
  hasMarsProgress,
  missionSaveStatus,
  onOpenAudioSettings,
  onChangeTrainingMode,
  onLaunchMission,
  onStartJudgeTour,
  onOpenMarsBonus,
  onOpen3DNasaDeck,
}: MissionLaunchScreenProps) {
  const { lang, setLang } = useI18n();
  const az = lang === 'az';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030913]/92 p-3 sm:p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={az ? 'Outpost Replay Missiya Başlanğıcı' : 'Outpost Replay Mission Launch'}
    >
      <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-[#c0e6aa]/35 bg-gradient-to-b from-[#0b1926] via-[#0f202c] to-[#0a151e] shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
        {/* Atmospheric Lunar Horizon SVG Banner */}
        <div className="relative h-36 sm:h-44 w-full overflow-hidden border-b border-white/10 bg-[#030811]">
          <svg
            viewBox="0 0 900 220"
            className="h-full w-full object-cover"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="launch-sun" cx="0.28" cy="0.62" r="0.45">
                <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
                <stop offset="25%" stopColor="#fde047" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="launch-rim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="45%" stopColor="#475569" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            {/* Starfield */}
            {[
              [60, 32, 1.4], [140, 58, 1.1], [210, 24, 1.7], [330, 38, 1.2],
              [420, 20, 1.5], [510, 48, 1.1], [610, 26, 1.6], [760, 42, 1.3],
              [830, 22, 1.5], [690, 65, 1.0], [95, 82, 1.2], [470, 72, 1.3],
            ].map(([cx, cy, r], idx) => (
              <circle key={idx} cx={cx} cy={cy} r={r} fill="#e2e8f0" opacity="0.8" />
            ))}
            {/* Crescent Earth */}
            <g transform="translate(715 54)">
              <circle r="26" fill="#0ea5e9" opacity="0.18" />
              <circle r="18" fill="#082f49" />
              <path d="M-4 -17 A18 18 0 0 1 -4 17 A13 17 0 0 0 -4 -17Z" fill="#38bdf8" />
              <path d="M3 -11 A14 14 0 0 1 7 10 A10 13 0 0 0 3 -11Z" fill="#f0f9ff" opacity="0.8" />
            </g>
            {/* 1.5 deg Grazing South Pole Sun */}
            <ellipse cx="252" cy="136" rx="210" ry="74" fill="url(#launch-sun)" />
            <circle cx="252" cy="136" r="14" fill="#fffbeb" />
            {/* Shackleton Crater Rim Silhouette */}
            <path
              d="M0 168 L95 142 L175 150 L252 138 L340 148 L435 126 L545 144 L650 132 L765 149 L900 136 L900 220 L0 220 Z"
              fill="url(#launch-rim)"
            />
            <path
              d="M0 168 L95 142 L175 150 L252 138 L340 148 L435 126 L545 144 L650 132 L765 149 L900 136"
              fill="none"
              stroke="#fef08a"
              strokeWidth="2"
              opacity="0.7"
            />
            {/* Outpost 10m Vertical Solar Mast vs 2m Blocked Mast Silhouette */}
            <line
              x1="252"
              y1="136"
              x2="435"
              y2="96"
              stroke="#fde047"
              strokeWidth="1.6"
              strokeDasharray="4 3"
              opacity="0.75"
            />
            <line
              x1="252"
              y1="138"
              x2="340"
              y2="146"
              stroke="#fb7185"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              opacity="0.8"
            />
            <g transform="translate(435 126)">
              <line x1="0" y1="0" x2="0" y2="-38" stroke="#fde047" strokeWidth="2.5" />
              <rect x="-11" y="-34" width="9" height="22" fill="#38bdf8" opacity="0.9" />
              <rect x="2" y="-34" width="9" height="22" fill="#38bdf8" opacity="0.9" />
              <text x="-18" y="-43" fill="#fef08a" fontSize="9" fontFamily="monospace" fontWeight="bold">
                10 m
              </text>
            </g>
            <g transform="translate(362 146)">
              <line x1="0" y1="0" x2="0" y2="-11" stroke="#fb7185" strokeWidth="2" />
              <rect x="-7" y="-11" width="14" height="5" fill="#fb7185" opacity="0.85" />
              <text x="-14" y="-15" fill="#fda4af" fontSize="8.5" fontFamily="monospace">
                2 m
              </text>
            </g>
          </svg>

          {/* Top Bar Inside Hero */}
          <div className="absolute inset-x-4 top-3.5 flex items-center justify-between">
            <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[#c0e6aa]/40 bg-slate-950/75 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#c0e6aa] backdrop-blur-md">
              <Orbit size={13} />
              {az ? 'AYIN CƏNUB QÜTBÜ · UYDURMA ŞEKLTON KƏNARI BAZASI' : 'LUNAR SOUTH POLE · FICTIONAL SHACKLETON RIM OUTPOST'}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={onOpenAudioSettings}
                aria-label={az ? 'Səs ayarları' : 'Audio settings'}
                className="rounded-lg border border-white/25 bg-slate-950/80 p-1.5 text-white hover:bg-slate-900">
                <Volume2 size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.play('uiClick');
                  setLang(az ? 'en' : 'az');
                }}
                className="rounded-lg border border-white/25 bg-slate-950/80 px-3 py-1 font-mono text-xs font-bold text-white hover:bg-slate-900"
              >
                {az ? 'AZ · EN' : 'EN · AZ'}
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              OUTPOST <span className="font-light text-[#c0e6aa]">REPLAY</span>
            </h1>
            <span className="font-mono text-xs text-sky-300">
              {az ? 'Gənc Astronavt Missiya Trenajoru' : 'Junior Astronaut Mission Trainer · NASA-informed'}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            {az
              ? 'İki astronavtı doqquz günlük Ay missiyasında qoruyun. Enerjini ekipaj üçün saxlamaq, yoxsa elmi kəşflərə sərf etmək? Proqnoz verin, qərarı sınayın, sonra bir seçimi geri sarıb nəticələri müqayisə edin.'
              : 'Keep two astronauts safe through a nine-day lunar mission. Save energy for the crew, or spend it on science? Make a prediction, try a decision, then rewind one choice and compare the results.'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            {az
              ? 'Şeklton yaxınlığında uydurma təlim bazası. Missiyanın şəraiti və doza hesabları təlim modelləridir, bu bazada aparılmış NASA ölçmələri deyil.'
              : 'Fictional training near Shackleton. Mission conditions and dose estimates are educational models, not NASA measurements at this outpost.'}
            {' '}<a href="./credits.html" target="_blank" rel="noreferrer" className="text-sky-200 underline underline-offset-2">
              {az ? 'Kreditlər və AI istifadəsi (EN)' : 'Credits & AI assistance'}
            </a>
          </p>

          {/* Callsign + Dual-Layer Mode Picker */}
          <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
            <label className="flex flex-col justify-between rounded-xl border border-white/15 bg-slate-950/55 p-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                {az ? 'Komandir Çağırış Adı' : 'Commander Callsign'}
              </span>
              <input
                type="text"
                maxLength={24}
                value={callsign}
                onChange={(e) => onChangeCallsign(e.target.value)}
                placeholder={az ? 'məs. Kənan / Leyla' : 'e.g. Cadet Nova'}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-amber-200 outline-none focus:border-[#c0e6aa]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={az ? 'Təlim rejimi' : 'Training mode'}>
              <button
                type="button"
                aria-pressed={trainingMode === 'cadet'}
                onClick={() => {
                  soundFX.play('uiClick');
                  onChangeTrainingMode('cadet');
                }}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  trainingMode === 'cadet'
                    ? 'border-[#c0e6aa] bg-[#1e3a31] text-white shadow-[0_0_20px_rgba(192,230,170,0.16)]'
                    : 'border-white/10 bg-slate-950/45 text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#c0e6aa]">
                  <Rocket size={13} />
                  {az ? 'Gənc Kadet (7–12 yaş)' : 'Junior Cadet (Ages 7–12)'}
                </span>
                <p className="mt-1 text-xs leading-snug text-slate-200">
                  {az
                    ? 'Aydın hekayə dili, vizual ipucları və interaktiv stansiya mini-oyunları.'
                    : 'Clear story language, visual survival badges & hands-on station mini-games.'}
                </p>
              </button>

              <button
                type="button"
                aria-pressed={trainingMode === 'engineer'}
                onClick={() => {
                  soundFX.play('uiClick');
                  onChangeTrainingMode('engineer');
                }}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  trainingMode === 'engineer'
                    ? 'border-sky-300 bg-sky-950/55 text-white shadow-[0_0_20px_rgba(56,189,248,0.16)]'
                    : 'border-white/10 bg-slate-950/45 text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  <GraduationCap size={13} />
                  {az ? 'Uçuş Mühəndisi (Münsif)' : 'Flight Engineer (Judge/SME)'}
                </span>
                <p className="mt-1 text-xs leading-snug text-slate-200">
                  {az
                    ? 'Tam kVt·saat / kq / mSv təlim hesablamaları, NASA mənbələri və model fərziyyələri.'
                    : 'Full kWh / kg / mSv training forecasts, NASA references and model assumptions.'}
                </p>
              </button>
            </div>
          </div>

          {/* 3-Pillar Learning Loop Strip */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-2.5 text-[11px] text-slate-200">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 font-mono text-[10px] font-bold text-emerald-300">
                1
              </span>
              <span>
                {az ? 'Nə dəyişəcək? Proqnoz verin' : 'Predict what will change'}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 font-mono text-[10px] font-bold text-cyan-300">
                2
              </span>
              <span>
                {az ? 'Bir qərarı sınayın' : 'Try an engineering decision'}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 font-mono text-[10px] font-bold text-amber-300">
                3
              </span>
              <span>
                {az ? 'Geri sarıb fayda və əvəzini müqayisə edin' : 'Rewind and compare the benefit and cost'}
              </span>
            </div>
          </div>

          {/* Primary Launch Actions */}
          <p className="mt-4 text-xs font-semibold text-[#c0e6aa]">
            {hasMissionProgress
              ? az ? 'Missiyanız davam edir. Davam edin və ya yeni bələdçili sınağa başlayın.' : 'Your mission is in progress. Resume it, or start a new guided experiment.'
              : az ? 'İlk dəfə oynayırsınız? Bir qərarı birlikdə yoxlayaq.' : 'New here? Start with one guided experiment.'}
          </p>
          {missionSaveStatus && (
            <p className={`mt-1 text-xs ${missionSaveStatus === 'saved' ? 'text-slate-300' : 'text-amber-200'}`} role="status">
              {missionSaveStatus === 'saved'
                ? az ? 'İrəliləyiş bu brauzerdə saxlanır. Yenilədikdən sonra davam edə bilərsiniz.' : 'Progress is saved in this browser. You can resume after refreshing.'
                : az ? 'Bu brauzer irəliləyişi saxlaya bilmir. Bu vərəqi açıq saxlayın.' : 'This browser cannot save progress. Keep this tab open.'}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onStartJudgeTour();
              }}
              className="inline-flex flex-1 min-w-[220px] items-center justify-center gap-2 rounded-xl bg-[#c0e6aa] px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-[#d5f5c3]"
            >
              <Sparkles size={17} />
              {az ? 'Bələdçili sınağa başla' : 'Start guided experiment'}
            </button>

            <button
              type="button"
              onClick={() => {
                onLaunchMission();
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-slate-950/40 px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              <Play size={15} />
              {hasMissionProgress
                ? az ? 'Missiyanı davam etdir' : 'Resume current mission'
                : az ? 'Tam 9 günlük missiyanı araşdır' : 'Explore the full 9-day mission'}
            </button>
          </div>

          {/* Secondary Quick Explorers: 2.5D Mountain Horizon Sunlight Lab + Bonus Mars Mission */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
            <button
              type="button"
              onClick={onOpen3DNasaDeck}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 font-semibold text-cyan-200 hover:bg-cyan-500/25"
            >
              🛰️{' '}
              {az
                ? 'Elm: Günəş Təcrübəsi (2m/10m), NASA Məlumatları və İstəyə Bağlı 3D →'
                : 'Science: Sunlight Experiment (2m vs 10m), NASA Data & Optional 3D →'}
            </button>

            <button
              type="button"
              onClick={onOpenMarsBonus}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-400/40 bg-orange-500/15 px-3 py-1.5 font-semibold text-orange-200 hover:bg-orange-500/25"
            >
              <Wind size={13} />
              {hasMarsProgress
                ? az ? 'Mars bonus missiyasını davam etdir' : 'Resume Mars bonus mission'
                : az ? 'Bonus Missiya 2: Mars Toz Fırtınası (14 dəq gecikmə)' : 'Bonus Mission 2: Mars Dust Storm (14m Delay)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
