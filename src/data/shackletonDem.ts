/**
 * Procedural teaching terrain inspired by Shackleton's bowl shape, NOT a NASA LOLA DEM.
 * No elevation raster, geodetic datum, measured temperatures or mapped study coordinates
 * are used. Peaks, mound, roughness and marker positions are authored approximations.
 * Real LOLA-derived study values are kept separately in lunarSiteIntelligence.ts.
 */

export interface ShackletonSiteMarker {
  id: 'S' | 'C1' | 'PSR';
  labelEn: string;
  labelAz: string;
  /** Arbitrary normalized illustration coordinates; not georeferenced. */
  nx: number;
  nz: number;
}

/** Illustration dimensions only. The retained 4.2 km bowl parameter is not a measured DEM. */
export const PATCH_WIDTH_KM = 36;
export const CRATER_RADIUS_KM = 10.5;
export const CRATER_DEPTH_KM = 4.2;
export const TERRAIN_PROVENANCE = {
  kind: 'educational-procedural',
  georeferenced: false,
  mastHeightExaggeration: 14,
  fixedSolarElevationDeg: 1.55,
} as const;

export const SHACKLETON_MARKERS: ShackletonSiteMarker[] = [
  {
    id: 'S',
    labelEn: 'Demo S · illustrative rim',
    labelAz: 'Demo S · sxematik kənar',
    nx: -0.295,
    nz: -0.505,
  },
  {
    id: 'C1',
    labelEn: 'Demo C1 · illustrative ridge',
    labelAz: 'Demo C1 · sxematik silsilə',
    nx: 0.43,
    nz: -0.45,
  },
  {
    id: 'PSR',
    labelEn: 'Illustrative cold trap',
    labelAz: 'Sxematik soyuq tələ',
    nx: 0.0,
    nz: 0.0,
  },
];

/**
 * Computes synthetic elevation in illustration kilometers relative to an arbitrary zero.
 */
export function sampleShackletonElevationKm(nx: number, nz: number): number {
  const xKm = nx * (PATCH_WIDTH_KM * 0.5);
  const zKm = nz * (PATCH_WIDTH_KM * 0.5);
  const rKm = Math.hypot(xKm, zKm);
  const theta = Math.atan2(zKm, xKm);

  // Authored bowl and raised rim, not fitted to measured slopes.
  const floorRadiusKm = 3.6;
  let elevKm = 0;

  if (rKm < floorRadiusKm) {
    // Authored central mound; not a reconstruction of a measured feature.
    const mound = 0.18 * Math.exp(-((rKm / 1.5) ** 2));
    elevKm = -3.35 + mound;
  } else if (rKm <= CRATER_RADIUS_KM) {
    const t = (rKm - floorRadiusKm) / (CRATER_RADIUS_KM - floorRadiusKm);
    // Smooth S-curve wall rising from -3.35 km floor to +0.85 km rim crest (total 4.2 km depth!)
    const wall = t * t * (3 - 2 * t);
    elevKm = -3.35 + 4.2 * wall;
  } else {
    // Ejecta blanket tapering outward from rim crest
    const distPastRim = rKm - CRATER_RADIUS_KM;
    elevKm = 0.85 * Math.exp(-distPastRim / 5.2);
  }

  // Asymmetric rim peaks & Connecting Ridge (C1 / Malapert-facing saddle & blocking ridge lobes)
  const rimBand = Math.exp(-(((rKm - CRATER_RADIUS_KM) / 2.6) ** 2));
  const peakA = 0.42 * rimBand * Math.cos(theta * 3 + 0.9);
  const peakB = 0.28 * rimBand * Math.sin(theta * 5 - 0.4);

  // Connecting ridge extending toward C1 (+x, -z quadrant)
  const ridgeDist = Math.abs(nx * 0.68 + nz * 0.73);
  const ridgeExtent = nx > 0.12 && nz < -0.12 ? Math.exp(-((ridgeDist / 0.18) ** 2)) * 0.62 : 0;

  // Secondary satellite craters on outer flanks
  const sat1 = -0.55 * Math.exp(-(((nx + 0.68) ** 2 + (nz - 0.52) ** 2) / 0.018));
  const sat2 = -0.42 * Math.exp(-(((nx - 0.62) ** 2 + (nz + 0.58) ** 2) / 0.014));
  const microRoughness = 0.045 * Math.sin(nx * 21) * Math.cos(nz * 19);

  return elevKm + peakA + peakB + ridgeExtent + sat1 + sat2 + microRoughness;
}

export interface HorizonIlluminationSample {
  illuminatedPct: number;
  solarElevationDeg: number;
  blockingRidgeDeg: number;
  inShadow: boolean;
}

/**
 * Raymarches across the Shackleton rim terrain toward solarAzimuthDeg at 1.55° grazing polar solar elevation
 * to show why raising solar panels from 2 m to a 10 m vertical mast dramatically reduces local ridge shadowing.
 */
export function computeRimIllumination(
  solarAzimuthDeg: number,
  mastHeightMeters: number,
  siteId: 'S' | 'C1' = 'S',
): HorizonIlluminationSample {
  const site = SHACKLETON_MARKERS.find((m) => m.id === siteId) ?? SHACKLETON_MARKERS[0];
  const baseElevKm = sampleShackletonElevationKm(site.nx, site.nz);
  // Deliberate x14 height exaggeration for the teaching contrast, not a real 2 m/10 m prediction.
  const effectiveHeightKm = (mastHeightMeters / 1000) * TERRAIN_PROVENANCE.mastHeightExaggeration;
  const observerElevKm = baseElevKm + effectiveHeightKm;

  const rad = (solarAzimuthDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dz = Math.sin(rad);

  let maxHorizonAngleDeg = -5;
  for (let step = 1; step <= 34; step++) {
    const distKm = step * 0.45;
    const sx = site.nx + (dx * distKm) / (PATCH_WIDTH_KM * 0.5);
    const sz = site.nz + (dz * distKm) / (PATCH_WIDTH_KM * 0.5);
    if (Math.abs(sx) > 1.05 || Math.abs(sz) > 1.05) break;
    const terrainKm = sampleShackletonElevationKm(sx, sz);
    const angleDeg = (Math.atan2(terrainKm - observerElevKm, distKm) * 180) / Math.PI;
    if (angleDeg > maxHorizonAngleDeg) {
      maxHorizonAngleDeg = angleDeg;
    }
  }

  // Fixed teaching angle and linear limb-height proxy (not a solar-disk area calculation).
  const solarElevationDeg = TERRAIN_PROVENANCE.fixedSolarElevationDeg;
  const halfDisk = 0.265;
  const topLimb = solarElevationDeg + halfDisk;
  const bottomLimb = solarElevationDeg - halfDisk;

  let visibleFraction = 1;
  if (maxHorizonAngleDeg >= topLimb) {
    visibleFraction = 0;
  } else if (maxHorizonAngleDeg > bottomLimb) {
    visibleFraction = (topLimb - maxHorizonAngleDeg) / (2 * halfDisk);
  }

  return {
    illuminatedPct: Math.round(visibleFraction * 100),
    solarElevationDeg,
    blockingRidgeDeg: Math.round(maxHorizonAngleDeg * 100) / 100,
    inShadow: visibleFraction < 0.35,
  };
}
