import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Compass,
  FlaskConical,
  GitBranch,
  HeartPulse,
  Map as MapIcon,
  Orbit,
  PlayCircle,
  Radio,
  RotateCcw,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Trash2,
  Trophy,
  Truck,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { PhaserWorld, type WorldHandle } from './game/PhaserWorld';
import {
  AI_CREWMATES,
  FIELD_SAMPLES,
  STATIONS,
  WORLD,
  type ElevationTier,
  type CropStatus,
  type LiveCrewState,
  type Point,
  type StationNode,
  type WorldTelemetryPayload,
} from './game/world';
import { BaseMap } from './components/BaseMap';
import StationTaskMiniGame from './components/StationTaskMiniGame';
import { OutcomeBadge } from './components/MetricGauges';
import DecisionCard from './components/DecisionCard';
import { DecisionDebrief } from './components/DecisionDebrief';
import CompareCharts from './components/CompareCharts';
import DeltaSummary from './components/DeltaSummary';
import MissionResults from './components/MissionResults';
import EvidencePanel from './components/EvidencePanel';
import { JudgeTourBanner, type DemoStage } from './components/JudgeTourBanner';
import { FlightCertificateModal } from './components/FlightCertificateModal';
import { NasaSensorDeckModal } from './components/NasaSensorDeckModal';
import {
  ACHIEVEMENTS,
  AchievementsModal,
  AchievementToast,
  type Achievement,
} from './components/AchievementsModal';
import { SampleDiscoveryModal } from './components/SampleDiscoveryModal';
import { CHOICE_LETTERS, fmt, signed } from './components/metricMeta';
import { useI18n } from './i18n/LanguageContext';
import { runSimulation, type StepRecord } from './engine/simulation';
import { canPowerCrop, CROP_TRIAL } from './engine/resources';
import { environmentAtHour } from './engine/power';
import type { MissionTaskSettings } from './types';
import { DECISION_COUNT, MISSION_DECISIONS, MISSION_DEMO } from './data/missionDecisions';
import { GAME_CONSTANTS, RADIATION_LIMITS, SEP_PEAK_FLUX_PFU, LRO_PROFILE, TRAINING_SITE } from './data/nasaTelemetry';
import { soundFX } from './utils/soundEffects';

const DEFAULT_TASK_SETTINGS: MissionTaskSettings = { solarCalibrated: false, icePrepared: false };

const TIER_BADGES: Record<ElevationTier, { en: string; az: string; tone: string }> = {
  high_ridge: {
    en: 'ELEV +2 · SUNLIT RIM',
    az: 'HÜND +2 · GÜNƏŞLİ ZİRVƏ',
    tone: 'text-amber-200 border-amber-400/35 bg-amber-400/10',
  },
  base_plateau: {
    en: 'ELEV 0 · COMMAND PLAZA',
    az: 'HÜND 0 · ƏSAS PLATO',
    tone: 'text-emerald-200 border-emerald-400/30 bg-emerald-400/10',
  },
  sunken_crater: {
    en: 'ELEV -2 · 90K ICE BASIN',
    az: 'HÜND -2 · 90K BUZ HÖVZƏSİ',
    tone: 'text-sky-200 border-sky-400/40 bg-sky-400/15',
  },
};

export default function App() {
  const { t, tr, lang, setLang } = useI18n();

  /** Run A — locked step by step through deterministic simulation. */
  const [baselineChoices, setBaselineChoices] = useState<number[]>([]);
  /** Run B — copy of Run A with one or more rewound decisions (null = no branch yet). */
  const [rewoundChoices, setRewoundChoices] = useState<number[] | null>(null);
  const [baselineTasks, setBaselineTasks] = useState(DEFAULT_TASK_SETTINGS);
  const [branchTasks, setBranchTasks] = useState(DEFAULT_TASK_SETTINGS);
  const [viewStep, setViewStep] = useState(1);

  // Overlays & Modals
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [telemetryDrawerOpen, setTelemetryDrawerOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [demoStage, setDemoStage] = useState<DemoStage | null>(null);
  const overlayOpener = useRef<HTMLElement | null>(null);
  const [sensorDeckOpen, setSensorDeckOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [muted, setMuted] = useState(() => soundFX.isMuted());
  const [guideDismissed, setGuideDismissed] = useState(false);

  const unlockedBadgeIds = useRef(new Set<string>());
  const awardAchievement = useCallback((id: string) => {
    if (unlockedBadgeIds.current.has(id)) return;
    const achievement = ACHIEVEMENTS.find((entry) => entry.id === id);
    if (!achievement) return;
    unlockedBadgeIds.current.add(id);
    setUnlockedBadges([...unlockedBadgeIds.current]);
    soundFX.play('achievement');
    setAchievementToast(achievement);
  }, []);

  useEffect(() => {
    if (!achievementToast) return;
    const timer = window.setTimeout(() => setAchievementToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [achievementToast]);
  const [lastDebrief, setLastDebrief] = useState<StepRecord | null>(null);

  // 2.5D Phaser World Live State
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [nearbyStation, setNearbyStation] = useState<StationNode | null>(null);
  const [position, setPosition] = useState<Point>(WORLD.spawn);
  const [carPos, setCarPos] = useState<Point>(WORLD.roverSpawn);
  const [dronePos, setDronePos] = useState<Point>({ x: 895, y: 495 });
  const [crewStates, setCrewStates] = useState<LiveCrewState[]>(() =>
    AI_CREWMATES.map((c) => ({
      id: c.id,
      x: c.patrol[0].x,
      y: c.patrol[0].y,
      statusText: '',
    })),
  );
  const [nearbyCrewSpeech, setNearbyCrewSpeech] = useState<{
    speaker: string;
    role: string;
    text: string;
    color: string;
  } | null>(null);
  const [currentTier, setCurrentTier] = useState<ElevationTier>('base_plateau');
  const [nearIceIdx, setNearIceIdx] = useState<number>(-1);
  const [nearSampleIdx, setNearSampleIdx] = useState<number>(-1);
  const [nearCar, setNearCar] = useState(false);

  // Interactive Gameplay Mechanics: Lunar Car [V], 90 K Ice Laser [Space], Hands-On Station Tasks & Science Samples
  const [controllingRover, setControllingRover] = useState(false);
  const [calibratedTasks, setCalibratedTasks] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [minedCrystals, setMinedCrystals] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [collectedSamples, setCollectedSamples] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [inspectSampleIdx, setInspectSampleIdx] = useState<number | null>(null);
  const [drillProgressPct, setDrillProgressPct] = useState(0);
  const [drillTempPct, setDrillTempPct] = useState(18);
  const [drillOverheated, setDrillOverheated] = useState(false);

  const world = useRef<WorldHandle>(null);
  const pointerStarted = useRef(0);
  const drillStateRef = useRef({
    progress: 0,
    temp: 18,
    overheated: false,
    mined: [false, false, false, false, false],
  });

  useEffect(() => {
    drillStateRef.current.mined = minedCrystals;
  }, [minedCrystals]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const anyOverlayOpen =
    decisionModalOpen ||
    telemetryDrawerOpen ||
    mapModalOpen ||
    showBriefing ||
    sensorDeckOpen ||
    certificateOpen ||
    achievementsModalOpen ||
    sampleModalOpen;

  // Keep keyboard navigation inside the active dialog and return to its opener.
  useLayoutEffect(() => {
    if (!anyOverlayOpen) return;
    if (document.activeElement instanceof HTMLElement) overlayOpener.current = document.activeElement;
    return () => overlayOpener.current?.focus();
  }, [anyOverlayOpen]);

  useLayoutEffect(() => {
    if (!anyOverlayOpen) return;
    const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
    const dialog = dialogs[dialogs.length - 1];
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.querySelector<HTMLElement>('button:not(:disabled), input')?.focus();
    }
  }, [anyOverlayOpen, decisionModalOpen, telemetryDrawerOpen, mapModalOpen, showBriefing,
    sensorDeckOpen, certificateOpen, achievementsModalOpen, sampleModalOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Tab' && anyOverlayOpen) {
        const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
        const controls = [...(dialogs[dialogs.length - 1]?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), summary, [tabindex="0"]',
        ) ?? [])].filter((element) => element.getClientRects().length > 0);
        if (!controls.length) return;
        const index = controls.indexOf(document.activeElement as HTMLElement);
        if (index < 0 || (e.shiftKey ? index === 0 : index === controls.length - 1)) {
          e.preventDefault();
          controls[e.shiftKey ? controls.length - 1 : 0].focus();
        }
        return;
      }

      const editing = e.target instanceof HTMLElement &&
        (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName));
      if (!editing && !anyOverlayOpen && !e.altKey && !e.ctrlKey && !e.metaKey && !e.repeat) {
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          soundFX.play('StepNav');
          setTelemetryDrawerOpen(true);
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          soundFX.play('uiClick');
          setMapModalOpen(true);
        }
      }
      if (e.key !== 'Escape') return;
      if (certificateOpen) {
        setCertificateOpen(false);
        return;
      }
      setDecisionModalOpen(false);
      setTelemetryDrawerOpen(false);
      setMapModalOpen(false);
      setShowBriefing(false);
      setSensorDeckOpen(false);
      setAchievementsModalOpen(false);
      setSampleModalOpen(false);
      if (!anyOverlayOpen) setDemoStage(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyOverlayOpen, certificateOpen]);

  // Passive Cryo-Laser Thermal Cooldown
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (drillStateRef.current.temp > 18) {
        drillStateRef.current.temp = Math.max(18, drillStateRef.current.temp - 4);
        setDrillTempPct(Math.round(drillStateRef.current.temp));
        if (drillStateRef.current.overheated && drillStateRef.current.temp <= 35) {
          drillStateRef.current.overheated = false;
          setDrillOverheated(false);
        }
      }
    }, 220);
    return () => window.clearInterval(timer);
  }, []);

  const handleDrillTick = useCallback((crystalIdx: number, dt: number) => {
    const ds = drillStateRef.current;
    if (ds.overheated || ds.mined[crystalIdx]) return;

    ds.temp = Math.min(100, ds.temp + dt * 34);
    setDrillTempPct(Math.round(ds.temp));

    if (ds.temp >= 98) {
      ds.overheated = true;
      setDrillOverheated(true);
      soundFX.play('shadowAlert');
      return;
    }

    soundFX.play('laserDrill');
    ds.progress = Math.min(100, ds.progress + dt * 66);
    setDrillProgressPct(Math.round(ds.progress));

    if (ds.progress >= 100) {
      ds.progress = 0;
      setDrillProgressPct(0);
      world.current?.setDrillHeld(false);
      const nextMined = [...ds.mined];
      nextMined[crystalIdx] = true;
      ds.mined = nextMined;
      setMinedCrystals(nextMined);
      soundFX.play('hotspot');
    }
  }, []);

  const handleTelemetry = useCallback((payload: WorldTelemetryPayload) => {
    setPosition(payload.player);
    setCarPos(payload.car);
    setDronePos(payload.drone);
    setCurrentTier(payload.tier);
    setNearIceIdx(payload.nearIceIdx);
    setNearSampleIdx(payload.nearSampleIdx);
    setNearCar(payload.nearCar);
    setCrewStates(payload.crew);
    setNearbyCrewSpeech(payload.nearbyCrewSpeech);
  }, []);

  const handleCollectSample = useCallback((idx: number) => {
    setCollectedSamples((prev) => prev.map((collected, index) => collected || index === idx));
    soundFX.play('hotspot');
    setInspectSampleIdx(idx);
    setSampleModalOpen(true);
  }, []);

  const handleToggleRover = useCallback(() => {
    setControllingRover((v) => !v);
  }, []);

  const handleCalibrateTask = useCallback((stepNum: number) => {
    setCalibratedTasks((prev) => {
      const next = [...prev];
      next[stepNum - 1] = true;
      return next;
    });
  }, []);

  // Deterministic Simulation Runs
  const runA = useMemo(() => runSimulation(baselineChoices, baselineTasks),
    [baselineChoices, baselineTasks]);
  const runB = useMemo(
    () => (rewoundChoices ? runSimulation(rewoundChoices, branchTasks) : null),
    [rewoundChoices, branchTasks],
  );

  const hasBranch = runB !== null;
  const activeRun = runB ?? runA;
  const activeChoices = rewoundChoices ?? baselineChoices;
  const activeTasks = hasBranch ? branchTasks : baselineTasks;
  const completedPhases = activeRun.steps.length;
  const lastAvailableStep = Math.min(DECISION_COUNT, completedPhases + (activeRun.complete ? 0 : 1));
  const phase = MISSION_DECISIONS[viewStep - 1].phase;
  const scenarioSamples = LRO_PROFILE.filter(({ hour }) => hour >= phase.startHour && hour < phase.endHour);
  const availableSunlight = scenarioSamples.reduce((total, sample) => total + sample.arrayOutputFactor, 0) / scenarioSamples.length;
  const surfaceTemperature = scenarioSamples.reduce((total, sample) => total + sample.surfaceTempK, 0) / scenarioSamples.length;
  const displayedResources = activeRun.resourceHistory[viewStep] ?? activeRun.resources;

  const divergedStep = useMemo(() => {
    if (!rewoundChoices) return null;
    if (baselineTasks.solarCalibrated !== branchTasks.solarCalibrated) return 1;
    for (let i = 0; i < baselineChoices.length; i++) {
      if (baselineChoices[i] !== rewoundChoices[i] || (i === 3 && runA.icePrepared !== runB?.icePrepared)) return i + 1;
    }
    return rewoundChoices.length > baselineChoices.length ? baselineChoices.length + 1 : null;
  }, [baselineChoices, rewoundChoices, baselineTasks.solarCalibrated, branchTasks.solarCalibrated, runA.icePrepared, runB?.icePrepared]);

  const runAChoiceLabel = useMemo(() => {
    if (divergedStep === null) return 'CHOICE A';
    const idx = baselineChoices[divergedStep - 1];
    return idx !== undefined ? `OPT ${CHOICE_LETTERS[idx]}` : 'RUN A';
  }, [baselineChoices, divergedStep]);

  // Trigger audio cues on LRO Shadow (Step 3) and DONKI Solar Storm (Step 5)
  useEffect(() => {
    if (viewStep === 3) soundFX.play('shadowAlert');
    else if (viewStep === 5) soundFX.play('stormAlert');
  }, [viewStep]);

  const activeRecord = activeRun.steps[viewStep - 1];
  const currentMetrics =
    activeRun.history[Math.min(viewStep, activeRun.history.length - 1)] ?? activeRun.final;
  const compareMetrics = hasBranch
    ? runA.history[Math.min(viewStep, runA.history.length - 1)]
    : undefined;

  const flagsBefore = useMemo(() => {
    if (viewStep === 1) return [];
    const prev = activeRun.steps[viewStep - 2];
    return prev ? prev.flagsAfter : activeRun.flags;
  }, [activeRun, viewStep]);

  const canChoose = viewStep <= lastAvailableStep &&
    (hasBranch || (!runA.complete && viewStep === completedPhases + 1));

  function celebrateVictory() {
    soundFX.play('success');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      confetti({
        particleCount: 75,
        spread: 68,
        origin: { y: 0.62 },
        colors: ['#c0e6aa', '#87cebd', '#edc18b', '#38bdf8'],
      });
    } catch {
      /* ignore confetti error in headless mode */
    }
  }

  function handleChoose(choiceIndex: number, tasks: MissionTaskSettings) {
    if (!canChoose) return;

    // Run B keeps the original plan for executed phases and can extend a rescued run.
    const nextChoices = activeChoices.slice();
    nextChoices[viewStep - 1] = choiceIndex;
    const preview = runSimulation(nextChoices, tasks);
    const debriefStep = preview.steps[viewStep - 1];
    if (!debriefStep) return;

    soundFX.play(hasBranch ? 'rewind' : 'choice');
    if (hasBranch) {
      setRewoundChoices(nextChoices);
      setBranchTasks(tasks);
    } else {
      setBaselineChoices(nextChoices);
      setBaselineTasks(tasks);
    }
    setLastDebrief(debriefStep);

    setDecisionModalOpen(false);
    if (preview.complete) {
      if (preview.outcome === 'success' && activeRun.outcome !== 'success') celebrateVictory();
      setViewStep(hasBranch ? Math.min(viewStep, preview.steps.length) : preview.steps.length);
      setTelemetryDrawerOpen(true);
    } else {
      setViewStep(preview.steps.length + 1);
      requestAnimationFrame(() => world.current?.focus());
    }
  }

  function handleSelectStep(step: number) {
    if (step > lastAvailableStep) return;
    soundFX.play('StepNav');
    setViewStep(step);
    if (runA.complete && !rewoundChoices) {
      soundFX.play('rewind');
      setRewoundChoices([...baselineChoices]);
      setBranchTasks(baselineTasks);
    }
  }

  function resetFieldwork() {
    setControllingRover(false);
    setCalibratedTasks(Array.from({ length: DECISION_COUNT }, () => false));
    setCollectedSamples(Array.from({ length: FIELD_SAMPLES.length }, () => false));
    const mined = [false, false, false, false, false];
    setMinedCrystals(mined);
    drillStateRef.current = { progress: 0, temp: 18, overheated: false, mined };
    setDrillProgressPct(0);
    setDrillTempPct(18);
    setDrillOverheated(false);
    setInspectSampleIdx(null);
    setSampleModalOpen(false);
    setLastDebrief(null);
    setAchievementToast(null);
    world.current?.reset();
  }

  function handleReset() {
    soundFX.play('StepNav');
    resetFieldwork();
    setBaselineChoices([]);
    setBaselineTasks(DEFAULT_TASK_SETTINGS);
    setBranchTasks(DEFAULT_TASK_SETTINGS);
    setRewoundChoices(null);
    setDemoStage(null);
    setViewStep(1);
    setDecisionModalOpen(false);
    setTelemetryDrawerOpen(false);
    setMapModalOpen(false);
    requestAnimationFrame(() => world.current?.focus());
  }

  function handleLoadDemo() {
    handleReset();
    soundFX.play('rewind');
    setBaselineChoices(MISSION_DEMO.baseline.slice(0, runSimulation(MISSION_DEMO.baseline).steps.length));
    setRewoundChoices(MISSION_DEMO.branch);
    setViewStep(MISSION_DEMO.rewindStep);
    setTelemetryDrawerOpen(true);
    world.current?.teleportTo({ x: 425, y: 800 });
  }

  function handleStartTour() {
    handleReset();
    soundFX.play('tourChime');
    setShowBriefing(false);
    setSensorDeckOpen(false);
    setCertificateOpen(false);
    setAchievementsModalOpen(false);
    setDemoStage('setup');
    world.current?.teleportTo({ x: STATIONS[0].x, y: STATIONS[0].y + 38 });
  }

  function handleAdvanceTour(stage: DemoStage, useBackup = false) {
    soundFX.play('tourChime');
    if (stage !== 'rewind') setRewoundChoices(null);
    setBaselineTasks(DEFAULT_TASK_SETTINGS);
    setBranchTasks(DEFAULT_TASK_SETTINGS);
    if (stage === 'setup') {
      setBaselineChoices(MISSION_DEMO.baseline.slice(0, 2));
      setViewStep(MISSION_DEMO.rewindStep);
      setDemoStage('shadow');
      world.current?.teleportTo({ x: STATIONS[2].x, y: STATIONS[2].y + 40 });
    } else if (stage === 'shadow') {
      const choices = useBackup ? MISSION_DEMO.branch : MISSION_DEMO.baseline;
      setBaselineChoices(choices.slice(0, runSimulation(choices).steps.length));
      setViewStep(MISSION_DEMO.rewindStep);
      setDemoStage('rewind');
    } else {
      const shadowIndex = MISSION_DEMO.rewindStep - 1;
      const usedBackup = baselineChoices[shadowIndex] === MISSION_DEMO.branch[shadowIndex];
      setRewoundChoices(usedBackup ? MISSION_DEMO.baseline : MISSION_DEMO.branch);
      setViewStep(MISSION_DEMO.rewindStep);
      setDemoStage(null);
      setTelemetryDrawerOpen(true);
    }
  }

  function handleClearBranch() {
    soundFX.play('StepNav');
    setRewoundChoices(null);
    setLastDebrief(null);
    setViewStep(Math.max(1, Math.min(viewStep, runA.steps.length)));
  }

  function handleAdoptBranch() {
    if (!runB || !rewoundChoices) return;
    soundFX.play('choice');
    setBaselineChoices(rewoundChoices);
    setBaselineTasks(branchTasks);
    setRewoundChoices(null);
    setViewStep(Math.min(viewStep, runB.steps.length + (runB.complete ? 0 : 1)));
  }

  const handleWorldInteract = useCallback(
    (station: StationNode) => {
      if (station.decisionId > lastAvailableStep) return;
      soundFX.play('hotspot');
      if (runA.complete && !hasBranch) {
        setRewoundChoices([...baselineChoices]);
        setBranchTasks(baselineTasks);
      }
      setViewStep(station.decisionId);
      setDecisionModalOpen(true);
    },
    [lastAvailableStep, runA.complete, hasBranch, baselineChoices, baselineTasks],
  );

  const handleNavigateFromMap = useCallback((station: StationNode, instant: boolean) => {
    soundFX.play('uiClick');
    if (instant) {
      world.current?.teleportTo({ x: station.x, y: station.y + 12 });
      setMapModalOpen(false);
      requestAnimationFrame(() => world.current?.focus());
    } else {
      world.current?.walkTo({ x: station.x, y: station.y });
    }
  }, []);

  const returnToWorld = useCallback(() => {
    setDecisionModalOpen(false);
    setTelemetryDrawerOpen(false);
    setMapModalOpen(false);
    setShowBriefing(false);
    setSensorDeckOpen(false);
    setCertificateOpen(false);
    setAchievementsModalOpen(false);
  }, []);

  // Automated Artemis Expedition Achievement Checks
  useEffect(() => {
    if (baselineChoices[0] === 0 || rewoundChoices?.[0] === 0) {
      awardAchievement('solar_vanguard');
    }
    if (
      (baselineChoices[1] === 0 || rewoundChoices?.[1] === 0) &&
      (baselineChoices[4] === 2 || rewoundChoices?.[4] === 2)
    ) {
      awardAchievement('storm_sentinel');
    }
    if (minedCrystals.some(Boolean)) {
      awardAchievement('ice_miner');
    }
    if (
      collectedSamples.some(Boolean) ||
      minedCrystals.filter(Boolean).length >= 3 ||
      calibratedTasks.filter(Boolean).length >= 3
    ) {
      awardAchievement('sample_hunter');
    }
    if (divergedStep !== null) {
      awardAchievement('temporal_pilot');
    }
    if (activeRun.complete && activeRun.outcome === 'success' && (activeRun.score ?? 0) >= 75) {
      awardAchievement('master_commander');
    }
  }, [
    baselineChoices,
    rewoundChoices,
    minedCrystals,
    calibratedTasks,
    collectedSamples,
    divergedStep,
    activeRun.complete,
    activeRun.outcome,
    activeRun.score,
    awardAchievement,
  ]);

  const activeStation = STATIONS[Math.min(DECISION_COUNT - 1, Math.max(0, viewStep - 1))];
  const atActiveStation = nearbyStation?.decisionId === activeStation.decisionId;
  function followStationRoute() {
    world.current?.walkTo(activeStation);
    world.current?.focus();
  }
  const currentDecision = MISSION_DECISIONS[viewStep - 1];
  const minedCount = minedCrystals.filter(Boolean).length;
  const calibratedCount = calibratedTasks.filter(Boolean).length;
  const collectedCount = collectedSamples.filter(Boolean).length;
  const bonusScience = collectedCount * 4;
  const effectiveSciencePoints = currentMetrics.sciencePoints;

  const isShadowCrisis = viewStep === 3 && completedPhases < 3 && !activeRun.complete;
  const isStormCrisis = viewStep === 5 && completedPhases < 5 && !activeRun.complete;
  const nearShelterAccess = nearbyStation?.decisionId === 5;
  const solarSetup = activeRun.steps[0];
  const solarOutputPct = activeRecord ? Math.round(activeRecord.env.arrayOutputFactor * 100)
    : solarSetup ? Math.round(100 * environmentAtHour(
      phase.startHour, new Set(flagsBefore), solarSetup.env.orientationFactor,
    ).arrayOutputFactor) : null;
  const iceRecord = viewStep >= 4 ? activeRun.steps[3] : undefined;
  const iceWaterKg = iceRecord?.choiceId === 'D4-A' ? iceRecord.resourceFlows.waterExtractedKg : null;

  const { cropGrowthDays, harvestedFoodKg } = displayedResources;
  const cropProgress = Math.max(0, Math.min(1,
    (cropGrowthDays - CROP_TRIAL.ageAtInstallDays) / (CROP_TRIAL.harvestAgeDays - CROP_TRIAL.ageAtInstallDays),
  ));
  const cropStatus: CropStatus = harvestedFoodKg > 0 ? 'harvested'
    : cropGrowthDays === 0 ? 'idle'
    : (activeRun.outcome === 'abort' && activeRecord?.endHour === activeRun.elapsedHours) ||
      !canPowerCrop(displayedResources, currentMetrics.powerKwh) ? 'paused'
    : cropProgress > 0 ? 'growing' : 'ready';

  const worldSnapshot = useMemo(
    () => ({
      batteryKwh: currentMetrics.powerKwh,
      powerLow: currentMetrics.powerKwh < GAME_CONSTANTS.brownoutThresholdKwh,
      lifeSupportLow: currentMetrics.lifeSupportPct < GAME_CONSTANTS.survivalFocusThresholdPct,
      lifeSupportPct: currentMetrics.lifeSupportPct,
      sunlightFraction: availableSunlight,
      solarOutputPct,
      cropStatus,
      cropProgress,
      harvestedFoodKg,
      iceWaterKg,
      icePreparationAvailable: calibratedTasks[3] || activeTasks.icePrepared,
      iceBypassed: iceRecord !== undefined && iceWaterKg === null,
      stormPending: isStormCrisis,
      activeStep: viewStep,
      lastAvailableStep,
      completedCount: completedPhases,
      choices: activeChoices,
      hasBranch,
      divergedStep,
      runAChoiceLabel,
      controllingRover,
      minedCrystals,
      calibratedTasks,
      collectedSamples,
      lang,
    }),
    [
      currentMetrics.powerKwh,
      currentMetrics.lifeSupportPct,
      availableSunlight,
      solarOutputPct,
      cropStatus,
      cropProgress,
      harvestedFoodKg,
      iceWaterKg,
      iceRecord,
      isStormCrisis,
      viewStep,
      lastAvailableStep,
      activeChoices,
      completedPhases,
      hasBranch,
      divergedStep,
      runAChoiceLabel,
      controllingRover,
      minedCrystals,
      calibratedTasks,
      activeTasks.icePrepared,
      collectedSamples,
      lang,
    ],
  );

  const bearingDeg =
    (Math.atan2(activeStation.x - position.x, -(activeStation.y - position.y)) * 180) / Math.PI;
  const distanceMeters = Math.max(
    0,
    Math.round(Math.hypot(activeStation.x - position.x, activeStation.y - position.y) / 6),
  );
  const tierMeta = TIER_BADGES[currentTier];

  const stationExercise = (
    <StationTaskMiniGame
      step={viewStep}
      lang={lang}
      completed={calibratedTasks[viewStep - 1]}
      minedCount={minedCount}
      onComplete={handleCalibrateTask}
    />
  );

  return (
    <div className="app-shell">
      {/* =====================================================================
       * TOP HEADER: Brand + Iconic Crew Task Bar + Mission Controls
       * =================================================================== */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-symbol">
            <Orbit size={21} strokeWidth={1.5} />
          </span>
          <div>
            <strong>
              OUTPOST<span>REPLAY</span>
            </strong>
            <small>{t('tagline')}</small>
          </div>
        </div>

        {/* Among-Us Inspired Outpost Total Task Progress Bar */}
        <div className="crew-taskbar" title="Mission Decisions & Station Calibrations">
          <span className="crew-taskbar-label">
            {lang === 'az' ? 'BAZA TAPŞIRIQLARI' : 'TOTAL TASKS'}
          </span>
          <div className="crew-taskbar-segments">
            {STATIONS.map((st, idx) => {
              const done = st.decisionId <= completedPhases;
              const cal = calibratedTasks[idx];
              return (
                <span
                  key={st.decisionId}
                  className={`crew-taskbar-seg ${done ? 'done' : cal ? 'calibrated' : ''}`}
                />
              );
            })}
          </div>
          <span className="font-mono text-[10px] font-semibold text-[#c0e6aa]">
            {completedPhases}/6
          </span>
        </div>

        <nav className="topbar-actions" aria-label={lang === 'az' ? 'Missiyanın idarəetmə düymələri' : 'Mission controls'}>
          {/* Guided judge demo */}
          <button
            type="button"
            className="text-button text-button--tour"
            onClick={handleStartTour}
            title={t('judgeTourButton')}
            aria-label={t('judgeTourButton')}
          >
            <Sparkles size={14} className="text-amber-300" />
            <span className="topbar-tour-label">{t('judgeTourButton')}</span>
          </button>

          {/* Interactive NASA Sensor Deck & Raw Telemetry Explorer */}
          <button
            type="button"
            className="text-button text-button--sensor"
            onClick={() => {
              soundFX.play('StepNav');
              setDecisionModalOpen(false);
              setTelemetryDrawerOpen(false);
              setMapModalOpen(false);
              setShowBriefing(false);
              setCertificateOpen(false);
              setSensorDeckOpen((v) => !v);
            }}
            title={t('sensorDeckButton')}
            aria-label={t('sensorDeckButton')}
          >
            <Activity size={14} className="text-cyan-300" />
            <span className="topbar-long">{t('sensorDeckButton')}</span>
          </button>

          {/* Downloadable / Printable Flight Certificate */}
          <button
            type="button"
            className="text-button text-button--cert"
            onClick={() => {
              soundFX.play('StepNav');
              setDecisionModalOpen(false);
              setTelemetryDrawerOpen(false);
              setMapModalOpen(false);
              setShowBriefing(false);
              setSensorDeckOpen(false);
              setAchievementsModalOpen(false);
              setCertificateOpen(true);
            }}
            title={t('exportCertificateButton')}
            aria-label={t('exportCertificateButton')}
          >
            <Award size={14} className="text-emerald-300" />
            <span className="topbar-long">{t('exportCertificateButton')}</span>
          </button>

          {/* Artemis Mission Honors & Achievements */}
          <button
            type="button"
            className="text-button text-button--badge"
            onClick={() => {
              soundFX.play('StepNav');
              setDecisionModalOpen(false);
              setTelemetryDrawerOpen(false);
              setMapModalOpen(false);
              setShowBriefing(false);
              setSensorDeckOpen(false);
              setCertificateOpen(false);
              setSampleModalOpen(false);
              setAchievementsModalOpen(true);
            }}
            title={t('achievementsButton')}
            aria-label={t('achievementsButton')}
          >
            <Trophy size={14} className="text-amber-300" />
            <span className="topbar-long">{t('achievementsButton')}</span>
            <span className="rounded bg-amber-400/25 px-1 font-mono text-[10px] font-bold text-amber-200">
              {unlockedBadges.length}/6
            </span>
          </button>

          {/* NASA Field Science Samples & Geological Dossier */}
          <button
            type="button"
            className="text-button text-button--badge"
            onClick={() => {
              soundFX.play('StepNav');
              setDecisionModalOpen(false);
              setTelemetryDrawerOpen(false);
              setMapModalOpen(false);
              setShowBriefing(false);
              setSensorDeckOpen(false);
              setCertificateOpen(false);
              setAchievementsModalOpen(false);
              setInspectSampleIdx(null);
              setSampleModalOpen(true);
            }}
            title={t('samplesButton')}
            aria-label={t('samplesButton')}
          >
            <Sparkles size={14} className="text-sky-300" />
            <span className="topbar-long">{t('samplesButton')}</span>
            <span className="rounded bg-sky-400/25 px-1 font-mono text-[10px] font-bold text-sky-200">
              {collectedCount}/6
            </span>
          </button>

          <button type="button" className="text-button text-button--accent" onClick={handleLoadDemo} title={t('loadDemo')} aria-label={t('loadDemo')}>
            <PlayCircle size={15} />
            <span className="topbar-long">{t('loadDemo')}</span>
          </button>

          <button
            type="button"
            className="text-button"
            aria-label={t('compareTitle')}
            title={t('compareTitle')}
            onClick={() => {
              soundFX.play('StepNav');
              setDecisionModalOpen(false);
              setMapModalOpen(false);
              setShowBriefing(false);
              setSensorDeckOpen(false);
              setCertificateOpen(false);
              setTelemetryDrawerOpen((v) => !v);
            }}
          >
            <BarChart3 size={15} />
            <span className="topbar-long">
              {t('compareTitle')}
            </span>
          </button>

          <button
            type="button"
            className="text-button"
            aria-label={t('missionBriefing')}
            title={t('missionBriefing')}
            onClick={() => {
              soundFX.play('StepNav');
              setDecisionModalOpen(false);
              setTelemetryDrawerOpen(false);
              setMapModalOpen(false);
              setSensorDeckOpen(false);
              setCertificateOpen(false);
              setShowBriefing(true);
            }}
          >
            <BookOpen size={15} />
            <span className="topbar-long">{t('missionBriefing')}</span>
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() => setMuted(soundFX.toggleMute())}
            aria-label={muted ? t('unmute') : t('mute')}
            title={muted ? t('unmute') : t('mute')}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            type="button"
            className="lang-button"
            onClick={() => {
              soundFX.play('StepNav');
              setLang(lang === 'en' ? 'az' : 'en');
            }}
            aria-label={t('language')}
          >
            {lang === 'en' ? 'EN · AZ' : 'AZ · EN'}
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={handleReset}
            aria-label={t('reset')}
            title={t('reset')}
          >
            <RotateCcw size={16} />
          </button>
        </nav>
      </header>

      {/* =====================================================================
       * DETERMINISTIC TELEMETRY BAR (Power, Life Support, Radiation, Science)
       * =================================================================== */}
      <section className="resource-hud" aria-label={lang === 'az' ? 'Bazanın telemetriyası' : 'Outpost telemetry'}>
        <div className="mission-clock">
          <span>{tr(currentDecision.phase.label)}</span>
          <strong>
            {fmt(activeRecord?.endHour ?? activeRun.elapsedHours)}
            <small> / 216 h</small>
          </strong>
        </div>

        {/* Power Reserve */}
        <div className="hud-resource hud-resource--power">
          <div className="resource-caption">
            <Zap size={13} />
            <span>{t('power')}</span>
          </div>
          <div className="resource-reading">
            <strong>{fmt(currentMetrics.powerKwh)}</strong>
            <small>{t('unitKwh')}</small>
            {compareMetrics !== undefined && (
              <small className="ml-1 font-mono text-[10px] text-[#c0e6aa]">
                ({signed(Math.round((currentMetrics.powerKwh - compareMetrics.powerKwh) * 10) / 10)})
              </small>
            )}
          </div>
          <div className="resource-track">
            <span style={{ width: `${Math.min(100, Math.max(0, currentMetrics.powerKwh))}%` }} />
          </div>
        </div>

        {/* Life Support */}
        <div className="hud-resource hud-resource--lifesupport">
          <div className="resource-caption">
            <HeartPulse size={13} />
            <span>{t('lifeSupport')}</span>
          </div>
          <div className="resource-reading">
            <strong>{fmt(currentMetrics.lifeSupportPct)}</strong>
            <small>{t('unitPct')}</small>
            {compareMetrics !== undefined && (
              <small className="ml-1 font-mono text-[10px] text-[#87cebd]">
                (
                {signed(
                  Math.round((currentMetrics.lifeSupportPct - compareMetrics.lifeSupportPct) * 10) /
                    10,
                )}
                )
              </small>
            )}
          </div>
          <div className="resource-track">
            <span
              style={{ width: `${Math.min(100, Math.max(0, currentMetrics.lifeSupportPct))}%` }}
            />
          </div>
        </div>

        {/* Cumulative Radiation Dose */}
        <div
          className={`hud-resource hud-resource--radiation ${
            currentMetrics.radiationMsv >= RADIATION_LIMITS.missionWarningMsv
              ? 'hud-resource--radiation-warn'
              : ''
          }`}
        >
          <div className="resource-caption">
            <ShieldAlert size={13} />
            <span>{t('radiation')}</span>
          </div>
          <div className="resource-reading">
            <strong>{fmt(currentMetrics.radiationMsv)}</strong>
            <small>
              {t('unitMsv')} / {RADIATION_LIMITS.missionWarningMsv}
            </small>
          </div>
          <div className="resource-track">
            <span
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, (currentMetrics.radiationMsv / 80) * 100),
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Science Progress */}
        <div className="hud-resource hud-resource--science">
          <div className="resource-caption">
            <FlaskConical size={13} />
            <span>{t('science')}</span>
            {bonusScience > 0 && (
              <span className="font-mono text-[10px] text-amber-300">
                (+{bonusScience} {lang === 'az' ? 'sahə' : 'field'})
              </span>
            )}
          </div>
          <div className="resource-reading">
            <strong>{fmt(effectiveSciencePoints)}</strong>
            <small>{t('unitPts')}</small>
          </div>
          <div className="resource-track">
            <span
              style={{ width: `${Math.min(100, Math.max(0, effectiveSciencePoints))}%` }}
            />
          </div>
        </div>

        {/* Run A / Run B Outcome & Rewind Trigger */}
        <div className="hud-resource">
          <div className="resource-caption">
            <GitBranch size={13} />
            <span>{hasBranch ? `${t('runB')} (${t('rewound')})` : t('runA')}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <OutcomeBadge result={activeRun} label={hasBranch ? t('runB') : t('runA')} />
          </div>
          <button
            type="button"
            onClick={() => setTelemetryDrawerOpen(true)}
            className="mt-1.5 text-left font-mono text-[10px] text-[#c0e6aa] hover:underline"
          >
            {hasBranch
              ? lang === 'az'
                ? 'Müqayisə Qrafiklərini Aç →'
                : 'Inspect Run A vs B →'
              : `${completedPhases}/${DECISION_COUNT} ${
                  lang === 'az' ? 'qərar' : 'decisions'
                } · [R]`}
          </button>
        </div>
      </section>

      <section className="nasa-physics-strip" aria-label={tr({ en: 'Scenario conditions and reserves', az: 'Ssenari şəraiti və ehtiyatlar' })}>
        <div className="nasa-physics-item">
          <Orbit size={13} className="text-amber-300" />
          <span>
            {tr({ en: 'Modeled sunlight', az: 'Modeldə günəş işığı' })}{' '}
            <strong>{Math.round(availableSunlight * 100)}%</strong>
          </span>
        </div>
        <div className="nasa-physics-item">
          <Snowflake size={13} className="text-sky-300" />
          <span>
            {tr({ en: 'Modeled surface', az: 'Modeldə səth' })}{' '}
            <strong>{fmt(surfaceTemperature)} K</strong>
          </span>
        </div>
        {viewStep === 5 && (
          <div className="nasa-physics-item">
            <Zap size={13} className="text-rose-400" />
            <span>{tr({ en: 'Scripted storm peak', az: 'Ssenaridə fırtına piki' })} <strong>{SEP_PEAK_FLUX_PFU} pfu</strong></span>
          </div>
        )}
        <div className="nasa-physics-item">
          <HeartPulse size={13} className="text-teal-300" />
          <span>{tr({ en: 'Crew reserves', az: 'Ekipaj ehtiyatı' })}{' '}
            <strong>
              {fmt(displayedResources.oxygenKg)} {tr({ en: 'kg', az: 'kq' })} O₂ ·{' '}
              {fmt(displayedResources.waterKg)} {tr({ en: 'kg', az: 'kq' })} H₂O ·{' '}
              {fmt(displayedResources.foodKg)} {tr({ en: 'kg food', az: 'kq qida' })}
            </strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSensorDeckOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20"
        >
          <Activity size={12} className="text-cyan-300" />
          <span>{t('sensorDeckButton')} →</span>
        </button>
      </section>

      {!guideDismissed && !demoStage && (
        <aside className="guide-banner" aria-label={t('guideTitle')}>
          <strong className="flex items-center gap-1.5 text-[#c0e6aa]">
            <Sparkles size={13} aria-hidden="true" />
            {t('guideTitle')} · {runA.complete ? 3 : completedPhases > 0 ? 2 : 1}/3
          </strong>
          <span className="flex-1 text-slate-100" role="status">
            {t(runA.complete ? 'guideReplay' : completedPhases > 0 ? 'guideAfterChoice' : atActiveStation ? 'guideAtSolar' : 'guideStart')}
          </span>
          <button
            type="button"
            onClick={() => setGuideDismissed(true)}
            className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-white/10"
          >
            {t('dismissGuide')}
          </button>
        </aside>
      )}

      {activeRun.outcome === 'abort' && !demoStage && (
        <aside className="causal-rescue-banner" role="status">
          <ShieldAlert size={18} className="shrink-0 text-rose-200" />
          <p className="text-xs text-rose-100">
            {lang === 'az'
              ? `Missiya D${completedPhases} mərhələsində dayandı. Müqayisə laboratoriyasında əvvəlki qərarı dəyişib nəticəni sınayın.`
              : `Mission stopped during D${completedPhases}. Revisit an earlier decision in the comparison lab and test a different strategy.`}
          </p>
          <button
            type="button"
            onClick={() => setTelemetryDrawerOpen(true)}
            className="ml-auto shrink-0 rounded-lg border border-rose-300/40 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-400/15"
          >
            {t('compareTitle')}
          </button>
        </aside>
      )}

      {/* =====================================================================
       * MAIN 2.5D LUNAR OUTPOST GAME VIEWPORT
       * =================================================================== */}
      <main id="game-surface" className="game-surface">
        <PhaserWorld
          ref={world}
          snapshot={worldSnapshot}
          paused={anyOverlayOpen}
          label={lang === 'az' ? 'Şeklton bazasının 2.5D interaktiv mühiti' : 'Shackleton Outpost 2.5D Interactive World'}
          onReady={() => setReady(true)}
          onError={setError}
          onNearby={setNearbyStation}
          onInteract={handleWorldInteract}
          onTelemetry={handleTelemetry}
          onToggleRover={handleToggleRover}
          onDrillTick={handleDrillTick}
          onCollectSample={handleCollectSample}
        />

        <div className="world-vignette" />

        {demoStage && !anyOverlayOpen && (
          <JudgeTourBanner
            stage={demoStage}
            baseline={runA}
            onAdvance={(useBackup) => handleAdvanceTour(demoStage, useBackup)}
            onOpenScience={() => setSensorDeckOpen(true)}
            onClose={() => setDemoStage(null)}
          />
        )}

        {!demoStage && <aside className="objective-card">
          <div className="eyebrow accent">
            <Radio size={13} />
            <span>{tr(activeStation.code)}</span>
            <span className="chapter-count">
              0{viewStep} / 0{DECISION_COUNT}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold ${tierMeta.tone}`}
            >
              {tierMeta[lang]}
            </span>
            {controllingRover && (
              <span className="inline-flex items-center gap-1 rounded border border-sky-400/40 bg-sky-400/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-sky-200">
                <Truck size={10} />
                {lang === 'az' ? 'AY MAŞINI AKTİV' : 'DRIVING CAR'}
              </span>
            )}
          </div>

          <h1>
            {runA.complete && !hasBranch
              ? t(`outcome.${runA.outcome}`)
              : viewStep === 1 && completedPhases === 0
                ? lang === 'az' ? 'Günəş enerjisini qur' : 'Set up solar power'
                : tr(activeStation.objectiveTitle)}
          </h1>
          <p>
            {runA.complete && !hasBranch
              ? t('timelineHintComplete')
              : viewStep === 1 && completedPhases === 0
                ? lang === 'az'
                  ? 'Günəş panelləri qızdırıcıları və həyat təminatını işlədən batareyanı doldurur. Kölgəyə hazırlaşmaq üçün panel quruluşunu seç.'
                  : 'Solar panels charge the battery that runs heaters and life support. Choose a setup before the shadow arrives.'
                : tr(activeStation.objectiveBody)}
          </p>

          {viewStep === 1 && completedPhases === 0 && !atActiveStation && !guideDismissed && (
            <div className="objective-controls-note">
              <kbd>WASD</kbd> {lang === 'az' ? 'ilə və ya xəritəyə klikləyərək hərəkət edin.' : 'or click the ground to move.'}
            </div>
          )}

          <div
            role="status"
            className={`mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${
              worldSnapshot.powerLow
                ? 'border-amber-300/40 bg-amber-950/70 text-amber-100'
                : 'border-emerald-300/25 bg-emerald-950/30 text-emerald-100'
            }`}
          >
            <Zap size={12} aria-hidden="true" />
            {worldSnapshot.powerLow
              ? lang === 'az' ? 'Aşağı enerji ehtiyatı' : 'Low battery reserve'
              : lang === 'az' ? 'Normal enerji ehtiyatı' : 'Normal battery reserve'}
            {worldSnapshot.powerLow && (
              <span className="font-mono">
                {fmt(currentMetrics.powerKwh)} {t('unitKwh')}
              </span>
            )}
          </div>

          {worldSnapshot.lifeSupportLow && (
            <div role="status" className="mt-1.5 text-xs font-semibold text-rose-200">
              {lang === 'az' ? 'Həyat təminatı ehtiyatı azdır' : 'Life support reserve low'}
            </div>
          )}
          {cropStatus !== 'idle' && (
            <div role="status" className="mt-1.5 text-xs text-emerald-200">
              {lang === 'az' ? 'İstixana' : 'Greenhouse'} · {
                tr({
                  ready: { en: 'ready to grow', az: 'böyüməyə hazırdır' },
                  growing: { en: 'growing', az: 'böyüyür' },
                  paused: { en: 'growth paused', az: 'böyümə dayanıb' },
                  harvested: { en: 'harvested', az: 'məhsul yığılıb' },
                }[cropStatus])
              } · {harvestedFoodKg > 0 ? `${fmt(harvestedFoodKg)} ${lang === 'az' ? 'kq' : 'kg'}` : `${Math.round(cropProgress * 100)}%`}
            </div>
          )}
          {viewStep <= 3 && solarOutputPct !== null && (
            <div className="mt-1.5 text-xs text-amber-100">
              {lang === 'az' ? `Panellər · nominal gücün ${solarOutputPct}%-i` : `Solar array · ${solarOutputPct}% of nominal output`}
            </div>
          )}
          {iceWaterKg !== null && (
            <div className="mt-1.5 text-xs text-sky-100">
              {lang === 'az' ? `Emaldan alınan su · ${fmt(iceWaterKg, 2)} kq` : `Water recovered · ${fmt(iceWaterKg, 2)} kg`}
            </div>
          )}

          {/* Quick Action Navigation & Direct Console Trigger Buttons */}
          {runA.complete ? (
            <button
              type="button"
              onClick={() => setTelemetryDrawerOpen(true)}
              className="mt-2.5 inline-flex items-center gap-2 rounded-md border border-sky-300/35 bg-sky-950/65 px-2.5 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-900/65"
            >
              <GitBranch size={13} aria-hidden="true" />
              {t('compareTitle')}
            </button>
          ) : (
            <div className="objective-actions">
              {!atActiveStation && (
                <button
                  type="button"
                  onClick={followStationRoute}
                  className="objective-action objective-action--primary"
                >
                  <Compass size={14} aria-hidden="true" />
                  <span>{t('jumpToActive')}<small>{distanceMeters} m</small></span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleWorldInteract(activeStation)}
                className={`objective-action ${atActiveStation ? 'objective-action--primary' : ''}`}
              >
                <Wrench size={14} aria-hidden="true" />
                <span>{t('openConsole')}{atActiveStation && <small>[E]</small>}</span>
              </button>
            </div>
          )}

          {/* Crisis Alert Pill (Step 3 Lights Out / Step 5 Solar Storm) */}
          {isShadowCrisis && (
            <div className="mt-2.5 rounded-lg border border-amber-400/40 bg-amber-950/45 px-2.5 py-1.5 text-[11px] text-amber-200">
              <strong>
                {lang === 'az' ? '72 SAATLIQ SSENARİ KÖLGƏSİ' : '72-HOUR TRAINING SHADOW'}
              </strong>{' '}
              {lang === 'az'
                ? 'Günəş panellərinin hasilatı azalır. D3-də enerji planını seçin.'
                : 'Solar output falls. Choose how to manage power at D3.'}
            </div>
          )}

          {isStormCrisis && (
            <div
              className={`mt-2.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${
                nearShelterAccess
                  ? 'border-cyan-400/45 bg-cyan-950/45 text-cyan-100'
                  : 'border-rose-400/55 bg-rose-950/55 text-rose-100'
              }`}
            >
              <strong>
                {nearShelterAccess
                  ? lang === 'az'
                    ? '🛡 SIĞINACAQ GİRİŞİ'
                    : '🛡 SHELTER ACCESS'
                  : lang === 'az'
                    ? '🚨 SSENARİDƏ PROTON FIRTINASI'
                    : '🚨 SCENARIO PROTON STORM'}
              </strong>{' '}
              {nearShelterAccess
                ? lang === 'az'
                  ? 'D5 konsolunda qorunma variantını seçin.'
                  : 'Choose a shielding strategy at the D5 console.'
                : lang === 'az'
                  ? 'D5 sığınacağına gedib məruzqalmanı müəyyən edən variantı seçin.'
                  : 'Visit the D5 shelter. Your console choice sets the modeled exposure.'}
            </div>
          )}

          {lastDebrief && <DecisionDebrief key={lastDebrief.choiceId} step={lastDebrief} onDismiss={() => setLastDebrief(null)} />}

          {nearbyCrewSpeech && (
            <details className="mt-2.5 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2 text-xs">
              <summary className="cursor-pointer font-semibold" style={{ color: nearbyCrewSpeech.color }}>
                {nearbyCrewSpeech.speaker} · {lang === 'az' ? 'Ekipajın məsləhəti' : 'Crew advisory'}
              </summary>
              <p className="mt-1">{nearbyCrewSpeech.text}</p>
            </details>
          )}

          {/* 6-Step Progress Nodes (Click to inspect / rewind!) */}
          <div className="objective-path" role="group" aria-label={t('timeline')}>
            {MISSION_DECISIONS.map((d, idx) => {
              const stepNum = d.id;
              const isLocked = stepNum <= completedPhases;
              const isCurrent = stepNum === viewStep;
              const isChanged =
                hasBranch &&
                rewoundChoices !== null &&
                baselineChoices[idx] !== rewoundChoices[idx];
              const clickable = stepNum <= lastAvailableStep;

              return (
                <div key={stepNum} className="contents">
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => {
                      handleSelectStep(stepNum);
                      const st = STATIONS[stepNum - 1];
                      if (st) world.current?.walkTo({ x: st.x, y: st.y });
                    }}
                    title={`D${stepNum}: ${tr(d.title)}`}
                    aria-label={`D${stepNum} · ${tr(d.title)}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`objective-dot ${
                      isChanged
                        ? 'changed'
                        : isLocked
                          ? 'complete'
                          : isCurrent
                            ? 'current'
                            : ''
                    }`}
                  >
                    {isLocked && !isChanged ? <Check size={10} /> : stepNum}
                  </button>
                  {idx < DECISION_COUNT - 1 && <i />}
                </div>
              );
            })}
          </div>

          {/* Field Bonus Counters */}
          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[9.5px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Wrench size={11} className="text-[#c0e6aa]" />
              {lang === 'az' ? 'Kalibr:' : 'Tasks:'} {calibratedCount}/6
            </span>
            <span className="inline-flex items-center gap-1">
              <Snowflake size={11} className="text-sky-300" />
              {lang === 'az' ? '90K Buz:' : 'Ice Cores:'} {minedCount}/5
            </span>
          </div>
        </aside>}

        {/* TOP-RIGHT: Live Tactical Base Radar + [M] Full Schematic Modal */}
        <BaseMap
          player={position}
          car={carPos}
          drone={dronePos}
          crew={crewStates}
          controllingRover={controllingRover}
          activeStep={viewStep}
          completedCount={completedPhases}
          calibratedTasks={calibratedTasks}
          lang={lang}
          expanded={mapModalOpen}
          onExpandToggle={() => {
            soundFX.play('uiClick');
            setMapModalOpen((v) => !v);
          }}
          onNavigateStation={handleNavigateFromMap}
        />

        {/* Loading / Error States */}
        {!ready && !error && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-xl border border-white/15 bg-[#10202a]/95 px-6 py-4 text-sm text-[#cbdcc9] shadow-2xl">
              {lang === 'az'
                ? 'Şeklton 2.5D Bazası yüklənir…'
                : 'Initializing Shackleton 2.5D Outpost…'}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="max-w-md rounded-xl border border-rose-400/30 bg-[#10202a] p-6 text-center text-sm text-rose-200 shadow-2xl">
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* BOTTOM-CENTER: Contextual USE [E] Prompt, Ice Laser Bar, or Wayfinding */}
        {!anyOverlayOpen && ready && (
          <div className="interaction-area">
            {nearIceIdx >= 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-sky-400/50 bg-[#0d2231]/95 px-4 py-2.5 shadow-xl">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    world.current?.setDrillHeld(true);
                  }}
                  onPointerUp={() => world.current?.setDrillHeld(false)}
                  onPointerCancel={() => world.current?.setDrillHeld(false)}
                  onLostPointerCapture={() => world.current?.setDrillHeld(false)}
                  onBlur={() => world.current?.setDrillHeld(false)}
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
                      world.current?.setDrillHeld(true);
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
                      world.current?.setDrillHeld(false);
                    }
                  }}
                  className="rounded-lg border border-sky-300/60 bg-sky-400/20 px-3 py-1.5 font-mono text-xs font-bold text-sky-100 hover:bg-sky-400/30"
                >
                  {drillOverheated
                    ? lang === 'az'
                      ? 'SOYUYUR…'
                      : 'COOLING…'
                    : lang === 'az'
                      ? 'QAZMAQ ÜÇÜN BASILI SAXLA [SPACE]'
                      : 'HOLD TO DRILL [SPACE]'}
                </button>
                <div className="w-36">
                  <div className="flex justify-between font-mono text-[9.5px] text-sky-200">
                    <span>{lang === 'az' ? 'Nümunə' : 'Core'} {drillProgressPct}%</span>
                    <span className={drillTempPct > 80 ? 'text-rose-300' : 'text-slate-300'}>
                      {lang === 'az' ? 'Qızma' : 'Heat'} {drillTempPct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40" role="progressbar"
                    aria-label={lang === 'az' ? 'Nümunənin götürülməsi' : 'Core collection'}
                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={drillProgressPct}>
                    <div
                      className="h-full bg-sky-400 transition-all"
                      style={{ width: `${drillProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : nearSampleIdx >= 0 && !collectedSamples[nearSampleIdx] ? (
              <button
                type="button"
                className="interaction-prompt border-amber-400/60 bg-[#172212]/95 hover:bg-[#213219]"
                onClick={() => handleCollectSample(nearSampleIdx)}
              >
                <kbd className="border-amber-300/40 bg-amber-400/20 text-amber-200">E</kbd>
                <span>
                  <small className="font-mono text-amber-300">
                    {FIELD_SAMPLES[nearSampleIdx]?.icon} {FIELD_SAMPLES[nearSampleIdx]?.elevation.toUpperCase().replace('_', ' ')}
                  </small>
                  {lang === 'az'
                    ? `Kəşf et: ${FIELD_SAMPLES[nearSampleIdx]?.name[lang]} (+4 Xal)`
                    : `Discover: ${FIELD_SAMPLES[nearSampleIdx]?.name[lang]} (+4 Science)`}
                </span>
                <ChevronRight size={19} className="text-amber-300" />
              </button>
            ) : nearbyStation ? (
              <button
                type="button"
                className="interaction-prompt"
                onClick={() => handleWorldInteract(nearbyStation)}
              >
                <kbd>E</kbd>
                <span>
                  <small>{tr(nearbyStation.code)}</small>
                  {lang === 'az'
                    ? `${tr(nearbyStation.roomName)} konsolunu aç`
                    : `Open ${tr(nearbyStation.roomName)} console`}
                </span>
                <ChevronRight size={19} />
              </button>
            ) : (
              <button
                type="button"
                className="wayfinding"
                onClick={followStationRoute}
                title={
                  lang === 'az'
                    ? 'Avtopilotla getmək üçün klikləyin'
                    : 'Click to auto-walk to target sector'
                }
              >
                <Compass
                  size={16}
                  style={{ transform: `rotate(${bearingDeg}deg)` }}
                  className="text-[#c0e6aa]"
                />
                <span>
                  {lang === 'az'
                    ? `D${viewStep} istiqaməti`
                    : `Route to D${viewStep}`}
                </span>
                <small className="ml-1 font-mono text-[10px] text-[#9fb4b5]">
                  {distanceMeters} m
                </small>
              </button>
            )}
          </div>
        )}

        {/* BOTTOM-RIGHT: Iconic Among-Us Style Action Buttons (USE [E], CAR [V], MAP [M]) + Touch D-Pad */}
        <div className="action-dock">
          <div className="among-actions">
            <button
              type="button"
              disabled={!nearbyStation || anyOverlayOpen}
              onClick={() => nearbyStation && handleWorldInteract(nearbyStation)}
              className={`among-btn ${nearbyStation ? 'among-btn--ready' : ''}`}
              title={lang === 'az' ? 'Stansiya Konsolunu İşlət [E]' : 'Use Station Console [E]'}
            >
              <Wrench size={20} />
              <span>{lang === 'az' ? 'İŞLƏT' : 'USE'}</span>
              <kbd>[E]</kbd>
            </button>

            <button
              type="button"
              disabled={anyOverlayOpen}
              onClick={() => {
                soundFX.play('uiClick');
                handleToggleRover();
                requestAnimationFrame(() => world.current?.focus());
              }}
              className={`among-btn ${
                controllingRover
                  ? 'among-btn--car-active'
                  : nearCar
                    ? 'among-btn--ready'
                    : ''
              }`}
              title={
                lang === 'az'
                  ? '2.5D Ay Maşınını Sür / Düş [V]'
                  : 'Drive / Exit 2.5D Lunar Car [V]'
              }
            >
              <Truck size={20} />
              <span>{controllingRover ? (lang === 'az' ? 'DÜŞ' : 'EXIT') : lang === 'az' ? 'MAŞIN' : 'CAR'}</span>
              <kbd>[V]</kbd>
            </button>

            <button
              type="button"
              disabled={anyOverlayOpen}
              onClick={() => {
                soundFX.play('uiClick');
                setMapModalOpen(true);
              }}
              className="among-btn"
              title={lang === 'az' ? 'Taktiki Baza Xəritəsi [M]' : 'Tactical Base Map [M]'}
            >
              <MapIcon size={20} />
              <span>{lang === 'az' ? 'XƏRİTƏ' : 'MAP'}</span>
              <kbd>[M]</kbd>
            </button>
          </div>

          <div className="touch-controls" role="group" aria-label={lang === 'az' ? 'Hərəkət düymələri' : 'Movement controls'}>
            {(
              [
                { key: 'up', x: 0, y: -1, Icon: ArrowUp, label: { en: 'Move north', az: 'Şimala get' } },
                { key: 'left', x: -1, y: 0, Icon: ArrowLeft, label: { en: 'Move west', az: 'Qərbə get' } },
                { key: 'down', x: 0, y: 1, Icon: ArrowDown, label: { en: 'Move south', az: 'Cənuba get' } },
                { key: 'right', x: 1, y: 0, Icon: ArrowRight, label: { en: 'Move east', az: 'Şərqə get' } },
              ] as const
            ).map(({ key, x, y, Icon, label }) => (
              <button
                key={key}
                type="button"
                className={`direction direction--${key}`}
                disabled={anyOverlayOpen || !ready}
                aria-label={tr(label)}
                onPointerDown={(e) => {
                  pointerStarted.current = performance.now();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  world.current?.move({ x, y });
                }}
                onPointerUp={() => world.current?.move({ x: 0, y: 0 })}
                onPointerCancel={() => world.current?.move({ x: 0, y: 0 })}
                onLostPointerCapture={() => world.current?.move({ x: 0, y: 0 })}
                onClick={(e) => {
                  if (e.detail === 0 || performance.now() - pointerStarted.current < 120) {
                    world.current?.nudge({ x, y });
                  }
                }}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        </div>

        {/* Subtle Bottom Controls Hint Strip */}
        <div className="world-bottom-bar">
          <div className="key-hints">
            <span>
              <kbd>WASD / CLICK</kbd>
              <small>{lang === 'az' ? 'Hərəkət' : 'Walk / Drive'}</small>
            </span>
            <span>
              <kbd>E</kbd>
              <small>{lang === 'az' ? 'Konsol' : 'Use Task'}</small>
            </span>
            <span>
              <kbd>V</kbd>
              <small>{lang === 'az' ? 'Ay Maşını' : 'Lunar Car'}</small>
            </span>
            <span>
              <kbd>M</kbd>
              <small>{lang === 'az' ? 'Xəritə' : 'Base Map'}</small>
            </span>
            <span>
              <kbd>R</kbd>
              <small>{lang === 'az' ? 'Geri Sar' : 'Rewind Lab'}</small>
            </span>
          </div>

          <span className="surface-status">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#b9dfad]" />
            {t('noLogosNote')}
          </span>
        </div>
      </main>

      {/* =====================================================================
       * STATION CONSOLE MODAL ([E] — Hands-On Mini-Game + NASA DecisionCard)
       * =================================================================== */}
      {decisionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={tr(currentDecision.title)}
          onClick={(e) => {
            if (e.target === e.currentTarget) returnToWorld();
          }}
        >
          <div className="relative flex max-h-[92dvh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-[#b6cec3]/30 bg-[#14222b] p-4 shadow-2xl sm:p-5">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#c0e6aa]">
                <Sparkles size={14} />
                <span>{tr(activeStation.code)}</span>
              </div>
              <button
                type="button"
                onClick={returnToWorld}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
                {t('close')}
              </button>
            </div>

            <DecisionCard
              key={viewStep}
              step={viewStep}
              mode={hasBranch ? 'branch' : 'baseline'}
              choiceA={baselineChoices[viewStep - 1]}
              choiceB={rewoundChoices?.[viewStep - 1]}
              record={activeRecord}
              flagsBefore={flagsBefore}
              priorChoices={activeChoices}
              taskSettings={activeTasks}
              taskAvailable={calibratedTasks[viewStep - 1]}
              taskExercise={stationExercise}
              canChoose={canChoose}
              onChoose={handleChoose}
              onPrev={() => setViewStep((s) => Math.max(1, s - 1))}
              onNext={() => {
                if (viewStep === completedPhases && activeRun.complete) {
                  setDecisionModalOpen(false);
                  setTelemetryDrawerOpen(true);
                } else {
                  setViewStep((s) => Math.min(lastAvailableStep, s + 1));
                }
              }}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
       * TIME-REWIND & NASA TELEMETRY DRAWER ([R] — Run A vs Run B + Recharts)
       * =================================================================== */}
      {telemetryDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/82 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t('compareTitle')}
          onClick={(e) => {
            if (e.target === e.currentTarget) returnToWorld();
          }}
        >
          <div className="relative max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#b6cec3]/30 bg-[#14222b] p-6 shadow-2xl scrollbar-thin">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#c0e6aa]">
                  {tr({ en: 'CONTROLLED MISSION EXPERIMENT', az: 'NƏZARƏTLİ MİSSİYA TƏCRÜBƏSİ' })}
                </span>
                <h2 className="mt-1 text-xl font-semibold text-[#e5eae4]">{t('compareTitle')}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.play('StepNav');
                    setCertificateOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25"
                  title={t('exportCertificateButton')}
                >
                  <Award size={14} />
                  <span>{t('exportCertificateButton')}</span>
                </button>

                {hasBranch && (
                  <>
                    <button
                      type="button"
                      onClick={handleAdoptBranch}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25"
                    >
                      <CheckCheck size={14} />
                      {t('adoptRunB')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearBranch}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                    >
                      <Trash2 size={14} />
                      {t('clearRunB')}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={returnToWorld}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                >
                  <X size={15} />
                  {t('close')}
                </button>
              </div>
            </div>

            {runB && <div className="mb-4"><DeltaSummary a={runA} b={runB} /></div>}

            <div className="mb-4 rounded-xl border border-white/10 bg-[#0e1a22] p-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-100">
                {lang === 'az' ? 'Qərarı yenidən nəzərdən keçirin' : 'Revisit a decision'}
              </h3>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span>
                  {hasBranch
                    ? t('timelineHintBranch')
                    : runA.complete
                      ? t('timelineHintComplete')
                      : t('timelineHintPlaying')}
                </span>
                {divergedStep !== null && (
                  <span className="rounded border border-purple-400/35 bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] text-purple-200">
                    {lang === 'az'
                      ? 'Xəritədə A gedişinin izi'
                      : 'Run A trail on the map'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {MISSION_DECISIONS.map((d, idx) => {
                  const stepNum = d.id;
                  const cA = baselineChoices[idx];
                  const cB = rewoundChoices?.[idx];
                  const taskChanged =
                    (stepNum === 1 && runB?.solarCalibrated !== runA.solarCalibrated) ||
                    (stepNum === 4 && runB?.icePrepared !== runA.icePrepared);
                  const changed = hasBranch && cB !== undefined && (cA !== cB || taskChanged);
                  const active = viewStep === stepNum;
                  const unlocked = stepNum <= lastAvailableStep;

                  return (
                    <button
                      key={stepNum}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        handleSelectStep(stepNum);
                        setTelemetryDrawerOpen(false);
                        setDecisionModalOpen(true);
                      }}
                      className={`flex flex-col items-start rounded-lg border p-2.5 text-left text-xs transition ${
                        active
                          ? 'border-[#c0e6aa]/70 bg-[#22352f] text-[#e5eae4]'
                          : changed
                            ? 'border-amber-400/50 bg-amber-500/10 text-amber-100'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-[#9eb6b5]">D{stepNum}</span>
                      <strong className="mt-0.5 line-clamp-2 font-medium">{tr(d.title)}</strong>
                      <span className="mt-1.5 font-mono text-[10px] text-[#c0e6aa]">
                        {cA !== undefined ? `A: ${CHOICE_LETTERS[cA]}` : '—'}
                        {cB !== undefined ? ` → B: ${CHOICE_LETTERS[cB]}` : ''}
                        {changed && taskChanged && (
                          <span className="block">{stepNum === 1
                            ? lang === 'az' ? 'Kalibrləmə dəyişdi' : 'Calibration changed'
                            : lang === 'az' ? 'Emal hazırlığı dəyişdi' : 'Extractor preparation changed'}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              {runB ? (
                <details className="rounded-xl border border-white/15 bg-[#0e1a22] p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                    {lang === 'az' ? 'Missiyanın ehtiyatları və müddəti' : 'Mission reserves and timing'}
                  </summary>
                  <div className="mt-3"><MissionResults a={runA} b={runB} /></div>
                </details>
              ) : <MissionResults a={runA} b={null} />}
              <CompareCharts a={runA} b={runB} comparisonStep={divergedStep} />
              <EvidencePanel />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MISSION BRIEFING MODAL
       * =================================================================== */}
      {showBriefing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t('briefingTitle')}
          onClick={(e) => {
            if (e.target === e.currentTarget) returnToWorld();
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#b6cec3]/35 bg-[#14222b] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#c0e6aa]">
                  {tr(TRAINING_SITE.name)}
                </span>
                <h2 className="mt-1 text-xl font-semibold text-[#e5eae4]">
                  {t('briefingTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={returnToWorld}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              <p>{t('briefingBody1')}</p>
              <p>{t('briefingBody2')}</p>
              <p>{t('briefingBody3')}</p>
              <div className="rounded-lg border border-white/10 bg-[#0d1a22] p-3 text-xs text-slate-300">
                <strong className="text-[#c0e6aa]">
                  {lang === 'az' ? 'Yeni 2.5D Oyun İmkanları:' : '2.5D Outpost Features:'}
                </strong>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>
                    {lang === 'az'
                      ? 'Ay Maşını [V]: Hər yerdən çağırın, fənərlərlə 90 K Buz Hövzəsinə sürün və [Space] ilə su-buz kristalları qazın.'
                      : 'Driveable Lunar Car [V]: Board anywhere, drive into the 90 K Cold-Trap Basin with headlights, and mine ice cores with [Space].'}
                  </li>
                  <li>
                    {lang === 'az'
                      ? 'Canlı AI Ekipaj Üzvləri (Müh. Leyla, Dr. Rəşad və SPARK-9 Dronu): Bazada patrul çəkir, məsləhət verir və Günəş fırtınasında D5 sığınacağına qaçırlar!'
                      : 'Autonomous AI Crewmates (Eng. Leyla, Dr. Rashad & SPARK-9 Drone): Patrol sectors, share live engineering tips, and sprint to D5 Bunker during solar storms!'}
                  </li>
                  <li>
                    {lang === 'az'
                      ? 'İnteraktiv Stansiya Tapşırıqları [E] və Taktiki Xəritə [M]: Naqilləri birləşdirin, klapanları tənzimləyin və otaqlar arası sürətli keçid edin.'
                      : 'Hands-On Station Tasks [E] & Tactical Map [M]: Patch HVDC wires, align solar masts, seal storm clamps, and fast-deploy between sectors.'}
                  </li>
                </ul>
              </div>
              <p className="rounded-lg border border-[#c0e6aa]/30 bg-[#c0e6aa]/10 p-3 text-xs font-medium text-[#d8f0c8]">
                {t('briefingGoal')}
              </p>
              <p className="text-[11px] text-slate-400">{t('noLogosNote')}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={returnToWorld}
                className="rounded-lg bg-[#c0e6aa] px-5 py-2.5 text-xs font-semibold text-[#162922] hover:bg-[#d2edbe]"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * NASA SENSOR DECK & RAW TELEMETRY MODAL
       * =================================================================== */}
      {sensorDeckOpen && (
        <NasaSensorDeckModal onClose={() => setSensorDeckOpen(false)} />
      )}

      {/* =====================================================================
       * ARTEMIS FLIGHT READINESS CERTIFICATE & AUDIT DOSSIER MODAL
       * =================================================================== */}
      {certificateOpen && (
        <FlightCertificateModal
          run={hasBranch && runB ? runB : runA}
          runLabel={hasBranch ? t('runB') : t('runA')}
          onClose={() => setCertificateOpen(false)}
        />
      )}

      {/* =====================================================================
       * ARTEMIS MISSION HONORS & ACHIEVEMENTS MODAL
       * =================================================================== */}
      {achievementsModalOpen && (
        <AchievementsModal
          unlockedIds={unlockedBadges}
          onClose={() => setAchievementsModalOpen(false)}
        />
      )}

      {/* =====================================================================
       * NASA FIELD SCIENCE SAMPLES & GEOLOGY DOSSIER MODAL
       * =================================================================== */}
      {sampleModalOpen && (
        <SampleDiscoveryModal
          sampleIdx={inspectSampleIdx}
          collectedSamples={collectedSamples}
          onSelectSample={(idx) => setInspectSampleIdx(idx)}
          onClose={() => setSampleModalOpen(false)}
        />
      )}

      {/* Celebratory Achievement Unlock Notification Toast */}
      {achievementToast && (
        <AchievementToast
          achievement={achievementToast}
          onDismiss={() => setAchievementToast(null)}
        />
      )}
    </div>
  );
}
