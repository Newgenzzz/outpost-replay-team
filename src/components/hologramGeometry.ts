import { BufferGeometry, Float32BufferAttribute, Color } from 'three';
import {
  PATCH_WIDTH_KM,
  SHACKLETON_MARKERS,
  TERRAIN_PROVENANCE,
  computeRimIllumination,
  sampleShackletonElevationKm,
} from '../data/shackletonDem';

export interface SightlineGeometryData {
  siteWorld: [number, number, number];
  collectorWorld: [number, number, number];
  altCollectorWorld: [number, number, number];
  ridgeWorld: [number, number, number];
  rayOverRidgeWorld: [number, number, number];
  sunOrbWorld: [number, number, number];
  illuminatedPct: number;
  blockingRidgeDeg: number;
  solarElevationDeg: number;
  topLimbDeg: number;
  inShadow: boolean;
  isBlocked: boolean;
}

/**
 * Computes deterministic 3D world coordinates for the illustrative solar sightline ray,
 * the highest obstructing ridge point along the current azimuth, and the alternate mast height.
 * Display coordinates only; illumination percentages come unmodified from computeRimIllumination.
 */
export function computeSightlineGeometry(
  solarAzimuthDeg: number,
  mastHeightMeters: 2 | 10,
  siteId: 'S' | 'C1' = 'S',
): SightlineGeometryData {
  const site = SHACKLETON_MARKERS.find((m) => m.id === siteId) ?? SHACKLETON_MARKERS[0];
  const illum = computeRimIllumination(solarAzimuthDeg, mastHeightMeters, siteId);

  const baseElevKm = sampleShackletonElevationKm(site.nx, site.nz);
  const effectiveHeightKm = (mastHeightMeters / 1000) * TERRAIN_PROVENANCE.mastHeightExaggeration;
  const observerElevKm = baseElevKm + effectiveHeightKm;

  const rad = (solarAzimuthDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dz = Math.sin(rad);

  let maxHorizonAngleDeg = -90;
  let blockerNx = site.nx + dx * 0.18;
  let blockerNz = site.nz + dz * 0.18;

  for (let step = 1; step <= 34; step++) {
    const distKm = step * 0.45;
    const sx = site.nx + (dx * distKm) / (PATCH_WIDTH_KM * 0.5);
    const sz = site.nz + (dz * distKm) / (PATCH_WIDTH_KM * 0.5);
    if (Math.abs(sx) > 1.05 || Math.abs(sz) > 1.05) break;
    const terrainKm = sampleShackletonElevationKm(sx, sz);
    const angleDeg = (Math.atan2(terrainKm - observerElevKm, distKm) * 180) / Math.PI;
    if (angleDeg > maxHorizonAngleDeg) {
      maxHorizonAngleDeg = angleDeg;
      const radial = Math.hypot(sx, sz);
      const clampScale = radial > 0.95 ? 0.95 / radial : 1;
      blockerNx = sx * clampScale;
      blockerNz = sz * clampScale;
    }
  }

  const siteWorldX = site.nx * 6;
  const siteWorldZ = site.nz * 6;
  const siteWorldY = baseElevKm * 0.52;

  const mastWorldHeight = mastHeightMeters === 10 ? 0.62 : 0.14;
  const altMastWorldHeight = mastHeightMeters === 10 ? 0.14 : 0.62;

  const collectorWorld: [number, number, number] = [
    siteWorldX,
    siteWorldY + mastWorldHeight,
    siteWorldZ,
  ];
  const altCollectorWorld: [number, number, number] = [
    siteWorldX,
    siteWorldY + altMastWorldHeight,
    siteWorldZ,
  ];

  const ridgeWorldX = blockerNx * 6;
  const ridgeWorldZ = blockerNz * 6;
  const ridgeWorldY = sampleShackletonElevationKm(blockerNx, blockerNz) * 0.52 + 0.035;
  const ridgeWorld: [number, number, number] = [ridgeWorldX, ridgeWorldY, ridgeWorldZ];

  const sunDist = 14;
  const sunOrbWorld: [number, number, number] = [
    dx * sunDist * 0.58,
    1.45 * 0.86,
    dz * sunDist * 0.58,
  ];

  const distToRidge = Math.hypot(ridgeWorldX - siteWorldX, ridgeWorldZ - siteWorldZ);
  const distToSun = Math.hypot(sunOrbWorld[0] - siteWorldX, sunOrbWorld[2] - siteWorldZ);
  const t = Math.min(0.88, Math.max(0.06, distToRidge / Math.max(0.001, distToSun)));

  const linearRayY = collectorWorld[1] + (sunOrbWorld[1] - collectorWorld[1]) * t;
  const isBlocked = illum.illuminatedPct < 100;
  const rayOverRidgeY = isBlocked
    ? ridgeWorldY
    : Math.max(ridgeWorldY + 0.16, linearRayY);

  return {
    siteWorld: [siteWorldX, siteWorldY, siteWorldZ],
    collectorWorld,
    altCollectorWorld,
    ridgeWorld,
    rayOverRidgeWorld: [ridgeWorldX, rayOverRidgeY, ridgeWorldZ],
    sunOrbWorld,
    illuminatedPct: illum.illuminatedPct,
    blockingRidgeDeg: illum.blockingRidgeDeg,
    solarElevationDeg: illum.solarElevationDeg,
    topLimbDeg: Math.round((illum.solarElevationDeg + 0.265) * 100) / 100,
    inShadow: illum.inShadow,
    isBlocked,
  };
}

/** Deterministic polar starfield backdrop geometry for the 3D hologram dome. */
export function buildPolarStarfield(count = 160): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const warm = new Color('#fef3c7');
  const cool = new Color('#bae6fd');
  const neutral = new Color('#e2e8f0');
  const c = new Color();

  for (let i = 0; i < count; i++) {
    // Golden-angle spiral on upper celestial dome for deterministic, clump-free distribution
    const u = (i + 0.5) / count;
    const theta = i * 2.399963229728653;
    const phi = Math.acos(1 - u * 0.78); // stay above horizon plane
    const radius = 15.5 + (i % 5) * 0.9;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi) - 1.2;
    const z = radius * Math.sin(phi) * Math.sin(theta);
    positions.push(x, y, z);

    const tint = i % 3 === 0 ? cool : i % 5 === 0 ? warm : neutral;
    const brightness = 0.65 + ((i * 7) % 10) * 0.035;
    c.copy(tint).multiplyScalar(brightness);
    colors.push(c.r, c.g, c.b);
  }

  const stars = new BufferGeometry();
  stars.setAttribute('position', new Float32BufferAttribute(positions, 3));
  stars.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return stars;
}


/** Authored circular display crop of the existing procedural relief, not a NASA DEM. */
export function buildHologramRelief() {
  const sectors = 96;
  const rings = 56;
  const positions: number[] = [0, sampleShackletonElevationKm(0, 0) * 0.52, 0];
  const indices: number[] = [];
  for (let ring = 1; ring <= rings; ring++) {
    const radius = 6 * ring / rings;
    for (let sector = 0; sector < sectors; sector++) {
      const angle = sector * Math.PI * 2 / sectors;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push(x, sampleShackletonElevationKm(x / 6, z / 6) * 0.52, z);
      const current = 1 + (ring - 1) * sectors + sector;
      const next = 1 + (ring - 1) * sectors + (sector + 1) % sectors;
      if (ring === 1) indices.push(0, next, current);
      else {
        const inner = current - sectors;
        const innerNext = next - sectors;
        indices.push(inner, next, current, inner, innerNext, next);
      }
    }
  }
  const terrain = new BufferGeometry();
  terrain.setAttribute('position', new Float32BufferAttribute(positions, 3));
  terrain.setIndex(indices);
  terrain.computeVertexNormals();
  const colors: number[] = [];
  const color = new Color();
  const floor = new Color('#405969');
  const wall = new Color('#8b9598');
  const rim = new Color('#d5cbb4');
  const apron = new Color('#79888d');
  const normals = terrain.getAttribute('normal');
  for (let i = 0; i < positions.length / 3; i++) {
    const [x, y, z] = positions.slice(i * 3, i * 3 + 3);
    const elevation = y / 0.52;
    if (elevation < -0.5) color.copy(floor).lerp(wall, Math.max(0, Math.min(1, (elevation + 3.35) / 2.85)));
    else color.copy(apron).lerp(rim, Math.max(0, Math.min(1, (elevation + 0.1) / 1.5)));
    // Deterministic mineral variation and slope shading, purely artistic albedo.
    const grain = Math.sin(x * 37 + z * 19) * Math.cos(z * 31 - x * 11);
    const strata = Math.sin(elevation * 19 + Math.sin(x * 2)) * 0.025;
    color.multiplyScalar(0.9 + normals.getY(i) * 0.1 + grain * 0.055 + strata);
    colors.push(color.r, color.g, color.b);
  }
  terrain.setAttribute('color', new Float32BufferAttribute(colors, 3));

  const edgePositions: number[] = [];
  const edgeIndices: number[] = [];
  for (let i = 0; i <= sectors; i++) {
    const angle = (i % sectors) * Math.PI * 2 / sectors;
    const x = Math.cos(angle) * 6;
    const z = Math.sin(angle) * 6;
    edgePositions.push(x, sampleShackletonElevationKm(x / 6, z / 6) * 0.52, z, x, -2.2, z);
    if (i < sectors) {
      const n = i * 2;
      edgeIndices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  const skirt = new BufferGeometry();
  skirt.setAttribute('position', new Float32BufferAttribute(edgePositions, 3));
  skirt.setIndex(edgeIndices);
  skirt.computeVertexNormals();
  return { terrain, skirt };
}
