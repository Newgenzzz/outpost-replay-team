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
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Compass,
  FlaskConical,
  FolderOpen,
  GitBranch,
  GraduationCap,
  HeartPulse,
  Map as MapIcon,
  Orbit,
  PlayCircle,
  Radio,
  Rocket,
  RotateCcw,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Trash2,
  Trophy,
  Truck,
  Wind,
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
import { ShadowPredictionResult } from './components/ShadowPredictionResult';
import { phasePreparationChanged } from './utils/playerFeedback';
import { recordShadowPrediction, type ShadowPrediction, type ShadowStrategy } from './engine/shadowPrediction';
import CompareCharts from './components/CompareCharts';
import DeltaSummary from './components/DeltaSummary';
import MissionResults from './components/MissionResults';
import EvidencePanel from './components/EvidencePanel';
import { JudgeTourBanner, type DemoStage } from './components/JudgeTourBanner';
import { FlightCertificateModal } from './components/FlightCertificateModal';
import { NasaSensorDeckModal } from './components/NasaSensorDeckModal';
import { MissionLaunchScreen } from './components/MissionLaunchScreen';
import { MarsBonusModal } from './components/MarsBonusModal';
import {
  ACHIEVEMENTS,
  AchievementsModal,
  AchievementToast,
  type Achievement,
} from './components/AchievementsModal';
import { SampleDiscoveryModal } from './components/SampleDiscoveryModal';
import { CHOICE_LETTERS, fmt, signed } from './components/metricMeta';
import { useI18n } from './i18n/LanguageContext';
import { compareRuns, runExperiment, type StepRecord } from './engine/simulation';
import { applyRunChoice, cloneRunInput, createRunInput, getRunTasks, type RunInput } from './engine/runInput';
import { encodeSharedReplayUrl, parseSharedReplayFromUrl, urlWithoutImportedReplay } from './engine/sharedReplay';
import { MISSION_PROGRESS_KEY, parseMissionProgress, serializeMissionProgress } from './engine/missionProgress';
import { canPowerCrop, CROP_TRIAL } from './engine/resources';
import { environmentAtHour } from './engine/power';
import type { MissionTaskSettings, TrainingMode } from './types';
import { DECISION_COUNT, MISSION_DECISIONS, MISSION_DEMO } from './data/missionDecisions';
import { GAME_CONSTANTS, RADIATION_LIMITS, SEP_PEAK_FLUX_PFU, LRO_PROFILE, TRAINING_SITE } from './data/nasaTelemetry';
import { soundFX } from './utils/soundEffects';
import { AudioSettings } from './components/AudioSettings';
import { runMarsSimulation } from './engine/marsMission';
import { decisionAudioCue, missionMusicState } from './utils/missionAudio';

const STORAGE_MODE_KEY = 'outpost_training_mode';
const STORAGE_CALLSIGN_KEY = 'outpost_commander_callsign';

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

  const initialShared = useMemo(() => parseSharedReplayFromUrl(window.location.href), []);
  const importedReplayPending = useRef(Boolean(initialShared));
  const initialSaved = useMemo(() => {
    // A requested replay takes precedence over this browser's previous mission.
    if (initialShared) return null;
    try { return parseMissionProgress(window.localStorage.getItem(MISSION_PROGRESS_KEY)); }
    catch { return null; }
  }, [initialShared]);
  const [missionSaveStatus, setMissionSaveStatus] = useState<'saved' | 'unavailable' | null>(initialSaved ? 'saved' : null);
  const [legacyReplay, setLegacyReplay] = useState(initialShared?.legacy ?? initialSaved?.legacyReplay ?? false);

  useLayoutEffect(() => { if (initialSaved) setLang(initialSaved.lang); }, [initialSaved, setLang]);

  const [trainingMode, setTrainingMode] = useState<TrainingMode>(() => {
    if (initialShared?.m) return initialShared.m;
    try {
      const saved = window.localStorage.getItem(STORAGE_MODE_KEY);
      return saved === 'engineer' ? 'engineer' : 'cadet';
    } catch {
      return 'cadet';
    }
  });

  const [commanderCallsign, setCommanderCallsign] = useState<string>(() => {
    try {
      return window.localStorage.getItem(STORAGE_CALLSIGN_KEY) ?? '';
    } catch {
      return '';
    }
  });

  /** Run A — locked step by step through deterministic simulation. */
  const [baselineInput, setBaselineInput] = useState<RunInput>(() => initialShared?.a ?? initialSaved?.a ?? createRunInput([]));
  /** Run B — copy of Run A with one or more rewound decisions (null = no branch yet). */
  const [branchInput, setBranchInput] = useState<RunInput | null>(() => initialShared?.b ?? initialSaved?.b ?? null);
  const baselineChoices = useMemo(() => baselineInput.phases.map((p) => p.choiceIndex), [baselineInput]);
  const rewoundChoices = useMemo(() => branchInput?.phases.map((p) => p.choiceIndex) ?? null, [branchInput]);
  // Exploration unlocks draft preparations. Only Apply records them in a run.
  const [pendingTasks, setPendingTasks] = useState<Record<number, Partial<MissionTaskSettings>>>(() => initialSaved?.pendingTasks ?? {});
  const [viewStep, setViewStep] = useState(() =>
    initialSaved?.viewStep ?? Math.max(1, Math.min(DECISION_COUNT, (initialShared?.b ?? initialShared?.a)?.phases.length ?? 1)),
  );

  // Overlays & Modals
  const [launchScreenOpen, setLaunchScreenOpen] = useState<boolean>(() => !initialShared);
  const [tourConfirmOpen, setTourConfirmOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [telemetryDrawerOpen, setTelemetryDrawerOpen] = useState<boolean>(() => Boolean(initialShared));
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [demoStage, setDemoStage] = useState<DemoStage | null>(() => initialSaved?.demoStage ?? null);
  const overlayOpener = useRef<HTMLElement | null>(null);
  const [sensorDeckOpen, setSensorDeckOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [marsModalOpen, setMarsModalOpen] = useState(false);
  const [marsChoices, setMarsChoices] = useState<number[]>(() => initialSaved?.marsChoices ?? []);
  const [dossierMenuOpen, setDossierMenuOpen] = useState(false);
  const dossierMenuRef = useRef<HTMLDivElement | null>(null);

  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);

  useEffect(() => {
    soundFX.initialize();
    const activate = (event: Event) => {
      if (!event.isTrusted) return;
      soundFX.unlock();
      soundFX.startAmbient();
    };
    document.addEventListener('pointerdown', activate, true);
    document.addEventListener('keydown', activate, true);
    return () => {
      document.removeEventListener('pointerdown', activate, true);
      document.removeEventListener('keydown', activate, true);
      soundFX.dispose();
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_MODE_KEY, trainingMode);
    } catch {
      /* ignore storage errors */
    }
  }, [trainingMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_CALLSIGN_KEY, commanderCallsign);
    } catch {
      /* ignore storage errors */
    }
  }, [commanderCallsign]);

  useEffect(() => {
    if (!dossierMenuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (dossierMenuRef.current && !dossierMenuRef.current.contains(e.target as Node)) {
        setDossierMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [dossierMenuOpen]);

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

  const [lastDebrief, setLastDebrief] = useState<StepRecord | null>(() => initialSaved?.debriefStep
    ? runExperiment(initialSaved.b ?? initialSaved.a).steps[initialSaved.debriefStep - 1] ?? null : null);
  const [trackedSample, setTrackedSample] = useState<number | null>(null);
  const [shadowPrediction, setShadowPrediction] = useState<ShadowPrediction | null>(() => initialShared?.prediction ?? initialSaved?.prediction ?? null);

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
  const [calibratedTasks, setCalibratedTasks] = useState<boolean[]>(initialSaved?.calibratedTasks ?? [
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [minedCrystals, setMinedCrystals] = useState<boolean[]>(initialSaved?.minedCrystals ?? [
    false,
    false,
    false,
    false,
    false,
  ]);
  const [collectedSamples, setCollectedSamples] = useState<boolean[]>(initialSaved?.collectedSamples ?? [
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

  const hasMissionProgress = baselineInput.phases.length > 0 || branchInput !== null || demoStage !== null ||
    Object.keys(pendingTasks).length > 0 || calibratedTasks.some(Boolean) || minedCrystals.some(Boolean) ||
    collectedSamples.some(Boolean) || baselineInput.scenario.stormPeakPfu !== SEP_PEAK_FLUX_PFU;

  useEffect(() => {
    try {
      if (hasMissionProgress || marsChoices.length > 0) {
        window.localStorage.setItem(MISSION_PROGRESS_KEY, serializeMissionProgress({
          a: baselineInput, b: branchInput, pendingTasks, calibratedTasks, minedCrystals, collectedSamples, marsChoices,
          prediction: shadowPrediction, viewStep, debriefStep: lastDebrief?.step ?? null,
          demoStage, legacyReplay, lang,
        }));
        setMissionSaveStatus('saved');
        if (importedReplayPending.current) {
          const resumeUrl = urlWithoutImportedReplay(window.location.href);
          if (resumeUrl) {
            try {
              window.history.replaceState(window.history.state, '', resumeUrl);
              importedReplayPending.current = false;
            } catch { /* Keep the original link if this browser disallows replacing it. */ }
          }
        }
      } else {
        window.localStorage.removeItem(MISSION_PROGRESS_KEY);
        setMissionSaveStatus(null);
      }
    } catch {
      setMissionSaveStatus('unavailable');
    }
  }, [hasMissionProgress, baselineInput, branchInput, pendingTasks, calibratedTasks, minedCrystals,
    collectedSamples, marsChoices, shadowPrediction, viewStep, lastDebrief, demoStage, legacyReplay, lang]);

  const world = useRef<WorldHandle>(null);
  const pointerStarted = useRef(0);
  const nextApplyStep = useRef(1);
  const recordedFieldwork = useRef({ cores: 0, samples: 0 });

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
    audioSettingsOpen ||
    launchScreenOpen ||
    tourConfirmOpen ||
    decisionModalOpen ||
    telemetryDrawerOpen ||
    mapModalOpen ||
    showBriefing ||
    sensorDeckOpen ||
    certificateOpen ||
    achievementsModalOpen ||
    sampleModalOpen ||
    marsModalOpen;

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
  }, [
    anyOverlayOpen,
    launchScreenOpen,
    tourConfirmOpen,
    decisionModalOpen,
    telemetryDrawerOpen,
    mapModalOpen,
    showBriefing,
    sensorDeckOpen,
    certificateOpen,
    achievementsModalOpen,
    sampleModalOpen,
    marsModalOpen,
    audioSettingsOpen,
  ]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Tab' && anyOverlayOpen) {
        const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
        const controls = [
          ...(dialogs[dialogs.length - 1]?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), summary, [tabindex="0"]',
          ) ?? []),
        ].filter((element) => element.getClientRects().length > 0);
        if (!controls.length) return;
        const index = controls.indexOf(document.activeElement as HTMLElement);
        if (index < 0 || (e.shiftKey ? index === 0 : index === controls.length - 1)) {
          e.preventDefault();
          controls[e.shiftKey ? controls.length - 1 : 0].focus();
        }
        return;
      }

      const editing =
        e.target instanceof HTMLElement &&
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
      if (audioSettingsOpen) {
        setAudioSettingsOpen(false);
        return;
      }
      if (tourConfirmOpen) {
        setTourConfirmOpen(false);
        return;
      }
      if (dossierMenuOpen) {
        setDossierMenuOpen(false);
        return;
      }
      if (certificateOpen) {
        setCertificateOpen(false);
        return;
      }
      if (launchScreenOpen) {
        setLaunchScreenOpen(false);
        return;
      }
      setDecisionModalOpen(false);
      setTelemetryDrawerOpen(false);
      setMapModalOpen(false);
      setShowBriefing(false);
      setSensorDeckOpen(false);
      setAchievementsModalOpen(false);
      setSampleModalOpen(false);
      setMarsModalOpen(false);
      if (!anyOverlayOpen) setDemoStage(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyOverlayOpen, audioSettingsOpen, certificateOpen, dossierMenuOpen, launchScreenOpen, tourConfirmOpen]);

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

  const updateActiveTasks = useCallback((step: number, patch: Partial<MissionTaskSettings>) => {
    setPendingTasks((prev) => ({ ...prev, [step]: { ...prev[step], ...patch } }));
  }, []);

  const handleDrillTick = useCallback(
    (crystalIdx: number, dt: number) => {
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
        updateActiveTasks(4, { extraIceCores: Math.max(recordedFieldwork.current.cores, nextMined.filter(Boolean).length) });
        soundFX.play('hotspot');
      }
    },
    [updateActiveTasks],
  );

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

  const handleCollectSample = useCallback(
    (idx: number) => {
      setCollectedSamples((prev) => {
        const next = prev.map((collected, index) => collected || index === idx);
        updateActiveTasks(nextApplyStep.current, { fieldSamplesCount: Math.max(recordedFieldwork.current.samples, next.filter(Boolean).length) });
        return next;
      });
      soundFX.play('hotspot');
      setInspectSampleIdx(idx);
      setSampleModalOpen(true);
      setTrackedSample((current) => (current === idx ? null : current));
    },
    [updateActiveTasks],
  );

  const handleToggleRover = useCallback(() => {
    setControllingRover((v) => !v);
  }, []);

  const handleCalibrateTask = useCallback(
    (stepNum: number) => {
      setCalibratedTasks((prev) => {
        const next = [...prev];
        next[stepNum - 1] = true;
        return next;
      });
      const patch: Partial<MissionTaskSettings> =
        stepNum === 1
          ? { solarCalibrated: true }
          : stepNum === 2
            ? { eclssSealed: true }
            : stepNum === 3
              ? { busPatched: true }
              : stepNum === 4
                ? { icePrepared: true }
                : stepNum === 5
                  ? { stormClamped: true }
                  : { dishAligned: true };
      updateActiveTasks(stepNum, patch);
    },
    [updateActiveTasks],
  );

  // Deterministic Simulation Runs
  const runA = useMemo(
    () => runExperiment(baselineInput),
    [baselineInput],
  );
  const runB = useMemo(
    () => (branchInput ? runExperiment(branchInput) : null),
    [branchInput],
  );

  const hasBranch = runB !== null;
  const activeRun = runB ?? runA;
  const activeChoices = rewoundChoices ?? baselineChoices;
  const activeInput = branchInput ?? baselineInput;
  const stormPeakPfu = activeInput.scenario.stormPeakPfu;
  const completedPhases = activeRun.steps.length;
  const lastAvailableStep = Math.min(DECISION_COUNT, completedPhases + (activeRun.complete ? 0 : 1));
  const canChoose =
    viewStep <= lastAvailableStep && (hasBranch || (!runA.complete && viewStep === completedPhases + 1));
  const activeTasks = {
    ...getRunTasks(activeInput, viewStep),
    ...(canChoose ? pendingTasks[viewStep] : {}),
  };
  nextApplyStep.current = hasBranch ? viewStep : Math.min(DECISION_COUNT, completedPhases + 1);
  recordedFieldwork.current = {
    cores: Math.max(0, ...activeInput.phases.map((p) => p.tasks.extraIceCores)),
    samples: Math.max(0, ...activeInput.phases.map((p) => p.tasks.fieldSamplesCount)),
  };
  const phase = MISSION_DECISIONS[viewStep - 1].phase;
  const scenarioSamples = LRO_PROFILE.filter(({ hour }) => hour >= phase.startHour && hour < phase.endHour);
  const availableSunlight =
    scenarioSamples.reduce((total, sample) => total + sample.arrayOutputFactor, 0) / scenarioSamples.length;
  const surfaceTemperature =
    scenarioSamples.reduce((total, sample) => total + sample.surfaceTempK, 0) / scenarioSamples.length;
  const displayedResources = activeRun.resourceHistory[viewStep] ?? activeRun.resources;

  const divergedStep = useMemo(() => {
    return runB ? compareRuns(runA, runB).firstDivergence : null;
  }, [runA, runB]);

  const runAChoiceLabel = useMemo(() => {
    if (divergedStep === null) return 'CHOICE A';
    const idx = baselineChoices[divergedStep - 1];
    return idx !== undefined ? `OPT ${CHOICE_LETTERS[idx]}` : 'RUN A';
  }, [baselineChoices, divergedStep]);

  const shareUrl = useMemo(
    () =>
      encodeSharedReplayUrl(window.location.href, {
        a: baselineInput,
        b: branchInput,
        m: trainingMode,
        prediction: shadowPrediction,
      }),
    [baselineInput, branchInput, trainingMode, shadowPrediction],
  );

  const activeRecord = activeRun.steps[viewStep - 1];
  const currentMetrics =
    activeRun.history[Math.min(viewStep, activeRun.history.length - 1)] ?? activeRun.final;
  const compareMetrics = hasBranch
    ? runA.history[Math.min(viewStep, runA.history.length - 1)]
    : undefined;

  const marsAudioOutcome = useMemo(() => runMarsSimulation(marsChoices).outcome, [marsChoices]);
  useEffect(() => {
    const state = launchScreenOpen ? 'menu' : marsModalOpen
      ? marsAudioOutcome === 'success' ? 'exploration' : 'critical'
      : missionMusicState(false, activeRun);
    soundFX.setMusicState(state);
  }, [launchScreenOpen, activeRun, marsModalOpen, marsAudioOutcome]);

  useEffect(() => () => soundFX.stopRadio(), [decisionModalOpen, viewStep]);

  // Warn once when a newly reached crisis becomes the next unplanned phase.
  // Restored missions start silently; inspecting completed history never replays warnings.
  const pendingAudioWarning = !runA.complete && !hasBranch
    ? completedPhases === 2 ? 'shadowAlert'
      : completedPhases === 4 && baselineInput.scenario.stormPeakPfu > 0 ? 'stormAlert' : null
    : null;
  const previousAudioWarning = useRef(pendingAudioWarning);
  useEffect(() => {
    if (pendingAudioWarning !== previousAudioWarning.current && pendingAudioWarning && !launchScreenOpen) {
      soundFX.play(pendingAudioWarning);
    }
    previousAudioWarning.current = pendingAudioWarning;
  }, [pendingAudioWarning, launchScreenOpen]);

  const flagsBefore = useMemo(() => {
    if (viewStep === 1) return [];
    const prev = activeRun.steps[viewStep - 2];
    return prev ? prev.flagsAfter : activeRun.flags;
  }, [activeRun, viewStep]);

  function celebrateVictory() {
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

  function closeAllModals() {
    setAudioSettingsOpen(false);
    setLaunchScreenOpen(false);
    setTourConfirmOpen(false);
    setDecisionModalOpen(false);
    setTelemetryDrawerOpen(false);
    setMapModalOpen(false);
    setShowBriefing(false);
    setSensorDeckOpen(false);
    setCertificateOpen(false);
    setAchievementsModalOpen(false);
    setSampleModalOpen(false);
    setMarsModalOpen(false);
    setDossierMenuOpen(false);
  }

  function handleChoose(choiceIndex: number, tasks: MissionTaskSettings, prediction: ShadowStrategy | null) {
    if (!canChoose) return;

    const nextInput = applyRunChoice(activeInput, viewStep, choiceIndex, tasks);
    const preview = runExperiment(nextInput);
    const debriefStep = preview.steps[viewStep - 1];
    if (!debriefStep) return;

    soundFX.play(decisionAudioCue(activeRun, preview, viewStep));
    if (hasBranch) {
      setBranchInput(nextInput);
    } else {
      setBaselineInput(nextInput);
    }
    setPendingTasks((prev) => { const next = { ...prev }; delete next[viewStep]; return next; });
    setLastDebrief(debriefStep);
    if (!hasBranch && viewStep === 3) {
      setShadowPrediction(prediction ? recordShadowPrediction(prediction, nextInput) : null);
    }

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
      setBranchInput(cloneRunInput(baselineInput));
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
    setTrackedSample(null);
    setSampleModalOpen(false);
    setLastDebrief(null);
    setShadowPrediction(null);
    setPendingTasks({});
    setLegacyReplay(false);
    setAchievementToast(null);
    world.current?.reset();
  }

  function resetExperiment(peakPfu = SEP_PEAK_FLUX_PFU) {
    soundFX.play('StepNav');
    resetFieldwork();
    setBaselineInput(createRunInput([], { stormPeakPfu: peakPfu }));
    setBranchInput(null);
    setDemoStage(null);
    setViewStep(1);
    closeAllModals();
    requestAnimationFrame(() => world.current?.focus());
  }

  function handleReset() { resetExperiment(); }

  function handleSelectStormPeakPfu(peakPfu: number) {
    // Called only by the explicit Start new experiment action in the science deck.
    resetExperiment(peakPfu);
  }

  function handleLoadDemo() {
    handleReset();
    soundFX.play('rewind');
    setBaselineInput(createRunInput(MISSION_DEMO.baseline));
    setBranchInput(createRunInput(MISSION_DEMO.branch));
    setViewStep(MISSION_DEMO.rewindStep);
    setTelemetryDrawerOpen(true);
    world.current?.teleportTo({ x: 425, y: 800 });
  }

  function handleStartTour() {
    if (hasMissionProgress) {
      setTourConfirmOpen(true);
      return;
    }
    startTour();
  }

  function startTour() {
    handleReset();
    soundFX.play('launch');
    setDemoStage('setup');
    world.current?.teleportTo({ x: STATIONS[0].x, y: STATIONS[0].y + 38 });
  }

  function handleAdvanceTour(
    stage: DemoStage,
    useBackup = false,
    prediction: ShadowStrategy | null = null,
  ) {
    if (stage === 'setup') soundFX.play('choice');
    if (stage === 'rewind') soundFX.play('rewind');
    if (stage !== 'rewind') setBranchInput(null);
    setPendingTasks({});
    if (stage === 'setup') {
      setBaselineInput(createRunInput(MISSION_DEMO.baseline.slice(0, 2)));
      setViewStep(MISSION_DEMO.rewindStep);
      setDemoStage('shadow');
      world.current?.teleportTo({ x: STATIONS[2].x, y: STATIONS[2].y + 40 });
    } else if (stage === 'shadow') {
      const choices = useBackup ? MISSION_DEMO.branch : MISSION_DEMO.baseline;
      const nextInput = createRunInput(choices);
      soundFX.play(decisionAudioCue(runA, runExperiment(nextInput), 3));
      setBaselineInput(nextInput);
      setShadowPrediction(prediction ? recordShadowPrediction(prediction, nextInput) : null);
      setViewStep(MISSION_DEMO.rewindStep);
      setDemoStage('rewind');
    } else {
      const shadowIndex = MISSION_DEMO.rewindStep - 1;
      const usedBackup = baselineChoices[shadowIndex] === MISSION_DEMO.branch[shadowIndex];
      setBranchInput(createRunInput(usedBackup ? MISSION_DEMO.baseline : MISSION_DEMO.branch));
      setViewStep(MISSION_DEMO.rewindStep);
      setDemoStage(null);
      setTelemetryDrawerOpen(true);
    }
  }

  function handleClearBranch() {
    soundFX.play('StepNav');
    setBranchInput(null);
    setPendingTasks({});
    setLastDebrief(null);
    setViewStep(Math.max(1, Math.min(viewStep, runA.steps.length)));
  }

  function handleAdoptBranch() {
    if (!runB || !branchInput) return;
    soundFX.play('choice');
    setBaselineInput(cloneRunInput(branchInput));
    setBranchInput(null);
    setPendingTasks({});
    setViewStep(Math.min(viewStep, runB.steps.length + (runB.complete ? 0 : 1)));
  }

  const handleWorldInteract = useCallback(
    (station: StationNode) => {
      if (station.decisionId > lastAvailableStep) return;
      soundFX.play('hotspot');
      if (runA.complete && !hasBranch) {
        setBranchInput(cloneRunInput(baselineInput));
      }
      setViewStep(station.decisionId);
      setDecisionModalOpen(true);
    },
    [lastAvailableStep, runA.complete, hasBranch, baselineInput],
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
    setLaunchScreenOpen(false);
    setDecisionModalOpen(false);
    setTelemetryDrawerOpen(false);
    setMapModalOpen(false);
    setShowBriefing(false);
    setSensorDeckOpen(false);
    setCertificateOpen(false);
    setAchievementsModalOpen(false);
    setMarsModalOpen(false);
    setDossierMenuOpen(false);
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
    setTrackedSample(null);
    world.current?.walkTo(activeStation);
    world.current?.focus();
  }
  const currentDecision = MISSION_DECISIONS[viewStep - 1];
  const minedCount = minedCrystals.filter(Boolean).length;
  const calibratedCount = calibratedTasks.filter(Boolean).length;
  const collectedCount = collectedSamples.filter(Boolean).length;
  const effectiveSciencePoints = currentMetrics.sciencePoints;
  const isCadet = trainingMode === 'cadet';

  const isShadowCrisis = viewStep === 3 && completedPhases < 3 && !activeRun.complete;
  const isStormCrisis = viewStep === 5 && completedPhases < 5 && !activeRun.complete;
  const nearShelterAccess = nearbyStation?.decisionId === 5;
  const solarSetup = activeRun.steps[0];
  const solarOutputPct = activeRecord
    ? Math.round(activeRecord.env.arrayOutputFactor * 100)
    : solarSetup
      ? Math.round(
          100 *
            environmentAtHour(phase.startHour, new Set(flagsBefore), solarSetup.env.orientationFactor)
              .arrayOutputFactor,
        )
      : null;
  const iceRecord = viewStep >= 4 ? activeRun.steps[3] : undefined;
  const iceWaterKg = iceRecord?.choiceId === 'D4-A' ? iceRecord.resourceFlows.waterExtractedKg : null;

  const { cropGrowthDays, harvestedFoodKg } = displayedResources;
  const cropProgress = Math.max(
    0,
    Math.min(
      1,
      (cropGrowthDays - CROP_TRIAL.ageAtInstallDays) / (CROP_TRIAL.harvestAgeDays - CROP_TRIAL.ageAtInstallDays),
    ),
  );
  const cropStatus: CropStatus =
    harvestedFoodKg > 0
      ? 'harvested'
      : cropGrowthDays === 0
        ? 'idle'
        : (activeRun.outcome === 'abort' && activeRecord?.endHour === activeRun.elapsedHours) ||
            !canPowerCrop(displayedResources, currentMetrics.powerKwh)
          ? 'paused'
          : cropProgress > 0
            ? 'growing'
            : 'ready';

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
      stormAudioActive: isStormCrisis && activeInput.scenario.stormPeakPfu > 0,
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
      activeInput.scenario.stormPeakPfu,
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
       * UNIFIED MISSION CONTROL HEADER (Brand + Live 4-Gauge HUD + Labeled Controls)
       * =================================================================== */}
      <header className="mc-header">
        <button
          type="button"
          className="brand text-left"
          onClick={() => {
            soundFX.play('uiClick');
            setLaunchScreenOpen(true);
          }}
          title={lang === 'az' ? 'Missiya Başlanğıc Ekranı' : 'Mission Launch Screen'}
        >
          <span className="brand-symbol">
            <Orbit size={20} strokeWidth={1.6} />
          </span>
          <div>
            <strong>
              OUTPOST<span>REPLAY</span>
            </strong>
            <small>
              {commanderCallsign.trim()
                ? `${lang === 'az' ? 'KMD' : 'CMDR'} ${commanderCallsign.trim().toUpperCase()}`
                : t('tagline')}
            </small>
          </div>
        </button>

        {/* Compact Live Deterministic Telemetry Readout */}
        <section
          className="mc-telemetry"
          aria-label={lang === 'az' ? 'Bazanın telemetriyası' : 'Outpost telemetry'}
        >
          <div className="mc-gauge mc-gauge--clock">
            <span className="mc-gauge-label">{tr(currentDecision.phase.label)}</span>
            <strong className="mc-gauge-val">
              {fmt(activeRecord?.endHour ?? activeRun.elapsedHours)}
              <small>/216h</small>
            </strong>
          </div>

          <div className={`mc-gauge mc-gauge--power ${worldSnapshot.powerLow ? 'mc-gauge--warn' : ''}`}>
            <span className="mc-gauge-label">
              <Zap size={11} /> {t('power')}
              {worldSnapshot.powerLow ? (
                <em className="ml-1 rounded bg-rose-500/25 px-1 py-0.5 text-[8.5px] font-bold not-italic text-rose-200">
                  &lt;20
                </em>
              ) : (
                completedPhases >= 3 &&
                activeChoices[2] === 1 && (
                  <em className="ml-1 rounded bg-cyan-500/20 px-1 py-0.5 text-[8.5px] font-bold not-italic text-cyan-200">
                    {lang === 'az' ? 'YEDƏK' : 'BACKUP'}
                  </em>
                )
              )}
            </span>
            <strong className="mc-gauge-val">
              {fmt(currentMetrics.powerKwh)}
              <small>{t('unitKwh')}</small>
              {compareMetrics !== undefined && (
                <em className="mc-delta">
                  {signed(Math.round((currentMetrics.powerKwh - compareMetrics.powerKwh) * 10) / 10)}
                </em>
              )}
            </strong>
            <i className="mc-bar">
              <span style={{ width: `${Math.min(100, Math.max(0, currentMetrics.powerKwh))}%` }} />
            </i>
          </div>

          <div className={`mc-gauge mc-gauge--life ${worldSnapshot.lifeSupportLow ? 'mc-gauge--warn' : ''}`}>
            <span className="mc-gauge-label">
              <HeartPulse size={11} /> {t('lifeSupport')}
              {worldSnapshot.lifeSupportLow && (
                <em className="ml-1 rounded bg-rose-500/25 px-1 py-0.5 text-[8.5px] font-bold not-italic text-rose-200">
                  {lang === 'az' ? 'ZƏİF' : 'LOW'}
                </em>
              )}
            </span>
            <strong className="mc-gauge-val">
              {fmt(currentMetrics.lifeSupportPct)}
              <small>%</small>
              {compareMetrics !== undefined && (
                <em className="mc-delta">
                  {signed(
                    Math.round((currentMetrics.lifeSupportPct - compareMetrics.lifeSupportPct) * 10) / 10,
                  )}
                </em>
              )}
            </strong>
            <i className="mc-bar">
              <span style={{ width: `${Math.min(100, Math.max(0, currentMetrics.lifeSupportPct))}%` }} />
            </i>
          </div>

          <div
            className={`mc-gauge mc-gauge--rad ${
              currentMetrics.radiationMsv >= RADIATION_LIMITS.missionWarningMsv ? 'mc-gauge--warn' : ''
            }`}
          >
            <span className="mc-gauge-label">
              <ShieldAlert size={11} /> {t('radiation')}
            </span>
            <strong className="mc-gauge-val">
              {fmt(currentMetrics.radiationMsv)}
              <small>/{RADIATION_LIMITS.missionWarningMsv}</small>
            </strong>
            <i className="mc-bar">
              <span
                style={{
                  width: `${Math.min(100, Math.max(0, (currentMetrics.radiationMsv / 80) * 100))}%`,
                }}
              />
            </i>
          </div>

          <div className="mc-gauge mc-gauge--sci">
            <span className="mc-gauge-label">
              <FlaskConical size={11} /> {t('science')}
            </span>
            <strong className="mc-gauge-val">
              {fmt(effectiveSciencePoints)}
              <small>{t('unitPts')}</small>
            </strong>
            <i className="mc-bar">
              <span style={{ width: `${Math.min(100, Math.max(0, effectiveSciencePoints))}%` }} />
            </i>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.play('StepNav');
              closeAllModals();
              setTelemetryDrawerOpen(true);
            }}
            className="mc-outcome-btn"
            title={t('compareTitle')}
          >
            <OutcomeBadge result={activeRun} label={hasBranch ? t('runB') : t('runA')} />
          </button>
        </section>

        {/* Primary Labeled Mission Controls */}
        <nav
          className="mc-actions"
          aria-label={lang === 'az' ? 'Missiyanın idarəetmə düymələri' : 'Mission controls'}
        >
          {/* Cadet vs Engineer Mode Switch */}
          <button
            type="button"
            onClick={() => {
              soundFX.play('uiClick');
              setTrainingMode((m) => (m === 'cadet' ? 'engineer' : 'cadet'));
            }}
            className={`text-button ${isCadet ? 'text-button--cadet' : 'text-button--engineer'}`}
            title={
              lang === 'az'
                ? 'Gənc Kadet (7–12 yaş) və Uçuş Mühəndisi rejimi arasında keçid'
                : 'Switch between Junior Cadet (Ages 7–12) and Flight Engineer telemetry'
            }
          >
            {isCadet ? <Rocket size={13} /> : <GraduationCap size={13} />}
            <span>
              {isCadet
                ? lang === 'az'
                  ? 'Kadet'
                  : 'Cadet'
                : lang === 'az'
                  ? 'Mühəndis'
                  : 'Engineer'}
            </span>
          </button>

          {/* Guided 90-Sec Judge Demo */}
          <button
            type="button"
            className="text-button text-button--tour"
            onClick={handleStartTour}
            title={t('judgeTourButton')}
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>{lang === 'az' ? 'Münsif Demo' : 'Judge Demo'}</span>
          </button>

          {/* Science section: sunlight experiment, NASA references, DONKI, OSDR, calculations & optional 3D */}
          <button
            type="button"
            className="text-button text-button--sensor"
            onClick={() => {
              soundFX.play('StepNav');
              closeAllModals();
              setSensorDeckOpen(true);
            }}
            title={t('sensorDeckButton')}
          >
            <Activity size={13} className="text-cyan-300" aria-hidden="true" />
            <span>{lang === 'az' ? 'Elm' : 'Science'}</span>
          </button>

          {/* Rewind & Counterfactual Comparison Lab [R] */}
          <button
            type="button"
            className="text-button text-button--rewind"
            onClick={() => {
              soundFX.play('StepNav');
              closeAllModals();
              setTelemetryDrawerOpen((v) => !v);
            }}
            title={t('compareTitle')}
          >
            <BarChart3 size={13} />
            <span>{lang === 'az' ? 'Geri Sar [R]' : 'Rewind [R]'}</span>
          </button>

          {/* Bonus Mission 2: Mars Jezero Dust Storm */}
          <button
            type="button"
            className="text-button text-button--mars"
            onClick={() => {
              soundFX.play('StepNav');
              closeAllModals();
              setMarsModalOpen(true);
            }}
            title={
              lang === 'az'
                ? 'Bonus Missiya 2: Mars Jezero Toz Fırtınası və 14 Dəq Rabitə Gecikməsi'
                : 'Bonus Mission 2: Mars Jezero Dust Storm & 14-Min Comms Delay'
            }
          >
            <Wind size={13} className="text-orange-300" />
            <span>Mars</span>
          </button>

          {/* Mission Dossier Dropdown (Certificate, Badges x/7, Samples x/6, Demo Preset, Briefing, Reset) */}
          <div className="relative" ref={dossierMenuRef}>
            <button
              type="button"
              onClick={() => {
                soundFX.play('uiClick');
                setDossierMenuOpen((v) => !v);
              }}
              aria-expanded={dossierMenuOpen}
              className="text-button text-button--badge"
            >
              <FolderOpen size={13} className="text-amber-300" />
              <span>{lang === 'az' ? 'Dosye' : 'Dossier'}</span>
              <span className="rounded bg-amber-400/25 px-1 font-mono text-[10px] font-bold text-amber-200">
                {unlockedBadges.length}/{ACHIEVEMENTS.length}
              </span>
              <ChevronDown size={12} />
            </button>

            {dossierMenuOpen && (
              <div
                className="dossier-menu"
                role="menu"
                aria-label={lang === 'az' ? 'Missiya dosyesi menyusu' : 'Mission dossier menu'}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundFX.play('StepNav');
                    closeAllModals();
                    setCertificateOpen(true);
                  }}
                >
                  <Award size={14} className="text-emerald-300" />
                  <span>{t('exportCertificateButton')} (PNG + URL)</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundFX.play('StepNav');
                    closeAllModals();
                    setAchievementsModalOpen(true);
                  }}
                >
                  <Trophy size={14} className="text-amber-300" />
                  <span>
                    {t('achievementsButton')} ({unlockedBadges.length}/{ACHIEVEMENTS.length})
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundFX.play('StepNav');
                    closeAllModals();
                    setInspectSampleIdx(null);
                    setSampleModalOpen(true);
                  }}
                >
                  <Sparkles size={14} className="text-sky-300" />
                  <span>
                    {t('samplesButton')} ({collectedCount}/6)
                  </span>
                </button>
                <button type="button" role="menuitem" onClick={handleLoadDemo}>
                  <PlayCircle size={14} className="text-[#c0e6aa]" />
                  <span>{t('loadDemo')}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundFX.play('StepNav');
                    closeAllModals();
                    setShowBriefing(true);
                  }}
                >
                  <BookOpen size={14} className="text-slate-300" />
                  <span>{t('missionBriefing')}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundFX.play('uiClick');
                    closeAllModals();
                    setLaunchScreenOpen(true);
                  }}
                >
                  <Rocket size={14} className="text-amber-200" />
                  <span>{lang === 'az' ? 'Başlanğıc Ekranı' : 'Launch Screen'}</span>
                </button>
                <button type="button" role="menuitem" onClick={handleReset}>
                  <RotateCcw size={14} className="text-rose-300" />
                  <span>{t('reset')}</span>
                </button>
              </div>
            )}
          </div>

          <AudioSettings open={audioSettingsOpen} onOpenChange={setAudioSettingsOpen} />

          <button
            type="button"
            className="lang-button"
            onClick={() => {
              soundFX.play('StepNav');
              setLang(lang === 'en' ? 'az' : 'en');
            }}
            aria-label={t('language')}
          >
            {lang === 'en' ? 'EN·AZ' : 'AZ·EN'}
          </button>
        </nav>
      </header>

      {/* Slim Contextual Status & NASA Reserves Sub-Strip */}
      <section
        className="mc-substrip"
        aria-label={tr({ en: 'Mission guide and surface conditions', az: 'Missiya bələdçisi və səth şəraiti' })}
      >
        {missionSaveStatus === 'unavailable' ? (
          <p className="min-w-0 flex-1 text-xs text-amber-200" role="status">
            {lang === 'az'
              ? 'Bu brauzerdə irəliləyiş saxlanmır. Bu vərəqi açıq saxlayın.'
              : 'Progress cannot be saved in this browser. Keep this tab open.'}
          </p>
        ) : !guideDismissed && !demoStage ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] text-[#d9eed0]">
            <Sparkles size={12} className="shrink-0 text-[#c0e6aa]" />
            <strong className="shrink-0 font-mono text-[10px] uppercase text-[#c0e6aa]">
              {t('guideTitle')} {runA.complete ? 3 : completedPhases > 0 ? 2 : 1}/3:
            </strong>
            <span className="truncate text-slate-100" role="status">
              {t(
                runA.complete
                  ? 'guideReplay'
                  : completedPhases > 0
                    ? 'guideAfterChoice'
                    : atActiveStation
                      ? 'guideAtSolar'
                      : 'guideStart',
              )}
            </span>
            <button
              type="button"
              onClick={() => setGuideDismissed(true)}
              className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-white/10"
            >
              {t('dismissGuide')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
            <Orbit size={12} className="text-amber-300" />
            <span>
              {tr({ en: 'Scenario sun', az: 'Ssenari işığı' })} <strong>{Math.round(availableSunlight * 100)}%</strong>
            </span>
          </div>
        )}

        <div className="hidden items-center gap-3 font-mono text-[10px] text-slate-300 lg:flex">
          <span className="inline-flex items-center gap-1">
            <Snowflake size={11} className="text-sky-300" />
            <strong>{fmt(surfaceTemperature)} K</strong>
          </span>
          {(viewStep === 5 || stormPeakPfu !== SEP_PEAK_FLUX_PFU) && (
            <span className="inline-flex items-center gap-1 text-rose-200">
              <Zap size={11} className="text-rose-400" />
              <strong>{stormPeakPfu} pfu</strong>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <HeartPulse size={11} className="text-teal-300" />
            <strong>
              {fmt(displayedResources.oxygenKg)} O₂ · {fmt(displayedResources.waterKg)} H₂O ·{' '}
              {fmt(displayedResources.foodKg)} {lang === 'az' ? 'qida' : 'food'}
            </strong>
          </span>
        </div>
      </section>

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
          suspendRendering={sensorDeckOpen}
          label={
            lang === 'az'
              ? 'Şeklton bazasının 2.5D interaktiv mühiti'
              : 'Shackleton Outpost 2.5D Interactive World'
          }
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
            onAdvance={(useBackup, prediction) => handleAdvanceTour(demoStage, useBackup, prediction)}
            onOpenScience={() => setSensorDeckOpen(true)}
            onClose={() => setDemoStage(null)}
          />
        )}

        {!demoStage && (
          <aside className="objective-card">
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
                : isCadet && currentDecision.cadetTitle
                  ? tr(currentDecision.cadetTitle)
                  : viewStep === 1 && completedPhases === 0
                    ? lang === 'az'
                      ? 'Günəş enerjisini qur'
                      : 'Set up solar power'
                    : tr(activeStation.objectiveTitle)}
            </h1>
            <p>
              {runA.complete && !hasBranch
                ? t('timelineHintComplete')
                : isCadet && currentDecision.cadetContext
                  ? tr(currentDecision.cadetContext)
                  : viewStep === 1 && completedPhases === 0
                    ? lang === 'az'
                      ? 'Günəş panelləri qızdırıcıları və həyat təminatını işlədən batareyanı doldurur. Kölgəyə hazırlaşmaq üçün panel quruluşunu seç.'
                      : 'Solar panels charge the battery that runs heaters and life support. Choose a setup before the shadow arrives.'
                    : tr(activeStation.objectiveBody)}
            </p>

            {viewStep === 1 && completedPhases === 0 && !atActiveStation && !guideDismissed && (
              <div className="objective-controls-note">
                <kbd>WASD</kbd>{' '}
                {lang === 'az' ? 'ilə və ya xəritəyə klikləyərək hərəkət edin.' : 'or click the ground to move.'}
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
                ? lang === 'az'
                  ? 'Aşağı enerji ehtiyatı'
                  : 'Low battery reserve'
                : lang === 'az'
                  ? 'Normal enerji ehtiyatı'
                  : 'Normal battery reserve'}
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
                {lang === 'az' ? 'İstixana' : 'Greenhouse'} ·{' '}
                {tr(
                  {
                    ready: { en: 'ready to grow', az: 'böyüməyə hazırdır' },
                    growing: { en: 'growing', az: 'böyüyür' },
                    paused: { en: 'growth paused', az: 'böyümə dayanıb' },
                    harvested: { en: 'harvested', az: 'məhsul yığılıb' },
                  }[cropStatus],
                )}{' '}
                ·{' '}
                {harvestedFoodKg > 0
                  ? `${fmt(harvestedFoodKg)} ${lang === 'az' ? 'kq' : 'kg'}`
                  : `${Math.round(cropProgress * 100)}%`}
              </div>
            )}
            {(completedPhases > 0 || worldSnapshot.powerLow || worldSnapshot.lifeSupportLow) && (
              <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/55 px-2.5 py-2">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Wrench size={11} className="text-sky-300" />
                    <span>{lang === 'az' ? 'Aktiv Baza Sistemləri' : 'Active Outpost Systems'}</span>
                  </span>
                  {hasBranch && (
                    <span className="rounded border border-amber-400/35 bg-amber-400/15 px-1.5 py-0.5 text-[9px] text-amber-200">
                      {lang === 'az' ? 'Sınaq B' : 'Run B'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completedPhases >= 1 && activeChoices[0] !== undefined && (
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                        activeChoices[0] === 0
                          ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100'
                          : 'border-amber-400/35 bg-amber-400/10 text-amber-100'
                      }`}
                    >
                      {activeChoices[0] === 0
                        ? lang === 'az'
                          ? '10 m Hündür Dirək'
                          : '10 m Tall Mast'
                        : activeChoices[0] === 1
                          ? lang === 'az'
                            ? '2 m Alçaq Panel'
                            : '2 m Low Deck'
                          : lang === 'az'
                            ? '25° Sapmalı Panel'
                            : '25° Off-Axis Array'}
                    </span>
                  )}
                  {completedPhases >= 2 && activeChoices[1] !== undefined && (
                    <span className="rounded border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-100">
                      {activeChoices[1] === 0
                        ? lang === 'az'
                          ? 'Reqolit Səddi'
                          : 'Regolith Berm'
                        : activeChoices[1] === 1
                          ? lang === 'az'
                            ? 'ISRU O₂ Qurğusu'
                            : 'ISRU O₂ Rig'
                          : lang === 'az'
                            ? 'İstixana Bitkisi'
                            : 'Veggie Crop'}
                    </span>
                  )}
                  {completedPhases >= 3 && activeChoices[2] !== undefined && (
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                        activeChoices[2] === 1
                          ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-100'
                          : activeChoices[2] === 0
                            ? 'border-amber-400/35 bg-amber-400/10 text-amber-100'
                            : 'border-rose-400/35 bg-rose-400/10 text-rose-100'
                      }`}
                    >
                      {activeChoices[2] === 1
                        ? lang === 'az'
                          ? 'Yanacaq Elementi Aktiv'
                          : 'Fuel Cells Active'
                        : activeChoices[2] === 0
                          ? lang === 'az'
                            ? 'Yük Azaltma Rejimi'
                            : 'Load-Shed Mode'
                          : lang === 'az'
                            ? 'Tam Qazma Rejimi'
                            : 'Deep Drill Ops'}
                    </span>
                  )}
                  {completedPhases >= 5 && activeChoices[4] !== undefined && (
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                        activeChoices[4] === 2
                          ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100'
                          : activeChoices[4] === 1
                            ? 'border-sky-400/35 bg-sky-400/10 text-sky-100'
                            : 'border-rose-400/35 bg-rose-400/10 text-rose-100'
                      }`}
                    >
                      {activeChoices[4] === 2
                        ? lang === 'az'
                          ? 'Fırtına Sığınacağı'
                          : 'Storm Bunker'
                        : activeChoices[4] === 1
                          ? lang === 'az'
                            ? 'Su Divarlı Modul'
                            : 'Water-Wall Hab'
                          : lang === 'az'
                            ? 'Açıq EVA Keçidi'
                            : 'Exposed EVA'}
                    </span>
                  )}
                </div>
                {worldSnapshot.powerLow && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded border border-amber-400/35 bg-amber-950/50 px-2 py-1 text-[10.5px] leading-snug text-amber-100">
                    <Zap size={12} className="mt-0.5 shrink-0 text-amber-300" />
                    <span>
                      {lang === 'az'
                        ? 'Enerji 20 kVt·s həddindən aşağı düşdü — yaşayış işıqları azaldıldı'
                        : 'Power below 20 kWh floor — habitat lights dimmed'}
                    </span>
                  </div>
                )}
                {worldSnapshot.lifeSupportLow && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded border border-rose-400/35 bg-rose-950/50 px-2 py-1 text-[10.5px] leading-snug text-rose-100">
                    <ShieldAlert size={12} className="mt-0.5 shrink-0 text-rose-300" />
                    <span>
                      {lang === 'az'
                        ? 'Həyat təminatı xəbərdarlığı aktivdir — stansiya rəngi qırmızıya keçdi'
                        : 'ECLSS reserve warning active — habitat alerts lit'}
                    </span>
                  </div>
                )}
              </div>
            )}
            {viewStep <= 3 && solarOutputPct !== null && (
              <div className="mt-1.5 text-xs text-amber-100">
                {lang === 'az'
                  ? `Panellər · nominal gücün ${solarOutputPct}%-i`
                  : `Solar array · ${solarOutputPct}% of nominal output`}
              </div>
            )}
            {iceWaterKg !== null && (
              <div className="mt-1.5 text-xs text-sky-100">
                {lang === 'az'
                  ? `Emaldan alınan su · ${fmt(iceWaterKg, 2)} kq`
                  : `Water recovered · ${fmt(iceWaterKg, 2)} kg`}
              </div>
            )}

            {/* Live Phase Environment & Crew Consumables Telemetry Grid */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-lg border border-white/10 bg-slate-950/55 p-2 font-mono text-[10px]">
              <div className="flex items-center justify-between rounded bg-white/[0.03] px-1.5 py-1">
                <span className="text-slate-400">{lang === 'az' ? '☀️ Günəş' : '☀️ Sunlight'}</span>
                <strong className={availableSunlight < 0.35 ? 'text-amber-300' : 'text-emerald-300'}>
                  {Math.round(availableSunlight * 100)}%
                </strong>
              </div>
              <div className="flex items-center justify-between rounded bg-white/[0.03] px-1.5 py-1">
                <span className="text-slate-400">{lang === 'az' ? '🌡️ Səth' : '🌡️ Temp'}</span>
                <strong className="text-sky-200">{fmt(surfaceTemperature)} K</strong>
              </div>
              <div className="flex items-center justify-between rounded bg-white/[0.03] px-1.5 py-1">
                <span className="text-slate-400">🫁 O₂</span>
                <strong className="text-teal-200">{fmt(displayedResources.oxygenKg, 1)} kg</strong>
              </div>
              <div className="flex items-center justify-between rounded bg-white/[0.03] px-1.5 py-1">
                <span className="text-slate-400">💧 H₂O</span>
                <strong className="text-cyan-200">{fmt(displayedResources.waterKg, 1)} kg</strong>
              </div>
            </div>

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
                    <span>
                      {t('jumpToActive')}
                      <small>{distanceMeters} m</small>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleWorldInteract(activeStation)}
                  className={`objective-action ${atActiveStation ? 'objective-action--primary' : ''}`}
                >
                  <Wrench size={14} aria-hidden="true" />
                  <span>
                    {t('openConsole')}
                    {atActiveStation && <small>[E]</small>}
                  </span>
                </button>
              </div>
            )}

            {/* 1-Click Direct Mountain Horizon & 2m vs 10m Sunlight Lab Launcher */}
            <button
              type="button"
              onClick={() => {
                soundFX.play('StepNav');
                closeAllModals();
                setSensorDeckOpen(true);
              }}
              title={t('sensorDeckButton')}
              className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-cyan-400/35 bg-cyan-950/45 px-2.5 py-1.5 text-left text-[11px] font-semibold text-cyan-100 transition hover:border-cyan-300/65 hover:bg-cyan-900/55"
            >
              <span className="inline-flex items-center gap-1.5">
                <Orbit size={13} className="shrink-0 text-cyan-300" aria-hidden="true" />
                <span>
                  {lang === 'az'
                    ? 'Elm · Günəş Təcrübəsi (2m və 10m)'
                    : 'Science · Sunlight Experiment (2m vs 10m)'}
                </span>
              </span>
              <span className="shrink-0 rounded border border-cyan-300/35 bg-cyan-400/20 px-1.5 py-0.5 font-mono text-[9px] text-cyan-200">
                {lang === 'az' ? 'ELM' : 'SCIENCE'}
              </span>
            </button>

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

            {trackedSample !== null && (
              <section className="mt-3 rounded-lg border border-amber-200/30 bg-amber-950/20 p-2.5 text-xs text-amber-100">
                <strong>{lang === 'az' ? 'Silsilə araşdırması' : 'Ridge investigation'}</strong>
                <p className="mt-1">
                  {lang === 'az' ? 'Qızılı nişanın yanında E basın.' : 'Press E beside the gold marker to log it.'}
                </p>
                <button
                  type="button"
                  className="mt-1 underline"
                  onClick={() => {
                    world.current?.walkTo(FIELD_SAMPLES[trackedSample]);
                    world.current?.focus();
                  }}
                >
                  {lang === 'az' ? 'Marşrutu davam etdir' : 'Resume sample route'}
                </button>
              </section>
            )}
            {lastDebrief && (
              <DecisionDebrief
                key={lastDebrief.choiceId}
                step={lastDebrief}
                onDismiss={() => setLastDebrief(null)}
                onOpenRewind={() => {
                  soundFX.play('StepNav');
                  setTelemetryDrawerOpen(true);
                }}
              />
            )}

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
                  hasBranch && rewoundChoices !== null && baselineChoices[idx] !== rewoundChoices[idx];
                const clickable = stepNum <= lastAvailableStep;
                const choiceIdx = activeChoices[idx];
                const choiceLetter = choiceIdx !== undefined ? CHOICE_LETTERS[choiceIdx] : null;

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
                      title={`D${stepNum}: ${tr(d.title)}${choiceLetter ? ` (${choiceLetter})` : ''}`}
                      aria-label={`D${stepNum} · ${tr(d.title)}`}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`objective-dot ${
                        isChanged ? 'changed' : isLocked ? 'complete' : isCurrent ? 'current' : ''
                      }`}
                    >
                      {isLocked && choiceLetter ? `${stepNum}${choiceLetter}` : `D${stepNum}`}
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
          </aside>
        )}

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

        {/* RIGHT-SIDE MOUNTAIN HORIZON & SOLAR MAST CROSS-SECTION CARD */}
        {!demoStage && !anyOverlayOpen && (
          <button
            type="button"
            onClick={() => {
              soundFX.play('StepNav');
              closeAllModals();
              setSensorDeckOpen(true);
            }}
            className="sightline-mini-card hidden lg:flex"
            title={
              lang === 'az'
                ? 'Elm bölməsini açın: Günəş təcrübəsi (2m və 10m), NASA məlumatları və istəyə bağlı 3D krater'
                : 'Open Science: Sunlight experiment (2m vs 10m), NASA data & optional 3D crater'
            }
          >
            <div className="sightline-mini-header">
              <span>{lang === 'az' ? 'GÜNƏŞ DAĞ ARXASINDA?' : 'SUN BEHIND MOUNTAIN?'}</span>
              <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[8.5px] font-bold text-cyan-200">
                128° AZ
              </span>
            </div>
            <svg
              viewBox="0 0 196 64"
              className="w-full"
              aria-hidden="true"
            >
              <rect width="196" height="64" rx="6" fill="#07131c" />
              {/* Grazing 1.55 deg Sun on left */}
              <circle cx="16" cy="24" r="9" fill="#fde047" opacity="0.24" />
              <circle cx="16" cy="24" r="5" fill="#fef08a" />
              {/* 10m Clear Solar Sightline Ray */}
              <line
                x1="22"
                y1="23"
                x2="156"
                y2="16"
                stroke="#facc15"
                strokeWidth="1.8"
              />
              {/* 2m Blocked Solar Sightline Ray */}
              <line
                x1="22"
                y1="26"
                x2="92"
                y2="30"
                stroke="#fb7185"
                strokeWidth="1.6"
                strokeDasharray="3 2"
              />
              <circle cx="92" cy="30" r="3" fill="#f43f5e" />
              {/* Shackleton Ridge Terrain Profile */}
              <path
                d="M 0 58 L 52 52 L 92 27 L 122 48 L 196 46 L 196 64 L 0 64 Z"
                fill="#1d2f3a"
                stroke="#587786"
                strokeWidth="1"
              />
              {/* 10m Tall Mast & 2m Low Mast at Site A (x=156) */}
              <line x1="156" y1="46" x2="156" y2="16" stroke="#38bdf8" strokeWidth="2.2" />
              <rect x="150" y="13" width="12" height="4" rx="1" fill="#fde047" />
              <line x1="172" y1="46" x2="172" y2="38" stroke="#fb7185" strokeWidth="2" />
              <rect x="167" y="36" width="10" height="3" rx="1" fill="#fb7185" />
              <text x="80" y="21" fill="#fda4af" fontSize="7.5" fontFamily="monospace">
                {lang === 'az' ? 'Silsilə' : 'Ridge'}
              </text>
              <text x="134" y="11" fill="#fde047" fontSize="7.5" fontFamily="monospace">
                10m:100%
              </text>
              <text x="148" y="58" fill="#fda4af" fontSize="7.5" fontFamily="monospace">
                2m:0%
              </text>
            </svg>
            <div className="sightline-mini-footer">
              <span>
                {lang === 'az'
                  ? 'Elm: 2m və 10m günəş təcrübəsi'
                  : 'Science: 2m vs 10m sunlight lab'}
              </span>
              <span className="font-mono text-cyan-300">→</span>
            </div>
          </button>
        )}

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
                    <span>
                      {lang === 'az' ? 'Nümunə' : 'Core'} {drillProgressPct}%
                    </span>
                    <span className={drillTempPct > 80 ? 'text-rose-300' : 'text-slate-300'}>
                      {lang === 'az' ? 'Qızma' : 'Heat'} {drillTempPct}%
                    </span>
                  </div>
                  <div
                    className="mt-1 h-2 overflow-hidden rounded-full bg-black/40"
                    role="progressbar"
                    aria-label={lang === 'az' ? 'Nümunənin götürülməsi' : 'Core collection'}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={drillProgressPct}
                  >
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
                    {FIELD_SAMPLES[nearSampleIdx]?.icon}{' '}
                    {FIELD_SAMPLES[nearSampleIdx]?.elevation.toUpperCase().replace('_', ' ')}
                  </small>
                  {lang === 'az'
                    ? `Kəşf et: ${FIELD_SAMPLES[nearSampleIdx]?.name[lang]} (+2 Xal)`
                    : `Discover: ${FIELD_SAMPLES[nearSampleIdx]?.name[lang]} (+2 Science)`}
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
                <span>{lang === 'az' ? `D${viewStep} istiqaməti` : `Route to D${viewStep}`}</span>
                <small className="ml-1 font-mono text-[10px] text-[#9fb4b5]">{distanceMeters} m</small>
              </button>
            )}
          </div>
        )}

        {/* BOTTOM-RIGHT: Iconic Action Buttons (USE [E], CAR [V], MAP [M]) + Touch D-Pad */}
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
                controllingRover ? 'among-btn--car-active' : nearCar ? 'among-btn--ready' : ''
              }`}
              title={
                lang === 'az'
                  ? '2.5D Ay Maşınını Sür / Düş [V]'
                  : 'Drive / Exit 2.5D Lunar Car [V]'
              }
            >
              <Truck size={20} />
              <span>
                {controllingRover ? (lang === 'az' ? 'DÜŞ' : 'EXIT') : lang === 'az' ? 'MAŞIN' : 'CAR'}
              </span>
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

          <div
            className="touch-controls"
            role="group"
            aria-label={lang === 'az' ? 'Hərəkət düymələri' : 'Movement controls'}
          >
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
       * SHACKLETON TOUCHDOWN LAUNCH SCREEN
       * =================================================================== */}
      {launchScreenOpen && (
        <MissionLaunchScreen
          callsign={commanderCallsign}
          onChangeCallsign={setCommanderCallsign}
          trainingMode={trainingMode}
          hasMissionProgress={hasMissionProgress}
          hasMarsProgress={marsChoices.length > 0}
          missionSaveStatus={missionSaveStatus}
          onOpenAudioSettings={() => setAudioSettingsOpen(true)}
          onChangeTrainingMode={setTrainingMode}
          onLaunchMission={() => {
            soundFX.play('launch');
            setLaunchScreenOpen(false);
            requestAnimationFrame(() => world.current?.focus());
          }}
          onStartJudgeTour={handleStartTour}
          onOpenMarsBonus={() => {
            soundFX.play('launch');
            setLaunchScreenOpen(false);
            setMarsModalOpen(true);
          }}
          onOpen3DNasaDeck={() => {
            soundFX.play('launch');
            setLaunchScreenOpen(false);
            setSensorDeckOpen(true);
          }}
        />
      )}

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
          <div className="relative flex max-h-[92dvh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border border-[#b6cec3]/30 bg-[#14222b] p-4 shadow-2xl sm:p-5">
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
              trainingMode={trainingMode}
              onToggleTrainingMode={() =>
                setTrainingMode((m) => (m === 'cadet' ? 'engineer' : 'cadet'))
              }
              choiceA={baselineChoices[viewStep - 1]}
              choiceB={rewoundChoices?.[viewStep - 1]}
              record={activeRecord}
              flagsBefore={flagsBefore}
              runInput={activeInput}
              taskSettings={activeTasks}
              taskAvailable={calibratedTasks[viewStep - 1]}
              minedCount={activeTasks.extraIceCores ?? 0}
              collectedSamplesCount={activeTasks.fieldSamplesCount ?? 0}
              taskExercise={stationExercise}
              canChoose={canChoose}
              shadowPrediction={shadowPrediction}
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
       * TIME-REWIND & NASA TELEMETRY DRAWER ([R] — Run A vs Run B + 216h Charts)
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
                  {tr({
                    en: 'PREDICT → DECIDE → OBSERVE → REWIND → COMPARE → LEARN · CONTROLLED EXPERIMENT',
                    az: 'PROQNOZ → QƏRAR → MÜŞAHİDƏ → GERİ SAR → MÜQAYİSƏ → ÖYRƏN · NƏZARƏTLİ TƏCRÜBƏ',
                  })}
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

            {legacyReplay && (
              <p role="status" className="mb-3 rounded-xl border border-amber-300/30 bg-amber-900/20 p-3 text-sm text-amber-100">
                {lang === 'az'
                  ? 'Köhnə təkrar keçidi: çatışmayan hazırlıq parametrləri standart qiymətlərlə əvəz olunub; nəticələr ilkin sınaqdan fərqlənə bilər.'
                  : 'Older replay link: missing preparation settings use defaults; results may differ from the original experiment.'}
              </p>
            )}
            {runB && (
              <div className="mb-4">
                <DeltaSummary a={runA} b={runB} trainingMode={trainingMode} />
              </div>
            )}
            {shadowPrediction && <ShadowPredictionResult prediction={shadowPrediction} a={runA} b={runB} />}

            <details open={!runB || divergedStep === null} className="mb-4 rounded-xl border border-cyan-400/25 bg-cyan-950/20 p-3.5">
              <summary className="cursor-pointer text-xs font-semibold text-cyan-200">
                {lang === 'az' ? 'Sınağın addımları' : 'Experiment steps'}
              </summary>
              <div className="mt-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                    {lang === 'az' ? '7 Addımlıq Elmi Metod Axını' : '7-Step Scientific Replay Loop'}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {runB && divergedStep !== null
                      ? lang === 'az'
                        ? 'Sınaq A və B müqayisəsi hazırdır'
                        : 'Run A vs Run B comparison active'
                      : hasBranch
                        ? lang === 'az'
                          ? 'İndi Sınaq B üçün fərqli strategiya seçin'
                          : 'Now choose an alternate strategy for Run B'
                        : runA.steps.length > 0
                          ? lang === 'az'
                            ? 'Geri qayıtmaq üçün aşağıdan tamamlanmış qərarı seçin'
                            : 'Select any completed decision below to rewind'
                          : lang === 'az'
                            ? 'Proqnoz verin və ilk qərarınızı sınayın'
                            : 'Make a prediction and test your first decision'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                  {[
                    {
                      n: 1,
                      en: 'Predict',
                      az: 'Proqnoz',
                      done: Boolean(shadowPrediction) || runA.steps.length > 0,
                      active: !shadowPrediction && runA.steps.length === 0,
                    },
                    {
                      n: 2,
                      en: 'Choose',
                      az: 'Seçim',
                      done: runA.steps.length > 0,
                      active: runA.steps.length === 0,
                    },
                    {
                      n: 3,
                      en: 'Observe A',
                      az: 'Sınaq A',
                      done: runA.steps.length > 0,
                      active: runA.steps.length > 0 && !hasBranch,
                    },
                    {
                      n: 4,
                      en: 'Rewind',
                      az: 'Geri Qayıt',
                      done: hasBranch,
                      active: runA.steps.length > 0 && !hasBranch,
                    },
                    {
                      n: 5,
                      en: 'Choose B',
                      az: 'Sınaq B',
                      done: Boolean(runB && divergedStep !== null),
                      active: hasBranch && divergedStep === null,
                    },
                    {
                      n: 6,
                      en: 'Compare',
                      az: 'Müqayisə',
                      done: Boolean(runB && divergedStep !== null),
                      active: false,
                    },
                    {
                      n: 7,
                      en: 'Principle',
                      az: 'Prinsip',
                      done: Boolean(runB && divergedStep !== null),
                      active: false,
                    },
                  ].map((stage) => (
                    <div
                      key={stage.n}
                      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium ${
                        stage.done
                          ? 'border-emerald-400/40 bg-emerald-400/12 text-emerald-100'
                          : stage.active
                            ? 'border-amber-300/55 bg-amber-400/15 text-amber-100'
                            : 'border-white/10 bg-slate-950/45 text-slate-400'
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          stage.done
                            ? 'bg-emerald-400 text-slate-950'
                            : stage.active
                              ? 'bg-amber-300 text-slate-950'
                              : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {stage.n}
                      </span>
                      <span className="truncate">{lang === 'az' ? stage.az : stage.en}</span>
                    </div>
                  ))}
                </div>
                {!hasBranch && runA.steps.length > 0 && (
                  <p className="mt-2 rounded-lg border border-amber-300/35 bg-amber-950/40 px-2.5 py-1.5 text-xs text-amber-100">
                    {lang === 'az'
                      ? 'Növbəti addım: Aşağıdakı tamamlanmış qərarlardan (D1–D6) birini klikləyib alternativ strategiya ilə Sınaq B yaradın.'
                      : 'Next step: Click any completed decision (D1–D6) below to rewind, pick an alternate strategy, and compare Run A vs Run B.'}
                  </p>
                )}
              </div>
            </details>

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
                    {lang === 'az' ? 'Xəritədə A gedişinin izi' : 'Run A trail on the map'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {MISSION_DECISIONS.map((d, idx) => {
                  const stepNum = d.id;
                  const cA = baselineChoices[idx];
                  const cB = rewoundChoices?.[idx];
                  const taskChanged = Boolean(runB && phasePreparationChanged(runA.input, runB.input, idx));
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
                      <span className="font-mono text-[10px] text-[#9eb6b5]">D{stepNum} </span>
                      <strong className="mt-0.5 line-clamp-2 font-medium">
                        {isCadet && d.cadetTitle ? tr(d.cadetTitle) : tr(d.title)}
                      </strong>
                      <span className="mt-1.5 font-mono text-[10px] text-[#c0e6aa]">
                        {cA !== undefined
                          ? `${lang === 'az' ? 'A: Var.' : 'Run A: Opt'} ${CHOICE_LETTERS[cA]}`
                          : '—'}
                        {cB !== undefined
                          ? ` → ${lang === 'az' ? 'B: Var.' : 'Run B: Opt'} ${CHOICE_LETTERS[cB]}`
                          : ''}
                        {changed && cA !== undefined && cB !== undefined && cA !== cB && (
                          <span className="mt-1 block font-sans text-[10.5px] leading-snug text-amber-100">
                            {tr(d.choices[cA].label)} → {tr(d.choices[cB].label)}
                          </span>
                        )}
                        {changed && taskChanged && (
                          <span className="block">
                            {lang === 'az' ? 'Hazırlıq və ya sahə işi dəyişdi' : 'Preparation or fieldwork changed'}
                          </span>
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
                  <div className="mt-3">
                    <MissionResults a={runA} b={runB} />
                  </div>
                </details>
              ) : (
                <MissionResults a={runA} b={null} />
              )}
              <CompareCharts a={runA} b={runB} comparisonStep={divergedStep} />
              <EvidencePanel stormPeakPfu={activeInput.scenario.stormPeakPfu} />
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
                <h2 className="mt-1 text-xl font-semibold text-[#e5eae4]">{t('briefingTitle')}</h2>
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
                  {lang === 'az' ? '2.5D + 3D təlim imkanları:' : '2.5D Outpost & 3D teaching features:'}
                </strong>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>
                    {lang === 'az'
                      ? 'Ay Maşını [V]: Hər yerdən çağırın, fənərlərlə 90 K Buz Hövzəsinə sürün və [Space] ilə su-buz kristalları qazın (+3 kq buz xammalı).'
                      : 'Driveable Lunar Car [V]: Board anywhere, drive into the 90 K Cold-Trap Basin with headlights, and mine ice cores with [Space] (+3 kg icy regolith feedstock each).'}
                  </li>
                  <li>
                    {lang === 'az'
                      ? 'Prosedur 3D Şeklton nümayişi və NASA DONKI alışma kataloqu. Nəşr edilmiş LOLA tədqiqatlarını təlim ssenariləri ilə müqayisə edin.'
                      : 'Procedural 3D Shackleton demonstration and NASA DONKI flare catalog. Compare published LOLA research with educational scenarios.'}
                  </li>
                  <li>
                    {lang === 'az'
                      ? 'Bonus Missiya 2 — Mars Jezero Toz Fırtınası: τ = 4.2 optik dərinlik və 14 dəqiqəlik radio gecikməsi ilə 3 Sol sağqalma sınağı.'
                      : 'Bonus Mission 2 — Mars Jezero Global Dust Storm: Survive 3 Sols under τ = 4.2 dust attenuation and a 14-minute Earth comms delay.'}
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
       * NASA SENSOR DECK & 3D LOLA HOLOGRAM MODAL
       * =================================================================== */}
      {sensorDeckOpen && (
        <NasaSensorDeckModal
          onClose={() => setSensorDeckOpen(false)}
          activeStormPeakPfu={stormPeakPfu}
          onSelectStormPeakPfu={(pfu) => handleSelectStormPeakPfu(pfu)}
        />
      )}

      {/* =====================================================================
       * BONUS MISSION 2: MARS JEZERO GLOBAL DUST STORM MODAL
       * =================================================================== */}
      {marsModalOpen && (
        <MarsBonusModal
          trainingMode={trainingMode}
          choices={marsChoices}
          onChangeChoices={setMarsChoices}
          onCompleteSuccess={() => awardAchievement('mars_pioneer')}
          onClose={() => setMarsModalOpen(false)}
        />
      )}

      {/* =====================================================================
       * FLIGHT READINESS CERTIFICATE, PNG PATCH & SHAREABLE REPLAY URL MODAL
       * =================================================================== */}
      {certificateOpen && (
        <FlightCertificateModal
          run={hasBranch && runB ? runB : runA}
          runLabel={hasBranch ? t('runB') : t('runA')}
          defaultCallsign={commanderCallsign}
          shareUrl={shareUrl}
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
          onRouteToSample={(idx) => {
            setTrackedSample(idx);
            setSampleModalOpen(false);
            world.current?.walkTo(FIELD_SAMPLES[idx]);
            requestAnimationFrame(() => world.current?.focus());
          }}
          onOpenScience={() => {
            setSampleModalOpen(false);
            setSensorDeckOpen(true);
          }}
        />
      )}

      {/* Celebratory Achievement Unlock Notification Toast */}
      {achievementToast && (
        <AchievementToast
          achievement={achievementToast}
          onDismiss={() => setAchievementToast(null)}
        />
      )}
      {tourConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#04101a]/90 p-4 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="tour-confirm-title" aria-describedby="tour-confirm-description">
          <div className="w-full max-w-md rounded-2xl border border-amber-300/40 bg-[#14222b] p-5 shadow-2xl">
            <h2 id="tour-confirm-title" className="text-lg font-bold text-white">
              {lang === 'az' ? 'Yeni bələdçili sınaq başladılsın?' : 'Start a new guided experiment?'}
            </h2>
            <p id="tour-confirm-description" className="mt-2 text-sm leading-relaxed text-slate-200">
              {lang === 'az'
                ? 'Cari missiya və hər iki müqayisə gedişi sıfırlanacaq. Dəyişiklik etmədən qayıtmaq üçün missiyanızı saxlayın.'
                : 'This replaces your current mission and both comparison runs. Keep your mission to return without changes.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setTourConfirmOpen(false)}
                className="rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
                {lang === 'az' ? 'Cari missiyanı saxla' : 'Keep current mission'}
              </button>
              <button type="button" onClick={startTour}
                className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-200">
                {lang === 'az' ? 'Yeni sınağa başla' : 'Start new experiment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
