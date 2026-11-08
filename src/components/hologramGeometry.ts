import { BufferGeometry, Float32BufferAttribute, Color } from 'three';
import { sampleShackletonElevationKm } from '../data/shackletonDem';

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
