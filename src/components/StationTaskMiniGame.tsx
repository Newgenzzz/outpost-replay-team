import { useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Radio, ShieldCheck, Snowflake, Sun, Zap } from 'lucide-react';
import type { Lang } from '../types';
import { soundFX } from '../utils/soundEffects';

interface Props {
  step: number;
  lang: Lang;
  completed: boolean;
  minedCount: number;
  onComplete: (step: number) => void;
}

const WIRE_COLORS = [
  { id: 'solar', color: '#facc15', en: 'SOLAR BUS', az: 'GÜNƏŞ ŞİNİ' },
  { id: 'h2', color: '#38bdf8', en: 'H₂ CRYO', az: 'H₂ KRİO' },
  { id: 'o2', color: '#4ade80', en: 'O₂ FEED', az: 'O₂ AXINI' },
  { id: 'heat', color: '#fb7185', en: '90K HEATER', az: '90K QIZDIRICI' },
] as const;

const RIGHT_WIRE_ORDER = [2, 0, 3, 1];

export default function StationTaskMiniGame({
  step,
  lang,
  completed,
  minedCount,
  onComplete,
}: Props) {
  // D1: Solar Azimuth Dial (target 128°)
  const [azimuth, setAzimuth] = useState(74);
  // D2: 3 Habitat Manifold Valves
  const [valves, setValves] = useState<[boolean, boolean, boolean]>([false, false, false]);
  // D3: Classic Among-Us 4-Wire HVDC Patch Panel
  const [selectedLeftWire, setSelectedLeftWire] = useState<string | null>(null);
  const [connectedWires, setConnectedWires] = useState<string[]>([]);
  const [wiringMismatch, setWiringMismatch] = useState(false);
  // D4: 90 K Ice Core Laser Pulses (0..3)
  const [coreHits, setCoreHits] = useState(0);
  // D5: 4 Radiation Storm Bulkhead Clamps
  const [clamps, setClamps] = useState<[boolean, boolean, boolean, boolean]>([
    false,
    false,
    false,
    false,
  ]);
  // D6: Ka-Band Earth Dish Frequency Slider (target 68)
  const [dishFreq, setDishFreq] = useState(26);

  // Auto-credit D4 calibration if player already mined >= 1 crystal in the world with Lunar Car!
  useEffect(() => {
    if (step === 4 && minedCount > 0 && !completed) {
      onComplete(4);
    }
  }, [step, minedCount, completed, onComplete]);

  function finishTask() {
    if (!completed) {
      soundFX.play('solarLock');
      onComplete(step);
    }
  }

  return (
    <div
      className={`rounded-xl border p-3.5 transition ${
        completed
          ? 'border-emerald-400/40 bg-emerald-950/25'
          : 'border-[#c0e6aa]/30 bg-[#0d1c24]/90'
      }`}
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu size={15} className={completed ? 'text-emerald-300' : 'text-[#c0e6aa]'} />
          <span className="font-mono text-[10px] tracking-wider uppercase text-[#c0e6aa]">
            {lang === 'az'
              ? `STANSİYA TAPŞIRIĞI · D${step} KONSOLU`
              : `HANDS-ON STATION TASK · D${step} CONSOLE`}
          </span>
        </div>
        {completed ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-200">
            <CheckCircle2 size={12} />
            {lang === 'az' ? 'KALİBRLƏNDİ ✓' : 'CALIBRATED ✓'}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-amber-200/90">
            {lang === 'az'
              ? 'Könüllü təlim tapşırığı'
              : 'Optional training exercise'}
          </span>
        )}
      </div>

      {/* D1: 1.5° Polar Sun-Tracking Azimuth Dial */}
      {step === 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-300">
            <strong className="flex items-center gap-1.5 text-[#e5eae4]">
              <Sun size={14} className="text-amber-300" />
              {lang === 'az'
                ? 'Panelin təlim azimutunu tənzimləyin (hədəf: 128°)'
                : 'Align the array’s training azimuth (target: 128°)'}
            </strong>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {lang === 'az'
                ? 'Maksimum enerji axını üçün günəş dirəyini 128° üfüq bucağına sürüşdürün.'
                : 'Slide the array mast rotator until solar capture locks onto 128°.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              aria-label={lang === 'az' ? 'Panel azimutu' : 'Array azimuth'}
              disabled={completed}
              min={40}
              max={160}
              value={completed ? 128 : azimuth}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAzimuth(v);
                soundFX.play('StepNav');
                if (Math.abs(v - 128) <= 4) finishTask();
              }}
              className="h-2 w-36 accent-[#c0e6aa]"
            />
            <span className="w-16 rounded border border-white/10 bg-black/30 px-2 py-1 text-center font-mono text-xs font-bold text-amber-200">
              {completed ? '128°' : `${azimuth}°`}
            </span>
          </div>
        </div>
      )}

      {/* D2: ECLSS 3-Valve Pressure & Shield Manifold */}
      {step === 2 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-300">
            <strong className="text-[#e5eae4]">
              {lang === 'az'
                ? 'ECLSS Təzyiq Klapanlarını Aktivləşdirin (3/3)'
                : 'Pressurize Habitat ECLSS Manifold Valves (3/3)'}
            </strong>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {lang === 'az'
                ? 'Oksigen axınını, suyun təkrar emalını və şlüz kilidini aktivləşdirin.'
                : 'Enable oxygen flow, water recycling and the airlock seal.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { en: 'O₂ flow', az: 'O₂ axını' },
              { en: 'H₂O loop', az: 'H₂O dövrəsi' },
              { en: 'Airlock seal', az: 'Şlüz kilidi' },
            ].map((lbl, idx) => {
              const on = completed || valves[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={completed}
                  aria-pressed={on}
                  onClick={() => {
                    soundFX.play('uiClick');
                    const next: [boolean, boolean, boolean] = [...valves] as [
                      boolean,
                      boolean,
                      boolean,
                    ];
                    next[idx] = !next[idx];
                    setValves(next);
                    if (next.every(Boolean)) finishTask();
                  }}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition ${
                    on
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {on ? '● ' : '○ '}
                  {lbl[lang]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* D3: Classic Among-Us HVDC Conduit Wire Routing */}
      {step === 3 && (
        <div>
          <p className="mb-2 text-[11px] text-slate-300">
            <Zap size={13} className="mr-1 inline text-amber-300" />
            {lang === 'az'
              ? '72 Saatlıq Kölgə Şini: Sol terminalı seçib sağda eyni adlı terminala qoşun.'
              : '72h Shadow Bus Wires: Click a left terminal, then choose the terminal with the same name on the right.'}
          </p>
          <div className="grid grid-cols-[1fr_70px_1fr] items-center gap-2 rounded-lg border border-white/10 bg-[#08131a] p-2.5">
            <div className="flex flex-col gap-1.5">
              {WIRE_COLORS.map((w) => {
                const done = completed || connectedWires.includes(w.id);
                const active = selectedLeftWire === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={done}
                    onClick={() => {
                      soundFX.play('uiClick');
                      setSelectedLeftWire(w.id);
                      setWiringMismatch(false);
                    }}
                    className={`flex items-center justify-between rounded border px-2 py-1 font-mono text-[10px] transition ${
                      done
                        ? 'border-white/15 bg-white/10 opacity-85'
                        : active
                          ? 'border-white bg-white/15 ring-1 ring-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    style={{ color: w.color }}
                  >
                    <span>{w[lang]}</span>
                    <span>{done ? '✓' : '●'}</span>
                  </button>
                );
              })}
            </div>

            {/* SVG Wire Bridge */}
            <svg viewBox="0 0 70 108" className="h-24 w-full">
              {WIRE_COLORS.map((w, leftIdx) => {
                const isLinked = completed || connectedWires.includes(w.id);
                if (!isLinked) return null;
                const rightIdx = RIGHT_WIRE_ORDER.indexOf(leftIdx);
                const y1 = 14 + leftIdx * 26;
                const y2 = 14 + rightIdx * 26;
                return (
                  <line
                    key={w.id}
                    x1="2"
                    y1={y1}
                    x2="68"
                    y2={y2}
                    stroke={w.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            <div className="flex flex-col gap-1.5">
              {RIGHT_WIRE_ORDER.map((origIdx) => {
                const w = WIRE_COLORS[origIdx];
                const done = completed || connectedWires.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={done}
                    onClick={() => {
                      if (selectedLeftWire === w.id) {
                        const next = [...connectedWires, w.id];
                        setConnectedWires(next);
                        setSelectedLeftWire(null);
                        soundFX.play('hotspot');
                        if (next.length === WIRE_COLORS.length) finishTask();
                      } else {
                        setWiringMismatch(true);
                        soundFX.play('shadowAlert');
                        setSelectedLeftWire(null);
                      }
                    }}
                    className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] hover:bg-white/10"
                    style={{ color: w.color }}
                  >
                    <span>{done ? '✓' : '○'}</span>
                    <span>{w[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {wiringMismatch && (
            <p role="status" className="mt-2 text-xs text-rose-200">
              {lang === 'az' ? 'Terminallar uyğun gəlmir. Sol terminalı yenidən seçin.' : 'Those terminals do not match. Select a left terminal to try again.'}
            </p>
          )}
        </div>
      )}

      {/* D4: Cold-trap ice core spectrometer */}
      {step === 4 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-300">
            <strong className="flex items-center gap-1.5 text-[#e5eae4]">
              <Snowflake size={14} className="text-sky-300" />
              {lang === 'az'
                ? '90 K Su-Buz Nüvəsi Lazer Ekstraksiyası'
                : '90 K Water-Ice Core Laser Extraction'}
            </strong>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {lang === 'az'
                ? `Çöldə qazılan kristallar: ${minedCount}/5 — və ya konsoldan 3 lazer impulsu vurun.`
                : `Surface crystals mined with Car: ${minedCount}/5 — or fire 3 thermal pulses here.`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-3 w-5 rounded-sm border ${
                    completed || coreHits > i
                      ? 'border-sky-300 bg-sky-400'
                      : 'border-white/15 bg-white/5'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={completed}
              onClick={() => {
                soundFX.play('laserDrill');
                const next = coreHits + 1;
                setCoreHits(next);
                if (next >= 3) finishTask();
              }}
              className="rounded-lg border border-sky-400/50 bg-sky-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
            >
              {completed
                ? lang === 'az'
                  ? 'H₂O HAZIRDIR'
                  : 'H₂O EXTRACTED'
                : lang === 'az'
                  ? 'LAZER İMPULSU'
                  : 'PULSE LASER'}
            </button>
          </div>
        </div>
      )}

      {/* D5: Radiation Storm Bulkhead Clamps */}
      {step === 5 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-300">
            <strong className="flex items-center gap-1.5 text-[#e5eae4]">
              <ShieldCheck size={14} className="text-rose-300" />
              {lang === 'az'
                ? 'AR 13664 Fırtına Qalxanı Kilidləri (4/4)'
                : 'Engage AR 13664 Storm Bulkhead Locks (4/4)'}
            </strong>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {lang === 'az'
                ? 'Fırtına sığınacağının dörd qoruyucu kilidini bağlayın.'
                : 'Secure the four storm shelter controls before choosing a protection strategy.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { en: 'CLAMP 01', az: 'KİLİD 01' }, { en: 'CLAMP 02', az: 'KİLİD 02' },
              { en: 'WATER WALL', az: 'SU DİVARI' }, { en: 'DOSIMETER', az: 'DOZİMETR' },
            ].map((label, idx) => {
              const on = completed || clamps[idx];
              return (
                <button
                  key={label.en}
                  type="button"
                  disabled={completed}
                  aria-pressed={on}
                  onClick={() => {
                    soundFX.play('uiClick');
                    const next = [...clamps] as [boolean, boolean, boolean, boolean];
                    next[idx] = !next[idx];
                    setClamps(next);
                    if (next.every(Boolean)) finishTask();
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 font-mono text-[10px] font-semibold transition ${
                    on
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                      : 'border-rose-400/35 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                  }`}
                >
                  {on ? '🔒 ' : '🔓 '}
                  {label[lang]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* D6: Ka-Band Earth Downlink Waveform Sync */}
      {step === 6 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-300">
            <strong className="flex items-center gap-1.5 text-[#e5eae4]">
              <Radio size={14} className="text-[#c0e6aa]" />
              {lang === 'az'
                ? 'Ka-Zolaq Yer Antenasını Sinxronlaşdırın (Hədəf: 32.0 GHz)'
                : 'Sync Ka-Band Deep Space Dish to Earth (Target: 32.0 GHz)'}
            </strong>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {lang === 'az'
                ? 'Yer stansiyası ilə 100% siqnal kilidi üçün tezliyi 68-ə gətirin.'
                : 'Tune the Ka-band transponder carrier until signal lock reaches 100%.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              aria-label={lang === 'az' ? 'Antenanın siqnal tənzimləyicisi' : 'Dish signal tuning'}
              disabled={completed}
              min={10}
              max={90}
              value={completed ? 68 : dishFreq}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDishFreq(v);
                soundFX.play('StepNav');
                if (Math.abs(v - 68) <= 4) finishTask();
              }}
              className="h-2 w-36 accent-[#c0e6aa]"
            />
            <span className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-center font-mono text-xs font-bold text-[#c0e6aa]">
              {completed
                ? '100% LOCK'
                : `${Math.max(12, 100 - Math.abs(dishFreq - 68) * 2)}%`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
