import { Maximize2, Navigation, Truck, X } from 'lucide-react';
import {
  AI_CREWMATES,
  BUILDINGS,
  STATIONS,
  type LiveCrewState,
  type Point,
  type StationNode,
} from '../game/world';
import type { Lang } from '../types';

interface BaseMapProps {
  player: Point;
  car: Point;
  drone: Point;
  crew: LiveCrewState[];
  controllingRover: boolean;
  activeStep: number;
  completedCount: number;
  calibratedTasks: boolean[];
  lang: Lang;
  expanded: boolean;
  onExpandToggle: () => void;
  onNavigateStation: (station: StationNode, instant: boolean) => void;
}

const SECTOR_POLYGONS: Array<{ step: number; x: number; y: number; w: number; h: number }> = [
  { step: 1, x: 240, y: 245, w: 420, h: 240 },
  { step: 2, x: 745, y: 255, w: 395, h: 235 },
  { step: 3, x: 265, y: 655, w: 315, h: 215 },
  { step: 4, x: 1055, y: 665, w: 515, h: 325 },
  { step: 5, x: 640, y: 765, w: 315, h: 210 },
  { step: 6, x: 1200, y: 295, w: 450, h: 245 },
];

export function BaseMap(props: BaseMapProps) {
  const {
    player,
    car,
    drone,
    crew,
    controllingRover,
    activeStep,
    completedCount,
    calibratedTasks,
    lang,
    expanded,
    onExpandToggle,
    onNavigateStation,
  } = props;

  const activeSt = STATIONS[Math.min(5, Math.max(0, activeStep - 1))];
  const isCrisis = (activeStep === 3 && completedCount < 3) || (activeStep === 5 && completedCount < 5);

  const renderSchematicSvg = (interactive: boolean) => (
    <svg
      viewBox="160 160 1560 890"
      className={interactive ? 'w-full h-auto max-h-[62vh]' : 'w-full h-auto'}
      role="img"
      aria-label={lang === 'az' ? 'Şeklton Bazası Taktiki Xəritəsi' : 'Shackleton Outpost Tactical Map'}
    >
      <defs>
        <pattern id="polus-grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M100 0H0V100"
            fill="none"
            stroke="#8fb2be"
            strokeOpacity="0.09"
            strokeWidth="3"
          />
        </pattern>
      </defs>

      <rect x="160" y="160" width="1560" height="890" rx="22" fill="#0d1d27" />
      <rect x="160" y="160" width="1560" height="890" rx="22" fill="url(#polus-grid)" />

      {/* Outpost Spine & Corridors */}
      <path
        d="M425 555H1530M475 555V430M895 555V435M425 555V800M795 555V915M1055 555V645L1165 815M1290 555V455M1530 555V490"
        fill="none"
        stroke="#8aa9b0"
        strokeOpacity="0.38"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 6 Among-Us Style Named Base Rooms / Sectors */}
      {SECTOR_POLYGONS.map((sec) => {
        const st = STATIONS[sec.step - 1];
        const done = sec.step <= completedCount;
        const current = sec.step === activeStep && completedCount < 6;
        const crisisRoom =
          (sec.step === 3 && activeStep === 3 && completedCount < 3) ||
          (sec.step === 5 && activeStep === 5 && completedCount < 5);

        const fill = crisisRoom
          ? '#4c1d24'
          : done
            ? '#173831'
            : current
              ? '#243a2e'
              : '#152936';
        const stroke = crisisRoom
          ? '#fb7185'
          : done
            ? '#86efac'
            : current
              ? '#fde047'
              : '#4b6b7c';

        return (
          <g
            key={sec.step}
            className="cursor-pointer"
            onClick={() => onNavigateStation(st, interactive)}
          >
            <rect
              x={sec.x}
              y={sec.y}
              width={sec.w}
              height={sec.h}
              rx="22"
              fill={fill}
              fillOpacity="0.82"
              stroke={stroke}
              strokeWidth={current || crisisRoom ? 6 : 3.5}
            />
            {interactive && (
              <>
                <text
                  x={sec.x + 20}
                  y={sec.y + 35}
                  fill={done ? '#bbf7d0' : current ? '#fef08a' : '#cbd5e1'}
                  fontSize="21"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {`D${sec.step} · ${st.roomName[lang].toUpperCase()}`}
                </text>
                <text
                  x={sec.x + 20}
                  y={sec.y + 62}
                  fill="#94b0b8"
                  fontSize="16"
                  fontFamily="monospace"
                >
                  {done
                    ? lang === 'az'
                      ? '✓ QƏRAR TƏSDİQLƏNDİ'
                      : '✓ DECISION LOCKED'
                    : calibratedTasks[sec.step - 1]
                      ? lang === 'az'
                        ? '★ SİSTEM KALİBRLƏNDİ'
                        : '★ TASK CALIBRATED'
                      : current
                        ? lang === 'az'
                          ? '● AKTİV HƏDƏF — KLİKLƏ KEÇ'
                          : '● ACTIVE TASK — CLICK TO DEPLOY'
                        : st.sectorCode}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Building Footprints */}
      {BUILDINGS.map((b) => {
        const done = (b.stationStep ?? 99) <= completedCount;
        const current = b.stationStep === activeStep;
        return (
          <path
            key={b.id}
            d={`M${b.x - 36} ${b.y - 18}l32-16 44 15-32 17Z`}
            fill={done ? '#a7e0b5' : current ? '#ebd08f' : '#567587'}
            stroke="#d2e2dc"
            strokeOpacity="0.28"
            strokeWidth="3"
          />
        );
      })}

      {/* Active Station Pulse Ring */}
      {completedCount < 6 && (
        <circle
          cx={activeSt.x}
          cy={activeSt.y}
          r="52"
          fill="#fde04718"
          stroke={isCrisis ? '#fb7185' : '#fde047'}
          strokeWidth="6"
          strokeDasharray="12 10"
        />
      )}

      {/*SPARK-9 AI Recon Drone */}
      <circle cx={drone.x} cy={drone.y} r="11" fill="#67e8f9" stroke="#0c2231" strokeWidth="4" />

      {/* Lunar Car Icon (when unoccupied) */}
      {!controllingRover && (
        <g transform={`translate(${car.x} ${car.y})`}>
          <rect
            x="-18"
            y="-12"
            width="36"
            height="24"
            rx="6"
            fill="#38bdf8"
            stroke="#0f2536"
            strokeWidth="4"
          />
        </g>
      )}

      {/* Autonomous AI Crewmates (Eng. Leyla & Dr. Rashad) */}
      {crew.map((c) => {
        const meta = AI_CREWMATES.find((m) => m.id === c.id)!;
        return (
          <g key={c.id} transform={`translate(${c.x} ${c.y})`}>
            <circle r="22" fill={meta.colorHex} opacity="0.2" />
            <circle r="13" fill={meta.colorHex} stroke="#0f2330" strokeWidth="5" />
            {interactive && (
              <text
                y="-20"
                textAnchor="middle"
                fill={meta.colorHex}
                fontSize="19"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                {meta.name[lang]}
              </text>
            )}
          </g>
        );
      })}

      {/* YOU (Commander / Occupied Lunar Car) */}
      <g transform={`translate(${player.x} ${player.y})`}>
        <circle r="32" fill="#c0e6aa" opacity="0.24" />
        <circle r="16" fill="#ecfccb" stroke="#112822" strokeWidth="6" />
        {interactive && (
          <text
            y="-24"
            textAnchor="middle"
            fill="#ecfccb"
            fontSize="21"
            fontWeight="800"
            fontFamily="monospace"
          >
            {lang === 'az' ? 'SİZ' : 'YOU'}
          </text>
        )}
      </g>
    </svg>
  );

  return (
    <>
      {/* Top-Right Compact Live Outpost Radar */}
      <div className="base-map-radar">
        <button
          type="button"
          onClick={onExpandToggle}
          className="base-map-header"
          title={lang === 'az' ? 'Tam Taktiki Xəritəni Aç [M]' : 'Open Full Tactical Map [M]'}
        >
          <span>SHACKLETON · RADAR</span>
          <span className="inline-flex items-center gap-1 text-[#c0e6aa]">
            <kbd className="rounded bg-white/10 px-1 py-0.5 text-[9px]">M</kbd>
            <Maximize2 size={11} />
          </span>
        </button>
        <div className="p-1.5">{renderSchematicSvg(false)}</div>
        <div className="base-map-legend">
          <span className="inline-flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full bg-[#ecfccb]" />
            {lang === 'az' ? 'Siz' : 'You'}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full bg-[#2dd4bf]" />
            Leyla
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full bg-[#eab308]" />
            Rashad
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-sm bg-[#38bdf8]" />
            {lang === 'az' ? 'Maşın' : 'Car'}
          </span>
        </div>
      </div>

      {/* Full-Screen Among-Us Polus Style Tactical Outpost Map Modal [M] */}
      {expanded && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-[#041018]/82 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'az' ? 'Baza Taktiki Xəritəsi' : 'Tactical Outpost Map'}
          onClick={(e) => {
            if (e.target === e.currentTarget) onExpandToggle();
          }}
        >
          <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#b6cec3]/30 bg-[#12222b] p-4 shadow-2xl scrollbar-thin">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-[#c0e6aa] uppercase">
                  {lang === 'az'
                    ? 'TAKTİKİ BAZA RADARI · 6 SEKTOR'
                    : 'TACTICAL BASE SCHEMATIC · 6 SECTORS'}
                </span>
                <h2 className="text-xl font-semibold text-[#e5eae4]">
                  {lang === 'az'
                    ? 'Şeklton Kənarı Bazası — Sürətli Keçid üçün Otağa Klikləyin'
                    : 'Shackleton Rim Outpost — Click Any Sector to Fast-Deploy'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onExpandToggle}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                <X size={15} />
                {lang === 'az' ? 'Bağla [M]' : 'Close [M]'}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1821] p-2">
              {renderSchematicSvg(true)}
            </div>

            {/* Quick Sector Jump Strip */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {STATIONS.map((st) => {
                const done = st.decisionId <= completedCount;
                const current = st.decisionId === activeStep;
                return (
                  <button
                    key={st.decisionId}
                    type="button"
                    onClick={() => onNavigateStation(st, true)}
                    className={`flex flex-col items-start rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                      current
                        ? 'border-[#c0e6aa]/70 bg-[#22382f] text-[#e5eae4]'
                        : done
                          ? 'border-emerald-400/35 bg-emerald-950/30 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between font-mono text-[10px] text-[#9eb8b5]">
                      <span>{`D${st.decisionId}`}</span>
                      <Navigation size={11} />
                    </span>
                    <strong className="mt-0.5 truncate w-full font-medium">
                      {st.roomName[lang]}
                    </strong>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9ab0b4]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-[#ecfccb]" />
                  {lang === 'az' ? 'Siz (Komandir)' : 'You (Commander)'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-[#2dd4bf]" />
                  {lang === 'az' ? 'Müh. Leyla (Enerji AI)' : 'Eng. Leyla (Power AI)'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
                  {lang === 'az' ? 'Dr. Rəşad (Elm AI)' : 'Dr. Rashad (Science AI)'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck size={13} className="text-sky-400" />
                  {lang === 'az' ? 'Ay Maşını [V]' : 'Lunar Car [V]'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                {lang === 'az' ? 'Şeklton kənarı · Təlim bazası' : 'Shackleton rim · Training site'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
