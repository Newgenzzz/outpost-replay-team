import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { renderCounter } from '../utils/renderDiagnostics';
import { hologramFrameLoop } from '../utils/renderPolicy';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Compass, Pause, Play, ArrowUpFromLine, Sun } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  SHACKLETON_MARKERS,
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
  az: boolean;
}

function ShackletonScene({
  solarAzimuthDeg,
  mastHeightMeters,
  activeSite,
  autoRotateSun,
  onTickAzimuth,
  az,
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

  const geometry = useMemo(() => {
    const segs = 84;
    const size = 12;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const nx = x / (size * 0.5);
      const nz = z / (size * 0.5);
      const elevKm = sampleShackletonElevationKm(nx, nz);
      // Vertical exaggeration 0.52 world-units per km for crisp 3D relief
      const y = elevKm * 0.52;
      pos.setY(i, y);

      // Artistic colors by synthetic elevation; not Diviner temperature or ice measurements.
      if (elevKm < -2.6) {
        // Illustrative cold-trap floor.
        color.setRGB(0.11, 0.34, 0.52);
      } else if (elevKm < -0.5) {
        // Steep inner crater walls — dark lunar basalt
        const t = (elevKm + 2.6) / 2.1;
        color.setRGB(0.16 + t * 0.22, 0.20 + t * 0.22, 0.28 + t * 0.20);
      } else if (elevKm < 0.75) {
        // Regolith plains & ejecta apron
        const t = (elevKm + 0.5) / 1.25;
        color.setRGB(0.42 + t * 0.22, 0.45 + t * 0.22, 0.49 + t * 0.20);
      } else {
        // Bright illustrative rim crests; continuous light is not guaranteed.
        color.setRGB(0.84, 0.85, 0.80);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // This geometry is created outside Fiber's declarative resource tree; we own its disposal.
  useEffect(() => () => geometry.dispose(), [geometry]);

  const sunRad = (solarAzimuthDeg * Math.PI) / 180;
  // Grazing polar sun ~4.5 deg visual angle in exaggerated scene coordinates
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
      <ambientLight intensity={0.22} color="#6088b8" />
      <directionalLight
        position={[sunX, sunY, sunZ]}
        intensity={2.7}
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
        shadow-bias={-0.0015}
      />

      {/* Grazing Polar Sun Orb */}
      <mesh position={[sunX * 0.58, sunY * 0.62, sunZ * 0.58]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>

      {/* Procedural crater teaching terrain */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      {/* Holographic Polar Coordinate Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.85, 0]}>
        <ringGeometry args={[5.85, 5.92, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

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
            <Html center distanceFactor={13} style={{ pointerEvents: 'none' }}>
              <div
                className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow-lg backdrop-blur-sm ${
                  isPsr
                    ? 'border-cyan-400/50 bg-cyan-950/85 text-cyan-200'
                    : isSelected
                    ? 'border-amber-300/70 bg-slate-950/90 text-amber-200'
                    : 'border-white/20 bg-slate-950/75 text-slate-200'
                }`}
              >
                {m.id === 'PSR' ? (az ? m.labelAz : m.labelEn) : `Demo ${m.id}`}
              </div>
            </Html>
          </group>
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={5.5}
        maxDistance={13.5}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI / 2.15}
      />
    </>
  );
}

export function Shackleton3DHologram({ compact = false, active = true }: { compact?: boolean; active?: boolean }) {
  const { lang } = useI18n();
  const az = lang === 'az';
  const [solarAzimuthDeg, setSolarAzimuthDeg] = useState(128);
  const [mastHeightMeters, setMastHeightMeters] = useState<2 | 10>(10);
  const [activeSite, setActiveSite] = useState<'S' | 'C1'>('S');
  const [autoRotateSun, setAutoRotateSun] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => { if (preference.matches) setAutoRotateSun(false); };
    preference.addEventListener('change', changed);
    return () => preference.removeEventListener('change', changed);
  }, []);

  const illum10m = computeRimIllumination(solarAzimuthDeg, 10, activeSite);
  const illum2m = computeRimIllumination(solarAzimuthDeg, 2, activeSite);
  const currentIllum = mastHeightMeters === 10 ? illum10m : illum2m;

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
            className="inline-flex items-center gap-1 rounded-lg border border-sky-300/35 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
          >
            {autoRotateSun ? <Pause size={12} /> : <Play size={12} />}
            {autoRotateSun ? (az ? 'Fırlanmanı Saxla' : 'Pause Orbit') : (az ? '360° Günəş' : '360° Sun')}
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

      <p className="mb-3 text-xs leading-relaxed text-slate-300">
        {az
          ? `Relyef, rənglər və markerlər sxematikdir; LOLA hündürlük və ya Diviner temperatur xəritəsi yüklənməyib. Dirəyin hündürlük təsiri ×${TERRAIN_PROVENANCE.mastHeightExaggeration} şişirdilib; səhnə miqyaslı deyil. Faizlər cari azimut üçün görünmə indeksidir, illik işıqlanma və ya enerji proqnozu deyil. S/C1 markerləri tədqiqat koordinatları deyil.`
          : `Terrain, colors and markers are illustrative; no LOLA elevation or Diviner temperature map is loaded. The mast-height effect is exaggerated ×${TERRAIN_PROVENANCE.mastHeightExaggeration}; the scene is not to scale. Percentages are a visibility index at this azimuth, not annual illumination or a power prediction. S/C1 markers are not mapped study coordinates.`}
      </p>

      {/* 3D WebGL Canvas */}
      <div className={`${compact ? 'h-56' : 'h-72'} relative w-full overflow-hidden rounded-xl border border-sky-300/20 bg-gradient-to-b from-[#02060d] to-[#081826]`}>
        <WebGLErrorBoundary fallback={fallback2D}>
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            frameloop={hologramFrameLoop(active, autoRotateSun)}
            dpr={[1, 1.5]}
            fallback={fallback2D}
            camera={{ position: [0, 6.2, 8.8], fov: 42 }}
            gl={{ antialias: true, powerPreference: 'default' }}
          >
            <ShackletonScene
              solarAzimuthDeg={solarAzimuthDeg}
              mastHeightMeters={mastHeightMeters}
              activeSite={activeSite}
              autoRotateSun={autoRotateSun}
              onTickAzimuth={setSolarAzimuthDeg}
              az={az}
            />
          </Canvas>
        </WebGLErrorBoundary>

        {/* Live Telemetry Overlay */}
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/15 bg-slate-950/80 px-3 py-1.5 text-[11px] backdrop-blur-md">
          <span className="flex items-center gap-1.5 font-mono text-amber-200">
            <Sun size={13} className="text-amber-300" />
            {az ? 'Günəş Azimutu' : 'Sun Azimuth'}: {Math.round(solarAzimuthDeg)}° (1.55° {az ? 'hündürlük' : 'elev'})
          </span>
          <span className="font-mono font-semibold text-white">
            2 m: <strong className={illum2m.inShadow ? 'text-rose-300' : 'text-emerald-300'}>{illum2m.illuminatedPct}%</strong>
            {' · '}
            10 m: <strong className={illum10m.inShadow ? 'text-amber-300' : 'text-emerald-300'}>{illum10m.illuminatedPct}%</strong>
            {' '}
            {az ? 'sxematik indeks' : 'illustrative index'}
          </span>
        </div>
      </div>

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
    </div>
  );
}
