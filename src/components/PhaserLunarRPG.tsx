import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Compass,
  Crosshair,
  Flame,
  Footprints,
  Gem as GemIcon,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { SimulationResult } from '../engine/simulation';
import type { Bilingual } from '../types';
import { soundFX } from '../utils/soundEffects';
import type { HotspotId } from './LunarOutpost2D';

/* ============================================================================
 * TOP-DOWN 2.5D 3/4-PERSPECTIVE RPG WORLD CONSTANTS (2304 x 1536 px)
 * ========================================================================== */
const TILE_SIZE = 64;
const MAP_COLS = 36;
const MAP_ROWS = 24;
const WORLD_W = MAP_COLS * TILE_SIZE; // 2304 px
const WORLD_H = MAP_ROWS * TILE_SIZE; // 1536 px

export type PowerRouteMode = 'heaters' | 'drill' | 'shields';

export interface RpgBuildingMeta {
  decisionId: 1 | 2 | 3 | 4 | 5 | 6;
  spriteKey: string;
  shortCode: string;
  code: string;
  title: Bilingual;
  prompt: Bilingual;
  tileX: number;
  tileY: number;
  doorTileX: number;
  doorTileY: number;
  widthPx: number;
  heightPx: number;
  accentHex: number;
  accentCss: string;
  hotspotId: HotspotId;
  hasInteriorCutaway?: boolean;
}

export const RPG_BUILDINGS: RpgBuildingMeta[] = [
  {
    decisionId: 1,
    spriteKey: 'station_d1_solar',
    shortCode: 'D1 · VSAT SOLAR',
    code: 'D1 · VSAT SOLAR PEAK',
    title: { en: 'Vertical Solar Array Compound', az: 'Şaquli Günəş Enerjisi Kompleksi' },
    prompt: { en: '[E] Align 1.5° Solar Array & Configure D1', az: '[E] 1.5° Günəş Panelini Tuşla (D1)' },
    tileX: 7,
    tileY: 5.4,
    doorTileX: 7,
    doorTileY: 7.4,
    widthPx: 265,
    heightPx: 245,
    accentHex: 0xf59e0b,
    accentCss: '#f59e0b',
    hotspotId: 'solar',
  },
  {
    decisionId: 2,
    spriteKey: 'station_d2_habitat',
    shortCode: 'D2 · HABITAT DOME',
    code: 'D2 · ARTEMIS HABITAT',
    title: { en: 'Geodesic Habitat & Hydroponics Dome', az: 'Yaşayış və Hidroponika Günbəzi' },
    prompt: { en: '[E] Configure Habitat & ECLSS Dome (Walk Inside!)', az: '[E] Yaşayış Günbəzi və ECLSS (İçəri Gir!)' },
    tileX: 17,
    tileY: 6.4,
    doorTileX: 17,
    doorTileY: 8.6,
    widthPx: 290,
    heightPx: 265,
    accentHex: 0x10b981,
    accentCss: '#10b981',
    hotspotId: 'habitat',
    hasInteriorCutaway: true,
  },
  {
    decisionId: 3,
    spriteKey: 'station_d3_reactor',
    shortCode: 'D3 · H₂/O₂ REACTOR',
    code: 'D3 · H₂/O₂ FUEL CELLS',
    title: { en: 'Cryo Fuel-Cell Reactor Plant', az: 'H₂/O₂ Yanacaq Elementi Reaktoru' },
    prompt: { en: '[E] Manage 72h LRO Shadow & Fuel Cells [P: Route Power]', az: '[E] 72s Kölgə və Yanacaq [P: Enerji Yönləndir]' },
    tileX: 8,
    tileY: 16.2,
    doorTileX: 8,
    doorTileY: 18.1,
    widthPx: 255,
    heightPx: 245,
    accentHex: 0x22c55e,
    accentCss: '#22c55e',
    hotspotId: 'solar',
  },
  {
    decisionId: 4,
    spriteKey: 'station_d4_icemine',
    shortCode: 'D4 · 90K ICE RIG',
    code: 'D4 · COLD-TRAP ICE RIG',
    title: { en: '90 K Cold-Trap Ice Extraction Rig', az: '90 K Soyuq Tələ Buz Qazma Qurğusu' },
    prompt: { en: '[E] Cold-Trap Ice Ops (Hold SPACE in Rover to Laser-Drill!)', az: '[E] Buz Qazma (Roverdə SPACE basıb Lazerlə Qaz!)' },
    tileX: 28,
    tileY: 16.8,
    doorTileX: 25.4,
    doorTileY: 16.8,
    widthPx: 265,
    heightPx: 250,
    accentHex: 0x06b6d4,
    accentCss: '#06b6d4',
    hotspotId: 'rover',
  },
  {
    decisionId: 5,
    spriteKey: 'station_d5_bunker',
    shortCode: 'D5 · STORM BUNKER',
    code: 'D5 · WATER-WALL BUNKER',
    title: { en: 'Water-Wall Radiation Shield Bunker', az: 'Su Divarlı Radiasiya Sığınacağı' },
    prompt: { en: '[E] DONKI Storm Bunker (Walk Inside Shield Dome!)', az: '[E] Günəş Fırtınası Sığınacağı (Qalxana Gir!)' },
    tileX: 18,
    tileY: 16.2,
    doorTileX: 18,
    doorTileY: 18.1,
    widthPx: 270,
    heightPx: 250,
    accentHex: 0xf43f5e,
    accentCss: '#f43f5e',
    hotspotId: 'shelter',
    hasInteriorCutaway: true,
  },
  {
    decisionId: 6,
    spriteKey: 'station_d6_ascent',
    shortCode: 'D6 · ASCENT PAD',
    code: 'D6 · ASCENT LAUNCHPAD',
    title: { en: 'Lunar Ascent Rocket & Downlink Pad', az: 'Qalxış Raketi və Yer Rabitə Meydançası' },
    prompt: { en: '[E] Final Day Earth Downlink & Ascent Prep', az: '[E] Yekun Rabitə və Qalxış Hazırlığı' },
    tileX: 28,
    tileY: 6.4,
    doorTileX: 28,
    doorTileY: 8.4,
    widthPx: 265,
    heightPx: 255,
    accentHex: 0xa855f7,
    accentCss: '#a855f7',
    hotspotId: 'habitat',
  },
];

/* ============================================================================
 * 6 COLLECTIBLE NASA FIELD SCIENCE NODES ON THE RPG MAP
 * ========================================================================== */
export interface FieldSampleNode {
  id: string;
  tileX: number;
  tileY: number;
  colorHex: number;
  title: Bilingual;
  Instrument: string;
  fact: Bilingual;
}

export const FIELD_SAMPLES: FieldSampleNode[] = [
  {
    id: 'lola_retro',
    tileX: 4.5,
    tileY: 9.2,
    colorHex: 0xfacc15,
    Instrument: 'LRO LOLA',
    title: { en: 'LOLA Laser Retroreflector Array', az: 'LOLA Lazer Retroreflektoru' },
    fact: {
      en: 'LOLA sub-meter laser altimetry mapped Shackleton Rim’s 1.5° grazing illumination peaks.',
      az: 'LOLA lazer altimetriyası Şeklton kənarının 1.5° üfüqi işıqlanma zirvələrini xəritələşdirib.',
    },
  },
  {
    id: 'anorthosite',
    tileX: 12.2,
    tileY: 8.8,
    colorHex: 0x38bdf8,
    Instrument: 'Artemis Geology',
    title: { en: 'Ferroan Anorthosite Crust Sample', az: 'Anortozit Ay Qabığı Nümunəsi' },
    fact: {
      en: '4.4-billion-year-old highland crust rock excavated by the Shackleton impact event.',
      az: 'Şeklton zərbəsi nəticəsində üzə çıxmış 4.4 milyard illik qədim Ay qabığı süxuru.',
    },
  },
  {
    id: 'ilmenite_isru',
    tileX: 12.5,
    tileY: 14.5,
    colorHex: 0x10b981,
    Instrument: 'ISRU Pilot',
    title: { en: 'Ilmenite (FeTiO₃) Oxygen Ore', az: 'İlmenit (FeTiO₃) Oksigen Filizi' },
    fact: {
      en: 'Heating ilmenite regolith with hydrogen yields water and breathable O₂ (0.82 kg/crew-day).',
      az: 'İlmenit reqolitinin qızdırılması nəfəs üçün O₂ (0.82 kq/ekipaj-gün) əldə etməyə imkan verir.',
    },
  },
  {
    id: 'diviner_probe',
    tileX: 22.2,
    tileY: 14.2,
    colorHex: 0x22d3ee,
    Instrument: 'LRO Diviner',
    title: { en: 'Diviner Thermal Radiometer Probe', az: 'Diviner İstilik Radiometri Zondu' },
    fact: {
      en: 'Measures the steep thermal gradient from 219 K on the sunlit ridge down to 90 K (−183°C) in shadow.',
      az: 'Günəşli zirvədəki 219 K-dən kölgədəki 90 K (−183°C) soyuq tələyə qədər temperatur fərqini ölçür.',
    },
  },
  {
    id: 'coldtrap_ice_core',
    tileX: 30.8,
    tileY: 19.5,
    colorHex: 0x67e8f9,
    Instrument: 'VIPER NSS/MSolo',
    title: { en: '90 K Permanently Shadowed Water-Ice Core', az: '90 K Daimi Kölgəli Su Buzu Nüvəsi' },
    fact: {
      en: 'Ancient cometary & solar-wind H₂O trapped for billions of years in Shackleton’s dark floor.',
      az: 'Milyardlarla il ərzində Şekltonun qaranlıq dibində donub qalmış qədim su buzu.',
    },
  },
  {
    id: 'crater_dosimeter',
    tileX: 22.5,
    tileY: 8.8,
    colorHex: 0xf43f5e,
    Instrument: 'LRO CRaTER / DONKI',
    title: { en: 'Tissue-Equivalent Radiation Dosimeter', az: 'Toxuma-Ekvivalentli Radiasiya Dozimetri' },
    fact: {
      en: 'Tracks GCR background (~1.0 mSv/day) and DONKI Solar Particle Events up to 205 pfu.',
      az: 'Kosmik şüa fonunu (~1.0 mSv/gün) və 205 pfu-ya çatan Günəş fırtınalarını ölçür.',
    },
  },
];

/* ============================================================================
 * 5 LASER-DRILLABLE 90 K WATER-ICE BOULDERS IN THE COLD-TRAP CRATER
 * ========================================================================== */
interface IceBoulderNode {
  id: string;
  tileX: number;
  tileY: number;
  radius: number;
}

const ICE_BOULDERS: IceBoulderNode[] = [
  { id: 'ice_b1', tileX: 25.2, tileY: 14.6, radius: 26 },
  { id: 'ice_b2', tileX: 26.8, tileY: 19.4, radius: 30 },
  { id: 'ice_b3', tileX: 30.4, tileY: 15.2, radius: 28 },
  { id: 'ice_b4', tileX: 31.8, tileY: 17.8, radius: 32 },
  { id: 'ice_b5', tileX: 28.6, tileY: 20.6, radius: 27 },
];

export interface LiveGameplayBonuses {
  solarAligned: boolean;
  solarAngleDeg: number;
  powerRoute: PowerRouteMode;
  iceCoresDrilled: number;
  samplesCollected: number;
  insideShelter: boolean;
  stormExposureMsv: number;
  stormWaveCountdownSec: number;
  stormWaveDeflected: boolean;
  laserHeatPct: number;
  isDrillingIce: boolean;
}

interface BridgeState {
  runA: SimulationResult;
  runB: SimulationResult | null;
  activeRun: SimulationResult;
  viewStep: number;
  lang: 'en' | 'az';
  drivingRover: boolean;
  solarAngleDeg: number;
  solarAligned: boolean;
  powerRoute: PowerRouteMode;
  onNearBuilding: (b: RpgBuildingMeta | null) => void;
  onOpenDecisionModal: (decisionId: number) => void;
  onSelectStep: (step: number) => void;
  onCollectSample: (sample: FieldSampleNode) => void;
  onDrillIceCore: (totalCores: number) => void;
  onCyclePowerRoute: (nextRoute?: PowerRouteMode) => void;
  onUpdateLaserState: (heatPct: number, drilling: boolean) => void;
  onUpdateShelterState: (
    inside: boolean,
    buildingId: number | null,
    stormDose: number,
    waveSec: number,
    deflected: boolean,
  ) => void;
  onUpdatePlayerPos: (pos: { x: number; y: number }) => void;
}

export interface PhaserLunarRPGProps {
  runA: SimulationResult;
  runB: SimulationResult | null;
  viewStep: number;
  onSelectStep: (step: number) => void;
  onOpenDecisionModal: (decisionId: number) => void;
  onSelectHotspot: (id: HotspotId) => void;
  onGameplayChange?: (bonuses: LiveGameplayBonuses) => void;
  onCrewRadioMessage?: (speaker: Bilingual, text: Bilingual, portrait: 'leyla' | 'azer' | 'rover') => void;
}

export default function PhaserLunarRPG({
  runA,
  runB,
  viewStep,
  onSelectStep,
  onOpenDecisionModal,
  onSelectHotspot,
  onGameplayChange,
  onCrewRadioMessage,
}: PhaserLunarRPGProps) {
  const { lang, tr } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hudCardRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const walkToStationRef = useRef<((decisionId: number, openWhenArrived: boolean) => void) | null>(null);
  const walkToWorldXYRef = useRef<((wx: number, wy: number) => void) | null>(null);
  const applyWorldStateRef = useRef<(() => void) | null>(null);
  const toggleVehicleRef = useRef<((driveRover: boolean) => void) | null>(null);

  const [nearbyBuilding, setNearbyBuilding] = useState<RpgBuildingMeta | null>(RPG_BUILDINGS[0]);
  const [drivingRover, setDrivingRover] = useState(false);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [recentDiscovery, setRecentDiscovery] = useState<FieldSampleNode | null>(null);
  const [playerNormPos, setPlayerNormPos] = useState<{ x: number; y: number }>({ x: 0.22, y: 0.35 });
  const [codexOpen, setCodexOpen] = useState(false);

  // Interactive Hands-On Mini-Game States
  const [solarAngleDeg, setSolarAngleDeg] = useState<number>(65);
  const [solarAligned, setSolarAligned] = useState<boolean>(false);
  const [powerRoute, setPowerRoute] = useState<PowerRouteMode>('heaters');
  const [iceCoresDrilled, setIceCoresDrilled] = useState<number>(0);
  const [laserHeatPct, setLaserHeatPct] = useState<number>(0);
  const [isDrillingIce, setIsDrillingIce] = useState<boolean>(false);
  const [insideShelter, setInsideShelter] = useState<boolean>(false);
  const [insideBuildingId, setInsideBuildingId] = useState<number | null>(null);
  const [stormExposureMsv, setStormExposureMsv] = useState<number>(0);
  const [stormWaveCountdownSec, setStormWaveCountdownSec] = useState<number>(12);
  const [stormWaveDeflected, setStormWaveDeflected] = useState<boolean>(false);

  const activeRun = runB ?? runA;

  // GSAP subtle entrance animation when active step widget changes
  useEffect(() => {
    if (hudCardRef.current) {
      gsap.fromTo(
        hudCardRef.current,
        { y: -10, opacity: 0.4 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
      );
    }
  }, [viewStep]);

  // Report live bonuses upward to App.tsx so HUD progress bars & radio ticker stay synced
  useEffect(() => {
    onGameplayChange?.({
      solarAligned,
      solarAngleDeg,
      powerRoute,
      iceCoresDrilled,
      samplesCollected: collectedIds.length,
      insideShelter,
      stormExposureMsv,
      stormWaveCountdownSec,
      stormWaveDeflected,
      laserHeatPct,
      isDrillingIce,
    });
  }, [
    solarAligned,
    solarAngleDeg,
    powerRoute,
    iceCoresDrilled,
    collectedIds.length,
    insideShelter,
    stormExposureMsv,
    stormWaveCountdownSec,
    stormWaveDeflected,
    laserHeatPct,
    isDrillingIce,
    onGameplayChange,
  ]);

  const handleCyclePowerRoute = (explicitRoute?: PowerRouteMode) => {
    const order: PowerRouteMode[] = ['heaters', 'drill', 'shields'];
    const next = explicitRoute ?? order[(order.indexOf(powerRoute) + 1) % order.length];
    setPowerRoute(next);
    soundFX.play('choice');

    const routeMessages: Record<PowerRouteMode, Bilingual> = {
      heaters: {
        en: '“HVDC Power routed to D2 Habitat Heaters (+5% ECLSS Life Support protection during 90 K Shadow)!”',
        az: '“HVDC Enerji D2 Yaşayış Qızdırıcılarına yönləndirildi (+5% ECLSS Həyat Təminatı qorunması)!”',
      },
      drill: {
        en: '“HVDC Power routed to D4 Cold-Trap Cryo Drill (1.5× Laser Drill speed & +4 Science Points)!”',
        az: '“HVDC Enerji D4 Buz Qazma Qurğusuna yönləndirildi (1.5× Lazer sürəti və +4 Elm Xalı)!”',
      },
      shields: {
        en: '“HVDC Power routed to D5 Storm Bunker Deflector (−3.5 mSv radiation dose during Solar Storm)!”',
        az: '“HVDC Enerji D5 Fırtına Sığınacağı Qalxanına yönləndirildi (−3.5 mSv radiasiya azalması)!”',
      },
    };
    onCrewRadioMessage?.(
      { en: 'Eng. Leyla · HVDC Power Grid [P]', az: 'Mühəndis Leyla · HVDC Enerji Şəbəkəsi [P]' },
      routeMessages[next],
      'leyla',
    );
    applyWorldStateRef.current?.();
  };

  const handleSolarRotate = (nextDeg: number) => {
    const norm = ((nextDeg % 360) + 360) % 360;
    setSolarAngleDeg(norm);
    const aligned = Math.abs(norm - 128) <= 14;
    if (aligned && !solarAligned) {
      soundFX.play('solarLock');
      setSolarAligned(true);
      confetti({ particleCount: 35, spread: 55, origin: { x: 0.85, y: 0.25 } });
      onCrewRadioMessage?.(
        { en: 'Eng. Leyla · VSAT Telemetry', az: 'Mühəndis Leyla · Günəş Telemetriyası' },
        {
          en: '“1.5° grazing sun vector LOCKED at 128°! Photovoltaic mast efficiency boosted by +4.0 kWh!”',
          az: '“1.5° üfüqi günəş bucağı 128°-də KİLİDLƏNDİ! Günəş qülləsinin gücü +4.0 kVt·s artdı!”',
        },
        'leyla',
      );
    } else if (!aligned && solarAligned) {
      setSolarAligned(false);
    }
    applyWorldStateRef.current?.();
  };

  const handleCollectSample = (sample: FieldSampleNode) => {
    setCollectedIds((prev) => {
      if (prev.includes(sample.id)) return prev;
      soundFX.play('hotspot');
      setRecentDiscovery(sample);
      const nextList = [...prev, sample.id];
      if (nextList.length === FIELD_SAMPLES.length) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
      onCrewRadioMessage?.(
        { en: `Field Lab · ${sample.Instrument}`, az: `Səhra Lab · ${sample.Instrument}` },
        sample.fact,
        'azer',
      );
      return nextList;
    });
  };

  const handleDrillIceCore = (totalCores: number) => {
    setIceCoresDrilled(totalCores);
    soundFX.play('hotspot');
    confetti({ particleCount: 28, spread: 50, origin: { x: 0.75, y: 0.65 } });
    onCrewRadioMessage?.(
      { en: 'VIPER-Jr Laser Drill · 90 K Crater', az: 'VIPER-Jr Lazer Qazma · 90 K Krater' },
      {
        en: `“Core #${totalCores} extracted from 90 K cold trap! Melted & electrolyzed for +2% ECLSS Life Support & +3 Science!”`,
        az: `“90 K soyuq tələdən #${totalCores} buz nüvəsi çıxarıldı! +2% Həyat Təminatı və +3 Elm əlavə olundu!”`,
      },
      'rover',
    );
  };

  const bridgeRef = useRef<BridgeState>({
    runA,
    runB,
    activeRun,
    viewStep,
    lang,
    drivingRover,
    solarAngleDeg,
    solarAligned,
    powerRoute,
    onNearBuilding: setNearbyBuilding,
    onOpenDecisionModal,
    onSelectStep,
    onCollectSample: handleCollectSample,
    onDrillIceCore: handleDrillIceCore,
    onCyclePowerRoute: handleCyclePowerRoute,
    onUpdateLaserState: (heat, drilling) => {
      setLaserHeatPct(heat);
      setIsDrillingIce(drilling);
    },
    onUpdateShelterState: (inside, bId, dose, waveSec, deflected) => {
      setInsideShelter(inside);
      setInsideBuildingId(bId);
      setStormExposureMsv(dose);
      setStormWaveCountdownSec(waveSec);
      setStormWaveDeflected(deflected);
    },
    onUpdatePlayerPos: setPlayerNormPos,
  });

  bridgeRef.current = {
    runA,
    runB,
    activeRun,
    viewStep,
    lang,
    drivingRover,
    solarAngleDeg,
    solarAligned,
    powerRoute,
    onNearBuilding: setNearbyBuilding,
    onOpenDecisionModal,
    onSelectStep,
    onCollectSample: handleCollectSample,
    onDrillIceCore: handleDrillIceCore,
    onCyclePowerRoute: handleCyclePowerRoute,
    onUpdateLaserState: (heat, drilling) => {
      setLaserHeatPct(heat);
      setIsDrillingIce(drilling);
    },
    onUpdateShelterState: (inside, bId, dose, waveSec, deflected) => {
      setInsideShelter(inside);
      setInsideBuildingId(bId);
      setStormExposureMsv(dose);
      setStormWaveCountdownSec(waveSec);
      setStormWaveDeflected(deflected);
    },
    onUpdatePlayerPos: setPlayerNormPos,
  };

  useEffect(() => {
    applyWorldStateRef.current?.();
  }, [activeRun, runA, runB, viewStep, lang, solarAngleDeg, solarAligned, powerRoute]);

  const prevStepRef = useRef<number>(viewStep);
  useEffect(() => {
    if (prevStepRef.current !== viewStep) {
      prevStepRef.current = viewStep;
      if (viewStep === 4 && !drivingRover) {
        setDrivingRover(true);
        toggleVehicleRef.current?.(true);
      }
      walkToStationRef.current?.(viewStep, false);
    }
  }, [viewStep, drivingRover]);

  useEffect(() => {
    if (!containerRef.current) return;

    class LunarOutpostScene extends Phaser.Scene {
      private player!: Phaser.Physics.Arcade.Sprite;
      private companionSprite!: Phaser.GameObjects.Sprite;
      private rover!: Phaser.Physics.Arcade.Sprite;
      private ghostRunA!: Phaser.GameObjects.Sprite;
      private ghostPill!: Phaser.GameObjects.Container;

      private playerLongShadow!: Phaser.GameObjects.Ellipse;
      private roverLongShadow!: Phaser.GameObjects.Ellipse;
      private playerNamePill!: Phaser.GameObjects.Container;
      private playerNameText!: Phaser.GameObjects.Text;
      private targetRing!: Phaser.GameObjects.Arc;
      private pathLine!: Phaser.GameObjects.Graphics;

      // Dynamic weather & additive lighting layers
      private twilightOverlay!: Phaser.GameObjects.Rectangle;
      private lampGlows: Phaser.GameObjects.Arc[] = [];
      private flashlightCone!: Phaser.GameObjects.Triangle;
      private shieldDomeGraphic!: Phaser.GameObjects.Arc;
      private habShieldDomeGraphic!: Phaser.GameObjects.Arc;
      private protonLines: Phaser.GameObjects.Line[] = [];
      private stormShockwaves: Phaser.GameObjects.Arc[] = [];

      // Sweeping Red Proton Wave Front during Decision 5 Solar Storm Dash
      private stormWaveWall!: Phaser.GameObjects.Graphics;
      private stormWaveX = 0;
      private stormWaveCountdown = 12.0;
      private stormWaveDeflected = false;

      // Interactive Power Conduits & Animated Energy Pulses
      private conduitGraphics!: Phaser.GameObjects.Graphics;
      private powerPulses: Phaser.GameObjects.Arc[] = [];

      // Rotatable D1 Solar Array Wing Indicator
      private solarWingGraphic!: Phaser.GameObjects.Graphics;
      private solarRayBeam!: Phaser.GameObjects.Graphics;

      // Building sprites, walkable interior cutaways, and sleek holographic pills
      private buildingSprites = new Map<number, Phaser.GameObjects.Image>();
      private buildingCutaways = new Map<number, Phaser.GameObjects.Container>();
      private buildingPills = new Map<
        number,
        {
          container: Phaser.GameObjects.Container;
          bg: Phaser.GameObjects.Graphics;
          titleTxt: Phaser.GameObjects.Text;
          subTxt: Phaser.GameObjects.Text;
          questArrow: Phaser.GameObjects.Text;
        }
      >();

      // Collectible Field Science Nodes
      private sampleSprites = new Map<string, Phaser.GameObjects.Container>();
      private collectedSet = new Set<string>();

      // Interactive 90 K Ice Boulders for Active Laser Drilling
      private iceBoulderMap = new Map<
        string,
        {
          node: IceBoulderNode;
          container: Phaser.GameObjects.Container;
          hp: number;
          hpBar: Phaser.GameObjects.Rectangle;
          harvested: boolean;
        }
      >();
      private activeLaserGraphics!: Phaser.GameObjects.Graphics;
      private laserHeat = 0;
      private laserOverheatedUntil = 0;
      private totalCoresExtracted = 0;
      private drillSoundTimer = 0;

      // Outdoor Solar Storm Survival state
      private stormDoseAccum = 0;
      private geigerTimer = 0;
      private lastInsideShelter = false;
      private lastInsideBuildingId: number | null = null;

      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private keys!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        E: Phaser.Input.Keyboard.Key;
        V: Phaser.Input.Keyboard.Key;
        P: Phaser.Input.Keyboard.Key;
        SPACE: Phaser.Input.Keyboard.Key;
      };

      private autoTarget: { x: number; y: number; openDecisionId?: number } | null = null;
      private currentNearestId: number | null = null;
      private stepDustTimer = 0;

      constructor() {
        super({ key: 'LunarOutpostScene' });
      }

      preload() {
        this.load.svg('astronaut_player', '/assets/astronaut_player.svg', { width: 96, height: 112 });
        this.load.svg('astronaut_companion', '/assets/astronaut_companion.svg', { width: 92, height: 108 });
        this.load.svg('rover_viper', '/assets/rover_viper.svg', { width: 140, height: 130 });
        this.load.svg('station_d1_solar', '/assets/station_d1_solar.svg', { width: 280, height: 260 });
        this.load.svg('station_d2_habitat', '/assets/station_d2_habitat.svg', { width: 300, height: 270 });
        this.load.svg('station_d3_reactor', '/assets/station_d3_reactor.svg', { width: 270, height: 260 });
        this.load.svg('station_d4_icemine', '/assets/station_d4_icemine.svg', { width: 280, height: 265 });
        this.load.svg('station_d5_bunker', '/assets/station_d5_bunker.svg', { width: 290, height: 265 });
        this.load.svg('station_d6_ascent', '/assets/station_d6_ascent.svg', { width: 280, height: 275 });
      }

      create() {
        // 1. Paint Seamless 2.5D Organic Lunar South Pole Terrain (with 3D stepped cliffs & raised metallic boardwalks)
        this.createOrganicLunarLandscape();
        this.add.image(WORLD_W / 2, WORLD_H / 2, 'lunar_organic_world').setDepth(1);

        const wallGroup = this.physics.add.staticGroup();
        const northCliff = wallGroup.create(WORLD_W / 2, 76, undefined) as Phaser.Physics.Arcade.Sprite;
        northCliff.setDisplaySize(WORLD_W, 152).setVisible(false).refreshBody();

        // 2. Interactive HVDC Power Conduits & Animated Energy Pulses (Clickable on Map!)
        this.conduitGraphics = this.add.graphics().setDepth(3);
        for (let i = 0; i < 9; i++) {
          const pulse = this.add
            .circle(0, 0, 6, 0xfacc15, 0.95)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(4);
          this.powerPulses.push(pulse);
        }

        // Create 3 interactive hit zones along the main power conduits so clicking a cable routes power!
        const createConduitClickZone = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          route: PowerRouteMode,
        ) => {
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const zone = this.add
            .zone(mx, my, Math.hypot(x2 - x1, y2 - y1) * 0.7, 36)
            .setDepth(6)
            .setInteractive({ useHandCursor: true });
          zone.on('pointerdown', () => {
            bridgeRef.current.onCyclePowerRoute(route);
          });
        };
        createConduitClickZone(8 * 64, 16 * 64, 17 * 64, 6.4 * 64, 'heaters');
        createConduitClickZone(18 * 64, 16 * 64, 28 * 64, 16.8 * 64, 'drill');
        createConduitClickZone(8 * 64, 16 * 64, 18 * 64, 16.2 * 64, 'shields');

        // 2B. Additive Lamp-Posts along Raised Boardwalks
        const lampCoords = [
          [6, 9],
          [12, 9],
          [16, 9],
          [21, 9],
          [27, 9],
          [6, 14],
          [12, 18],
          [16, 14],
          [22, 18],
          [25, 13],
        ];
        lampCoords.forEach(([lc, lr]) => {
          const lx = lc * TILE_SIZE + 32;
          const ly = lr * TILE_SIZE + 32;
          const poleShadow = this.add.graphics().setDepth(2);
          poleShadow.fillStyle(0x020617, 0.58);
          poleShadow.fillTriangle(lx, ly - 3, lx, ly + 3, lx + 72, ly + 34);

          const glow = this.add
            .circle(lx, ly, 88, 0x38bdf8, 0.16)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(4);
          this.lampGlows.push(glow);
          this.add.circle(lx, ly, 6, 0x1e293b).setStrokeStyle(2, 0x475569).setDepth(5);
          this.add
            .circle(lx, ly, 3.5, 0xe0f2fe)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(5);
        });

        // 3. Spawn 6 Collectible NASA Field Science Sample Nodes with Additive Glow
        FIELD_SAMPLES.forEach((s) => {
          const sx = s.tileX * TILE_SIZE;
          const sy = s.tileY * TILE_SIZE;

          const shadow = this.add.ellipse(18, 10, 36, 12, 0x020617, 0.6);
          const additiveHalo = this.add
            .circle(0, 0, 32, s.colorHex, 0.28)
            .setBlendMode(Phaser.BlendModes.ADD);
          const outerRing = this.add.circle(0, 0, 19, s.colorHex, 0.22).setStrokeStyle(2, s.colorHex, 0.95);
          const crystal = this.add.star(0, 0, 5, 6, 13, s.colorHex, 1).setStrokeStyle(1.5, 0xffffff);

          const pillBg = this.add.graphics();
          pillBg.fillStyle(0x0f172a, 0.92);
          pillBg.lineStyle(1.5, s.colorHex, 0.95);
          pillBg.fillRoundedRect(-52, -38, 104, 20, 6);
          pillBg.strokeRoundedRect(-52, -38, 104, 20, 6);

          const tag = this.add
            .text(0, -28, `✦ ${s.Instrument}`, {
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontStyle: 'bold',
              color: '#f8fafc',
            })
            .setOrigin(0.5);

          const nodeContainer = this.add
            .container(sx, sy, [shadow, additiveHalo, outerRing, crystal, pillBg, tag])
            .setSize(48, 48)
            .setDepth(100 + Math.round(sy))
            .setInteractive({ useHandCursor: true });

          nodeContainer.on('pointerdown', () => {
            soundFX.play('StepNav');
            this.walkPlayerTo(sx, sy);
          });

          this.tweens.add({
            targets: crystal,
            angle: 360,
            duration: 5000,
            repeat: -1,
          });
          this.tweens.add({
            targets: additiveHalo,
            scaleX: 1.35,
            scaleY: 1.35,
            alpha: 0.08,
            duration: 950,
            yoyo: true,
            repeat: -1,
          });

          this.sampleSprites.set(s.id, nodeContainer);
        });

        // 4. Spawn 5 Laser-Drillable 90 K Water-Ice Boulders in the Cold-Trap Crater
        ICE_BOULDERS.forEach((b) => {
          const bx = b.tileX * TILE_SIZE;
          const by = b.tileY * TILE_SIZE;

          const shadow = this.add.ellipse(34, 16, b.radius * 2.8, b.radius * 1.1, 0x020617, 0.7);
          const glow = this.add
            .circle(0, 0, b.radius * 1.4, 0x22d3ee, 0.25)
            .setBlendMode(Phaser.BlendModes.ADD);

          const rockGfx = this.add.graphics();
          rockGfx.fillStyle(0x0e7490, 1);
          rockGfx.fillCircle(0, 0, b.radius);
          rockGfx.fillStyle(0x22d3ee, 0.85);
          rockGfx.fillTriangle(-b.radius * 0.6, b.radius * 0.3, -4, -b.radius * 0.85, b.radius * 0.5, b.radius * 0.2);
          rockGfx.fillStyle(0xa5f3fc, 0.9);
          rockGfx.fillTriangle(0, b.radius * 0.4, b.radius * 0.3, -b.radius * 0.6, b.radius * 0.75, b.radius * 0.25);
          rockGfx.lineStyle(2, 0x67e8f9, 0.9);
          rockGfx.strokeCircle(0, 0, b.radius);

          const hpBg = this.add.rectangle(0, -b.radius - 12, 48, 7, 0x0f172a, 0.92).setStrokeStyle(1, 0x22d3ee);
          const hpBar = this.add.rectangle(-23, -b.radius - 12, 46, 5, 0x22d3ee, 1).setOrigin(0, 0.5);
          const hintTxt = this.add
            .text(0, b.radius + 12, 'H₂O ICE [LASER]', {
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              fontStyle: 'bold',
              color: '#67e8f9',
            })
            .setOrigin(0.5);

          const container = this.add
            .container(bx, by, [shadow, glow, rockGfx, hpBg, hpBar, hintTxt])
            .setSize(b.radius * 2, b.radius * 2)
            .setDepth(100 + Math.round(by))
            .setInteractive({ useHandCursor: true });

          container.on('pointerdown', () => {
            soundFX.play('StepNav');
            this.walkPlayerTo(bx - 75, by);
          });

          this.iceBoulderMap.set(b.id, {
            node: b,
            container,
            hp: 100,
            hpBar,
            harvested: false,
          });
        });

        this.activeLaserGraphics = this.add.graphics().setDepth(2100);

        // 5. Place All 6 Extruded 2.5D 3/4-Perspective Buildings with Y-Depth Sorting
        RPG_BUILDINGS.forEach((b) => {
          const bx = b.tileX * TILE_SIZE + 32;
          const by = b.tileY * TILE_SIZE + 90; // Bottom-center baseline of extruded 2.5D structure
          const centerY = b.tileY * TILE_SIZE + 32;
          const doorX = b.doorTileX * TILE_SIZE + 32;
          const doorY = b.doorTileY * TILE_SIZE + 32;

          // 5A. Long 1.5° Grazing Sun Directional Shadow stretching South-East behind every building
          const bShadow = this.add.graphics().setDepth(2);
          bShadow.fillStyle(0x020617, 0.65);
          bShadow.beginPath();
          bShadow.moveTo(bx - b.widthPx * 0.36, centerY + b.heightPx * 0.18);
          bShadow.lineTo(bx + b.widthPx * 0.38, centerY - b.heightPx * 0.22);
          bShadow.lineTo(bx + b.widthPx * 0.38 + 190, centerY - b.heightPx * 0.22 + 112);
          bShadow.lineTo(bx - b.widthPx * 0.36 + 170, centerY + b.heightPx * 0.18 + 120);
          bShadow.closePath();
          bShadow.fillPath();

          // 5B. Additive Window / Conduit Glow around each building
          this.add
            .circle(bx, centerY, Math.max(b.widthPx, b.heightPx) * 0.56, b.accentHex, 0.15)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(4);

          // 5C. Walkable Interior Cutaway Room for D2 (Habitat Dome) & D5 (Radiation Bunker)
          if (b.hasInteriorCutaway) {
            const cutaway = this.createBuildingInteriorCutaway(bx, centerY, b);
            this.buildingCutaways.set(b.decisionId, cutaway);
          }

          // 5D. Pulsing Entrance Beacon Pad at Door
          const halo = this.add
            .circle(doorX, doorY, 28, b.accentHex, 0.22)
            .setStrokeStyle(2.5, b.accentHex, 0.9)
            .setDepth(5);

          this.tweens.add({
            targets: halo,
            scaleX: 1.18,
            scaleY: 1.18,
            alpha: 0.4,
            duration: 950,
            yoyo: true,
            repeat: -1,
          });

          // 5E. Extruded 2.5D Building Sprite with origin(0.5, 0.82) for true Y-Depth Sorting!
          const sprite = this.add
            .image(bx, by, b.spriteKey)
            .setOrigin(0.5, 0.82)
            .setDisplaySize(b.widthPx, b.heightPx)
            .setDepth(100 + Math.round(by))
            .setInteractive({ useHandCursor: true });

          sprite.on('pointerdown', () => {
            soundFX.play('StepNav');
            if (b.hasInteriorCutaway) {
              this.walkPlayerTo(bx, centerY + 12, b.decisionId);
            } else {
              this.walkPlayerTo(doorX, doorY, b.decisionId);
            }
          });

          this.buildingSprites.set(b.decisionId, sprite);

          // Only add solid physics collider to upper footprint of non-cutaway buildings
          if (!b.hasInteriorCutaway) {
            const collider = wallGroup.create(bx, centerY - 22, undefined) as Phaser.Physics.Arcade.Sprite;
            collider
              .setDisplaySize(b.widthPx * 0.62, b.heightPx * 0.42)
              .setVisible(false)
              .refreshBody();
          }

          // 5F. Sleek Dark-Glass Holographic Pill with Larger, High-Contrast Typography (13px-14px bold)
          const pillBg = this.add.graphics();
          const titleTxt = this.add
            .text(0, -6, b.shortCode, {
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              fontStyle: 'bold',
              color: '#ffffff',
            })
            .setOrigin(0.5);

          const subTxt = this.add
            .text(0, 10, '', {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '12px',
              fontStyle: 'bold',
              color: '#38bdf8',
            })
            .setOrigin(0.5);

          const questArrow = this.add
            .text(0, -32, '▼ ACTIVE OBJECTIVE [E]', {
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontStyle: 'bold',
              color: '#fde047',
              backgroundColor: 'rgba(15,23,42,0.95)',
              padding: { left: 8, right: 8, top: 3, bottom: 3 },
            })
            .setOrigin(0.5);

          const pillContainer = this.add
            .container(bx, centerY - b.heightPx / 2 - 12, [pillBg, titleTxt, subTxt, questArrow])
            .setDepth(2400);

          this.tweens.add({
            targets: questArrow,
            y: -38,
            duration: 550,
            yoyo: true,
            repeat: -1,
          });

          this.buildingPills.set(b.decisionId, {
            container: pillContainer,
            bg: pillBg,
            titleTxt,
            subTxt,
            questArrow,
          });
        });

        // 5G. Interactive Rotatable Solar Array Wing & Grazing Sun Ray on D1
        this.solarRayBeam = this.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
        this.solarWingGraphic = this.add.graphics().setDepth(2150);

        // 6. Cyan Radiation Shield Domes over Storm Bunker (D5) & Habitat (D2)
        this.shieldDomeGraphic = this.add
          .circle(18 * TILE_SIZE + 32, 16.2 * TILE_SIZE + 32, 168, 0x22d3ee, 0.15)
          .setStrokeStyle(3.5, 0x67e8f9, 0.88)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(2050)
          .setVisible(false);

        this.habShieldDomeGraphic = this.add
          .circle(17 * TILE_SIZE + 32, 6.4 * TILE_SIZE + 32, 178, 0x22d3ee, 0.13)
          .setStrokeStyle(3, 0x67e8f9, 0.78)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(2050)
          .setVisible(false);

        this.tweens.add({
          targets: [this.shieldDomeGraphic, this.habShieldDomeGraphic],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 1200,
          yoyo: true,
          repeat: -1,
        });

        // 7. Companion Astronaut (Eng. Leyla) with Long 1.5° Shadow & Holographic Tag
        const compX = 15 * TILE_SIZE + 32;
        const compY = 9.5 * TILE_SIZE;
        this.add
          .ellipse(compX + 26, compY + 6, 68, 16, 0x020617, 0.62)
          .setRotation(0.35)
          .setDepth(13);

        this.companionSprite = this.add
          .sprite(compX, compY, 'astronaut_companion')
          .setOrigin(0.5, 0.85)
          .setDisplaySize(68, 80)
          .setDepth(100 + Math.round(compY))
          .setInteractive({ useHandCursor: true });

        this.tweens.add({
          targets: this.companionSprite,
          y: compY - 4,
          duration: 1300,
          yoyo: true,
          repeat: -1,
        });

        const compTagBg = this.add.graphics().setDepth(2300);
        compTagBg.fillStyle(0x0f172a, 0.9);
        compTagBg.lineStyle(1.2, 0x38bdf8, 0.9);
        compTagBg.fillRoundedRect(compX - 64, compY - 82, 128, 20, 6);
        compTagBg.strokeRoundedRect(compX - 64, compY - 82, 128, 20, 6);
        this.add
          .text(compX, compY - 72, 'Eng. Leyla · ECLSS', {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#bae6fd',
          })
          .setOrigin(0.5)
          .setDepth(2301);

        // Run A Ghost Replay Sprite (visible when Run B is active!)
        this.ghostRunA = this.add
          .sprite(8 * TILE_SIZE, 18.5 * TILE_SIZE, 'astronaut_player')
          .setOrigin(0.5, 0.85)
          .setDisplaySize(70, 82)
          .setTint(0xe879f9)
          .setAlpha(0.62)
          .setDepth(1900)
          .setVisible(false);

        const gBg = this.add.graphics();
        gBg.fillStyle(0x4a044e, 0.92);
        gBg.lineStyle(1.5, 0xf0abfc, 0.95);
        gBg.fillRoundedRect(-76, -11, 152, 22, 6);
        gBg.strokeRoundedRect(-76, -11, 152, 22, 6);
        const gTxt = this.add
          .text(0, 0, 'GHOST · RUN A', {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#fae8ff',
          })
          .setOrigin(0.5);
        this.ghostPill = this.add
          .container(8 * TILE_SIZE, 18.5 * TILE_SIZE - 78, [gBg, gTxt])
          .setDepth(2450)
          .setVisible(false);

        // 8. VIPER-Jr Ice Rover (Drivable!) with Long 1.5° Shadow & Y-Depth Sorting
        const roverX = 24.5 * TILE_SIZE;
        const roverY = 16.8 * TILE_SIZE;
        this.roverLongShadow = this.add
          .ellipse(roverX + 36, roverY + 6, 98, 26, 0x020617, 0.65)
          .setRotation(0.32)
          .setDepth(13);

        this.rover = this.physics.add
          .sprite(roverX, roverY, 'rover_viper')
          .setOrigin(0.5, 0.82)
          .setDisplaySize(104, 96)
          .setDepth(100 + Math.round(roverY))
          .setInteractive({ useHandCursor: true });

        this.rover.on('pointerdown', () => {
          soundFX.play('choice');
          const nextDrive = !bridgeRef.current.drivingRover;
          toggleVehicleRef.current?.(nextDrive);
        });

        // 9. Spawn Playable Junior Astronaut (Commander Azer) with 2.5D Y-Depth Sorting
        const startB = RPG_BUILDINGS[bridgeRef.current.viewStep - 1] ?? RPG_BUILDINGS[0];
        const startX = startB.doorTileX * TILE_SIZE + 32;
        const startY = (startB.doorTileY + 1.0) * TILE_SIZE;

        this.pathLine = this.add.graphics().setDepth(5);
        this.targetRing = this.add
          .circle(startX, startY, 20, 0x38bdf8, 0.22)
          .setStrokeStyle(2, 0x38bdf8)
          .setDepth(5)
          .setVisible(false);

        this.playerLongShadow = this.add
          .ellipse(startX + 28, startY + 6, 76, 18, 0x020617, 0.65)
          .setRotation(0.34)
          .setDepth(14);

        this.flashlightCone = this.add
          .triangle(startX, startY - 24, 0, 0, -75, -180, 75, -180, 0xe0f2fe, 0.25)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(2100)
          .setVisible(false);

        this.player = this.physics.add
          .sprite(startX, startY, 'astronaut_player')
          .setOrigin(0.5, 0.85)
          .setDisplaySize(76, 88)
          .setDepth(100 + Math.round(startY))
          .setCollideWorldBounds(true);

        this.player.body?.setSize(42, 36).setOffset(27, 68);
        this.physics.add.collider(this.player, wallGroup);

        const pPillBg = this.add.graphics();
        pPillBg.fillStyle(0x0f172a, 0.92);
        pPillBg.lineStyle(1.8, 0x38bdf8, 0.95);
        pPillBg.fillRoundedRect(-66, -12, 132, 24, 8);
        pPillBg.strokeRoundedRect(-66, -12, 132, 24, 8);
        this.playerNameText = this.add
          .text(0, 0, '★ Cmdr. Azer', {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#38bdf8',
          })
          .setOrigin(0.5);
        this.playerNamePill = this.add
          .container(startX, startY - 82, [pPillBg, this.playerNameText])
          .setDepth(2500);

        // 10. Weather Layers: LRO 72h Shadow Veil (Decision 3) & DONKI Solar Proton Wave Wall (Decision 5)
        this.twilightOverlay = this.add
          .rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x020617, 0.52)
          .setDepth(2000)
          .setVisible(false);

        for (let i = 0; i < 34; i++) {
          const px = Phaser.Math.Between(80, WORLD_W - 80);
          const py = Phaser.Math.Between(80, WORLD_H - 80);
          const line = this.add
            .line(0, 0, px, py, px + 46, py + 28, i % 2 === 0 ? 0xf43f5e : 0xfb923c, 0.9)
            .setLineWidth(3)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(2200)
            .setVisible(false);
          this.protonLines.push(line);
        }

        for (let s = 0; s < 3; s++) {
          const wave = this.add
            .circle(WORLD_W * (0.25 + s * 0.25), WORLD_H * 0.5, 40 + s * 140, 0xf43f5e, 0.06)
            .setStrokeStyle(2.5, 0xf43f5e, 0.65)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(2180)
            .setVisible(false);
          this.stormShockwaves.push(wave);
        }

        this.stormWaveWall = this.add
          .graphics()
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(2250)
          .setVisible(false);

        // 11. Camera Zoom, Smooth Follow & WebGL PostFX Bloom + Vignette Shaders!
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
        const cam = this.cameras.main;
        cam.setBounds(0, 0, WORLD_W, WORLD_H);
        const minZoomToFill = Math.max(this.scale.width / WORLD_W, this.scale.height / WORLD_H, 1.38);
        cam.setZoom(minZoomToFill);
        cam.startFollow(this.player, true, 0.1, 0.1);

        // Attach Phaser WebGL PostFX Shaders (Bloom + Vignette) with safe fallback
        try {
          const fxCam = cam as unknown as {
            postFX?: {
              addBloom: (color: number, offsetX: number, offsetY: number, blurStrength: number, strength: number) => void;
              addVignette: (x: number, y: number, radius: number, strength: number) => void;
            };
          };
          if (fxCam.postFX) {
            fxCam.postFX.addBloom(0xffffff, 1, 1, 1.12, 1.15);
            fxCam.postFX.addVignette(0.5, 0.5, 0.94, 0.2);
          }
        } catch {
          // Canvas fallback if WebGL postFX is unavailable
        }

        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
          const z = Math.max(gameSize.width / WORLD_W, gameSize.height / WORLD_H, 1.38);
          cam.setZoom(z);
        });

        // 12. Input Setup: WASD, Arrow Keys, [E] Interact, [V] Rover, [P] Power Route, [SPACE] Laser Drill
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,V,P,SPACE') as {
          W: Phaser.Input.Keyboard.Key;
          A: Phaser.Input.Keyboard.Key;
          S: Phaser.Input.Keyboard.Key;
          D: Phaser.Input.Keyboard.Key;
          E: Phaser.Input.Keyboard.Key;
          V: Phaser.Input.Keyboard.Key;
          P: Phaser.Input.Keyboard.Key;
          SPACE: Phaser.Input.Keyboard.Key;
        };

        this.keys.E.on('down', () => {
          const targetId = this.currentNearestId ?? bridgeRef.current.viewStep;
          soundFX.play('choice');
          bridgeRef.current.onSelectStep(targetId);
          bridgeRef.current.onOpenDecisionModal(targetId);
        });

        this.keys.V.on('down', () => {
          soundFX.play('choice');
          toggleVehicleRef.current?.(!bridgeRef.current.drivingRover);
        });

        this.keys.P.on('down', () => {
          bridgeRef.current.onCyclePowerRoute();
        });

        this.input.on(
          'pointerdown',
          (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
            if (currentlyOver.length > 0) return;
            soundFX.play('StepNav');
            this.walkPlayerTo(pointer.worldX, pointer.worldY);
          },
        );

        walkToStationRef.current = (decisionId: number, openWhenArrived: boolean) => {
          const b = RPG_BUILDINGS.find((x) => x.decisionId === decisionId);
          if (!b) return;
          const dx = b.hasInteriorCutaway ? b.tileX * TILE_SIZE + 32 : b.doorTileX * TILE_SIZE + 32;
          const dy = b.hasInteriorCutaway ? b.tileY * TILE_SIZE + 44 : b.doorTileY * TILE_SIZE + 32;
          this.walkPlayerTo(dx, dy, openWhenArrived ? decisionId : undefined);
        };

        walkToWorldXYRef.current = (wx: number, wy: number) => {
          this.walkPlayerTo(wx, wy);
        };

        toggleVehicleRef.current = (driveRover: boolean) => {
          setDrivingRover(driveRover);
          if (driveRover) {
            this.player.setTexture('rover_viper').setDisplaySize(104, 96);
            this.rover.setVisible(false);
            this.roverLongShadow.setVisible(false);
            this.playerNameText.setText('🚜 VIPER-Jr [V]').setColor('#fde047');
          } else {
            this.player.setTexture('astronaut_player').setDisplaySize(76, 88);
            this.rover.setPosition(this.player.x + 72, this.player.y).setVisible(true);
            this.roverLongShadow.setPosition(this.player.x + 108, this.player.y + 6).setVisible(true);
            this.playerNameText.setText('★ Cmdr. Azer').setColor('#38bdf8');
          }
        };

        applyWorldStateRef.current = () => {
          this.syncVisualState();
        };

        this.syncVisualState();
      }

      private createBuildingInteriorCutaway(
        bx: number,
        by: number,
        b: RpgBuildingMeta,
      ): Phaser.GameObjects.Container {
        const g = this.add.graphics();
        const rx = b.widthPx * 0.44;
        const ry = b.heightPx * 0.4;

        g.fillStyle(0x0f172a, 0.96);
        g.fillEllipse(0, 0, rx * 2, ry * 2);
        g.lineStyle(5, b.decisionId === 2 ? 0x10b981 : 0x22d3ee, 0.92);
        g.strokeEllipse(0, 0, rx * 2, ry * 2);

        g.lineStyle(1, 0x334155, 0.75);
        g.strokeEllipse(0, 0, rx * 1.5, ry * 1.5);
        g.lineBetween(-rx * 0.85, 0, rx * 0.85, 0);
        g.lineBetween(0, -ry * 0.85, 0, ry * 0.85);

        if (b.decisionId === 2) {
          g.fillStyle(0x064e3b, 0.95);
          g.fillRoundedRect(-72, -48, 48, 22, 5);
          g.fillRoundedRect(-72, -16, 48, 22, 5);
          g.fillStyle(0x10b981, 0.95);
          for (let px = -64; px <= -32; px += 10) {
            g.fillCircle(px, -37, 4);
            g.fillCircle(px, -5, 4);
          }

          g.fillStyle(0x0c4a6e, 0.95);
          g.fillRoundedRect(24, -46, 50, 56, 6);
          g.lineStyle(2, 0x38bdf8, 0.9);
          g.strokeRoundedRect(24, -46, 50, 56, 6);
          g.fillStyle(0x38bdf8, 0.9);
          g.fillCircle(49, -28, 9);
          g.fillCircle(49, -4, 9);
        } else {
          g.lineStyle(10, 0x0284c7, 0.78);
          g.strokeEllipse(0, 0, rx * 1.72, ry * 1.72);
          g.lineStyle(4, 0x67e8f9, 0.92);
          g.strokeEllipse(0, 0, rx * 1.72, ry * 1.72);

          g.fillStyle(0x1e293b, 0.95);
          g.fillRoundedRect(-45, -30, 90, 44, 8);
          g.lineStyle(2, 0x22d3ee, 0.9);
          g.strokeRoundedRect(-45, -30, 90, 44, 8);
        }

        const label = this.add
          .text(
            0,
            ry * 0.58,
            b.decisionId === 2
              ? '🌱 HYDROPONICS & 98% ECLSS LOOP'
              : '🛡️ H₂O WATER-WALL SHIELD VAULT (6–15% DOSE)',
            {
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              fontStyle: 'bold',
              color: '#a5f3fc',
              backgroundColor: 'rgba(2,6,23,0.9)',
              padding: { left: 6, right: 6, top: 2, bottom: 2 },
            },
          )
          .setOrigin(0.5);

        return this.add.container(bx, by, [g, label]).setDepth(8);
      }

      private updateBuildingPill(
        b: RpgBuildingMeta,
        isNear: boolean,
        isActiveStep: boolean,
        choiceIdx: number | undefined,
        choiceSummary: string,
        langCode: 'en' | 'az',
      ) {
        const pill = this.buildingPills.get(b.decisionId);
        if (!pill) return;

        const done = choiceIdx !== undefined;
        const letter = done ? ['A', 'B', 'C'][choiceIdx!] : '';
        const expanded = isNear || isActiveStep;

        const headerStr = expanded
          ? `${b.shortCode} · ${b.title[langCode]}${done ? ` [${letter} ✓]` : ''}`
          : `${b.shortCode}${done ? ` · [${letter} ✓]` : ''}`;

        const subStr = isNear
          ? b.prompt[langCode]
          : done && expanded
            ? `✓ ${choiceSummary}`
            : '';

        pill.titleTxt.setText(headerStr);
        pill.subTxt.setText(subStr).setVisible(Boolean(subStr));
        pill.questArrow.setVisible(isActiveStep && !done);

        const padX = 14;
        const textW = Math.max(pill.titleTxt.width, subStr ? pill.subTxt.width : 0);
        const w = Math.max(136, textW + padX * 2);
        const h = subStr ? 44 : 26;

        pill.titleTxt.setY(subStr ? -8 : 0);
        pill.subTxt.setY(10);
        pill.questArrow.setY(-h / 2 - 15);

        pill.bg.clear();
        pill.bg.fillStyle(0x0f172a, expanded ? 0.94 : 0.86);
        const borderHex = isNear ? 0xfde047 : isActiveStep ? 0x38bdf8 : done ? 0x10b981 : 0x64748b;
        pill.bg.lineStyle(expanded ? 2.2 : 1.5, borderHex, 0.96);
        pill.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
        pill.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 9);
      }

      private walkPlayerTo(worldX: number, worldY: number, openDecisionId?: number) {
        const clampedX = Phaser.Math.Clamp(worldX, 96, WORLD_W - 96);
        const clampedY = Phaser.Math.Clamp(worldY, 160, WORLD_H - 84);
        this.autoTarget = { x: clampedX, y: clampedY, openDecisionId };
        this.targetRing.setPosition(clampedX, clampedY).setVisible(true);
      }

      private syncVisualState() {
        const {
          activeRun: run,
          runA: rA,
          runB: rB,
          viewStep: step,
          lang: curLang,
          solarAngleDeg: sAngle,
          solarAligned: sAligned,
          powerRoute: pRoute,
        } = bridgeRef.current;

        const choiceLabels: Record<number, [string, string, string]> = {
          1: ['10m VSAT Tower (40% shadow)', 'Low Deck Panels (15% shadow)', 'Battery-Only Mode'],
          2: ['Regolith Berm Shield (6% dose)', 'ISRU O₂ Plant (+8% LS)', 'Geophysics Array (+18 Sci)'],
          3: ['Survival Load-Shed', 'H₂/O₂ Fuel Cells (+18 kWh)', '90 K Cold-Trap Drill (+20 Sci)'],
          4: ['Crewed Rover Traverse', 'Battery & ECLSS Overhaul', 'Teleop Robotic Scout'],
          5: ['Storm EVA (+36.8 mSv!)', 'Habitat Shelter (25% dose)', 'Water-Wall Bunker (15%/6%)'],
          6: ['Sample Cache EVA', 'Nominal Stow & Safe', 'High-Rate Earth Downlink'],
        };

        RPG_BUILDINGS.forEach((b) => {
          const chIdx = run.choices[b.decisionId - 1];
          const summary = chIdx !== undefined ? choiceLabels[b.decisionId][chIdx] : '';
          this.updateBuildingPill(
            b,
            this.currentNearestId === b.decisionId,
            b.decisionId === step,
            chIdx,
            summary,
            curLang,
          );
        });

        // Draw Interactive Power Conduit Lines (highlighting active route!)
        this.conduitGraphics.clear();
        const drawConduitLine = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          activeColor: number,
          isActive: boolean,
        ) => {
          this.conduitGraphics.lineStyle(11, 0x020617, 0.55);
          this.conduitGraphics.lineBetween(x1 + 8, y1 + 6, x2 + 8, y2 + 6);
          this.conduitGraphics.lineStyle(7, 0x1e293b, 0.95);
          this.conduitGraphics.lineBetween(x1, y1, x2, y2);
          this.conduitGraphics.lineStyle(isActive ? 4 : 2, activeColor, isActive ? 1.0 : 0.45);
          this.conduitGraphics.lineBetween(x1, y1, x2, y2);
        };
        drawConduitLine(7 * 64, 5.4 * 64, 17 * 64, 6.4 * 64, 0xf59e0b, true);
        drawConduitLine(8 * 64, 16.2 * 64, 17 * 64, 6.4 * 64, 0x10b981, pRoute === 'heaters');
        drawConduitLine(18 * 64, 16.2 * 64, 28 * 64, 16.8 * 64, 0x06b6d4, pRoute === 'drill');
        drawConduitLine(8 * 64, 16.2 * 64, 18 * 64, 16.2 * 64, 0x38bdf8, pRoute === 'shields');

        // Draw Rotatable D1 Solar Array Wing & 1.5° Grazing Sun Ray
        const d1 = RPG_BUILDINGS[0];
        const d1x = d1.tileX * TILE_SIZE + 32;
        const d1y = d1.tileY * TILE_SIZE - 42;
        const rad = Phaser.Math.DegToRad(sAngle);
        this.solarWingGraphic.clear();
        const wingLen = 62;
        const wx1 = d1x + Math.cos(rad) * wingLen;
        const wy1 = d1y + Math.sin(rad) * wingLen;
        const wx2 = d1x - Math.cos(rad) * wingLen;
        const wy2 = d1y - Math.sin(rad) * wingLen;
        this.solarWingGraphic.lineStyle(8, sAligned ? 0xfacc15 : 0x38bdf8, 0.95);
        this.solarWingGraphic.lineBetween(wx1, wy1, wx2, wy2);
        this.solarWingGraphic.fillStyle(0x0f172a, 1);
        this.solarWingGraphic.fillCircle(d1x, d1y, 7);
        this.solarWingGraphic.lineStyle(2, 0xfef08a, 1);
        this.solarWingGraphic.strokeCircle(d1x, d1y, 7);

        this.solarRayBeam.clear();
        if (sAligned) {
          this.solarRayBeam.lineStyle(4, 0xfde047, 0.48);
          this.solarRayBeam.lineBetween(180, 40, d1x, d1y);
          this.solarRayBeam.fillStyle(0xfef08a, 0.24);
          this.solarRayBeam.fillCircle(d1x, d1y, 54);
        }

        // Show Run A Ghost Astronaut whenever Run B is active!
        if (rB) {
          const bldg = RPG_BUILDINGS[step - 1] ?? RPG_BUILDINGS[0];
          const gx = (bldg.doorTileX - 1.2) * TILE_SIZE + 32;
          const gy = (bldg.doorTileY + 0.5) * TILE_SIZE + 32;
          const chA = rA.choices[step - 1];
          const letterA = chA !== undefined ? ['A', 'B', 'C'][chA] : '?';
          this.ghostRunA.setPosition(gx, gy).setVisible(true);
          this.ghostPill.setPosition(gx, gy - 78).setVisible(true);
          const txt = this.ghostPill.getAt(1) as Phaser.GameObjects.Text;
          txt.setText(`GHOST RUN A [Chose ${letterA}]`);
        } else {
          this.ghostRunA.setVisible(false);
          this.ghostPill.setVisible(false);
        }

        // Decision 3 (72-Hour LRO Horizon Shadow)
        const inShadow = step === 3;
        this.twilightOverlay.setVisible(inShadow);
        this.flashlightCone.setVisible(inShadow);
        this.lampGlows.forEach((g) => {
          g.setFillStyle(inShadow ? 0xfde047 : 0x38bdf8, inShadow ? 0.36 : 0.15);
          g.setRadius(inShadow ? 118 : 84);
        });

        // Decision 5 (NASA DONKI Solar Superstorm): Red Proton Wave Wall + Glowing Cyan Shield Domes
        const inStorm = step === 5;
        const shieldBuilt = inStorm || run.choices[4] === 2 || run.flags.includes('regolithBerm');
        this.shieldDomeGraphic.setVisible(shieldBuilt);
        this.habShieldDomeGraphic.setVisible(shieldBuilt);
        this.protonLines.forEach((l) => l.setVisible(inStorm));
        this.stormShockwaves.forEach((w) => w.setVisible(inStorm));
        this.stormWaveWall.setVisible(inStorm);
        if (!inStorm) {
          this.stormWaveX = 0;
          this.stormWaveCountdown = 12.0;
          this.stormWaveDeflected = false;
        }
      }

      /**
       * Procedural Full-World 2.5D Organic Lunar South Pole Canvas (2304 x 1536 px).
       * Features 3D stepped cliff rims with vertical rock faces and 2.5D raised metallic boardwalk decks.
       */
      private createOrganicLunarLandscape() {
        if (this.textures.exists('lunar_organic_world')) return;

        const canvasTex = this.textures.createCanvas('lunar_organic_world', WORLD_W, WORLD_H);
        if (!canvasTex) return;
        const ctx = canvasTex.getContext();

        // 1. Base Multi-Layered Basalt & Silver-Slate Regolith Gradient
        const baseGrad = ctx.createLinearGradient(0, 120, WORLD_W, WORLD_H);
        baseGrad.addColorStop(0, '#475569');
        baseGrad.addColorStop(0.38, '#334155');
        baseGrad.addColorStop(0.74, '#1e293b');
        baseGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // 2. Organic Topographic Contour Ridges
        const ridgePatches = [
          { x: 460, y: 360, rx: 420, ry: 220, color: 'rgba(100, 116, 139, 0.36)' },
          { x: 1120, y: 420, rx: 520, ry: 260, color: 'rgba(71, 85, 105, 0.34)' },
          { x: 1780, y: 380, rx: 410, ry: 210, color: 'rgba(100, 116, 139, 0.28)' },
          { x: 620, y: 1050, rx: 490, ry: 270, color: 'rgba(51, 65, 85, 0.42)' },
          { x: 1240, y: 1120, rx: 460, ry: 250, color: 'rgba(30, 41, 59, 0.45)' },
        ];
        ridgePatches.forEach((p) => {
          const rg = ctx.createRadialGradient(p.x, p.y, 20, p.x, p.y, Math.max(p.rx, p.ry));
          rg.addColorStop(0, p.color);
          rg.addColorStop(1, 'rgba(30, 41, 59, 0)');
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.rx, p.ry, 0.15, 0, Math.PI * 2);
          ctx.fill();
        });

        // 3. 3D Stepped 90 K Permanently Shadowed Cold-Trap Crater Floor (South-East Basin)
        const coldX = 28 * TILE_SIZE;
        const coldY = 17.2 * TILE_SIZE;
        // Outer 3D Stepped Crater Cliff Wall
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.ellipse(coldX, coldY + 14, 480, 390, -0.15, 0, Math.PI * 2);
        ctx.fill();

        const coldGrad = ctx.createRadialGradient(coldX, coldY, 40, coldX, coldY, 460);
        coldGrad.addColorStop(0, '#041f30');
        coldGrad.addColorStop(0.45, '#083344');
        coldGrad.addColorStop(0.78, '#0f172a');
        coldGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = coldGrad;
        ctx.beginPath();
        ctx.ellipse(coldX, coldY, 470, 380, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // 3D Stepped Terrace Ledges with Vertical Rock Striations Inside Cold Trap
        for (let ring = 170; ring <= 390; ring += 72) {
          ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.ellipse(coldX, coldY - 4, ring * 1.15, ring * 0.88, -0.15, Math.PI * 0.95, Math.PI * 2.05);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(coldX, coldY, ring * 1.15, ring * 0.88, -0.15, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 4. Organic Multi-Scale Lunar Impact Craters with 1.5° Grazing Directional Shadows
        const craters = [
          { x: 240, y: 520, r: 58 },
          { x: 350, y: 820, r: 42 },
          { x: 820, y: 290, r: 48 },
          { x: 890, y: 780, r: 64 },
          { x: 1420, y: 310, r: 52 },
          { x: 1460, y: 820, r: 74 },
          { x: 2080, y: 340, r: 62 },
          { x: 2120, y: 720, r: 48 },
          { x: 310, y: 1290, r: 68 },
          { x: 840, y: 1340, r: 54 },
          { x: 1420, y: 1350, r: 60 },
          { x: 1950, y: 920, r: 44 },
          { x: 640, y: 470, r: 26 },
          { x: 1260, y: 520, r: 30 },
          { x: 1580, y: 610, r: 24 },
          { x: 540, y: 910, r: 28 },
          { x: 1020, y: 980, r: 32 },
          { x: 1620, y: 1180, r: 29 },
        ];
        craters.forEach((c) => {
          const ej = ctx.createRadialGradient(c.x, c.y, c.r * 0.7, c.x, c.y, c.r * 1.55);
          ej.addColorStop(0, 'rgba(100, 116, 139, 0.28)');
          ej.addColorStop(1, 'rgba(51, 65, 85, 0)');
          ctx.fillStyle = ej;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.r * 1.5, c.r * 1.15, 0.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.r, c.r * 0.76, 0.18, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
          ctx.beginPath();
          ctx.ellipse(c.x - c.r * 0.18, c.y - c.r * 0.1, c.r * 0.82, c.r * 0.62, 0.18, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.68)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.r, c.r * 0.76, 0.18, -0.3, Math.PI * 0.65);
          ctx.stroke();
        });

        // 5. Fine Organic Regolith Dust Grain & Micro-Pebbles
        let seed = 421337;
        const rand = () => {
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          return seed / 4294967296;
        };
        for (let i = 0; i < 1600; i++) {
          const rx = rand() * WORLD_W;
          const ry = 155 + rand() * (WORLD_H - 165);
          const rr = 1 + rand() * 2.4;
          ctx.fillStyle = rand() > 0.45 ? 'rgba(15, 23, 42, 0.35)' : 'rgba(148, 163, 184, 0.22)';
          ctx.beginPath();
          ctx.arc(rx, ry, rr, 0, Math.PI * 2);
          ctx.fill();
        }

        // 6. Starry Black Space Horizon & 3D Stepped Northern Cliff Rim with Vertical Rock Faces
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 150);
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(0.75, '#090d16');
        skyGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, WORLD_W, 148);

        for (let s = 0; s < 220; s++) {
          const sx = rand() * WORLD_W;
          const sy = rand() * 115;
          const sr = 0.6 + rand() * 1.4;
          ctx.fillStyle = s % 7 === 0 ? '#bae6fd' : s % 11 === 0 ? '#fde68a' : '#f8fafc';
          ctx.globalAlpha = 0.4 + rand() * 0.6;
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Blue-Marble Crescent Earth
        const earthX = 1960;
        const earthY = 54;
        const earthGlow = ctx.createRadialGradient(earthX, earthY, 8, earthX, earthY, 54);
        earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
        earthGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = earthGlow;
        ctx.beginPath();
        ctx.arc(earthX, earthY, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(earthX, earthY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.arc(earthX - 5, earthY - 4, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(earthX + 8, earthY + 3, 19, 0, Math.PI * 2);
        ctx.fill();

        // Low 1.5° Grazing Sun Corona
        const sunX = 210;
        const sunY = 48;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 260);
        sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        sunGlow.addColorStop(0.22, 'rgba(250, 204, 21, 0.38)');
        sunGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
        ctx.fill();

        // 3D Extruded Northern Cliff Wall with Vertical Rock Face & Drop Shadow
        ctx.fillStyle = 'rgba(2, 6, 23, 0.68)';
        ctx.beginPath();
        ctx.moveTo(0, 145);
        for (let x = 0; x <= WORLD_W; x += 48) {
          const ridgeY = 108 + Math.sin(x * 0.008) * 12 + Math.cos(x * 0.023) * 7;
          ctx.lineTo(x + 38, ridgeY + 68);
        }
        ctx.lineTo(WORLD_W, 205);
        ctx.lineTo(0, 205);
        ctx.closePath();
        ctx.fill();

        // Vertical Striated Basalt Cliff Face (y = ridgeY .. ridgeY + 38)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(0, 152);
        for (let x = 0; x <= WORLD_W; x += 48) {
          const ridgeY = 108 + Math.sin(x * 0.008) * 12 + Math.cos(x * 0.023) * 7;
          ctx.lineTo(x, ridgeY);
        }
        for (let x = WORLD_W; x >= 0; x -= 48) {
          const ridgeY = 108 + Math.sin(x * 0.008) * 12 + Math.cos(x * 0.023) * 7;
          ctx.lineTo(x, ridgeY + 38);
        }
        ctx.closePath();
        ctx.fill();

        // Vertical rock crack striations on cliff wall
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        for (let x = 24; x < WORLD_W; x += 36) {
          const ry = 110 + Math.sin(x * 0.008) * 12;
          ctx.beginPath();
          ctx.moveTo(x, ry);
          ctx.lineTo(x + 4, ry + 36);
          ctx.stroke();
        }

        // Sunlit Top Rim Edge of Northern Cliff
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= WORLD_W; x += 48) {
          const ridgeY = 108 + Math.sin(x * 0.008) * 12 + Math.cos(x * 0.023) * 7;
          if (x === 0) ctx.moveTo(x, ridgeY);
          else ctx.lineTo(x, ridgeY);
        }
        ctx.stroke();

        // 7. 2.5D Raised Metallic Boardwalk Decks (with visible 3D side thickness, bolts & support struts!)
        const drawBoardwalk25D = (x1: number, y1: number, x2: number, y2: number, width: number) => {
          ctx.save();
          const isHorizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);

          // Ground drop shadow under boardwalk struts
          ctx.strokeStyle = 'rgba(2, 6, 23, 0.68)';
          ctx.lineWidth = width + 8;
          ctx.lineCap = 'butt';
          ctx.beginPath();
          ctx.moveTo(x1 + 10, y1 + 14);
          ctx.lineTo(x2 + 10, y2 + 14);
          ctx.stroke();

          // 3D Vertical Side Wall Extrusion & Support Struts along the southern/eastern edge
          if (isHorizontal) {
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            // Vertical steel side apron
            ctx.fillStyle = '#090d16';
            ctx.fillRect(minX, y1 + width / 2 - 2, maxX - minX, 12);
            // Support struts anchored into regolith every 48px
            ctx.fillStyle = '#475569';
            for (let sx = minX + 16; sx < maxX - 8; sx += 48) {
              ctx.fillRect(sx, y1 + width / 2 + 2, 6, 12);
            }
          } else {
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            ctx.fillStyle = '#090d16';
            ctx.fillRect(x1 + width / 2 - 2, minY, 10, maxY - minY);
            ctx.fillStyle = '#475569';
            for (let sy = minY + 16; sy < maxY - 8; sy += 48) {
              ctx.fillRect(x1 + width / 2 + 1, sy, 9, 6);
            }
          }

          // Top Brushed Titanium Deck Plate
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = width + 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = width - 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Deck Plank Seams & Rivet Bolts
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
          ctx.lineWidth = 2;
          const dist = Math.hypot(x2 - x1, y2 - y1);
          const steps = Math.floor(dist / 32);
          for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            ctx.beginPath();
            if (isHorizontal) {
              ctx.moveTo(px, py - width * 0.42);
              ctx.lineTo(px, py + width * 0.42);
            } else {
              ctx.moveTo(px - width * 0.42, py);
              ctx.lineTo(px + width * 0.42, py);
            }
            ctx.stroke();
          }

          // Center Glowing LED Guide Strip
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.52)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([14, 10]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.restore();
        };

        drawBoardwalk25D(6 * 64, 9.5 * 64, 28.5 * 64, 9.5 * 64, 50);
        drawBoardwalk25D(7.5 * 64, 18.2 * 64, 25.8 * 64, 18.2 * 64, 48);
        drawBoardwalk25D(7.5 * 64, 6.8 * 64, 7.5 * 64, 18.2 * 64, 46);
        drawBoardwalk25D(17.5 * 64, 7.8 * 64, 17.5 * 64, 18.2 * 64, 48);
        drawBoardwalk25D(26.2 * 64, 7.8 * 64, 26.2 * 64, 18.2 * 64, 46);

        // 8. Scattered 3D Lunar Boulder Clusters with Long 1.5° Directional Shadows
        for (let b = 0; b < 68; b++) {
          const bx = 90 + rand() * (WORLD_W - 180);
          const by = 180 + rand() * (WORLD_H - 245);
          const nearBuilding = RPG_BUILDINGS.some(
            (st) => Math.hypot(bx - st.tileX * 64, by - st.tileY * 64) < 180,
          );
          if (nearBuilding) continue;

          const br = 6 + rand() * 13;
          ctx.fillStyle = 'rgba(2, 6, 23, 0.64)';
          ctx.beginPath();
          ctx.moveTo(bx, by - br * 0.6);
          ctx.lineTo(bx + br * 4.2, by + br * 2.1);
          ctx.lineTo(bx, by + br * 0.8);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(bx - br * 0.25, by - br * 0.25, br * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }

        canvasTex.refresh();
      }

      update(time: number, delta: number) {
        const isRover = bridgeRef.current.drivingRover;
        const speed = isRover ? 390 : 285;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
        if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;

        if (vx !== 0 || vy !== 0) {
          this.autoTarget = null;
          this.targetRing.setVisible(false);
          this.pathLine.clear();
          const len = Math.hypot(vx, vy);
          this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
        } else if (this.autoTarget) {
          const dx = this.autoTarget.x - this.player.x;
          const dy = this.autoTarget.y - this.player.y;
          const dist = Math.hypot(dx, dy);

          this.pathLine.clear();
          this.pathLine.lineStyle(3, 0x38bdf8, 0.85);
          this.pathLine.lineBetween(this.player.x, this.player.y, this.autoTarget.x, this.autoTarget.y);

          if (dist < 16) {
            this.player.setVelocity(0, 0);
            const openId = this.autoTarget.openDecisionId;
            this.autoTarget = null;
            this.targetRing.setVisible(false);
            this.pathLine.clear();
            if (openId !== undefined) {
              soundFX.play('choice');
              bridgeRef.current.onSelectStep(openId);
              bridgeRef.current.onOpenDecisionModal(openId);
            }
          } else {
            this.player.setVelocity((dx / dist) * speed, (dy / dist) * speed);
          }
        } else {
          this.player.setVelocity(0, 0);
        }

        // REAL 2.5D Y-DEPTH SORTING (`sprite.setDepth(100 + Math.round(sprite.y))`)
        // Ensures astronauts & rover walk IN FRONT of southern doors and pass BEHIND northern building roofs!
        this.player.setDepth(100 + Math.round(this.player.y));
        if (this.rover.visible) {
          this.rover.setDepth(100 + Math.round(this.rover.y));
        }

        // Animate Energy Pulses along Active Power Conduit Route
        const pRoute = bridgeRef.current.powerRoute;
        const routeEndpoints: Record<PowerRouteMode, [number, number, number, number, number]> = {
          heaters: [8 * 64, 16.2 * 64, 17 * 64, 6.4 * 64, 0x10b981],
          drill: [18 * 64, 16.2 * 64, 28 * 64, 16.8 * 64, 0x06b6d4],
          shields: [8 * 64, 16.2 * 64, 18 * 64, 16.2 * 64, 0x38bdf8],
        };
        const [rx1, ry1, rx2, ry2, rColor] = routeEndpoints[pRoute];
        this.powerPulses.forEach((pulse, idx) => {
          if (idx < 3) {
            // Primary solar feed D1 -> D2
            const t = ((time * 0.0005 + idx / 3) % 1);
            pulse.setPosition(
              Phaser.Math.Linear(7 * 64, 17 * 64, t),
              Phaser.Math.Linear(5.4 * 64, 6.4 * 64, t),
            );
            pulse.setFillStyle(0xfacc15, 0.9);
          } else {
            // Active selected HVDC conduit route
            const t = ((time * 0.00065 + (idx - 3) / 6) % 1);
            pulse.setPosition(Phaser.Math.Linear(rx1, rx2, t), Phaser.Math.Linear(ry1, ry2, t));
            pulse.setFillStyle(rColor, 0.95);
          }
        });

        // Bobbing RPG Walk-Cycle OR Rover Wheel Tracks
        const isMoving = Math.hypot(this.player.body?.velocity.x ?? 0, this.player.body?.velocity.y ?? 0) > 10;
        if (isMoving) {
          const wobble = isRover ? Math.sin(time * 0.04) * 2 : Math.sin(time * 0.022) * 5;
          this.player.setAngle(wobble);

          const angleRad = Math.atan2(this.player.body!.velocity.y, this.player.body!.velocity.x);
          this.flashlightCone.setRotation(angleRad + Math.PI / 2);

          this.stepDustTimer += delta;
          if (this.stepDustTimer > (isRover ? 95 : 150)) {
            this.stepDustTimer = 0;
            if (isRover) {
              const track = this.add
                .rectangle(this.player.x, this.player.y + 4, 28, 6, 0x0f172a, 0.55)
                .setDepth(2);
              this.tweens.add({
                targets: track,
                alpha: 0,
                duration: 2400,
                onComplete: () => track.destroy(),
              });
            } else {
              const puff = this.add
                .circle(this.player.x, this.player.y + 4, 5, 0x94a3b8, 0.55)
                .setDepth(12);
              this.tweens.add({
                targets: puff,
                scaleX: 2.1,
                scaleY: 2.1,
                alpha: 0,
                duration: 380,
                onComplete: () => puff.destroy(),
              });
            }
          }
        } else {
          this.player.setAngle(0);
        }

        this.playerLongShadow.setPosition(this.player.x + 28, this.player.y + 6);
        this.playerNamePill.setPosition(this.player.x, this.player.y - 82);
        this.flashlightCone.setPosition(this.player.x, this.player.y - 24);

        // Update normalized minimap coordinates every ~180ms
        if (Math.floor(time / 180) !== Math.floor((time - delta) / 180)) {
          bridgeRef.current.onUpdatePlayerPos({
            x: this.player.x / WORLD_W,
            y: this.player.y / WORLD_H,
          });
        }

        // Check if Player / Rover collects any of the 6 NASA Field Science Samples
        FIELD_SAMPLES.forEach((s) => {
          if (this.collectedSet.has(s.id)) return;
          const sx = s.tileX * TILE_SIZE;
          const sy = s.tileY * TILE_SIZE;
          if (Math.hypot(this.player.x - sx, this.player.y - sy) < 60) {
            this.collectedSet.add(s.id);
            const node = this.sampleSprites.get(s.id);
            if (node) {
              const pop = this.add
                .text(sx, sy - 24, `★ ${s.Instrument} (+2 SCI)`, {
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  fontStyle: 'bold',
                  color: '#020617',
                  backgroundColor: '#34d399',
                  padding: { left: 8, right: 8, top: 4, bottom: 4 },
                })
                .setOrigin(0.5)
                .setDepth(2600);
              this.tweens.add({
                targets: pop,
                y: sy - 80,
                alpha: 0,
                duration: 1800,
                onComplete: () => pop.destroy(),
              });
              node.setAlpha(0.28);
            }
            bridgeRef.current.onCollectSample(s);
          }
        });

        // ====================================================================
        // HANDS-ON MINI-GAME 1: ACTIVE ROVER LASER DRILLING IN 90 K CRATER
        // ====================================================================
        this.activeLaserGraphics.clear();
        const holdingLaserKey =
          this.keys.SPACE.isDown ||
          (this.input.activePointer.isDown && bridgeRef.current.drivingRover);

        let nearestBoulder: {
          id: string;
          entry: {
            node: IceBoulderNode;
            container: Phaser.GameObjects.Container;
            hp: number;
            hpBar: Phaser.GameObjects.Rectangle;
            harvested: boolean;
          };
          bx: number;
          by: number;
          dist: number;
        } | null = null;

        this.iceBoulderMap.forEach((entry, id) => {
          if (entry.harvested) return;
          const bx = entry.node.tileX * TILE_SIZE;
          const by = entry.node.tileY * TILE_SIZE;
          const dist = Math.hypot(this.player.x - bx, this.player.y - by);
          if (dist < 180 && (!nearestBoulder || dist < nearestBoulder.dist)) {
            nearestBoulder = { id, entry, bx, by, dist };
          }
        });

        const isOverheated = time < this.laserOverheatedUntil;
        const canFireLaser = Boolean(nearestBoulder && (holdingLaserKey || isRover) && !isOverheated);
        const drillSpeedMult = bridgeRef.current.powerRoute === 'drill' ? 1.55 : 1.0;

        if (canFireLaser && nearestBoulder) {
          const target = nearestBoulder as {
            id: string;
            entry: {
              node: IceBoulderNode;
              container: Phaser.GameObjects.Container;
              hp: number;
              hpBar: Phaser.GameObjects.Rectangle;
              harvested: boolean;
            };
            bx: number;
            by: number;
          };

          this.laserHeat = Math.min(100, this.laserHeat + delta * 0.026);
          if (this.laserHeat >= 100) {
            this.laserOverheatedUntil = time + 1500;
          }

          this.activeLaserGraphics.lineStyle(8, 0x06b6d4, 0.38);
          this.activeLaserGraphics.lineBetween(this.player.x, this.player.y - 18, target.bx, target.by);
          this.activeLaserGraphics.lineStyle(3.5, 0xa5f3fc, 0.98);
          this.activeLaserGraphics.lineBetween(this.player.x, this.player.y - 18, target.bx, target.by);
          this.activeLaserGraphics.fillStyle(0x67e8f9, 0.95);
          this.activeLaserGraphics.fillCircle(target.bx, target.by, 9 + Math.sin(time * 0.05) * 3);

          if (Math.random() < 0.38) {
            const spark = this.add
              .circle(
                target.bx + Phaser.Math.Between(-10, 10),
                target.by + Phaser.Math.Between(-10, 10),
                3.5,
                0xa5f3fc,
                0.95,
              )
              .setBlendMode(Phaser.BlendModes.ADD)
              .setDepth(2300);
            this.tweens.add({
              targets: spark,
              x: spark.x + Phaser.Math.Between(-38, 38),
              y: spark.y + Phaser.Math.Between(-38, 38),
              alpha: 0,
              duration: 320,
              onComplete: () => spark.destroy(),
            });
          }

          this.drillSoundTimer += delta;
          if (this.drillSoundTimer > 160) {
            this.drillSoundTimer = 0;
            soundFX.play('laserDrill');
          }

          target.entry.hp = Math.max(0, target.entry.hp - delta * 0.058 * drillSpeedMult);
          target.entry.hpBar.width = (target.entry.hp / 100) * 46;

          if (target.entry.hp <= 0) {
            target.entry.harvested = true;
            target.entry.container.setAlpha(0.22);
            this.totalCoresExtracted += 1;
            bridgeRef.current.onDrillIceCore(this.totalCoresExtracted);

            const pop = this.add
              .text(target.bx, target.by - 24, '❄ H₂O ICE CORE! (+2% ECLSS · +3 SCI)', {
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#020617',
                backgroundColor: '#38bdf8',
                padding: { left: 8, right: 8, top: 4, bottom: 4 },
              })
              .setOrigin(0.5)
              .setDepth(2600);
            this.tweens.add({
              targets: pop,
              y: target.by - 86,
              alpha: 0,
              duration: 1900,
              onComplete: () => pop.destroy(),
            });
          }
        } else {
          this.laserHeat = Math.max(0, this.laserHeat - delta * 0.045);
        }

        if (Math.floor(time / 120) !== Math.floor((time - delta) / 120)) {
          bridgeRef.current.onUpdateLaserState(Math.round(this.laserHeat), canFireLaser);
        }

        // ====================================================================
        // HANDS-ON MINI-GAME 2: WALKABLE BUILDING CUTAWAYS (D2 & D5) &
        // PHYSICAL SOLAR STORM SHELTER DASH WITH GSAP DEFLECTION SHOCKWAVE
        // ====================================================================
        let playerInsideShelter = false;
        let currentInsideId: number | null = null;

        RPG_BUILDINGS.forEach((b) => {
          if (!b.hasInteriorCutaway) return;
          const bx = b.tileX * TILE_SIZE + 32;
          const by = b.tileY * TILE_SIZE + 32;
          const distToCenter = Math.hypot(this.player.x - bx, this.player.y - by);
          const isInside = distToCenter < 142;
          const sprite = this.buildingSprites.get(b.decisionId);
          if (sprite) {
            const targetAlpha = isInside ? 0.16 : 1.0;
            sprite.setAlpha(Phaser.Math.Linear(sprite.alpha, targetAlpha, 0.15));
          }
          if (isInside) {
            playerInsideShelter = true;
            currentInsideId = b.decisionId;
          }
        });

        // Animate Sweeping Red Proton Wave Front & Shockwaves when Decision 5 is active
        if (bridgeRef.current.viewStep === 5) {
          this.protonLines.forEach((l, idx) => {
            l.x += delta * 0.48 * (idx % 2 === 0 ? 1 : 1.25);
            l.y += delta * 0.3;
            if (l.x > 320) {
              l.x = -320;
              l.y = -210;
            }
          });
          this.stormShockwaves.forEach((w, idx) => {
            const r = ((time * 0.18 + idx * 220) % 680) + 40;
            w.setRadius(r);
            w.setAlpha(Math.max(0, 0.25 * (1 - r / 720)));
          });

          // Sweeping Red Proton Wave Wall across the map
          this.stormWaveX = (this.stormWaveX + delta * 0.19) % WORLD_W;
          this.stormWaveWall.clear();
          this.stormWaveWall.lineStyle(18, 0xf43f5e, 0.28);
          this.stormWaveWall.lineBetween(this.stormWaveX, 0, this.stormWaveX - 180, WORLD_H);
          this.stormWaveWall.lineStyle(4, 0xfda4af, 0.85);
          this.stormWaveWall.lineBetween(this.stormWaveX, 0, this.stormWaveX - 180, WORLD_H);

          if (!this.stormWaveDeflected) {
            this.stormWaveCountdown = Math.max(0, this.stormWaveCountdown - delta / 1000);
            if (playerInsideShelter) {
              // Player dashed inside D2/D5 shelter before the wave hit -> Trigger GSAP Deflection Shockwave!
              this.stormWaveDeflected = true;
              soundFX.play('success');
              gsap.fromTo(
                this.cameras.main,
                { zoom: this.cameras.main.zoom * 1.04 },
                { zoom: this.cameras.main.zoom, duration: 0.45, ease: 'elastic.out(1, 0.3)' },
              );
              const deflectBurst = this.add
                .circle(this.player.x, this.player.y, 40, 0x22d3ee, 0.65)
                .setStrokeStyle(5, 0xffffff, 1)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(2550);
              this.tweens.add({
                targets: deflectBurst,
                radius: 260,
                alpha: 0,
                duration: 750,
                onComplete: () => deflectBurst.destroy(),
              });
            }
          }

          if (!playerInsideShelter) {
            const shieldMult = bridgeRef.current.powerRoute === 'shields' ? 0.65 : 1.0;
            this.stormDoseAccum =
              Math.round((this.stormDoseAccum + delta * 0.0012 * shieldMult) * 10) / 10;
            this.geigerTimer += delta;
            if (this.geigerTimer > 380) {
              this.geigerTimer = 0;
              soundFX.play('geiger');
            }
          }
        }

        if (
          playerInsideShelter !== this.lastInsideShelter ||
          currentInsideId !== this.lastInsideBuildingId ||
          Math.floor(time / 250) !== Math.floor((time - delta) / 250)
        ) {
          this.lastInsideShelter = playerInsideShelter;
          this.lastInsideBuildingId = currentInsideId;
          bridgeRef.current.onUpdateShelterState(
            playerInsideShelter,
            currentInsideId,
            this.stormDoseAccum,
            Math.ceil(this.stormWaveCountdown),
            this.stormWaveDeflected,
          );
        }

        // Check proximity to each of the 6 RPG Building Entrance Doors
        let closest: RpgBuildingMeta | null = null;
        let minDist = 152;
        for (const b of RPG_BUILDINGS) {
          const checkX = b.hasInteriorCutaway ? b.tileX * TILE_SIZE + 32 : b.doorTileX * TILE_SIZE + 32;
          const checkY = b.hasInteriorCutaway ? b.tileY * TILE_SIZE + 32 : b.doorTileY * TILE_SIZE + 32;
          const d = Math.hypot(this.player.x - checkX, this.player.y - checkY);
          if (d < minDist) {
            minDist = d;
            closest = b;
          }
        }

        const nextId = closest?.decisionId ?? null;
        if (nextId !== this.currentNearestId) {
          this.currentNearestId = nextId;
          bridgeRef.current.onNearBuilding(closest);
          this.syncVisualState();
        }
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || 1280,
      height: containerRef.current.clientHeight || 720,
      backgroundColor: '#090d16',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [LunarOutpostScene],
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const exposedInStorm = viewStep === 5 && !insideShelter;

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      {/* Full-Screen Edge-to-Edge Phaser 2.5D RPG World */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Subtle Cinematic Space Vignette Overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(2,6,23,0) 58%, rgba(2,6,23,0.52) 100%)',
        }}
      />

      {/* Real-Time D5 Solar Storm Shelter Dash Countdown & Radiation Hazard Vignette */}
      {exposedInStorm && (
        <div
          className="pointer-events-none absolute inset-0 animate-pulse border-4 border-rose-500/80"
          style={{
            background:
              'radial-gradient(circle at center, rgba(244,63,94,0) 50%, rgba(225,29,72,0.38) 100%)',
          }}
        >
          <div className="pointer-events-auto mx-auto mt-20 flex max-w-2xl items-center justify-between gap-3 rounded-2xl border-2 border-rose-400 bg-rose-950/95 px-5 py-3 text-sm font-bold text-rose-100 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 shrink-0 animate-bounce text-rose-400" />
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-rose-300">
                  {lang === 'az'
                    ? `⚠ DONKI X8.7 PROTON DALĞASI (${stormWaveCountdownSec}s) · GEIGER AKTİV!`
                    : `⚠ DONKI X8.7 PROTON WAVE IMPACT IN ${stormWaveCountdownSec}s · GEIGER ACTIVE!`}
                </p>
                <p className="text-sm text-white">
                  {lang === 'az'
                    ? `Çöldə radiasiya udulur (+${stormExposureMsv.toFixed(1)} mSv)! Dərhal D5 Sığınacağına və ya D2 Günbəzinə qaçın!`
                    : `Outdoor exposure (+${stormExposureMsv.toFixed(1)} mSv)! Sprint inside D5 Storm Bunker or D2 Habitat Dome!`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                soundFX.play('choice');
                walkToStationRef.current?.(5, false);
              }}
              className="shrink-0 rounded-xl bg-cyan-400 px-4 py-2 font-mono text-xs font-bold text-slate-950 shadow-lg hover:bg-cyan-300"
            >
              {lang === 'az' ? 'Sığınacağa Qaç!' : 'Dash to Bunker!'}
            </button>
          </div>
        </div>
      )}

      {/* Inside Cutaway Shelter Status Banner */}
      {insideShelter && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 rounded-full border-2 border-emerald-400/90 bg-slate-950/95 px-5 py-2 text-sm font-bold text-emerald-300 shadow-2xl backdrop-blur-md">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            {insideBuildingId === 2
              ? lang === 'az'
                ? 'D2 HERMETİK GÜNBƏZİN İÇİ · Hidroponika və 98% ECLSS Qorunması Aktivdir'
                : 'INSIDE D2 HABITAT CUTAWAY · Hydroponics & 98% ECLSS Loop Active'
              : lang === 'az'
                ? 'D5 SU DİVARLI SIĞINACAĞIN İÇİ · 205 pfu Günəş Fırtınasından Tam Qorunur!'
                : 'INSIDE D5 WATER-WALL BUNKER CUTAWAY · Shielded from 205 pfu Solar Protons!'}
          </span>
        </div>
      )}

      {/* ====================================================================
       * HANDS-ON MINI-GAME HUD WIDGETS (D1 Solar Alignment, Power Routing [P], D4 Laser Drill)
       * ================================================================== */}
      <div ref={hudCardRef} className="pointer-events-auto absolute top-20 right-4 z-20 flex w-80 flex-col gap-2.5">
        {/* Interactive Power Conduit Router ([P] key or click cables on map) */}
        <div className="rounded-2xl border border-emerald-400/60 bg-slate-950/92 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-emerald-300">
              <Zap className="h-4 w-4 text-amber-400" />
              {lang === 'az' ? 'HVDC ENERJİ YÖNLƏNDİRMƏ [P]' : 'HVDC POWER ROUTING [P]'}
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-200">
              {powerRoute === 'heaters' ? '+5% ECLSS' : powerRoute === 'drill' ? '1.5× DRILL' : '−3.5 mSv'}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'heaters' as PowerRouteMode, label: { en: 'D2 Heaters', az: 'D2 İstilik' } },
                { id: 'drill' as PowerRouteMode, label: { en: 'D4 Ice Drill', az: 'D4 Qazma' } },
                { id: 'shields' as PowerRouteMode, label: { en: 'D5 Shield', az: 'D5 Qalxan' } },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => handleCyclePowerRoute(r.id)}
                className={`rounded-xl border px-2 py-1.5 font-mono text-xs font-bold transition ${
                  powerRoute === r.id
                    ? 'border-amber-400 bg-amber-400 text-slate-950 shadow'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {tr(r.label)}
              </button>
            ))}
          </div>
        </div>

        {(viewStep === 1 || nearbyBuilding?.decisionId === 1) && (
          <div className="rounded-2xl border border-amber-400/60 bg-slate-950/92 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-amber-300">
                <Sun className="h-4 w-4" />
                {lang === 'az' ? 'D1 · 1.5° GÜNƏŞ TUŞLAMA' : 'D1 · 1.5° SOLAR ALIGNMENT'}
              </span>
              <span
                className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                  solarAligned
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                    : 'bg-amber-500/20 text-amber-200'
                }`}
              >
                {solarAligned ? 'LOCKED (+4 kWh)' : `${solarAngleDeg}° / 128°`}
              </span>
            </div>
            <p className="mt-1 text-xs leading-snug text-slate-200">
              {lang === 'az'
                ? 'Şaquli Günəş Qülləsini 128° üfüq zirvəsinə fırladaraq maksimum enerji kilidləyin:'
                : 'Rotate the VSAT Solar Mast to 128° azimuth to lock onto the 1.5° grazing sun peak:'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={240}
                value={solarAngleDeg}
                onChange={(e) => handleSolarRotate(Number(e.target.value))}
                className="h-2.5 flex-1 cursor-pointer accent-amber-400"
              />
              <button
                onClick={() => handleSolarRotate(128)}
                className="rounded-lg bg-amber-400 px-2.5 py-1 font-mono text-xs font-bold text-slate-950 hover:bg-amber-300"
              >
                128° Lock
              </button>
            </div>
          </div>
        )}

        {(drivingRover || viewStep === 4 || nearbyBuilding?.decisionId === 4) && (
          <div className="rounded-2xl border border-cyan-400/60 bg-slate-950/92 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-cyan-300">
                <Crosshair className="h-4 w-4" />
                {lang === 'az' ? 'D4 · LAZER BUZ QAZMA' : 'D4 · 90K LASER ICE DRILL'}
              </span>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-xs font-bold text-cyan-200">
                {iceCoresDrilled}/{ICE_BOULDERS.length} H₂O Cores
              </span>
            </div>
            <p className="mt-1 text-xs leading-snug text-slate-200">
              {lang === 'az'
                ? '90 K kraterdəki mavi buz qayalarına yaxınlaşın (Roverdə və ya [SPACE] basaraq qazın → +2% ECLSS):'
                : 'Drive near blue ice boulders in the SE 90 K crater (auto-drills in Rover or hold [SPACE] → +2% ECLSS):'}
            </p>
            <div className="mt-2">
              <div className="flex justify-between font-mono text-xs text-slate-300">
                <span>{isDrillingIce ? '⚡ LASER FIRING' : 'LASER THERMAL LOAD'}</span>
                <span className={laserHeatPct > 80 ? 'text-rose-400 font-bold' : 'text-cyan-300 font-bold'}>
                  {laserHeatPct}%
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    laserHeatPct > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-sky-300'
                  }`}
                  style={{ width: `${laserHeatPct}%` }}
                />
              </div>
            </div>
            {!drivingRover && (
              <button
                onClick={() => {
                  soundFX.play('choice');
                  toggleVehicleRef.current?.(true);
                  walkToStationRef.current?.(4, false);
                }}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-400 py-1.5 font-mono text-xs font-bold text-slate-950 hover:bg-cyan-300"
              >
                <Bot className="h-4 w-4" />
                {lang === 'az' ? 'VIPER-Jr Roverini Sür [V]' : 'Deploy VIPER-Jr Rover [V]'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Discovery Toast Banner when Player collects a NASA Field Sample on the Map */}
      {recentDiscovery && (
        <div className="pointer-events-auto absolute bottom-44 left-4 z-20 max-w-sm rounded-2xl border border-emerald-400/70 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {recentDiscovery.Instrument} · {lang === 'az' ? 'Kəşf Edildi!' : 'Sample Analyzed!'}
            </span>
            <button
              onClick={() => setRecentDiscovery(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm font-bold text-white">{tr(recentDiscovery.title)}</p>
          <p className="mt-1 text-xs leading-snug text-slate-200">{tr(recentDiscovery.fact)}</p>
        </div>
      )}

      {/* Collapsible RPG Codex & Field Science Drawer */}
      {codexOpen && (
        <div className="pointer-events-auto absolute top-20 left-96 z-30 w-80 rounded-2xl border border-sky-400/50 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-sky-300">
              <BookOpen className="h-4 w-4" />
              {lang === 'az' ? 'RPG Kodeksi və NASA Elmi' : 'RPG Science Codex & Log'}
            </span>
            <button
              onClick={() => setCodexOpen(false)}
              className="rounded px-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 font-mono text-xs uppercase text-slate-300">
            {lang === 'az' ? '4 Mühəndislik Sistem Kartı:' : '4 Outpost Engineering Systems:'}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { id: 'solar' as HotspotId, label: { en: '1.5° VSAT Solar', az: '1.5° Günəş Qülləsi' }, Icon: Sun },
                { id: 'habitat' as HotspotId, label: { en: '98% ECLSS Loop', az: '98% ECLSS Dövrəsi' }, Icon: Flame },
                { id: 'rover' as HotspotId, label: { en: '90K Cold-Trap', az: '90K Soyuq Tələ' }, Icon: Snowflake },
                { id: 'shelter' as HotspotId, label: { en: 'Water-Wall Shield', az: 'Su Divarı Qalxanı' }, Icon: ShieldAlert },
              ] as const
            ).map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  soundFX.play('hotspot');
                  onSelectHotspot(h.id);
                  setCodexOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-left text-xs font-semibold text-slate-100 transition hover:border-sky-400 hover:text-white"
              >
                <h.Icon className="h-4 w-4 shrink-0 text-sky-400" />
                <span className="truncate">{tr(h.label)}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 font-mono text-xs text-emerald-300">
            <span>
              {lang === 'az' ? 'Nümunələr:' : 'Field Samples:'} {collectedIds.length}/{FIELD_SAMPLES.length}
            </span>
            <span>
              {lang === 'az' ? 'Buz Nüvələri:' : 'Ice Cores:'} {iceCoresDrilled}/{ICE_BOULDERS.length}
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Bar at Top-Center (Unit Switch + Codex Toggle + Go to Station) */}
      <div className="pointer-events-auto absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/92 px-3.5 py-1.5 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => {
            soundFX.play('choice');
            toggleVehicleRef.current?.(!drivingRover);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition ${
            drivingRover
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-800 text-sky-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {drivingRover ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          <span>{drivingRover ? 'VIPER-Jr Rover [V]' : 'Cmdr. EVA [V]'}</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={() => {
            soundFX.play('StepNav');
            setCodexOpen((v) => !v);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition ${
            codexOpen
              ? 'bg-sky-500 text-slate-950'
              : 'bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-sky-300'
          }`}
        >
          <GemIcon className="h-4 w-4 text-emerald-400" />
          <span>
            {lang === 'az' ? 'Kodeks və Nümunələr' : 'Codex & Samples'} ({collectedIds.length}/{FIELD_SAMPLES.length})
          </span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={() => {
            soundFX.play('choice');
            walkToStationRef.current?.(viewStep, true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/70 px-3.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition"
        >
          <Compass className="h-4 w-4" />
          <span>{lang === 'az' ? `D${viewStep} Hədəfə Get [E]` : `Go to D${viewStep} [E]`}</span>
        </button>
      </div>

      {/* Bottom-Right Interactive Tactical Radar Minimap */}
      <div className="pointer-events-auto absolute right-4 bottom-24 z-20 hidden flex-col gap-1.5 rounded-2xl border border-slate-700/80 bg-slate-950/92 p-2.5 shadow-2xl backdrop-blur-md sm:flex">
        <div className="flex items-center justify-between px-1 text-xs font-bold uppercase tracking-wider text-sky-300">
          <span className="inline-flex items-center gap-1">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            {lang === 'az' ? 'Şeklton Radar' : 'Shackleton Radar'}
          </span>
          <span className="font-mono text-[10px] text-slate-400">89.67°S</span>
        </div>

        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            const ny = (e.clientY - rect.top) / rect.height;
            soundFX.play('StepNav');
            walkToWorldXYRef.current?.(nx * WORLD_W, ny * WORLD_H);
          }}
          className="relative h-28 w-48 cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
        >
          <div className="absolute inset-x-0 top-0 h-2.5 bg-slate-950 border-b border-slate-700" />
          <div
            className="absolute rounded-full bg-cyan-500/25 border border-cyan-400/40"
            style={{ left: '62%', top: '52%', width: '36%', height: '46%' }}
          />
          <div className="absolute bg-slate-600/60" style={{ left: '14%', top: '38%', width: '68%', height: '2px' }} />
          <div className="absolute bg-slate-600/60" style={{ left: '16%', top: '74%', width: '58%', height: '2px' }} />
          <div className="absolute bg-slate-600/60" style={{ left: '20%', top: '24%', width: '2px', height: '52%' }} />
          <div className="absolute bg-slate-600/60" style={{ left: '48%', top: '28%', width: '2px', height: '48%' }} />

          {RPG_BUILDINGS.map((b) => {
            const bxPct = ((b.tileX + 0.5) / MAP_COLS) * 100;
            const byPct = ((b.tileY + 0.5) / MAP_ROWS) * 100;
            const isTarget = b.decisionId === viewStep;
            const isDone = activeRun.choices[b.decisionId - 1] !== undefined;
            return (
              <button
                key={b.decisionId}
                onClick={(ev) => {
                  ev.stopPropagation();
                  soundFX.play('choice');
                  walkToStationRef.current?.(b.decisionId, false);
                }}
                title={tr(b.title)}
                style={{ left: `${bxPct}%`, top: `${byPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition ${
                  isTarget
                    ? 'scale-110 bg-amber-400 text-slate-950 ring-2 ring-white'
                    : isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-700 text-slate-100 border border-slate-500'
                }`}
              >
                D{b.decisionId}
              </button>
            );
          })}

          {FIELD_SAMPLES.map((s) => {
            if (collectedIds.includes(s.id)) return null;
            return (
              <span
                key={s.id}
                style={{
                  left: `${(s.tileX / MAP_COLS) * 100}%`,
                  top: `${(s.tileY / MAP_ROWS) * 100}%`,
                }}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300"
              />
            );
          })}

          <span
            style={{
              left: `${playerNormPos.x * 100}%`,
              top: `${playerNormPos.y * 100}%`,
            }}
            className="pointer-events-none absolute flex h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <MapPin className="relative h-3.5 w-3.5 text-sky-300" />
          </span>
        </div>
      </div>

      {/* Floating RPG Door Action Prompt when Astronaut stands near a Building */}
      {nearbyBuilding && (
        <div className="pointer-events-auto absolute bottom-24 left-1/2 z-20 -translate-x-1/2">
          <button
            onClick={() => {
              soundFX.play('choice');
              onSelectStep(nearbyBuilding.decisionId);
              onOpenDecisionModal(nearbyBuilding.decisionId);
            }}
            className="inline-flex items-center gap-2.5 rounded-full border-2 border-amber-400 bg-slate-950/95 px-6 py-2.5 text-sm font-bold text-amber-200 shadow-2xl backdrop-blur-md transition hover:scale-105 hover:bg-amber-400 hover:text-slate-950"
          >
            <Footprints className="h-4 w-4 text-amber-400" />
            <span>{tr(nearbyBuilding.prompt)}</span>
            <Sparkles className="h-4 w-4 text-amber-300" />
          </button>
        </div>
      )}
    </div>
  );
}
