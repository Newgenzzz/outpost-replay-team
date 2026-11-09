import { Component, type ReactNode, type ElementRef, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { renderCounter } from '../utils/renderDiagnostics';
import { hologramFrameLoop } from '../utils/renderPolicy';
import { buildHologramRelief } from './hologramGeometry';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Compass, Pause, Play, ArrowUpFromLine, Sun, RotateCcw } from 'lucide-react';
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
}

function ShackletonScene({
  solarAzimuthDeg,
  mastHeightMeters,
  activeSite,
  autoRotateSun,
  onTickAzimuth,
  viewReset,
}: TerrainMeshProps) {
  const azimuthRef = useRef(solarAzimuthDeg);
  const gl = useThree(state => state.gl);
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
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  useEffect(() => { controls.current?.saveState(); }, []);
  useEffect(() => { if (viewReset) controls.current?.reset(); }, [viewReset]);
  useEffect(() => () => { geometry.dispose(); skirt.dispose(); }, [geometry, skirt]);

  const sunRad = (solarAzimuthDeg * Math.PI) / 180;
  // Artistic grazing light in exaggerated scene coordinates, separate from the 1.55° index model.
  const sunDist = 14;
  const sunX = Math.cos(sunRad) * sunDist;
  const sunZ = Math.sin(sunRad) * sunDist;
  const sunY = 1.45;

  const siteMarker = SHACKLETON_MARKERS.find((m) => m.id === activeSite) ?? SHACKLETON_MARKERS[0];
  const siteWorldX = siteMarker.nx * 6;
  const siteWorldZ = siteMarker.nz * 6;
  const siteWorldY = sampleShackletonElevationKm(siteMarker.nx, siteMarker.nz) * 0.52;
  const mastWorldHeight = mastHeightMeters === 10 ? 0.62 : 0.14;

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

      {/* Grazing Polar Sun Orb */}
      <mesh position={[sunX * 0.58, sunY * 0.62, sunZ * 0.58]}>
        <sphereGeometry args={[0.19, 16, 16]} />
        <meshBasicMaterial color="#fff1bd" />
      </mesh>

      {/* Procedural crater teaching terrain */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.96}
          metalness={0.02}
        />
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

      {/* Active Outpost Solar Mast / Deck Array */}
      <group position={[siteWorldX, siteWorldY, siteWorldZ]}>
        {/* Mast pole */}
        <mesh position={[0, mastWorldHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, mastWorldHeight, 10]} />
          <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.45} />
        </mesh>
        {/* Solar wing */}
        <mesh position={[0, mastWorldHeight, 0]} rotation={[0, -sunRad, 0]} castShadow>
          <boxGeometry args={[0.05, mastHeightMeters === 10 ? 0.34 : 0.14, 0.38]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.55} />
        </mesh>
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
        minDistance={8}
        maxDistance={21}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI / 2.15}
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
            />
          </Canvas>
        </WebGLErrorBoundary>

        <div className="pointer-events-none absolute left-3 top-3 border-l-2 border-sky-300/60 pl-2 font-mono text-[9px] uppercase tracking-widest text-sky-200/75">
          {az ? 'RELYEF LABORATORİYASI' : 'RELIEF LAB'} · {az ? 'SXEMATİK' : 'ILLUSTRATIVE'}
        </div>
        <button type="button" onClick={() => setViewReset(value => value + 1)}
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-sky-300/25 bg-slate-950/80 px-2 py-1 text-[10px] text-sky-100 hover:bg-sky-900 focus-visible:outline-2 focus-visible:outline-sky-300">
          <RotateCcw size={11} />{az ? 'Görünüşü sıfırla' : 'Reset view'}
        </button>
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
