import { Component, type ReactNode, type ElementRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { renderCounter } from '../utils/renderDiagnostics';
import { hologramFrameLoop } from '../utils/renderPolicy';
import {
  buildHologramRelief,
  buildPolarStarfield,
  computeHorizonDiagram,
} from './hologramGeometry';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowUpFromLine,
  Box,
  CheckCircle2,
  Compass,
  Eye,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Sun,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  SHACKLETON_MARKERS,
  HEIGHT_LESSON_START,
  computeRimIllumination,
  sampleShackletonElevationKm,
  TERRAIN_PROVENANCE,
} from '../data/shackletonDem';

class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface TerrainMeshProps {
  solarAzimuthDeg: number;
  mastHeightMeters: 2 | 10;
  activeSite: 'S' | 'C1';
  autoRotateSun: boolean;
  onTickAzimuth: (next: number) => void;
  viewReset: number;
  cameraMode: 'orbit' | 'rim';
}

const COMPASS_DEGREE_TICKS = Array.from({ length: 24 }, (_, idx) => idx * 15);

function ShackletonScene({
  solarAzimuthDeg,
  mastHeightMeters,
  activeSite,
  autoRotateSun,
  onTickAzimuth,
  viewReset,
  cameraMode,
}: TerrainMeshProps) {
  const azimuthRef = useRef(solarAzimuthDeg);
  const gl = useThree(state => state.gl);
  const camera = useThree(state => state.camera);
  const invalidate = useThree(state => state.invalidate);
  const countFrame = useMemo(() => renderCounter(gl.domElement, 'three'), [gl]);
  azimuthRef.current = solarAzimuthDeg;

  useFrame((_, delta) => {
    countFrame();
    if (autoRotateSun) {
      const next = (azimuthRef.current + delta * 18) % 360;
      onTickAzimuth(next);
    }
  });

  const { terrain: geometry, skirt } = useMemo(buildHologramRelief, []);
  const starfield = useMemo(() => buildPolarStarfield(160), []);
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  useEffect(() => () => { geometry.dispose(); skirt.dispose(); starfield.dispose(); }, [geometry, skirt, starfield]);

  const sunRad = (solarAzimuthDeg * Math.PI) / 180;
  // Artistic grazing light in exaggerated scene coordinates, separate from the 1.55° index model.
  const sunDist = 14;
  const sunX = Math.cos(sunRad) * sunDist;
  const sunZ = Math.sin(sunRad) * sunDist;
  const sunY = 1.45;

  const site = SHACKLETON_MARKERS.find(marker => marker.id === activeSite)!;
  const siteWorldX = site.nx * 6;
  const siteWorldZ = site.nz * 6;
  const siteWorldY = sampleShackletonElevationKm(site.nx, site.nz) * 0.52;
  const currentIllum = computeRimIllumination(solarAzimuthDeg, mastHeightMeters, activeSite);
  const mastWorldHeight = mastHeightMeters === 10 ? 0.62 : 0.14;
  const altMastWorldHeight = mastHeightMeters === 10 ? 0.14 : 0.62;
  const psrFloorY = sampleShackletonElevationKm(0, 0) * 0.52;

  // Sun changes never reset a learner's orbit. Only mode, Reset view and site changes do.
  const cameraAnchor = useRef({ sunRad, site: [siteWorldX, siteWorldY, siteWorldZ] });
  cameraAnchor.current = { sunRad, site: [siteWorldX, siteWorldY, siteWorldZ] };

  useEffect(() => {
    const ctrl = controls.current;
    if (!ctrl) return;
    const anchor = cameraAnchor.current;
    if (cameraMode === 'rim') {
      const dx = Math.cos(anchor.sunRad);
      const dz = Math.sin(anchor.sunRad);
      const [sx, sy, sz] = anchor.site;
      camera.position.set(
        sx - dx * 3.2 + dz * 1.1,
        sy + 1.6,
        sz - dz * 3.2 - dx * 1.1,
      );
      ctrl.target.set(sx + dx * 0.7, sy + 0.35, sz + dz * 0.7);
    } else {
      camera.position.set(8.5, 9, 11.5);
      ctrl.target.set(0, -1.4, 0);
    }
    ctrl.update();
    invalidate();
  }, [cameraMode, viewReset, activeSite, camera, invalidate]);

  return (
    <>
      <ambientLight intensity={0.65} color="#9eb9d0" />
      <hemisphereLight intensity={0.7} color="#c0d8eb" groundColor="#253344" />
      <directionalLight
        position={[sunX, sunY, sunZ]}
        intensity={2.4}
        color="#fff0c2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
        shadow-normalBias={0.035}
        shadow-radius={2}
      />

      {/* Deterministic Polar Starfield Dome */}
      <points geometry={starfield}>
        <pointsMaterial vertexColors size={0.11} sizeAttenuation transparent opacity={0.82} />
      </points>

      {/* Grazing Polar Sun Orb + Solar Corona Halo */}
      <group position={[sunX * 0.58, sunY * 0.86, sunZ * 0.58]}>
        <mesh>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshBasicMaterial color="#fff4c2" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.34, 16, 16]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.28} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.52, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      </group>

      {/* Low Polar Horizon Blue-Marble Earth */}
      <group position={[-4.8, 3.1, -10.4]}>
        <mesh>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.35} roughness={0.6} />
        </mesh>
        <mesh position={[0.06, 0.08, 0.05]}>
          <sphereGeometry args={[0.43, 20, 20]} />
          <meshBasicMaterial color="#e0f2fe" wireframe transparent opacity={0.18} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.49, 20, 20]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </group>

      {/* Procedural crater teaching terrain */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {/* PSR Cold-Trap Cryogenic Contour Ring on Crater Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, psrFloorY + 0.025, 0]}>
        <ringGeometry args={[0.85, 0.92, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.32} side={THREE.DoubleSide} />
      </mesh>

      {/* Cutaway display edge and instrument plinth, not geological strata. */}
      <mesh geometry={skirt}>
        <meshStandardMaterial color="#45667b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -2.34, 0]}>
        <cylinderGeometry args={[6.12, 6.22, 0.28, 96]} />
        <meshStandardMaterial color="#152d40" metalness={0.5} roughness={0.55} />
      </mesh>
      {[6.18, 6.42].map((radius, index) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.18, 0]}>
          <ringGeometry args={[radius, radius + 0.022, 96]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={index ? 0.18 : 0.75} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Plinth Azimuth Compass Ticks & Active Sun Pointer */}
      {COMPASS_DEGREE_TICKS.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const isMajor = deg % 90 === 0;
        const rInner = isMajor ? 6.18 : 6.24;
        const rOuter = isMajor ? 6.44 : 6.38;
        const rMid = (rInner + rOuter) * 0.5;
        return (
          <mesh
            key={deg}
            position={[Math.cos(rad) * rMid, -2.17, Math.sin(rad) * rMid]}
            rotation={[0, -rad, 0]}
          >
            <boxGeometry args={[rOuter - rInner, 0.015, isMajor ? 0.045 : 0.024]} />
            <meshBasicMaterial
              color={isMajor ? '#7dd3fc' : '#38bdf8'}
              transparent
              opacity={isMajor ? 0.72 : 0.35}
            />
          </mesh>
        );
      })}
      {/* Active Sun Azimuth Pointer on Plinth Ring */}
      <mesh
        position={[Math.cos(sunRad) * 6.32, -2.15, Math.sin(sunRad) * 6.32]}
        rotation={[0, -sunRad, 0]}
      >
        <boxGeometry args={[0.32, 0.04, 0.09]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>

      {/* Active Outpost Solar Mast / Deck Array + Ghost Alternate-Height Reference */}
      <group position={[siteWorldX, siteWorldY, siteWorldZ]}>
        {/* Ghost wireframe comparison of the alternate mast height (2 m vs 10 m) */}
        <mesh position={[0, altMastWorldHeight / 2, 0]}>
          <cylinderGeometry args={[0.026, 0.032, altMastWorldHeight, 8]} />
          <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.28} />
        </mesh>
        <mesh position={[0, altMastWorldHeight, 0]} rotation={[0, -sunRad, 0]}>
          <boxGeometry args={[0.04, mastHeightMeters === 10 ? 0.14 : 0.34, 0.34]} />
          <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.34} />
        </mesh>

        {/* Active Mast pole */}
        <mesh position={[0, mastWorldHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.052, mastWorldHeight, 12]} />
          <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.5} />
        </mesh>
        {/* Active Solar wing */}
        <mesh position={[0, mastWorldHeight, 0]} rotation={[0, -sunRad, 0]} castShadow>
          <boxGeometry args={[0.055, mastHeightMeters === 10 ? 0.34 : 0.14, 0.38]} />
          <meshStandardMaterial
            color={currentIllum.inShadow ? '#64748b' : '#38bdf8'}
            emissive={currentIllum.inShadow ? '#334155' : '#0284c7'}
            emissiveIntensity={currentIllum.inShadow ? 0.25 : 0.65}
          />
        </mesh>

        {/* Stylized 3D Outpost Habitat Dome & Pressurized Rover beside the Mast */}
        <group position={[0.26, 0.04, 0.22]}>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.15, 0.09, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.09, 0]} castShadow>
            <sphereGeometry args={[0.125, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.25} roughness={0.45} />
          </mesh>
          {/* Glowing habitat viewport window */}
          <mesh position={[-0.09, 0.065, -0.09]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshBasicMaterial color={currentIllum.inShadow ? '#fbbf24' : '#7dd3fc'} />
          </mesh>
          {/* Miniature 3D Lunar Rover */}
          <group position={[-0.22, 0.015, 0.12]} rotation={[0, 0.6, 0]}>
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.11, 0.035, 0.065]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.5} />
            </mesh>
            <mesh position={[0.058, 0.022, 0]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
          </group>
        </group>
      </group>

      {/* The independent horizon diagram below carries the model result. No ray is fitted to
          the differently exaggerated artistic mesh: that would imply false geometric agreement. */}

      {/* Illustrative markers, not mapped NASA study coordinates */}
      {SHACKLETON_MARKERS.map((m) => {
        const mx = m.nx * 6;
        const mz = m.nz * 6;
        const my = sampleShackletonElevationKm(m.nx, m.nz) * 0.52;
        const isSelected = m.id === activeSite;
        const isPsr = m.id === 'PSR';

        return (
          <group key={m.id} position={[mx, my + (isPsr ? 0.18 : 0.22), mz]}>
            <mesh>
              <sphereGeometry args={[isSelected ? 0.11 : 0.08, 12, 12]} />
              <meshBasicMaterial color={isPsr ? '#22d3ee' : isSelected ? '#fde047' : '#a7f3d0'} />
            </mesh>
            {!isPsr && <Html center position={[0, 0.85, 0]} style={{ pointerEvents: 'none' }}>
              <div
                className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow-lg backdrop-blur-sm ${
                  isPsr
                    ? 'border-cyan-400/50 bg-cyan-950/85 text-cyan-200'
                    : isSelected
                    ? 'border-amber-300/70 bg-slate-950/90 text-amber-200'
                    : 'border-white/20 bg-slate-950/75 text-slate-200'
                }`}
              >
                {`Demo ${m.id}${isSelected ? ` · ${mastHeightMeters} m` : ''}`}
              </div>
            </Html>}
          </group>
        );
      })}

      <OrbitControls
        ref={controls}
        target={[0, -1.4, 0]}
        enableDamping
        dampingFactor={0.09}
        enablePan={false}
        minDistance={cameraMode === 'rim' ? 2.5 : 8}
        maxDistance={21}
        minPolarAngle={0.22}
        maxPolarAngle={Math.PI / 2.04}
      />
    </>
  );
}

export function Shackleton3DHologram({ compact = false, active = true }: { compact?: boolean; active?: boolean }) {
  const { lang } = useI18n();
  const az = lang === 'az';
  const uid = useId().replace(/:/g, '');
  const [solarAzimuthDeg, setSolarAzimuthDeg] = useState<number>(HEIGHT_LESSON_START.azimuthDeg);
  const [mastHeightMeters, setMastHeightMeters] = useState<2 | 10>(HEIGHT_LESSON_START.mastHeightMeters);
  const [viewReset, setViewReset] = useState(0);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'rim'>('orbit');
  const [activeSite, setActiveSite] = useState<'S' | 'C1'>(HEIGHT_LESSON_START.site);
  const [autoRotateSun, setAutoRotateSun] = useState(false);
  const [show3DScene, setShow3DScene] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => { if (preference.matches) setAutoRotateSun(false); };
    preference.addEventListener('change', changed);
    return () => preference.removeEventListener('change', changed);
  }, []);

  const diag2m = computeHorizonDiagram(solarAzimuthDeg, 2, activeSite);
  const diag10m = computeHorizonDiagram(solarAzimuthDeg, 10, activeSite);
  const currentIllum = mastHeightMeters === 10 ? diag10m : diag2m;
  const heightHelps = diag10m.illuminatedPct > diag2m.illuminatedPct;
  const azRounded = Math.round(solarAzimuthDeg);

  // Geometric mapping for the primary 2.5D cross-section SVG (680 x 256)
  // Sun at (66, 78); Base at (526, 214); Mountain ridge peak at x = 276.
  // Line from Sun (66, 78) to 2m panel (526, 192): at x=276, y = 78 + (192-78)*(210/460) = 130.0
  // Line from Sun (66, 78) to 10m panel (526, 106): at x=276, y = 78 + (106-78)*(210/460) = 90.8
  let ridgePeakY = 166;
  if (diag10m.illuminatedPct === 0) {
    ridgePeakY = Math.max(66, Math.min(84, 84 - (diag10m.blockingRidgeDeg - 1.8) * 14));
  } else if (diag2m.illuminatedPct < 100 && diag10m.illuminatedPct > diag2m.illuminatedPct) {
    ridgePeakY = diag10m.illuminatedPct === 100 ? 108 : 96;
  } else if (diag2m.illuminatedPct === 0) {
    ridgePeakY = 104;
  } else if (diag2m.blockingRidgeDeg > 0.6) {
    ridgePeakY = 152 - Math.min(20, (diag2m.blockingRidgeDeg - 0.6) * 20);
  } else {
    ridgePeakY = 178;
  }

  const sunX = 66;
  const sunY = 78;
  const mastX = 526;
  const groundY = 214;
  const panel2mY = 192;
  const panel10mY = 106;
  const activePanelY = mastHeightMeters === 10 ? panel10mY : panel2mY;
  const activeClear = currentIllum.illuminatedPct === 100;
  const activePartial = currentIllum.illuminatedPct > 0 && currentIllum.illuminatedPct < 100;
  const ridgeX = 276;

  // Intersect blocked ray with the sunward mountain face (x: 222 -> 276)
  const mr = (activePanelY - sunY) / (mastX - sunX);
  const mm = -46 / (ridgeX - 222);
  const hitXRaw = (ridgePeakY + 46 - mm * 222 - (sunY - mr * sunX)) / (mr - mm);
  const activeRayBlocked = currentIllum.illuminatedPct === 0;
  const hitX = activeRayBlocked ? Math.max(222, Math.min(ridgeX, hitXRaw)) : mastX;
  const hitY = activeRayBlocked ? sunY + mr * (hitX - sunX) : activePanelY;

  function restartHeightLesson() {
    setAutoRotateSun(false);
    setSolarAzimuthDeg(HEIGHT_LESSON_START.azimuthDeg);
    setActiveSite(HEIGHT_LESSON_START.site);
    setMastHeightMeters(HEIGHT_LESSON_START.mastHeightMeters);
    setCameraMode('orbit');
    setViewReset(value => value + 1);
  }

  const fallback2D = (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-sky-400/25 bg-slate-950/80 p-4 text-center text-xs text-slate-300">
      <Compass size={26} className="mb-2 text-sky-300" />
      <p className="font-semibold text-white">
        {az
          ? 'Şeklton Qütb Üfüq Simulyatoru (2D Rejim)'
          : 'Shackleton Polar Horizon Simulator (2D Fallback)'}
      </p>
      <p className="mt-1 font-mono text-sky-200">
        Azimuth {azRounded}° · {mastHeightMeters} m → {currentIllum.illuminatedPct}%{' '}
        {az ? 'sxematik görünmə indeksi' : 'illustrative visibility index'}
      </p>
    </div>
  );

  return (
    <div className="rounded-xl border border-sky-400/35 bg-[#07131d] p-3.5 sm:p-4 shadow-inner">
      {/* Primary Opening Question & Action Prompt */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded border border-sky-400/35 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
            {az
              ? 'GÜNƏŞ VƏ RELYEF TƏCRÜBƏSİ · SXEMATİK MODEL (NASA DEM DEYİL)'
              : 'SUNLIGHT & TERRAIN EXPERIMENT · ILLUSTRATIVE MODEL (NOT A NASA DEM)'}
          </span>
          <h3 className="mt-1.5 flex items-start gap-2 text-base sm:text-lg font-bold leading-snug text-white">
            <HelpCircle size={20} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span>
              {az
                ? 'Günəş dağın arxasında gizlənib. Günəş panellərimizin daha çox işıq almasına kömək edə bilərsən?'
                : 'The Sun is hiding behind a mountain. Can you help our solar panels receive more sunlight?'}
            </span>
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">
            {az
              ? 'Nə etməli: 1) Panelləri 128° dağ silsiləsinin üzərinə qaldırmaq üçün dirək hündürlüyünü 2 m-dən 10 m-ə keçir. 2) Hündürlüyün nə vaxt kömək etdiyini görmək üçün Günəş bucağı sürgüsünü (0°–360°) hərəkət etdir.'
              : 'What to do: 1) Switch the mast from 2 m to 10 m to lift the panels over the mountain ridge at 128°. 2) Sweep the Sun angle slider (0°–360°) to see when height helps.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAutoRotateSun((v) => !v)}
            aria-pressed={autoRotateSun}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-300/35 bg-sky-500/15 px-2.5 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
          >
            {autoRotateSun ? <Pause size={12} /> : <Play size={12} />}
            {autoRotateSun ? (az ? 'Günəşi dayandır' : 'Pause Sun') : (az ? 'Günəşi fırlat' : 'Animate Sun')}
          </button>
          <button
            type="button"
            onClick={restartHeightLesson}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/20"
          >
            <RotateCcw size={12} />
            {az ? '128° sınağına qayıt' : 'Restart height lesson'}
          </button>
        </div>
      </div>

      {/* Prominent Height Choice Buttons (2 m Low Deck vs 10 m Tall Mast) */}
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        {([
          {
            height: 2 as const,
            diag: diag2m,
            title: az ? '2 m Alçaq Gövdə (D1-B)' : '2 m Low Deck (D1-B)',
            sub: az ? 'Dağın kölgəsi panelləri örtə bilər' : 'Mountain ridges can shade low panels',
          },
          {
            height: 10 as const,
            diag: diag10m,
            title: az ? '10 m Hündür Dirək (D1-A)' : '10 m Tall Mast (D1-A)',
            sub: az ? 'Panelləri maneəli üfüqdən yuxarı qaldırır' : 'Lifts panels higher over blocking ridges',
          },
        ]).map(({ height, diag, title, sub }) => {
          const isSelected = mastHeightMeters === height;
          const isLit = diag.illuminatedPct === 100;
          return (
            <button
              key={height}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setMastHeightMeters(height)}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                isSelected
                  ? height === 10
                    ? 'border-emerald-300/80 bg-emerald-950/55 ring-1 ring-emerald-400/50 text-white'
                    : 'border-amber-300/80 bg-amber-950/50 ring-1 ring-amber-400/50 text-white'
                  : 'border-white/15 bg-slate-900/65 text-slate-200 hover:border-sky-300/40 hover:bg-slate-800/75'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                  <ArrowUpFromLine size={14} className={height === 10 ? 'text-emerald-300' : 'text-amber-300'} />
                  <span>{title}</span>
                  {isSelected && (
                    <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white">
                      {az ? 'Seçilib' : 'Active'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-300">{sub}</p>
              </div>
              <div className="shrink-0 text-right font-mono">
                <strong
                  className={`block text-base font-bold ${
                    isLit ? 'text-emerald-300' : diag.illuminatedPct > 0 ? 'text-amber-200' : 'text-rose-300'
                  }`}
                >
                  {diag.illuminatedPct}%
                </strong>
                <span className="text-[9.5px] text-slate-400">
                  {az ? 'görünmə' : 'visibility'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Visual Experiment Feedback Banner */}
      <div
        role="status"
        aria-live="polite"
        className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
          heightHelps && activeClear
            ? 'border-emerald-400/60 bg-emerald-950/55 text-emerald-100'
            : heightHelps && !activeClear
              ? 'border-amber-400/60 bg-amber-950/55 text-amber-100'
              : activeClear
                ? 'border-sky-400/45 bg-sky-950/45 text-sky-100'
                : 'border-rose-400/50 bg-rose-950/45 text-rose-100'
        }`}
      >
        <span className="flex items-center gap-2 font-medium">
          {heightHelps && activeClear ? (
            <CheckCircle2 size={15} className="shrink-0 text-emerald-300" />
          ) : (
            <Sun size={15} className="shrink-0 text-amber-300" />
          )}
          <span>
            {heightHelps && activeClear
              ? az
                ? `Əla! ${azRounded}° istiqamətində 10 m-lik dirək dağ silsiləsini aşdı — panellər 0% əvəzinə 100% işıq alır!`
                : `Solved! Raising the mast to 10 m clears the ridge at ${azRounded}° — your panels now catch 100% Sun instead of 0%!`
              : heightHelps
                ? az
                  ? `Dağ kölgəsi! ${azRounded}°-də 2 m-lik panel alçaq Günəşi görmür (0%). Yuxarıda "10 m Hündür Dirək (D1-A)" düyməsinə klikləyin!`
                  : `Blocked by mountain shadow! At ${azRounded}°, the 2 m deck sits in shadow (0%). Click "10 m Tall Mast (D1-A)" above!`
                : activeClear
                  ? az
                    ? `${azRounded}° istiqamətində açıq üfüq: həm 2 m, həm də 10 m 100% işıq alır. Hündürlük yalnız dağ maneəsi olanda fərq yaradır.`
                    : `Open sky at ${azRounded}°: both 2 m and 10 m panels see 100% Sun. Height helps only where terrain blocks the horizon.`
                  : az
                    ? `${azRounded}°-də hündür silsilə (${currentIllum.blockingRidgeDeg.toFixed(1)}°): hətta 10 m-lik dirək də onu aşmır — buna görə batareya ehtiyatı vacibdir!`
                    : `Tall ridge at ${azRounded}° (${currentIllum.blockingRidgeDeg.toFixed(1)}°): even a 10 m mast cannot clear this ridge — showing why battery storage matters!`}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[10.5px] opacity-90">
          {az ? 'Azimut' : 'Azimuth'} {azRounded}° · {az ? 'Üfüq' : 'Ridge'} {currentIllum.blockingRidgeDeg.toFixed(2)}°
        </span>
      </div>

      {/* Primary Interactive 2.5D Mountain Horizon Cross-Section */}
      <div className="relative overflow-hidden rounded-xl border border-sky-300/30 bg-[#05101a]">
        <svg
          viewBox="0 0 680 256"
          role="img"
          aria-label={
            az
              ? `2.5D dağ və günəş dirəyi təcrübəsi: ${mastHeightMeters} m dirək, ${azRounded}° azimut, ${currentIllum.illuminatedPct}% görünmə indeksi`
              : `2.5D mountain horizon & solar mast experiment: ${mastHeightMeters} m mast, ${azRounded}° azimuth, ${currentIllum.illuminatedPct}% visibility index`
          }
          className="h-auto w-full block"
        >
          <defs>
            <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#030a14" />
              <stop offset="65%" stopColor="#0b2032" />
              <stop offset="100%" stopColor="#143248" />
            </linearGradient>
            <linearGradient id={`${uid}-mtn`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#466275" />
              <stop offset="55%" stopColor="#273c4b" />
              <stop offset="100%" stopColor="#12212c" />
            </linearGradient>
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#facc15" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fde047" stopOpacity="0.14" />
            </linearGradient>
          </defs>

          <rect width="680" height="256" fill={`url(#${uid}-sky)`} />

          {/* Subtle polar stars */}
          {[
            [110, 28, 1.3], [190, 44, 1.0], [260, 22, 1.4], [345, 36, 1.1],
            [435, 25, 1.5], [515, 42, 1.1], [610, 24, 1.3], [645, 58, 1.0],
          ].map(([sx, sy, r], idx) => (
            <circle key={idx} cx={sx} cy={sy} r={r} fill="#dbeafe" opacity={0.65} />
          ))}

          {/* Grazing 1.55° Sun with corona */}
          <circle cx={sunX} cy={sunY} r="44" fill={`url(#${uid}-glow)`} />
          <circle cx={sunX} cy={sunY} r="17" fill="#fef08a" stroke="#facc15" strokeWidth="1.5" />
          <text x={sunX} y={sunY - 26} textAnchor="middle" fill="#fde047" fontSize="10" fontFamily="monospace" fontWeight="bold">
            1.55° SUN
          </text>

          {/* Ghost 10m vs 2m comparison ray (dashed) */}
          {mastHeightMeters === 2 && diag10m.illuminatedPct > 0 && (
            <line
              x1={sunX + 16}
              y1={sunY + 1}
              x2={mastX}
              y2={panel10mY}
              stroke="#fde047"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              opacity="0.55"
            />
          )}

          {/* Mountain Shadow Cone behind ridge when active mast is blocked or 2m is blocked */}
          {(activeRayBlocked || (mastHeightMeters === 10 && diag2m.illuminatedPct === 0)) && (
            <polygon
              points={`${ridgeX},${ridgePeakY} 680,146 680,256 ${ridgeX},256`}
              fill="#020810"
              opacity="0.46"
            />
          )}

          {/* Active Solar Beam from Sun to Active Panel (or hitting ridge if blocked) */}
          {activeClear || activePartial ? (
            <>
              <polygon
                points={`${sunX + 12},${sunY - 9} ${mastX},${activePanelY - 7} ${mastX},${activePanelY + 8} ${sunX + 12},${sunY + 10}`}
                fill={`url(#${uid}-beam)`}
              />
              <line
                x1={sunX + 17}
                y1={sunY + 1}
                x2={mastX - 8}
                y2={activePanelY}
                stroke={activeClear ? '#fde047' : '#fbbf24'}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx={mastX} cy={activePanelY} r="16" fill="#fde047" opacity="0.24" />
            </>
          ) : (
            <>
              <line
                x1={sunX + 17}
                y1={sunY + 2}
                x2={hitX}
                y2={hitY}
                stroke="#fb7185"
                strokeWidth="2.8"
                strokeDasharray="6 4"
              />
              <circle cx={hitX} cy={hitY} r="6.5" fill="#f43f5e" />
              <circle cx={hitX} cy={hitY} r="11" fill="none" stroke="#fda4af" strokeWidth="1.4" opacity="0.7" />
              <text x={Math.min(hitX, 240)} y={hitY - 14} textAnchor="middle" fill="#fda4af" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                {az ? 'DAĞ KÖLGƏYƏ SALIR!' : 'BLOCKED BY RIDGE!'}
              </text>
            </>
          )}

          {/* Blocking Mountain Silhouette + Crater Rim Outpost Plateau */}
          <path
            d={`M 0 222 L 155 212 L 222 ${ridgePeakY + 46} L ${ridgeX} ${ridgePeakY} L 336 ${ridgePeakY + 52} L 420 214 L 680 214 L 680 256 L 0 256 Z`}
            fill={`url(#${uid}-mtn)`}
            stroke="#648396"
            strokeWidth="1.6"
          />
          {/* Surface texture ribs on ridge */}
          <path
            d={`M ${ridgeX} ${ridgePeakY} L 296 184 M 252 ${ridgePeakY + 26} L 236 206`}
            stroke="#7da0b5"
            strokeWidth="1"
            opacity="0.4"
          />
          <text x={ridgeX} y={ridgePeakY - 8} textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
            {az ? 'SİLSİLƏ' : 'MOUNTAIN'} ({currentIllum.blockingRidgeDeg.toFixed(1)}°)
          </text>

          {/* Ghost outline showing the other mast height option */}
          {mastHeightMeters === 2 ? (
            <g opacity="0.45">
              <line x1={mastX} y1={groundY} x2={mastX} y2={panel10mY} stroke="#7dd3fc" strokeWidth="2.5" strokeDasharray="4 3" />
              <rect x={mastX - 18} y={panel10mY - 6} width="36" height="9" rx="2" fill="none" stroke="#7dd3fc" strokeWidth="1.4" strokeDasharray="3 2" />
              <text x={mastX - 24} y={panel10mY + 3} textAnchor="end" fill="#7dd3fc" fontSize="10" fontFamily="monospace">
                10 m: {diag10m.illuminatedPct}%
              </text>
            </g>
          ) : (
            <g opacity="0.45">
              <rect x={mastX - 16} y={panel2mY - 5} width="32" height="7" rx="2" fill="none" stroke="#fda4af" strokeWidth="1.2" strokeDasharray="3 2" />
              <text x={mastX - 22} y={panel2mY + 3} textAnchor="end" fill="#fda4af" fontSize="10" fontFamily="monospace">
                2 m: {diag2m.illuminatedPct}%
              </text>
            </g>
          )}

          {/* Active Solar Mast & Panels */}
          <rect x={mastX - 7} y={groundY - 4} width="14" height="5" rx="1.5" fill="#64748b" />
          <line
            x1={mastX}
            y1={groundY}
            x2={mastX}
            y2={activePanelY}
            stroke={activeClear ? '#facc15' : '#94a3b8'}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Dual Solar Wings */}
          <rect
            x={mastX - 20}
            y={activePanelY - 6}
            width="40"
            height="10"
            rx="2.5"
            fill={activeClear ? '#0284c7' : activePartial ? '#0369a1' : '#334155'}
            stroke={activeClear ? '#fde047' : '#94a3b8'}
            strokeWidth="1.8"
          />
          <line x1={mastX - 6} y1={activePanelY - 6} x2={mastX - 6} y2={activePanelY + 4} stroke="#bae6fd" strokeWidth="0.9" opacity="0.65" />
          <line x1={mastX + 6} y1={activePanelY - 6} x2={mastX + 6} y2={activePanelY + 4} stroke="#bae6fd" strokeWidth="0.9" opacity="0.65" />

          {/* Outpost Habitat Dome next to mast — windows light up cleanly when Sun hits panel */}
          <g transform="translate(598, 214)">
            <path d="M -26 0 A 26 22 0 0 1 26 0 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.4" />
            <rect x="-15" y="-12" width="12" height="6" rx="2" fill={activeClear ? '#fde047' : activePartial ? '#fbbf24' : '#475569'} />
            <rect x="3" y="-12" width="12" height="6" rx="2" fill={activeClear ? '#fde047' : activePartial ? '#fbbf24' : '#475569'} />
            <rect x="-32" y="-2" width="64" height="5" rx="2" fill="#475569" />
            {/* Astronaut figure outside dome */}
            <circle cx="-36" cy="-16" r="4" fill="#f8fafc" />
            <rect x="-39" y="-12" width="6" height="9" rx="2" fill="#f8fafc" />
            <rect x="-38" y="-17" width="4" height="2.5" rx="1" fill="#f59e0b" />
          </g>

          {/* Ground labels */}
          <text x={mastX} y="238" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
            {mastHeightMeters} m · {currentIllum.illuminatedPct}%
          </text>
          <text x="598" y="238" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
            {az ? 'BAZA MODULU' : 'HABITAT'}
          </text>
          <text x="12" y="246" fill="#7dd3fc" fontSize="9.5" fontFamily="monospace" opacity="0.85">
            {az
              ? `Demo ${activeSite} · sxematik kəsik (miqyaslı deyil)`
              : `Demo ${activeSite} · schematic cross-section (not to scale)`}
          </text>
        </svg>
      </div>

      {/* Controls: 360° Sun Azimuth Slider + Demo Site Switcher */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <label className="flex items-center justify-between text-xs font-medium text-slate-200">
            <span className="flex items-center gap-1.5">
              <Sun size={13} className="text-amber-300" />
              {az
                ? 'Addım 2: Günəşi 360° üfüq ətrafında fırlat'
                : 'Step 2: Sweep Sun around 360° Horizon (watch mountain height change!)'}
            </span>
            <span className="font-mono font-bold text-amber-300">{azRounded}°</span>
          </label>
          <input
            type="range"
            aria-label={az ? 'Təlim Günəş azimutu' : 'Training Sun azimuth'}
            min={0}
            max={360}
            value={azRounded}
            onChange={(e) => {
              setAutoRotateSun(false);
              setSolarAzimuthDeg(Number(e.target.value));
            }}
            className="mt-1.5 w-full accent-amber-300"
          />
        </div>
        <div className="flex gap-1.5">
          {(['S', 'C1'] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeSite === id}
              onClick={() => setActiveSite(id)}
              className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold ${
                activeSite === id
                  ? 'border-sky-300 bg-sky-500/25 text-white'
                  : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Demo {id}
            </button>
          ))}
        </div>
      </div>

      {/* Panel's-Eye Horizon View (2 m vs 10 m solar disk cutoff) */}
      <div className="mt-3 rounded-lg border border-sky-300/20 bg-slate-950/65 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-sky-100">
            {az ? 'Panelin gözü ilə üfüq · 2 m və 10 m müqayisəsi' : 'Panel’s-Eye Horizon View · 2 m vs 10 m comparison'}
          </p>
          <span className="font-mono text-[10px] text-slate-400">
            {az ? 'Sxematik görünmə indeksi (enerji proqnozu deyil)' : 'Illustrative visibility index (not a power forecast)'}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([2, 10] as const).map(height => {
            const diagram = height === 2 ? diag2m : diag10m;
            const selected = height === mastHeightMeters;
            const stateLabel = az
              ? diagram.visibility === 'hidden' ? 'Örtülüb' : diagram.visibility === 'partial' ? 'Qismən görünür' : 'Görünür'
              : diagram.visibility === 'hidden' ? 'Hidden' : diagram.visibility === 'partial' ? 'Partly visible' : 'Clear';
            return (
              <div key={height} className={`overflow-hidden rounded-lg border ${selected ? 'border-amber-300/70 bg-slate-900/60' : 'border-white/15 bg-slate-950/50'}`}>
                <div className="flex flex-wrap justify-between gap-1 px-2 pt-1.5 text-[11px] font-semibold">
                  <span>{height} m{selected ? (az ? ' · seçilib' : ' · selected') : ''}</span>
                  <span className={diagram.visibility === 'clear' ? 'text-emerald-300' : 'text-amber-200'}>{diagram.illuminatedPct}% · {stateLabel}</span>
                </div>
                <svg viewBox="0 0 240 92" role="img" aria-label={`${height} m · ${stateLabel} · ${diagram.illuminatedPct}%`} className="h-16 w-full">
                  <rect width="240" height="92" fill="#07131d" />
                  <circle cx="172" cy={diagram.sunCenterY} r={diagram.sunRadius} fill="#fde047" />
                  <rect x="0" y={diagram.horizonY} width="240" height={92 - diagram.horizonY} fill="#294252" />
                  <line x1="0" x2="240" y1={diagram.horizonY} y2={diagram.horizonY} stroke="#7dd3fc" strokeWidth="1.5" />
                  <text x="9" y="81" fill="#cbd5e1" fontSize="11">{az ? 'Yerli üfüq' : 'Local horizon'} {diagram.blockingRidgeDeg.toFixed(2)}°</text>
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional 3D Crater Relief Toggle & Collapsible WebGL Scene */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sky-300/15 pt-2.5">
        <button
          type="button"
          aria-expanded={show3DScene}
          onClick={() => setShow3DScene((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/20"
        >
          <Box size={14} className="text-sky-300" />
          {show3DScene
            ? az ? '3D Krater Relyefini Gizlət' : 'Hide 3D Crater Relief'
            : az ? '3D Krater Relyefini Araşdır (İstəyə bağlı)' : 'Explore 3D Crater Relief (Optional)'}
        </button>
        <span className="text-[11px] text-slate-400">
          {az ? 'Bədii 3D baxış · ayrıca prosedural relyef' : 'Optional 3D relief viewer · illustrative surface'}
        </span>
      </div>

      {show3DScene && (
        <div className="mt-2.5">
          <div className={`${compact ? 'h-48' : 'h-56'} relative w-full overflow-hidden rounded-xl border border-sky-300/20 bg-[radial-gradient(ellipse_at_50%_70%,#193b50_0%,#07121f_55%,#02060d_100%)]`}>
            <WebGLErrorBoundary fallback={fallback2D}>
              <Canvas
                shadows={{ type: THREE.PCFShadowMap }}
                frameloop={hologramFrameLoop(active && show3DScene, autoRotateSun)}
                dpr={[1, 1.5]}
                fallback={fallback2D}
                camera={{ position: [8.5, 9, 11.5], fov: 38 }}
                gl={{ antialias: true, powerPreference: 'default' }}
              >
                <ShackletonScene
                  solarAzimuthDeg={solarAzimuthDeg}
                  mastHeightMeters={mastHeightMeters}
                  activeSite={activeSite}
                  autoRotateSun={autoRotateSun}
                  onTickAzimuth={setSolarAzimuthDeg}
                  viewReset={viewReset}
                  cameraMode={cameraMode}
                />
              </Canvas>
            </WebGLErrorBoundary>

            <div className="pointer-events-none absolute left-3 top-3 border-l-2 border-sky-300/60 pl-2 font-mono text-[9px] uppercase tracking-widest text-sky-200/75">
              {az ? '3D RELYEF (İSTƏYƏ BAĞLI)' : 'OPTIONAL 3D RELIEF'} · {az ? 'SXEMATİK' : 'ILLUSTRATIVE'}
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              <button
                type="button"
                aria-pressed={cameraMode === 'rim'}
                onClick={() => setCameraMode(mode => (mode === 'orbit' ? 'rim' : 'orbit'))}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition focus-visible:outline-2 focus-visible:outline-sky-300 ${
                  cameraMode === 'rim'
                    ? 'border-amber-300/60 bg-amber-400/20 text-amber-100'
                    : 'border-sky-300/25 bg-slate-950/80 text-sky-100 hover:bg-sky-900'
                }`}
              >
                <Eye size={11} />
                {cameraMode === 'rim'
                  ? az ? 'Orbit baxışı' : 'Orbit view'
                  : az ? 'Astronavt baxışı (Kənar POV)' : 'Astronaut Rim POV'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraMode('orbit');
                  setViewReset(value => value + 1);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-sky-300/25 bg-slate-950/80 px-2 py-1 text-[10px] text-sky-100 hover:bg-sky-900 focus-visible:outline-2 focus-visible:outline-sky-300"
              >
                <RotateCcw size={11} />{az ? 'Görünüşü sıfırla' : 'Reset view'}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">{az
            ? 'Döndərmək üçün sürükləyin, yaxınlaşdırmaq üçün təkəri çevirin. Mavi nöqtə: sxematik soyuq tələ. S/C1 mövqeləri və ölçülər sxematikdir.'
            : 'Drag to orbit · Scroll to zoom. Blue marker: illustrative cold trap. S/C1 positions and dimensions are illustrative.'}</p>
        </div>
      )}

      <details className="mt-2.5 border-t border-sky-300/15 pt-2">
        <summary className="cursor-pointer text-xs font-medium text-sky-200">{az ? 'Elmi sərhəd və illüstrasiya qeydləri' : 'Scientific separation & illustration notes'}</summary>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          {az
            ? `Yuxarıdakı eksperiment prosedural təlim modelidir (NASA LOLA DEM deyil): müşahidəçi hündürlüyü ×${TERRAIN_PROVENANCE.mastHeightExaggeration} şişirdilib və faizlər cari azimut üçün görünmə indeksidir (real enerji proqnozu deyil). Aşağıdakı "Ay məkanlarının təhlili" paneli isə nəşr edilmiş NASA LOLA/Gläser (2018) və Mazarico (2011) tədqiqatlarını ayrıca təqdim edir.`
            : `The experiment above is an illustrative procedural teaching model (not a NASA LOLA DEM): observer height is exaggerated ×${TERRAIN_PROVENANCE.mastHeightExaggeration} and percentages show a directional visibility index (not a real power forecast). Published NASA LRO/LOLA findings (Mazarico et al. 2011 & Gläser et al. 2018) are shown separately below.`}
        </p>
      </details>
    </div>
  );
}
