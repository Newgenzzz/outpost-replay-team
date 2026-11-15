import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Compass,
  Cpu,
  Crosshair,
  Eye,
  Footprints,
  Pause,
  Play,
  Radiation,
  RotateCcw,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Sun,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { SimulationResult } from '../engine/simulation';
import type { Bilingual } from '../types';
import { soundFX } from '../utils/soundEffects';
import type { HotspotId } from './LunarOutpost2D';

/* ============================================================================
 * 24x24 ISOMETRIC SHACKLETON CRATER RIM TILEMAP & A* PATHFINDING ENGINE
 * ========================================================================== */

export const GRID_SIZE = 24;
const TILE_W = 54;
const TILE_H = 27;

export type TileKind =
  | 'regolith'       // Walkable sunlit lunar soil
  | 'ridge_peak'     // Elevated Shackleton Rim crest (Solar Peak zone)
  | 'pathway'        // Walkable metal outpost catwalk grating
  | 'hab_floor'      // Pressurized Habitat Dome interior tile
  | 'bunker_floor'   // Radiation Storm Shelter bunker tile
  | 'reactor_pad'    // H2/O2 Fuel-Cell & ISRU pad
  | 'comms_pad'      // Ascent & High-Gain Downlink pad
  | 'crater_slope'   // Ramp descending into Shackleton crater
  | 'cold_trap_ice'  // Permanently shadowed 90 K water-ice crater floor
  | 'cliff_wall';    // Impassable steep crater wall boulder

export interface StationMeta {
  decisionId: 1 | 2 | 3 | 4 | 5 | 6;
  gx: number;
  gy: number;
  hotspotId: HotspotId;
  code: string;
  name: Bilingual;
  actionHint: Bilingual;
  color: string;
}

export const MISSION_STATIONS: StationMeta[] = [
  {
    decisionId: 1,
    gx: 5,
    gy: 5,
    hotspotId: 'solar',
    code: 'D1 · SOLAR PEAK',
    name: { en: 'Shackleton Peak Solar Array Zone', az: 'Şeklton Zirvəsi Günəş Paneli Zonası' },
    actionHint: {
      en: 'Walk to Peak (5,5) & press [E] to deploy Solar Architecture',
      az: 'Günəş Arxitekturasını qurmaq üçün Zirvəyə (5,5) gedin və [E] basın',
    },
    color: '#f59e0b',
  },
  {
    decisionId: 2,
    gx: 10,
    gy: 10,
    hotspotId: 'habitat',
    code: 'D2 · HABITAT BAY',
    name: { en: 'Pressurized Habitat & ECLSS Dome', az: 'Hermetik Yaşayış Günbəzi və ECLSS' },
    actionHint: {
      en: 'Walk to Habitat Bay (10,10) & press [E] to configure Berm / ISRU / Geophysics',
      az: 'Sədd / ISRU / Geofizika üçün Yaşayış Moduluna (10,10) gedin və [E] basın',
    },
    color: '#10b981',
  },
  {
    decisionId: 3,
    gx: 7,
    gy: 14,
    hotspotId: 'solar',
    code: 'D3 · REACTOR PAD',
    name: { en: 'H₂/O₂ Fuel-Cell Reactor & Shadow Control', az: 'H₂/O₂ Yanacaq Elementi Reaktoru və Kölgə Nəzarəti' },
    actionHint: {
      en: '72h LRO Shadow Alert! Move to Reactor Pad (7,14) & press [E]',
      az: '72s LRO Kölgə Xəbərdarlığı! Reaktor Meydançasına (7,14) gedin və [E] basın',
    },
    color: '#22d3ee',
  },
  {
    decisionId: 4,
    gx: 18,
    gy: 18,
    hotspotId: 'rover',
    code: 'D4 · COLD-TRAP ICE',
    name: { en: 'Shackleton 90 K Cold-Trap Ice Floor', az: 'Şeklton 90 K Soyuq Tələ Buz Dibi' },
    actionHint: {
      en: 'Drive Rover / Walk to Cold-Trap Crater (18,18) & press [E] to drill H₂O Ice',
      az: 'H₂O buzu qazmaq üçün Roveri Soyuq Tələyə (18,18) sürün və [E] basın',
    },
    color: '#38bdf8',
  },
  {
    decisionId: 5,
    gx: 13,
    gy: 7,
    hotspotId: 'shelter',
    code: 'D5 · STORM BUNKER',
    name: { en: 'Water-Wall & Regolith Radiation Shelter', az: 'Su Divarı və Reqolit Radiasiya Sığınacağı' },
    actionHint: {
      en: 'Training particle storm incoming! Rush to Storm Bunker (13,7) & press [E]',
      az: 'Təlim zərrəcik fırtınası yaxınlaşır! Fırtına Sığınacağına (13,7) tələsin və [E] basın',
    },
    color: '#f43f5e',
  },
  {
    decisionId: 6,
    gx: 15,
    gy: 12,
    hotspotId: 'habitat',
    code: 'D6 · COMMS & ASCENT',
    name: { en: 'High-Gain Earth Downlink & Ascent Pad', az: 'Yüksək Güclü Yer Rabitəsi və Qalxış Meydançası' },
    actionHint: {
      en: 'Walk to Comms & Ascent Pad (15,12) & press [E] for Mission Close-Out',
      az: 'Missiyanı yekunlaşdırmaq üçün Rabitə Meydançasına (15,12) gedin və [E] basın',
    },
    color: '#a855f7',
  },
];

interface TileCell {
  gx: number;
  gy: number;
  kind: TileKind;
  elevation: number; // 0 = rim bench, +1/+2 = solar peak, -1/-2 = cold-trap crater floor
  walkable: boolean;
  craterDecor?: number;
}

/** Deterministic 24x24 Lunar South Pole Outpost Map Generator */
function buildOutpostGrid(): TileCell[][] {
  const grid: TileCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let kind: TileKind = 'regolith';
      let elevation = 0;
      let walkable = true;

      // 1. Northwest Elevated Solar Peak (x: 2..7, y: 2..7)
      const distPeak = Math.hypot(x - 5, y - 5);
      if (distPeak <= 3.2) {
        kind = 'ridge_peak';
        elevation = distPeak <= 1.8 ? 2 : 1;
      }

      // 2. Southeast Permanently Shadowed Shackleton Cold-Trap Crater (x >= 14, y >= 14)
      const distCrater = Math.hypot(x - 19, y - 19);
      if (distCrater <= 6.2) {
        if (distCrater <= 4.6) {
          kind = 'cold_trap_ice';
          elevation = -2;
        } else {
          // Steep crater rim wall — only walkable along the rover access ramp (x: 13..16, y: 13..16)
          if (x >= 12 && x <= 16 && y >= 12 && y <= 16 && Math.abs(x - y) <= 1) {
            kind = 'crater_slope';
            elevation = -1;
            walkable = true;
          } else {
            kind = 'cliff_wall';
            elevation = 1;
            walkable = false;
          }
        }
      }

      // 3. Pressurized Habitat Dome Footprint (center: 10, 10, radius ~2.2)
      const distHab = Math.hypot(x - 10, y - 10);
      if (distHab <= 2.1) {
        kind = 'hab_floor';
        elevation = 0;
        walkable = true;
      }

      // 4. Radiation Storm Shelter Bunker (x: 12..14, y: 6..8)
      if (x >= 12 && x <= 14 && y >= 6 && y <= 8) {
        kind = 'bunker_floor';
        elevation = 0;
        walkable = true;
      }

      // 5. H2/O2 Fuel-Cell Reactor Pad (x: 6..8, y: 13..15)
      if (x >= 6 && x <= 8 && y >= 13 && y <= 15) {
        kind = 'reactor_pad';
        elevation = 0;
        walkable = true;
      }

      // 6. High-Gain Comms & Ascent Pad (x: 14..16, y: 11..13)
      if (x >= 14 && x <= 16 && y >= 11 && y <= 13 && kind !== 'cliff_wall') {
        kind = 'comms_pad';
        elevation = 0;
        walkable = true;
      }

      // 7. Walkable Metal Outpost Pathways connecting all 6 stations
      const onPath =
        (x === y && x >= 5 && x <= 18) || // Main diagonal spine from Solar Peak (5,5) -> Hab (10,10) -> Rover Ramp -> Ice Crater (18,18)
        (y === 10 && x >= 7 && x <= 15) || // East-West spine
        (x === 7 && y >= 6 && y <= 14) || // North-South link to Reactor Pad (7,14)
        (x === 13 && y >= 7 && y <= 12) || // Link to Storm Bunker (13,7)
        (y === 12 && x >= 10 && x <= 15); // Link to Comms Pad (15,12)

      if (onPath && kind === 'regolith') {
        kind = 'pathway';
        walkable = true;
      }

      // Deterministic small lunar crater decoration hash
      const hash = (x * 37 + y * 91) % 19;
      const craterDecor = kind === 'regolith' && hash < 3 ? hash + 1 : undefined;

      row.push({ gx: x, gy: y, kind, elevation, walkable, craterDecor });
    }
    grid.push(row);
  }
  return grid;
}

const OUTPOST_GRID = buildOutpostGrid();

/* ----------------------------------------------------------------------------
 * Fast 8-Directional A* Pathfinder on the 24x24 Tile Grid
 * -------------------------------------------------------------------------- */
export interface GridPoint {
  gx: number;
  gy: number;
}

function findPathAStar(start: GridPoint, goal: GridPoint): { path: GridPoint[]; ms: number } {
  const t0 = performance.now();
  const sx = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(start.gx)));
  const sy = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(start.gy)));
  let tx = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(goal.gx)));
  let ty = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(goal.gy)));

  // If target tile is unwalkable cliff, snap to nearest walkable neighbor
  if (!OUTPOST_GRID[ty][tx].walkable) {
    let bestD = 999;
    for (let ny = 0; ny < GRID_SIZE; ny++) {
      for (let nx = 0; nx < GRID_SIZE; nx++) {
        if (OUTPOST_GRID[ny][nx].walkable) {
          const d = Math.hypot(nx - tx, ny - ty);
          if (d < bestD) {
            bestD = d;
            tx = nx;
            ty = ny;
          }
        }
      }
    }
  }

  if (sx === tx && sy === ty) {
    return { path: [], ms: Math.round((performance.now() - t0) * 100) / 100 };
  }

  const key = (x: number, y: number) => y * GRID_SIZE + x;
  const open: number[] = [key(sx, sy)];
  const cameFrom = new Map<number, number>();
  const gScore = new Map<number, number>([[key(sx, sy), 0]]);
  const fScore = new Map<number, number>([[key(sx, sy), Math.hypot(tx - sx, ty - sy)]]);
  const closed = new Set<number>();

  const dirs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, 1.414],
    [-1, -1, 1.414],
    [1, -1, 1.414],
    [-1, 1, 1.414],
  ];

  while (open.length > 0) {
    open.sort((a, b) => (fScore.get(a) ?? 999) - (fScore.get(b) ?? 999));
    const current = open.shift()!;
    if (current === key(tx, ty)) {
      const path: GridPoint[] = [];
      let cur: number | undefined = current;
      while (cur !== undefined && cur !== key(sx, sy)) {
        const cy = Math.floor(cur / GRID_SIZE);
        const cx = cur % GRID_SIZE;
        path.unshift({ gx: cx, gy: cy });
        cur = cameFrom.get(cur);
      }
      return { path, ms: Math.round((performance.now() - t0) * 100) / 100 };
    }

    closed.add(current);
    const cy = Math.floor(current / GRID_SIZE);
    const cx = current % GRID_SIZE;

    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;
      const cell = OUTPOST_GRID[ny][nx];
      if (!cell.walkable) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;

      // Slight preference for metal pathways
      const terrainWeight = cell.kind === 'pathway' ? 0.85 : 1.0;
      const tentativeG = (gScore.get(current) ?? 0) + cost * terrainWeight;

      if (tentativeG < (gScore.get(nk) ?? 9999)) {
        cameFrom.set(nk, current);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + Math.hypot(tx - nx, ty - ny));
        if (!open.includes(nk)) open.push(nk);
      }
    }
  }

  return { path: [{ gx: tx, gy: ty }], ms: Math.round((performance.now() - t0) * 100) / 100 };
}

/* ----------------------------------------------------------------------------
 * Isometric Projection Helpers (Grid <-> Screen Pixels)
 * -------------------------------------------------------------------------- */
function gridToScreen(
  gx: number,
  gy: number,
  elevation: number,
  originX: number,
  originY: number,
): { sx: number; sy: number } {
  const sx = originX + (gx - gy) * (TILE_W / 2);
  const sy = originY + (gx + gy) * (TILE_H / 2) - elevation * 9;
  return { sx, sy };
}

function screenToGrid(sx: number, sy: number, originX: number, originY: number): GridPoint {
  const dx = sx - originX;
  const dy = sy - originY;
  const gx = (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2;
  const gy = (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2;
  return {
    gx: Math.max(0, Math.min(GRID_SIZE - 1, Math.round(gx))),
    gy: Math.max(0, Math.min(GRID_SIZE - 1, Math.round(gy))),
  };
}

/* ----------------------------------------------------------------------------
 * Playable RPG Unit State (Astronauts, Ice Rover, and Run A Ghost Replay)
 * -------------------------------------------------------------------------- */
export interface RpgUnit {
  id: 'astro1' | 'astro2' | 'rover';
  name: Bilingual;
  role: Bilingual;
  gx: number;
  gy: number;
  path: GridPoint[];
  speed: number; // tiles per second
  color: string;
  selected: boolean;
  facing: { dx: number; dy: number };
  walkPhase: number;
  targetStationDecision?: number;
}

interface LunarRpgCanvasProps {
  runA: SimulationResult;
  runB: SimulationResult | null;
  viewStep: number;
  onSelectStep: (step: number) => void;
  onOpenDecisionModal: (decisionId: number) => void;
  onSelectHotspot: (id: HotspotId) => void;
}

export default function LunarRpgCanvas({
  runA,
  runB,
  viewStep,
  onSelectStep,
  onOpenDecisionModal,
  onSelectHotspot,
}: LunarRpgCanvasProps) {
  const { lang, t, tr } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine HUD states
  const [paused, setPaused] = useState(false);
  const [showEngineHud, setShowEngineHud] = useState(true);
  const [splitCompareCanvas, setSplitCompareCanvas] = useState(false);
  const [fps, setFps] = useState(60);
  const [lastPathMs, setLastPathMs] = useState(0.12);
  const [hoverTile, setHoverTile] = useState<GridPoint>({ gx: 10, gy: 10 });
  const [selectedUnitId, setSelectedUnitId] = useState<'astro1' | 'astro2' | 'rover'>('astro1');
  const [nearbyStation, setNearbyStation] = useState<StationMeta | null>(MISSION_STATIONS[0]);

  // Mutable simulation state inside 60 FPS loop
  const unitsRef = useRef<RpgUnit[]>([
    {
      id: 'astro1',
      name: { en: 'Cmdr. Azer', az: 'Komandir Azər' },
      role: { en: 'Mission Commander', az: 'Missiya Komandiri' },
      gx: 8,
      gy: 8,
      path: [],
      speed: 4.4,
      color: '#38bdf8',
      selected: true,
      facing: { dx: 1, dy: 0 },
      walkPhase: 0,
    },
    {
      id: 'astro2',
      name: { en: 'Eng. Leyla', az: 'Mühəndis Leyla' },
      role: { en: 'Systems & ECLSS Specialist', az: 'Sistem və ECLSS Mütəxəssisi' },
      gx: 10,
      gy: 10,
      path: [],
      speed: 4.2,
      color: '#34d399',
      selected: false,
      facing: { dx: 0, dy: 1 },
      walkPhase: 1.5,
    },
    {
      id: 'rover',
      name: { en: 'VIPER-Jr Ice Rover', az: 'VIPER-Jr Buz Roveri' },
      role: { en: 'Cold-Trap Drill Unit', az: 'Soyuq Tələ Qazma Roveri' },
      gx: 14,
      gy: 14,
      path: [],
      speed: 5.5,
      color: '#f59e0b',
      selected: false,
      facing: { dx: 1, dy: 1 },
      walkPhase: 0,
    },
  ]);

  const keysPressedRef = useRef<Set<string>>(new Set());
  const dragBoxRef = useRef<{
    active: boolean;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    moved: boolean;
  }>({ active: false, x0: 0, y0: 0, x1: 0, y1: 0, moved: false });

  // Auto-move the appropriate unit toward the active viewStep's Mission Station when viewStep changes
  useEffect(() => {
    const station = MISSION_STATIONS[viewStep - 1];
    if (!station) return;
    const units = unitsRef.current;
    // Decision 4 uses the Ice Rover; other decisions use Commander Azer
    const activeId = viewStep === 4 ? 'rover' : 'astro1';
    setSelectedUnitId(activeId);
    units.forEach((u) => {
      u.selected = u.id === activeId;
    });
    const unit = units.find((u) => u.id === activeId)!;
    const dist = Math.hypot(unit.gx - station.gx, unit.gy - station.gy);
    if (dist > 1.5) {
      const { path, ms } = findPathAStar({ gx: unit.gx, gy: unit.gy }, { gx: station.gx, gy: station.gy });
      unit.path = path;
      unit.targetStationDecision = undefined; // walk there visually without forcing modal until user clicks/presses E
      setLastPathMs(ms);
    }
  }, [viewStep]);

  // Select a specific unit from HUD or keyboard (1, 2, 3)
  const selectUnit = useCallback((id: 'astro1' | 'astro2' | 'rover') => {
    soundFX.play('StepNav');
    setSelectedUnitId(id);
    unitsRef.current.forEach((u) => {
      u.selected = u.id === id;
    });
  }, []);

  // Command selected unit(s) to walk to a mission station and open its RPG Choice Modal
  const walkToStationAndInteract = useCallback(
    (station: StationMeta, openImmediately = false) => {
      soundFX.play('choice');
      onSelectStep(station.decisionId);
      const units = unitsRef.current;
      const targetUnit =
        station.decisionId === 4
          ? units.find((u) => u.id === 'rover')!
          : units.find((u) => u.selected) ?? units[0];

      units.forEach((u) => {
        u.selected = u.id === targetUnit.id;
      });
      setSelectedUnitId(targetUnit.id);

      const dist = Math.hypot(targetUnit.gx - station.gx, targetUnit.gy - station.gy);
      if (openImmediately || dist <= 2.2) {
        targetUnit.gx = station.gx;
        targetUnit.gy = station.gy;
        targetUnit.path = [];
        onOpenDecisionModal(station.decisionId);
      } else {
        const { path, ms } = findPathAStar(
          { gx: targetUnit.gx, gy: targetUnit.gy },
          { gx: station.gx, gy: station.gy },
        );
        targetUnit.path = path;
        targetUnit.targetStationDecision = station.decisionId;
        setLastPathMs(ms);
      }
    },
    [onOpenDecisionModal, onSelectStep],
  );

  // Keyboard Listeners (WASD / Arrows, Space Tactical Pause, E Interact, 1-3 Unit Select)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();

      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        keysPressedRef.current.add(k);
        // Cancel A* path on manual WASD override
        unitsRef.current.forEach((u) => {
          if (u.selected) {
            u.path = [];
            u.targetStationDecision = undefined;
          }
        });
      } else if (e.code === 'Space') {
        e.preventDefault();
        soundFX.play('StepNav');
        setPaused((p) => !p);
      } else if (k === 'e' || k === 'enter') {
        e.preventDefault();
        const st = nearbyStation ?? MISSION_STATIONS[viewStep - 1];
        if (st) {
          soundFX.play('choice');
          onSelectStep(st.decisionId);
          onOpenDecisionModal(st.decisionId);
        }
      } else if (k === '1') {
        selectUnit('astro1');
      } else if (k === '2') {
        selectUnit('astro2');
      } else if (k === '3') {
        selectUnit('rover');
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      keysPressedRef.current.delete(e.key.toLowerCase());
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [nearbyStation, onOpenDecisionModal, onSelectStep, selectUnit, viewStep]);

  /* --------------------------------------------------------------------------
   * Main 60 FPS HTML5 Canvas Game Loop (Update + Isometric Renderer)
   * ------------------------------------------------------------------------ */
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const renderScene = (
      ctx: CanvasRenderingContext2D,
      viewportX: number,
      viewportW: number,
      viewportH: number,
      sim: SimulationResult,
      label: string,
      isBranch: boolean,
      nowMs: number,
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(viewportX, 0, viewportW, viewportH);
      ctx.clip();

      const originX = viewportX + viewportW * 0.5;
      const originY = Math.max(76, viewportH * 0.14);

      const stepIdx = Math.min(viewStep, Math.max(1, sim.choices.length));
      const stateAtStep = sim.history[stepIdx] ?? sim.history[sim.history.length - 1];
      const stepRecord = sim.steps[stepIdx - 1];

      const d1 = sim.choices[0]; // 0 = 10m mast, 1 = deck panels, 2 = battery-only
      const d2 = viewStep >= 2 ? sim.choices[1] : undefined; // 0 = regolith berm, 1 = ISRU O2, 2 = geophysics
      const d3 = viewStep >= 3 ? sim.choices[2] : undefined; // 0 = survival, 1 = fuel cells, 2 = cold-trap drill
      const d4 = viewStep >= 4 ? sim.choices[3] : undefined; // 0 = crewed rover, 1 = service, 2 = teleop rover
      const d5 = viewStep >= 5 ? sim.choices[4] : undefined; // 0 = EVA in storm, 1 = hab, 2 = storm shelter

      const inShadow = viewStep === 3;
      const inStorm = viewStep === 5;
      const isBlackout =
        stateAtStep.powerKwh <= 0 ||
        stateAtStep.lifeSupportPct <= 0 ||
        (stepRecord?.rulesTriggered.includes('blackout') ?? false) ||
        (sim.outcome === 'abort' && stepIdx === sim.choices.length);
      const isBrownout =
        !isBlackout &&
        (stateAtStep.powerKwh < 20 || (stepRecord?.rulesTriggered.includes('brownout') ?? false));

      // 1. Deep Lunar Sky & Grazing Sun Background
      const skyGrad = ctx.createLinearGradient(viewportX, 0, viewportX, viewportH);
      if (inStorm) {
        skyGrad.addColorStop(0, '#230612');
        skyGrad.addColorStop(0.5, '#120817');
        skyGrad.addColorStop(1, '#050814');
      } else if (inShadow) {
        skyGrad.addColorStop(0, '#01030a');
        skyGrad.addColorStop(0.6, '#040917');
        skyGrad.addColorStop(1, '#020617');
      } else {
        skyGrad.addColorStop(0, '#03081c');
        skyGrad.addColorStop(0.6, '#081229');
        skyGrad.addColorStop(1, '#030712');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(viewportX, 0, viewportW, viewportH);

      // Stars
      for (let i = 0; i < 42; i++) {
        const sx = viewportX + ((i * 197 + 43) % Math.max(100, Math.floor(viewportW)));
        const sy = (i * 89 + 17) % Math.max(80, Math.floor(viewportH * 0.45));
        const twinkle = 0.35 + 0.55 * Math.abs(Math.sin(nowMs * 0.0015 + i));
        ctx.fillStyle = `rgba(226, 232, 240, ${twinkle})`;
        ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1.3, i % 3 === 0 ? 2 : 1.3);
      }

      // Crescent Earth on the northern horizon
      const earthX = viewportX + viewportW * 0.78;
      const earthY = 58;
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthX, earthY, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.75)';
      ctx.beginPath();
      ctx.arc(earthX - 4, earthY - 3, 6, 0, Math.PI * 2);
      ctx.arc(earthX + 5, earthY + 4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(earthX, earthY, 16.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Grazing 1.5° Polar Sun on the northwest horizon
      const sunX = viewportX + viewportW * 0.16;
      const sunY = inShadow ? 78 : 54;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, inShadow ? 38 : 85);
      sunGlow.addColorStop(0, inShadow ? 'rgba(253, 224, 71, 0.35)' : 'rgba(253, 224, 71, 0.92)');
      sunGlow.addColorStop(0.4, inShadow ? 'rgba(245, 158, 11, 0.10)' : 'rgba(245, 158, 11, 0.32)');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, inShadow ? 38 : 85, 0, Math.PI * 2);
      ctx.fill();

      // 2. Render 24x24 Isometric Tiles (Back-to-Front Painter's Order)
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          const cell = OUTPOST_GRID[gy][gx];
          const { sx, sy } = gridToScreen(gx, gy, cell.elevation, originX, originY);

          // Determine tile top & side bevel colors
          let topColor = inShadow ? '#1e293b' : '#475569';
          let sideColor = '#0f172a';
          let strokeColor = inShadow ? 'rgba(51, 65, 85, 0.45)' : 'rgba(100, 116, 139, 0.35)';

          switch (cell.kind) {
            case 'ridge_peak':
              topColor = inShadow ? '#334155' : '#64748b';
              sideColor = '#1e293b';
              strokeColor = 'rgba(253, 224, 71, 0.32)';
              break;
            case 'pathway':
              topColor = inShadow ? '#334155' : '#475569';
              sideColor = '#1e293b';
              strokeColor = 'rgba(56, 189, 248, 0.45)';
              break;
            case 'hab_floor':
              topColor = isBlackout ? '#4c0519' : isBrownout ? '#451a03' : '#083344';
              sideColor = '#090d16';
              strokeColor = isBlackout ? '#f43f5e' : isBrownout ? '#f59e0b' : '#22d3ee';
              break;
            case 'bunker_floor':
              topColor = '#164e63';
              sideColor = '#082f49';
              strokeColor = '#38bdf8';
              break;
            case 'reactor_pad':
              topColor = d3 === 1 ? '#064e3b' : '#1e293b';
              sideColor = '#0f172a';
              strokeColor = d3 === 1 ? '#34d399' : '#64748b';
              break;
            case 'comms_pad':
              topColor = '#2e1065';
              sideColor = '#1e1b4b';
              strokeColor = '#a855f7';
              break;
            case 'crater_slope':
              topColor = '#1e293b';
              sideColor = '#090d16';
              strokeColor = '#38bdf8';
              break;
            case 'cold_trap_ice': {
              const shimmer = 0.18 + 0.1 * Math.sin(nowMs * 0.003 + gx + gy);
              topColor = `rgba(14, 116, 144, ${0.45 + shimmer})`;
              sideColor = '#020617';
              strokeColor = 'rgba(56, 189, 248, 0.5)';
              break;
            }
            case 'cliff_wall':
              topColor = '#0f172a';
              sideColor = '#020617';
              strokeColor = '#334155';
              break;
          }

          // Hover highlight
          const isHovered = hoverTile.gx === gx && hoverTile.gy === gy;
          if (isHovered && cell.walkable) {
            strokeColor = '#fde047';
          }

          // Draw Isometric Diamond Top
          ctx.beginPath();
          ctx.moveTo(sx, sy - TILE_H / 2);
          ctx.lineTo(sx + TILE_W / 2, sy);
          ctx.lineTo(sx, sy + TILE_H / 2);
          ctx.lineTo(sx - TILE_W / 2, sy);
          ctx.closePath();
          ctx.fillStyle = topColor;
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isHovered ? 1.8 : 0.7;
          ctx.stroke();

          // Draw 3D Tile Extrusion Skirt for elevated peak / cliff walls
          if (cell.elevation > 0 || cell.kind === 'cliff_wall') {
            const skirtH = cell.kind === 'cliff_wall' ? 14 : 9;
            ctx.beginPath();
            ctx.moveTo(sx - TILE_W / 2, sy);
            ctx.lineTo(sx, sy + TILE_H / 2);
            ctx.lineTo(sx + TILE_W / 2, sy);
            ctx.lineTo(sx + TILE_W / 2, sy + skirtH);
            ctx.lineTo(sx, sy + TILE_H / 2 + skirtH);
            ctx.lineTo(sx - TILE_W / 2, sy + skirtH);
            ctx.closePath();
            ctx.fillStyle = sideColor;
            ctx.fill();
          }

          // Small crater or ice crystal detail on tile
          if (cell.craterDecor) {
            ctx.beginPath();
            ctx.ellipse(sx, sy, 6, 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
            ctx.fill();
          }

          // Crystalline frost sparkles during Decision 3 LRO 72h Shadow (90 K)
          if (inShadow && cell.kind !== 'hab_floor' && (gx + gy) % 4 === 0) {
            ctx.fillStyle = 'rgba(165, 243, 252, 0.45)';
            ctx.fillRect(sx - 1, sy - 1, 2.5, 2.5);
          }
        }
      }

      // 3. Draw Glowing Power Conduits between Solar Peak (5,5), Reactor (7,14), and Habitat (10,10)
      const drawPowerPipe = (p1: GridPoint, p2: GridPoint, activeColor: string) => {
        const a = gridToScreen(p1.gx, p1.gy, OUTPOST_GRID[p1.gy][p1.gx].elevation, originX, originY);
        const b = gridToScreen(p2.gx, p2.gy, OUTPOST_GRID[p2.gy][p2.gx].elevation, originX, originY);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = isBlackout ? '#334155' : activeColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = -(nowMs * 0.03);
        ctx.stroke();
        ctx.restore();
      };

      drawPowerPipe({ gx: 5, gy: 5 }, { gx: 10, gy: 10 }, '#f59e0b');
      if (d3 === 1 || sim.flags.includes('fuelCellsSpent')) {
        drawPowerPipe({ gx: 7, gy: 14 }, { gx: 10, gy: 10 }, '#34d399');
      }

      // 4. Render Outpost 2.5D Structures on the Map

      // (A) STATION 1: SOLAR PEAK (gx=5, gy=5)
      {
        const { sx, sy } = gridToScreen(5, 5, 2, originX, originY);
        if (d1 === 0) {
          // 10m Vertical Solar Mast towering above horizon shadow
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, sy - 64);
          ctx.stroke();

          // Dual solar wings
          ctx.fillStyle = inShadow ? '#0284c7' : '#38bdf8';
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.5;
          ctx.fillRect(sx - 26, sy - 58, 22, 34);
          ctx.strokeRect(sx - 26, sy - 58, 22, 34);
          ctx.fillRect(sx + 4, sy - 58, 22, 34);
          ctx.strokeRect(sx + 4, sy - 58, 22, 34);

          // Glowing top beacon
          ctx.beginPath();
          ctx.arc(sx, sy - 68, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fde047';
          ctx.fill();
        } else if (d1 === 1 || d1 === undefined) {
          // Low Deck Panels
          ctx.fillStyle = inShadow ? '#1e293b' : '#0284c7';
          ctx.strokeStyle = inShadow ? '#475569' : '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.fillRect(sx - 28, sy - 14, 24, 12);
          ctx.strokeRect(sx - 28, sy - 14, 24, 12);
          ctx.fillRect(sx + 4, sy - 14, 24, 12);
          ctx.strokeRect(sx + 4, sy - 14, 24, 12);
        } else {
          // Battery-only bank
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.8;
          ctx.fillRect(sx - 16, sy - 16, 32, 16);
          ctx.strokeRect(sx - 16, sy - 16, 32, 16);
        }
      }

      // (B) STATION 2: PRESSURIZED HABITAT & ECLSS CUTAWAY DOME (gx=10, gy=10)
      {
        const { sx, sy } = gridToScreen(10, 10, 0, originX, originY);

        // Regolith Berm Shield Arc if D2-A built
        if (d2 === 0 || sim.flags.includes('regolithBerm')) {
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 8;
          ctx.setLineDash([10, 4]);
          ctx.beginPath();
          ctx.arc(sx, sy - 6, 56, Math.PI * 1.05, Math.PI * 1.95);
          ctx.stroke();
          ctx.restore();
        }

        // Hydroponics & ECLSS interior racks inside the dome
        ctx.fillStyle = isBlackout ? '#475569' : '#22c55e';
        ctx.fillRect(sx - 22, sy - 18, 12, 14);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(sx + 10, sy - 18, 12, 14);

        // Transparent Cutaway Geodesic Dome
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, 44, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = isBlackout
          ? `rgba(244, 63, 94, ${0.2 + 0.25 * Math.abs(Math.sin(nowMs * 0.008))})`
          : isBrownout
            ? 'rgba(245, 158, 11, 0.22)'
            : 'rgba(56, 189, 248, 0.18)';
        ctx.fill();
        ctx.strokeStyle = isBlackout ? '#f43f5e' : isBrownout ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.restore();

        // ISRU O2 Plant beside dome if D2-B built
        if (d2 === 1 || sim.flags.includes('isruOxygen')) {
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.6;
          ctx.fillRect(sx - 64, sy - 12, 18, 16);
          ctx.strokeRect(sx - 64, sy - 12, 18, 16);
        }
      }

      // (C) STATION 3: H2/O2 FUEL-CELL REACTOR PAD (gx=7, gy=14)
      {
        const { sx, sy } = gridToScreen(7, 14, 0, originX, originY);
        const fuelActive = d3 === 1 || sim.flags.includes('fuelCellsSpent');
        ctx.fillStyle = fuelActive ? '#065f46' : '#1e293b';
        ctx.strokeStyle = fuelActive ? '#34d399' : '#64748b';
        ctx.lineWidth = 2;
        ctx.fillRect(sx - 18, sy - 20, 36, 20);
        ctx.strokeRect(sx - 18, sy - 20, 36, 20);

        // Rising green/cyan H2O exhaust vapor particles when fuel cells active
        if (fuelActive) {
          for (let p = 0; p < 3; p++) {
            const py = sy - 24 - ((nowMs * 0.025 + p * 12) % 26);
            const alpha = 1 - ((nowMs * 0.025 + p * 12) % 26) / 26;
            ctx.beginPath();
            ctx.arc(sx - 6 + p * 6, py, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(52, 211, 153, ${alpha * 0.75})`;
            ctx.fill();
          }
        }
      }

      // (D) STATION 5: RADIATION STORM SHELTER BUNKER (gx=13, gy=7)
      {
        const { sx, sy } = gridToScreen(13, 7, 0, originX, originY);
        const shieldOn = inStorm || d5 === 2 || d2 === 0;
        ctx.beginPath();
        ctx.arc(sx, sy, 28, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = shieldOn ? 'rgba(6, 182, 212, 0.32)' : 'rgba(30, 41, 59, 0.75)';
        ctx.fill();
        ctx.strokeStyle = shieldOn ? '#22d3ee' : '#64748b';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Outer Cyan Water-Wall Deflection Dome during DONKI Solar Storm
        if (inStorm && d5 !== 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(sx, sy + 12, 95, Math.PI * 1.05, Math.PI * 1.95);
          ctx.strokeStyle = `rgba(34, 211, 238, ${0.55 + 0.35 * Math.sin(nowMs * 0.006)})`;
          ctx.lineWidth = 3.5;
          ctx.setLineDash([8, 4]);
          ctx.stroke();
          ctx.restore();
        }
      }

      // (E) STATION 6: HIGH-GAIN EARTH DOWNLINK & ASCENT PAD (gx=15, gy=12)
      {
        const { sx, sy } = gridToScreen(15, 12, 0, originX, originY);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy - 22);
        ctx.stroke();
        // Parabolic dish
        ctx.beginPath();
        ctx.arc(sx + 4, sy - 26, 11, Math.PI * 0.7, Math.PI * 1.6);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 5. Render Pulsing Interactive Mission Station Rings & Floating Labels
      MISSION_STATIONS.forEach((st) => {
        const elev = OUTPOST_GRID[st.gy][st.gx].elevation;
        const { sx, sy } = gridToScreen(st.gx, st.gy, elev, originX, originY);
        const isCurrentObjective = st.decisionId === viewStep;
        const choiceMade = sim.choices[st.decisionId - 1] !== undefined;

        const pulseR = isCurrentObjective ? 22 + 5 * Math.sin(nowMs * 0.006) : 16;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, pulseR, pulseR * 0.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = isCurrentObjective ? '#fde047' : st.color;
        ctx.lineWidth = isCurrentObjective ? 2.6 : 1.5;
        ctx.stroke();

        // Floating Station Tag above structure
        const tagY = sy - (st.decisionId === 1 && d1 === 0 ? 78 : 38);
        ctx.font = 'bold 10px monospace';
        const labelText = `${st.code}${choiceMade ? ' ✓' : isCurrentObjective ? ' [!]' : ''}`;
        const textW = ctx.measureText(labelText).width + 10;
        ctx.fillStyle = isCurrentObjective ? 'rgba(250, 204, 21, 0.92)' : 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(sx - textW / 2, tagY - 11, textW, 15);
        ctx.strokeStyle = isCurrentObjective ? '#fde047' : st.color;
        ctx.strokeRect(sx - textW / 2, tagY - 11, textW, 15);
        ctx.fillStyle = isCurrentObjective ? '#020617' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, sx, tagY);
        ctx.restore();
      });

      // 6. Render A* Path Nodes & Waypoints for Playable Units
      unitsRef.current.forEach((u) => {
        if (u.path.length > 0) {
          ctx.save();
          ctx.beginPath();
          const startPos = gridToScreen(
            u.gx,
            u.gy,
            OUTPOST_GRID[Math.round(u.gy)]?.[Math.round(u.gx)]?.elevation ?? 0,
            originX,
            originY,
          );
          ctx.moveTo(startPos.sx, startPos.sy);
          for (const node of u.path) {
            const elev = OUTPOST_GRID[node.gy]?.[node.gx]?.elevation ?? 0;
            const pt = gridToScreen(node.gx, node.gy, elev, originX, originY);
            ctx.lineTo(pt.sx, pt.sy);
          }
          ctx.strokeStyle = u.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.stroke();

          // Draw tactical path nodes
          for (let i = 0; i < u.path.length; i++) {
            const node = u.path[i];
            const elev = OUTPOST_GRID[node.gy]?.[node.gx]?.elevation ?? 0;
            const pt = gridToScreen(node.gx, node.gy, elev, originX, originY);
            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, i === u.path.length - 1 ? 5 : 2.5, 0, Math.PI * 2);
            ctx.fillStyle = i === u.path.length - 1 ? '#fde047' : u.color;
            ctx.fill();
          }
          ctx.restore();
        }
      });

      // 7. If Run B is active and we are in Single View, render a translucent "Run A Ghost Astronaut" at Run A's station!
      if (runB && !splitCompareCanvas) {
        const ghostStation = MISSION_STATIONS[viewStep - 1];
        const ghostElev = OUTPOST_GRID[ghostStation.gy][ghostStation.gx].elevation;
        const { sx, sy } = gridToScreen(ghostStation.gx - 0.8, ghostStation.gy + 0.6, ghostElev, originX, originY);
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(sx, sy - 16, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 5, sy - 10, 10, 11);
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fda4af';
        ctx.fillText('GHOST (RUN A)', sx, sy - 26);
        ctx.restore();
      }

      // 8. Render Playable Units (Commander Azer, Engineer Leyla, and VIPER-Jr Ice Rover)
      unitsRef.current.forEach((u) => {
        const rgx = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(u.gx)));
        const rgy = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(u.gy)));
        const elev = OUTPOST_GRID[rgy][rgx].elevation;
        const { sx, sy } = gridToScreen(u.gx, u.gy, elev, originX, originY);

        ctx.save();

        // Tactical Selection Circle under unit
        if (u.selected) {
          ctx.beginPath();
          ctx.ellipse(sx, sy + 2, 14, 7, 0, 0, Math.PI * 2);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        // Directional Flashlight Cone during Decision 3 LRO 72-Hour Shadow
        if (inShadow) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(sx, sy - 10);
          const angle = Math.atan2(u.facing.dy + u.facing.dx, u.facing.dx - u.facing.dy);
          ctx.arc(sx, sy - 10, 68, angle - 0.38, angle + 0.38);
          ctx.closePath();
          const coneGrad = ctx.createRadialGradient(sx, sy - 10, 4, sx, sy - 10, 68);
          coneGrad.addColorStop(0, 'rgba(253, 224, 71, 0.48)');
          coneGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = coneGrad;
          ctx.fill();
          ctx.restore();
        }

        if (u.id === 'rover') {
          // Draw Wheeled Lunar Ice Rover Sprite
          ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
          ctx.beginPath();
          ctx.ellipse(sx, sy + 3, 16, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Chassis
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.6;
          ctx.fillRect(sx - 15, sy - 13, 30, 11);
          ctx.strokeRect(sx - 15, sy - 13, 30, 11);

          // Rover wheels
          ctx.fillStyle = '#0f172a';
          [-11, 0, 11].forEach((wx) => {
            ctx.beginPath();
            ctx.arc(sx + wx, sy - 1, 4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Rover camera mast
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(sx + 6, sy - 13);
          ctx.lineTo(sx + 9, sy - 23);
          ctx.stroke();

          // Active Blue Laser Ice Core Drill when in Cold-Trap Crater or Step 4 (unless D4-B maintenance was picked)
          if ((OUTPOST_GRID[rgy][rgx].kind === 'cold_trap_ice' || viewStep === 4) && d4 !== 1) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(sx + 14, sy - 6);
            ctx.lineTo(sx + 26, sy + 8);
            ctx.stroke();
          }
        } else {
          // Draw Animated Junior Astronaut Sprite
          const bob = Math.sin(u.walkPhase) * 2.2;
          const legSwing = Math.sin(u.walkPhase) * 3.5;

          // Drop shadow
          ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
          ctx.beginPath();
          ctx.ellipse(sx, sy + 2, 9, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Animated Legs
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(sx - 3, sy - 8 + bob);
          ctx.lineTo(sx - 3 - legSwing * 0.5, sy + 1);
          ctx.moveTo(sx + 3, sy - 8 + bob);
          ctx.lineTo(sx + 3 + legSwing * 0.5, sy + 1);
          ctx.stroke();

          // PLSS Life-Support Backpack & Suit Torso
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = u.color;
          ctx.lineWidth = 1.5;
          ctx.fillRect(sx - 6, sy - 19 + bob, 12, 11);
          ctx.strokeRect(sx - 6, sy - 19 + bob, 12, 11);

          // Helmet & Gold/Cyan Reflective Visor
          ctx.beginPath();
          ctx.arc(sx, sy - 24 + bob, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#f8fafc';
          ctx.fill();
          ctx.strokeStyle = u.color;
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(sx + u.facing.dx * 1.5, sy - 24 + bob, 3.8, 2.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#0284c7';
          ctx.fill();
        }

        // Unit Floating Nameplate
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = u.selected ? '#fde047' : '#cbd5e1';
        ctx.fillText(tr(u.name), sx, sy - 34);
        ctx.restore();
      });

      // 9. Weather Shader Overlays: Decision 3 Shadow Darkness & Decision 5 DONKI Solar Proton Waves
      if (inShadow) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.34)';
        ctx.fillRect(viewportX, 0, viewportW, viewportH);
      }

      if (inStorm) {
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
        ctx.lineWidth = 2;
        for (let w = 0; w < 22; w++) {
          const px = viewportX + ((w * 97 + Math.floor(nowMs * 0.38)) % Math.max(120, Math.floor(viewportW)));
          const py = (w * 67 + Math.floor(nowMs * 0.26)) % Math.max(120, Math.floor(viewportH));
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 22, py + 14);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 10. Viewport Header Badge (for Split-Compare Run A vs Run B)
      ctx.save();
      ctx.fillStyle = isBranch ? 'rgba(162, 28, 175, 0.88)' : 'rgba(14, 116, 144, 0.88)';
      ctx.fillRect(viewportX + 12, 52, 250, 24);
      ctx.strokeStyle = isBranch ? '#f0abfc' : '#67e8f9';
      ctx.strokeRect(viewportX + 12, 52, 250, 24);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${label} · ⚡${stateAtStep.powerKwh}kWh ♥${stateAtStep.lifeSupportPct}% ☢${stateAtStep.radiationMsv}mSv`,
        viewportX + 20,
        68,
      );
      ctx.restore();

      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      frameCount++;
      if (now - fpsTimer >= 500) {
        setFps(Math.min(60, Math.round((frameCount * 1000) / (now - fpsTimer))));
        frameCount = 0;
        fpsTimer = now;
      }

      // Update Unit Movement (WASD + A* Path Following) if not paused
      if (!paused) {
        const keys = keysPressedRef.current;
        let kbDx = 0;
        let kbDy = 0;
        if (keys.has('w') || keys.has('arrowup')) {
          kbDx -= 1;
          kbDy -= 1;
        }
        if (keys.has('s') || keys.has('arrowdown')) {
          kbDx += 1;
          kbDy += 1;
        }
        if (keys.has('a') || keys.has('arrowleft')) {
          kbDx -= 1;
          kbDy += 1;
        }
        if (keys.has('d') || keys.has('arrowright')) {
          kbDx += 1;
          kbDy -= 1;
        }

        unitsRef.current.forEach((u) => {
          if (u.selected && (kbDx !== 0 || kbDy !== 0)) {
            const len = Math.hypot(kbDx, kbDy) || 1;
            const nx = u.gx + (kbDx / len) * u.speed * dt;
            const ny = u.gy + (kbDy / len) * u.speed * dt;
            const tx = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(nx)));
            const ty = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(ny)));
            if (OUTPOST_GRID[ty][tx].walkable) {
              u.gx = nx;
              u.gy = ny;
              u.facing = { dx: Math.sign(kbDx), dy: Math.sign(kbDy) };
              u.walkPhase += dt * 12;
            }
          } else if (u.path.length > 0) {
            const target = u.path[0];
            const dx = target.gx - u.gx;
            const dy = target.gy - u.gy;
            const dist = Math.hypot(dx, dy);
            if (dist <= u.speed * dt) {
              u.gx = target.gx;
              u.gy = target.gy;
              u.path.shift();
              if (u.path.length === 0 && u.targetStationDecision !== undefined) {
                const decId = u.targetStationDecision;
                u.targetStationDecision = undefined;
                onOpenDecisionModal(decId);
              }
            } else {
              u.gx += (dx / dist) * u.speed * dt;
              u.gy += (dy / dist) * u.speed * dt;
              u.facing = { dx: Math.sign(dx), dy: Math.sign(dy) };
              u.walkPhase += dt * 12;
            }
          } else {
            // Subtle idle breathing bob
            u.walkPhase += dt * 2.2;
          }
        });

        // Check proximity of active unit to any of the 6 Mission Stations
        const activeUnit = unitsRef.current.find((u) => u.selected) ?? unitsRef.current[0];
        let closest: StationMeta | null = null;
        let minD = 2.6;
        for (const st of MISSION_STATIONS) {
          const d = Math.hypot(activeUnit.gx - st.gx, activeUnit.gy - st.gy);
          if (d < minD) {
            minD = d;
            closest = st;
          }
        }
        setNearbyStation(closest);
      }

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
          canvas.width = Math.floor(rect.width);
          canvas.height = Math.floor(rect.height);
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (splitCompareCanvas && runB) {
            const halfW = Math.floor(canvas.width / 2);
            renderScene(ctx, 0, halfW, canvas.height, runA, t('runA'), false, now);
            renderScene(ctx, halfW, canvas.width - halfW, canvas.height, runB, t('runB'), true, now);
            // Center Split Divider Line
            ctx.strokeStyle = '#e879f9';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(halfW, 0);
            ctx.lineTo(halfW, canvas.height);
            ctx.stroke();
          } else {
            const activeSim = runB ?? runA;
            renderScene(
              ctx,
              0,
              canvas.width,
              canvas.height,
              activeSim,
              runB ? t('runB') : t('runA'),
              Boolean(runB),
              now,
            );
          }

          // Draw Tactical RTS Drag-Selection Box if active
          const db = dragBoxRef.current;
          if (db.active && db.moved) {
            ctx.save();
            ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1.5;
            const bx = Math.min(db.x0, db.x1);
            const by = Math.min(db.y0, db.y1);
            const bw = Math.abs(db.x1 - db.x0);
            const bh = Math.abs(db.y1 - db.y0);
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hoverTile.gx, hoverTile.gy, onOpenDecisionModal, paused, runA, runB, splitCompareCanvas, t, tr, viewStep]);

  /* --------------------------------------------------------------------------
   * Mouse Handlers on the Isometric Canvas (Left-Click, Drag-Select, RMB A* Move)
   * ------------------------------------------------------------------------ */
  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const vw = splitCompareCanvas && runB ? rect.width / 2 : rect.width;
    const localX = splitCompareCanvas && runB && x > vw ? x - vw : x;
    const originX = vw * 0.5;
    const originY = Math.max(76, rect.height * 0.14);
    return { x, y, localX, originX, originY };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y, localX, originX, originY } = getCanvasCoords(e);

    if (e.button === 2) {
      // Right-Click (RMB): Tactical A* Move Command
      e.preventDefault();
      const targetGrid = screenToGrid(localX, y, originX, originY);
      soundFX.play('StepNav');
      unitsRef.current.forEach((u) => {
        if (u.selected) {
          const { path, ms } = findPathAStar({ gx: u.gx, gy: u.gy }, targetGrid);
          u.path = path;
          u.targetStationDecision = undefined;
          setLastPathMs(ms);
        }
      });
      return;
    }

    if (e.button === 0) {
      dragBoxRef.current = { active: true, x0: x, y0: y, x1: x, y1: y, moved: false };
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y, localX, originX, originY } = getCanvasCoords(e);
    const g = screenToGrid(localX, y, originX, originY);
    if (g.gx !== hoverTile.gx || g.gy !== hoverTile.gy) {
      setHoverTile(g);
    }
    if (dragBoxRef.current.active) {
      dragBoxRef.current.x1 = x;
      dragBoxRef.current.y1 = y;
      if (Math.hypot(x - dragBoxRef.current.x0, y - dragBoxRef.current.y0) > 8) {
        dragBoxRef.current.moved = true;
      }
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;
    const { localX, y, originX, originY } = getCanvasCoords(e);
    const db = dragBoxRef.current;
    db.active = false;

    if (db.moved) {
      // Complete Drag-Box Selection
      const minX = Math.min(db.x0, db.x1);
      const maxX = Math.max(db.x0, db.x1);
      const minY = Math.min(db.y0, db.y1);
      const maxY = Math.max(db.y0, db.y1);
      let anySelected = false;
      unitsRef.current.forEach((u) => {
        const elev = OUTPOST_GRID[Math.round(u.gy)]?.[Math.round(u.gx)]?.elevation ?? 0;
        const { sx, sy } = gridToScreen(u.gx, u.gy, elev, originX, originY);
        const inside = sx >= minX && sx <= maxX && sy >= minY && sy <= maxY;
        u.selected = inside;
        if (inside && !anySelected) {
          anySelected = true;
          setSelectedUnitId(u.id);
        }
      });
      if (!anySelected) {
        unitsRef.current[0].selected = true;
        setSelectedUnitId('astro1');
      }
      soundFX.play('StepNav');
      return;
    }

    // Single Left-Click: Check if user clicked a Mission Station OR a Unit OR a Tile to walk to
    const clickedGrid = screenToGrid(localX, y, originX, originY);

    // 1. Did user click near one of the 6 Mission Stations?
    const clickedStation = MISSION_STATIONS.find(
      (st) => Math.hypot(st.gx - clickedGrid.gx, st.gy - clickedGrid.gy) <= 1.8,
    );
    if (clickedStation) {
      walkToStationAndInteract(clickedStation, false);
      return;
    }

    // 2. Did user click on a Unit?
    const clickedUnit = unitsRef.current.find(
      (u) => Math.hypot(u.gx - clickedGrid.gx, u.gy - clickedGrid.gy) <= 1.2,
    );
    if (clickedUnit) {
      selectUnit(clickedUnit.id);
      return;
    }

    // 3. Otherwise, A* Pathfind the selected unit to the clicked tile!
    soundFX.play('StepNav');
    unitsRef.current.forEach((u) => {
      if (u.selected) {
        const { path, ms } = findPathAStar({ gx: u.gx, gy: u.gy }, clickedGrid);
        u.path = path;
        u.targetStationDecision = undefined;
        setLastPathMs(ms);
      }
    });
  }

  const currentStation = MISSION_STATIONS[viewStep - 1];
  const surfaceTempK = viewStep === 3 ? 90 : viewStep === 4 ? 168 : 219;

  return (
    <div className="relative h-full w-full select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Interactive Full-Viewport 60 FPS Isometric Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="block h-full w-full cursor-crosshair"
      />

      {/* TOP-LEFT FLOATING ENGINE TELEMETRY OVERLAY */}
      <div className="pointer-events-auto absolute top-3 left-3 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 font-mono text-[11px] text-slate-300 backdrop-blur-md">
          <button
            onClick={() => setShowEngineHud((v) => !v)}
            className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>{fps} FPS</span>
          </button>
          {showEngineHud && (
            <>
              <span className="text-slate-600">|</span>
              <span className="inline-flex items-center gap-1 text-sky-300">
                <Cpu className="h-3 w-3" /> A*: {lastPathMs.toFixed(2)} ms
              </span>
              <span className="text-slate-600">|</span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Crosshair className="h-3 w-3" /> Tile ({hoverTile.gx}, {hoverTile.gy})
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">WASD / Click / RMB A*</span>
            </>
          )}
          <button
            onClick={() => {
              soundFX.play('StepNav');
              setPaused((p) => !p);
            }}
            className={`ml-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase transition ${
              paused ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? (lang === 'az' ? 'DAVAM [Space]' : 'RESUME [Space]') : 'PAUSE [Space]'}
          </button>
        </div>

        {/* Unit Selection Portraits Strip (1: Cmdr. Azer, 2: Eng. Leyla, 3: Ice Rover) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {unitsRef.current.map((u, idx) => {
            const isSel = selectedUnitId === u.id;
            const Icon = u.id === 'rover' ? Bot : User;
            return (
              <button
                key={u.id}
                onClick={() => selectUnit(u.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium backdrop-blur-md transition ${
                  isSel
                    ? 'border-sky-400 bg-sky-500/20 text-white ring-1 ring-sky-400/50'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="rounded bg-slate-800 px-1 font-mono text-[10px] text-slate-400">{idx + 1}</span>
                <Icon className="h-3.5 w-3.5" style={{ color: u.color }} />
                <span>{tr(u.name)}</span>
              </button>
            );
          })}

          {runB && (
            <button
              onClick={() => {
                soundFX.play('StepNav');
                setSplitCompareCanvas((s) => !s);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition ${
                splitCompareCanvas
                  ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100'
                  : 'border-fuchsia-500/40 bg-slate-950/80 text-fuchsia-200 hover:bg-fuchsia-500/15'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {splitCompareCanvas ? t('singleView') : t('splitCompare')}
            </button>
          )}
        </div>
      </div>

      {/* TOP-RIGHT FLOATING CURRENT OBJECTIVE & TELEPORT/INTERACT BAR */}
      <div className="pointer-events-auto absolute top-3 right-3 flex max-w-md flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-2 backdrop-blur-md">
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <Compass className="h-3.5 w-3.5" />
              {currentStation.code} · {surfaceTempK} K ({surfaceTempK - 273}°C)
            </p>
            <p className="text-xs font-medium text-slate-100">{tr(currentStation.actionHint)}</p>
          </div>

          <button
            onClick={() => walkToStationAndInteract(currentStation, true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-300"
          >
            <Zap className="h-3.5 w-3.5" />
            {lang === 'az' ? 'Stansiyanı Aç [E]' : 'Open Station [E]'}
          </button>
        </div>

        {/* 4 Engineering Science Lore Hotspots (Quick Inspect on Map) */}
        <div className="flex flex-wrap justify-end gap-1">
          {(
            [
              { id: 'solar' as HotspotId, label: { en: '1·Solar Lore', az: '1·Günəş Elmi' }, Icon: Sun },
              { id: 'habitat' as HotspotId, label: { en: '2·ECLSS Lore', az: '2·ECLSS Elmi' }, Icon: Activity },
              { id: 'rover' as HotspotId, label: { en: '3·Ice Lore', az: '3·Buz Elmi' }, Icon: Snowflake },
              { id: 'shelter' as HotspotId, label: { en: '4·Shield Lore', az: '4·Qalxan Elmi' }, Icon: ShieldAlert },
            ] as const
          ).map((h) => (
            <button
              key={h.id}
              onClick={() => {
                soundFX.play('hotspot');
                onSelectHotspot(h.id);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-300 backdrop-blur-md hover:border-sky-400 hover:text-white"
            >
              <h.Icon className="h-3 w-3 text-sky-400" />
              {tr(h.label)}
            </button>
          ))}
        </div>
      </div>

      {/* CENTER-TOP CRISIS ALERT BANNER (D3 LRO 72h Shadow OR D5 DONKI Solar Superstorm) */}
      {viewStep === 3 && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/60 bg-cyan-950/90 px-4 py-1 text-xs font-semibold text-cyan-200 shadow-lg backdrop-blur-md">
          <span className="inline-flex items-center gap-1.5">
            <Snowflake className="h-3.5 w-3.5 text-cyan-300" />
            {t('crisisShadowBanner')}
          </span>
        </div>
      )}
      {viewStep === 5 && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 rounded-full border border-rose-500/60 bg-rose-950/90 px-4 py-1 text-xs font-semibold text-rose-200 shadow-lg backdrop-blur-md">
          <span className="inline-flex items-center gap-1.5">
            <Radiation className="h-3.5 w-3.5 animate-spin text-rose-300" />
            {t('crisisStormBanner')}
          </span>
        </div>
      )}

      {/* PROXIMITY INTERACTION PROMPT (When Astronaut/Rover is standing near a Station) */}
      {nearbyStation && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            onClick={() => {
              soundFX.play('choice');
              onSelectStep(nearbyStation.decisionId);
              onOpenDecisionModal(nearbyStation.decisionId);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/80 bg-slate-950/90 px-4 py-2 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur-md transition hover:scale-105 hover:bg-slate-900"
          >
            <Footprints className="h-4 w-4 text-amber-400" />
            <span>
              {tr(nearbyStation.name)} —{' '}
              <strong className="underline">
                {lang === 'az' ? '[E] və ya Kliklə: Qərar Ver' : 'Press [E] or Click to Configure'}
              </strong>
            </span>
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          </button>
        </div>
      )}

      {/* TACTICAL PAUSE BANNER */}
      {paused && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <div className="rounded-2xl border border-amber-400/60 bg-slate-950/90 px-6 py-3 text-center shadow-2xl backdrop-blur-md">
            <p className="flex items-center justify-center gap-2 font-mono text-sm font-bold tracking-widest text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {lang === 'az' ? 'TAKTİKİ FASİLƏ AKTİVDİR [SPACE]' : 'TACTICAL PAUSE ACTIVE [SPACE]'}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {lang === 'az'
                ? 'Stansiyalara klikləyə və ya A* marşrutu təyin edə bilərsiniz.'
                : 'You can still inspect stations, assign A* waypoints, or rewind time.'}
            </p>
          </div>
        </div>
      )}

      {/* Quick Station Jump Bar in Bottom-Left of Canvas */}
      <div className="pointer-events-auto absolute bottom-3 left-3 hidden flex-wrap items-center gap-1 xl:flex">
        {MISSION_STATIONS.map((st) => {
          const isCurrent = st.decisionId === viewStep;
          return (
            <button
              key={st.decisionId}
              onClick={() => walkToStationAndInteract(st, false)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold backdrop-blur-md transition ${
                isCurrent
                  ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                  : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span>{st.code}</span>
            </button>
          );
        })}
        <button
          onClick={() => {
            // Re-center units near habitat
            unitsRef.current[0].gx = 9;
            unitsRef.current[0].gy = 9;
            unitsRef.current[0].path = [];
            soundFX.play('StepNav');
          }}
          title="Reset Unit Position"
          className="rounded-lg border border-slate-800 bg-slate-950/80 p-1 text-slate-400 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
