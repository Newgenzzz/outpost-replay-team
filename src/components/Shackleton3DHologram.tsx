import { Component, type ReactNode, type ElementRef, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { renderCounter } from '../utils/renderDiagnostics';
import { hologramFrameLoop } from '../utils/renderPolicy';
import {
  buildHologramRelief,
  buildPolarStarfield,
  computeSightlineGeometry,
} from './hologramGeometry';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Compass, Eye, Pause, Play, ArrowUpFromLine, Sun, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  SHACKLETON_MARKERS,
  HEIGHT_LESSON_START,
  computeRimIllumination,
  sampleShackletonElevationKm,
  TERRAIN_PROVENANCE,
} from '../data/shackletonDem';

const UP_AXIS = new THREE.Vector3(0, 1, 0);

function BeamSegment({
  start,
  end,
  radius = 0.022,
  haloRadius = 0,
  color,
  opacity = 0.9,
}: {
  start: [number, number, number];
  end: [number, number, number];
  radius?: number;
  haloRadius?: number;
  color: string;
  opacity?: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion();
    if (len > 0.0001) {
      quat.setFromUnitVectors(UP_AXIS, dir.normalize());
    }
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      quaternion: quat,
      length: Math.max(0.001, len),
    };
  }, [start, end]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh>
        <cylinderGeometry args={[radius, radius, length, 10]} />
        <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {haloRadius > radius && (
        <mesh>
          <cylinderGeometry args={[haloRadius, haloRadius, length, 10]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 0.28} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}


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
  az: boolean;
  heightHelps: boolean;
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
  az,
  heightHelps,
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

  const sightline = useMemo(
    () => computeSightlineGeometry(solarAzimuthDeg, mastHeightMeters, activeSite),
    [solarAzimuthDeg, mastHeightMeters, activeSite],
  );
  const [siteWorldX, siteWorldY, siteWorldZ] = sightline.siteWorld;
  const mastWorldHeight = mastHeightMeters === 10 ? 0.62 : 0.14;
  const altMastWorldHeight = mastHeightMeters === 10 ? 0.14 : 0.62;
  const psrFloorY = sampleShackletonElevationKm(0, 0) * 0.52;

  useEffect(() => {
    const ctrl = controls.current;
    if (!ctrl) return;
    if (cameraMode === 'rim') {
      const dx = Math.cos(sunRad);
      const dz = Math.sin(sunRad);
      camera.position.set(
        siteWorldX - dx * 1.85 + dz * 0.42,
        siteWorldY + 0.58,
        siteWorldZ - dz * 1.85 - dx * 0.42,
      );
      ctrl.target.set(
        sightline.ridgeWorld[0],
        sightline.ridgeWorld[1] + 0.12,
        sightline.ridgeWorld[2],
      );
    } else {
      camera.position.set(8.5, 9, 11.5);
      ctrl.target.set(0, -1.4, 0);
    }
    ctrl.update();
    invalidate();
  }, [cameraMode, viewReset, activeSite, camera, invalidate, siteWorldX, siteWorldY, siteWorldZ, sunRad, sightline.ridgeWorld]);

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
      <group position={sightline.sunOrbWorld}>
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
            color={sightline.inShadow ? '#64748b' : '#38bdf8'}
            emissive={sightline.inShadow ? '#334155' : '#0284c7'}
            emissiveIntensity={sightline.inShadow ? 0.25 : 0.65}
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
            <meshBasicMaterial color={sightline.inShadow ? '#fbbf24' : '#7dd3fc'} />
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

      {/* 3D Solar Sightline Ray & Horizon Obstruction / Clearance Visualization */}
      {sightline.isBlocked ? (
        <>
          {/* Ray from active collector intercepted by blocking ridge crest */}
          <BeamSegment
            start={sightline.collectorWorld}
            end={sightline.ridgeWorld}
            radius={0.024}
            haloRadius={0.056}
            color="#fb7185"
            opacity={0.92}
          />
          {/* Dimmed shadow continuation from blocking ridge toward Sun Orb */}
          <BeamSegment
            start={sightline.ridgeWorld}
            end={sightline.sunOrbWorld}
            radius={0.013}
            color="#94a3b8"
            opacity={0.24}
          />
          {/* Subtle ghost sightline showing how the 10 m mast clears this ridge when heightHelps */}
          {heightHelps && mastHeightMeters === 2 && (
            <BeamSegment
              start={sightline.altCollectorWorld}
              end={sightline.sunOrbWorld}
              radius={0.012}
              color="#38bdf8"
              opacity={0.24}
            />
          )}
        </>
      ) : (
        <>
          {/* Unbroken golden solar beam from collector over the horizon to the Sun Orb */}
          <BeamSegment
            start={sightline.collectorWorld}
            end={sightline.rayOverRidgeWorld}
            radius={0.025}
            haloRadius={0.06}
            color="#fde047"
            opacity={0.94}
          />
          <BeamSegment
            start={sightline.rayOverRidgeWorld}
            end={sightline.sunOrbWorld}
            radius={0.022}
            haloRadius={0.052}
            color="#fde047"
            opacity={0.85}
          />
          {/* Vertical clearance pin from ridge crest up to the passing solar ray */}
          <BeamSegment
            start={sightline.ridgeWorld}
            end={sightline.rayOverRidgeWorld}
            radius={0.014}
            color="#34d399"
            opacity={0.65}
          />
        </>
      )}

      {/* Horizon Ridge Crest Target Ring & Educational Callout */}
      <group position={sightline.ridgeWorld}>
        <mesh>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial color={sightline.isBlocked ? '#fb7185' : '#34d399'} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.13, 0.18, 24]} />
          <meshBasicMaterial
            color={sightline.isBlocked ? '#fda4af' : '#6ee7b7'}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        {(sightline.isBlocked || heightHelps) && (
          <Html center position={[0, 0.55, 0]} distanceFactor={11} style={{ pointerEvents: 'none' }}>
            <div
              className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold shadow-lg backdrop-blur-sm ${
                sightline.isBlocked
                  ? 'border-rose-400/70 bg-rose-950/90 text-rose-100'
                  : 'border-emerald-400/70 bg-emerald-950/90 text-emerald-100'
              }`}
            >
              {sightline.isBlocked
                ? az
                  ? `Silsilə ${mastHeightMeters}m-i örtür (${sightline.blockingRidgeDeg.toFixed(2)}°)`
                  : `Ridge blocks ${mastHeightMeters}m (${sightline.blockingRidgeDeg.toFixed(2)}°)`
                : az
                  ? `${mastHeightMeters}m silsiləni aşır (${sightline.blockingRidgeDeg.toFixed(2)}°)`
                  : `${mastHeightMeters}m clears ridge (${sightline.blockingRidgeDeg.toFixed(2)}°)`}
            </div>
          </Html>
        )}
      </group>


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
            {!isPsr && <Html center position={[0, 0.85, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
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
        minDistance={cameraMode === 'rim' ? 0.7 : 8}
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
  const [solarAzimuthDeg, setSolarAzimuthDeg] = useState<number>(HEIGHT_LESSON_START.azimuthDeg);
  const [mastHeightMeters, setMastHeightMeters] = useState<2 | 10>(HEIGHT_LESSON_START.mastHeightMeters);
  const [viewReset, setViewReset] = useState(0);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'rim'>('orbit');
  const [activeSite, setActiveSite] = useState<'S' | 'C1'>(HEIGHT_LESSON_START.site);
  const [autoRotateSun, setAutoRotateSun] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => { if (preference.matches) setAutoRotateSun(false); };
    preference.addEventListener('change', changed);
    return () => preference.removeEventListener('change', changed);
  }, []);

  const illum10m = computeRimIllumination(solarAzimuthDeg, 10, activeSite);
  const illum2m = computeRimIllumination(solarAzimuthDeg, 2, activeSite);
  const currentIllum = mastHeightMeters === 10 ? illum10m : illum2m;
  const heightHelps = illum10m.illuminatedPct > illum2m.illuminatedPct;
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
        Azimuth {Math.round(solarAzimuthDeg)}° · {mastHeightMeters} m → {currentIllum.illuminatedPct}%{' '}
        {az ? 'sxematik görünmə indeksi' : 'illustrative visibility index'}
      </p>
    </div>
  );

  return (
    <div className="rounded-xl border border-sky-400/35 bg-[#07131d] p-3.5 shadow-inner">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-sky-300">
            {az ? 'PROSEDUR TƏLİM RELYEFİ · NASA DEM MƏLUMATI DEYİL' : 'PROCEDURAL TEACHING TERRAIN · NOT A NASA DEM'}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white">
            {az
              ? 'Şekltondan ilhamlanan 3D kölgə nümayişi'
              : 'Shackleton-inspired 3D shadow demonstration'}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoRotateSun((v) => !v)}
            aria-pressed={autoRotateSun}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-300/35 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
          >
            {autoRotateSun ? <Pause size={12} /> : <Play size={12} />}
            {autoRotateSun ? (az ? 'Günəşi dayandır' : 'Pause Sun') : (az ? 'Günəşi hərəkət etdir' : 'Animate Sun')}
          </button>
          <button
            type="button"
            onClick={() => setMastHeightMeters((h) => (h === 10 ? 2 : 10))}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
              mastHeightMeters === 10
                ? 'border-amber-300/60 bg-amber-400/20 text-amber-100'
                : 'border-slate-500 bg-slate-800 text-slate-200'
            }`}
          >
            <ArrowUpFromLine size={12} />
            {mastHeightMeters === 10
              ? az ? '10 m Şaquli Dirək (D1-A)' : '10 m Tall Mast (D1-A)'
              : az ? '2 m Alçaq Panel (D1-B)' : '2 m Low Deck (D1-B)'}
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-300">{az
        ? 'Sxematik relyef və bədii işıqlandırma. Ayrıca indeks modeli: 1.55° Günəş, ×14 hündürlük; elektrik proqnozu deyil.'
        : 'Illustrative relief and artistic lighting. Separate index model: 1.55° Sun, ×14 height; not a power prediction.'}</p>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/25 bg-amber-400/5 px-3 py-2">
        <p className="flex-1 text-xs leading-relaxed text-amber-100">{az
          ? 'Hündürlük nəyi dəyişir? Günəşi sabit saxlayıb 2 m / 10 m düyməsini sınayın, sonra azimutu dəyişin.'
          : 'Does height help? Keep the Sun fixed and try the 2 m / 10 m button, then change its azimuth.'}</p>
        <button type="button" onClick={restartHeightLesson}
          className="rounded-md border border-amber-300/40 px-2 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-400/15">
          {az ? 'Hündürlük sınağını yenidən başlat' : 'Restart height lesson'}
        </button>
      </div>

      {/* 3D WebGL Canvas */}
      <div className={`${compact ? 'h-64' : 'h-72'} relative w-full overflow-hidden rounded-xl border border-sky-300/20 bg-[radial-gradient(ellipse_at_50%_70%,#193b50_0%,#07121f_55%,#02060d_100%)]`}>
        <WebGLErrorBoundary fallback={fallback2D}>
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            frameloop={hologramFrameLoop(active, autoRotateSun)}
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
              az={az}
              heightHelps={heightHelps}
            />
          </Canvas>
        </WebGLErrorBoundary>

        <div className="pointer-events-none absolute left-3 top-3 border-l-2 border-sky-300/60 pl-2 font-mono text-[9px] uppercase tracking-widest text-sky-200/75">
          {az ? 'RELYEF LABORATORİYASI' : 'RELIEF LAB'} · {az ? 'SXEMATİK' : 'ILLUSTRATIVE'}
        </div>
        <div
          className={`pointer-events-none absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold backdrop-blur-sm ${
            currentIllum.illuminatedPct < 100
              ? 'border-rose-400/50 bg-rose-950/80 text-rose-100'
              : 'border-emerald-400/50 bg-emerald-950/80 text-emerald-100'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              currentIllum.illuminatedPct < 100 ? 'bg-rose-400' : 'bg-emerald-400'
            }`}
          />
          {currentIllum.illuminatedPct < 100
            ? az
              ? `Şüa: Silsilə tərəfindən tutulur (${currentIllum.blockingRidgeDeg.toFixed(2)}° > 1.82°)`
              : `Sightline: Blocked by ridge (${currentIllum.blockingRidgeDeg.toFixed(2)}° > 1.82°)`
            : az
              ? `Şüa: Üfüqü aşır (${currentIllum.blockingRidgeDeg.toFixed(2)}° < 1.82°)`
              : `Sightline: Clears horizon (${currentIllum.blockingRidgeDeg.toFixed(2)}° < 1.82°)`}
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
        {/* Teaching index, separate from the artistic light and display geometry. */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/15 bg-slate-950/80 px-3 py-1.5 text-[11px]">
          <span className="flex items-center gap-1.5 font-mono text-amber-200">
            <Sun size={13} className="text-amber-300" />
            {az ? 'Günəş Azimutu' : 'Sun Azimuth'}: {Math.round(solarAzimuthDeg)}°
          </span>
          <span className="font-mono font-semibold text-white">
            2 m: <strong className={illum2m.inShadow ? 'text-rose-300' : 'text-emerald-300'}>{illum2m.illuminatedPct}%</strong>
            {' · '}
            10 m: <strong className={illum10m.inShadow ? 'text-amber-300' : 'text-emerald-300'}>{illum10m.illuminatedPct}%</strong>
            {' '}
            {az ? 'sxematik indeks' : 'illustrative index'}
          </span>
        </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-200">{heightHelps
        ? az
          ? 'Burada hündür panelin indeksi daha yüksəkdir: yüksəklik alçaq Günəşi örtən üfüqü aşmağa kömək edə bilər.'
          : 'Here height improves visibility over the terrain horizon. A low Sun can be hidden by nearby terrain.'
        : az
          ? 'Bu istiqamətdə hər iki hündürlüyün indeksi eynidir. Hündürlük yalnız maneə yaradan üfüqü aşmağa kömək etdikdə üstünlük verir.'
          : 'Both heights have the same index here. Height helps only when it improves clearance over the obstructing horizon.'}
        {' '}{az ? 'Faizlər illik işıqlanma deyil.' : 'Percentages are not annual illumination.'}</p>
      <p className="mt-2 text-[10px] text-slate-400">{az
        ? 'Döndərmək üçün sürükləyin, yaxınlaşdırmaq üçün təkəri çevirin. Mavi nöqtə: sxematik soyuq tələ. S/C1 mövqeləri və ölçülər sxematikdir.'
        : 'Drag to orbit · Scroll to zoom. Blue marker: illustrative cold trap. S/C1 positions and dimensions are illustrative.'}</p>
      {/* Interactive Controls */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <label className="flex items-center justify-between text-xs font-medium text-slate-200">
            <span>
              {az
                ? 'Nümayiş azimutunu dəyişin (0°–360°; tarix proqnozu deyil)'
                : 'Drag Sun around 360° Polar Horizon (drag 3D crater to rotate)'}
            </span>
            <span className="font-mono text-sky-300">{Math.round(solarAzimuthDeg)}°</span>
          </label>
          <input
            type="range"
            aria-label={az ? 'Təlim Günəş azimutu' : 'Training Sun azimuth'}
            min={0}
            max={360}
            value={Math.round(solarAzimuthDeg)}
            onChange={(e) => {
              setAutoRotateSun(false);
              setSolarAzimuthDeg(Number(e.target.value));
            }}
            className="mt-1 w-full accent-amber-300"
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
      <details className="mt-3 border-t border-sky-300/15 pt-2">
        <summary className="cursor-pointer text-xs font-medium text-sky-200">{az ? 'İllüstrasiya məhdudiyyətləri və model qeydləri' : 'Illustration limits & model notes'}</summary>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">
        {az
          ? `Relyef, rənglər və markerlər sxematikdir; LOLA hündürlük və ya Diviner temperatur xəritəsi yüklənməyib. İndeks modelində müşahidəçi hündürlüyü ×${TERRAIN_PROVENANCE.mastHeightExaggeration} şişirdilib; göstərilən dirək və relyef miqyaslı deyil. Baza və kəsik kənarlar təqdimat üçündür. Faizlər cari azimut üçün görünmə indeksidir, illik işıqlanma və ya enerji proqnozu deyil. S/C1 markerləri tədqiqat koordinatları deyil.`
          : `Terrain, colors and markers are illustrative; no LOLA elevation or Diviner temperature map is loaded. The index model exaggerates observer height ×${TERRAIN_PROVENANCE.mastHeightExaggeration}; the displayed mast and relief are not to scale. The base and cut edges are display geometry. Percentages are a visibility index at this azimuth, not annual illumination or a power prediction. S/C1 markers are not mapped study coordinates.`}
      </p>

      </details>
    </div>
  );
}
