import { BufferGeometry, Float32BufferAttribute, Color } from 'three';
import {
  computeRimIllumination,
  sampleShackletonElevationKm,
} from '../data/shackletonDem';

export interface HorizonDiagramData {
  illuminatedPct: number;
  blockingRidgeDeg: number;
  solarElevationDeg: number;
  visibility: 'hidden' | 'partial' | 'clear';
  sunCenterY: number;
  sunRadius: number;
  horizonY: number;
}

/**
 * A separate angular-index diagram, NOT a ray projected onto the artistic 3D relief.
 * The horizon cuts the disk's vertical diameter by the model's rounded visibility proxy.
 * Neither the disk area nor the distance to the ridge is being calculated here.
 * Keeping the disk fixed makes the observer-height comparison a controlled illustration.
 */
export function computeHorizonDiagram(
  solarAzimuthDeg: number,
  mastHeightMeters: 2 | 10,
  siteId: 'S' | 'C1' = 'S',
): HorizonDiagramData {
  const sample = computeRimIllumination(solarAzimuthDeg, mastHeightMeters, siteId);
  const sunCenterY = 44;
  const sunRadius = 18;
  return {
    illuminatedPct: sample.illuminatedPct,
    blockingRidgeDeg: sample.blockingRidgeDeg,
    solarElevationDeg: sample.solarElevationDeg,
    visibility: sample.illuminatedPct === 0 ? 'hidden' : sample.illuminatedPct === 100 ? 'clear' : 'partial',
    sunCenterY,
    sunRadius,
    horizonY: sunCenterY - sunRadius + 2 * sunRadius * sample.illuminatedPct / 100,
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
