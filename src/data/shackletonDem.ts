/**
 * NASA LRO LOLA Shackleton Crater Rim Digital Elevation Model (Parameterized Polar Grid)
 *
 * Grounded in published Lunar Reconnaissance Orbiter (LRO) Lunar Orbiter Laser Altimeter (LOLA)
 * and Diviner Lunar Radiometer measurements of Shackleton Crater (89.9° S):
 * - Rim-to-rim diameter: ~21 km, interior depth: ~4.2 km, inner wall slope: ~30.5° (Zuber et al. 2012, Nature 486)
 * - Permanently Shadowed Region (PSR) floor temperature: ~40–90 K (Paige et al. 2010, Science 330)
 * - Rim illumination study points S (-89.69°, 197.2°E) and C1 (-89.44°, 222.8°E) (Gläser et al. 2018; Mazarico et al. 2011)
 */

export interface ShackletonSiteMarker {
  id: 'S' | 'C1' | 'PSR';
  labelEn: string;
  labelAz: string;
  /** Normalized DEM coordinates in [-1, 1] across a 36 km × 36 km polar patch */
  nx: number;
  nz: number;
  tempK: number;
}

/** 36 km × 36 km South Polar patch centered on Shackleton Crater */
export const PATCH_WIDTH_KM = 36;
export const CRATER_RADIUS_KM = 10.5;
export const CRATER_DEPTH_KM = 4.2;

export const SHACKLETON_MARKERS: ShackletonSiteMarker[] = [
  {
    id: 'S',
    labelEn: 'Outpost Site S (Rim Crest · 86% Sun)',
    labelAz: 'Baza Nöqtəsi S (Kənar Zirvə · 86% Günəş)',
    nx: -0.295,
    nz: -0.505,
    tempK: 198,
  },
  {
    id: 'C1',
    labelEn: 'Connecting Ridge C1 (89.7% Sun)',
    labelAz: 'Birləşdirici Silsilə C1 (89,7% Günəş)',
    nx: 0.43,
    nz: -0.45,
    tempK: 204,
  },
  {
    id: 'PSR',
    labelEn: 'Shackleton Cold-Trap Floor (88 K · Water Ice)',
    labelAz: 'Şeklton Soyuq Tələ Dibi (88 K · Su Buzu)',
    nx: 0.0,
    nz: 0.0,
    tempK: 88,
  },
];

/**
 * Computes elevation in kilometers relative to mean south-polar datum at normalized coords (nx, nz) in [-1, 1].
 */
export function sampleShackletonElevationKm(nx: number, nz: number): number {
  const xKm = nx * (PATCH_WIDTH_KM * 0.5);
  const zKm = nz * (PATCH_WIDTH_KM * 0.5);
  const rKm = Math.hypot(xKm, zKm);
  const theta = Math.atan2(zKm, xKm);

  // Flat-bottomed bowl + steep 30.5 deg inner walls + raised ejecta rim collar
  const floorRadiusKm = 3.6;
  let elevKm = 0;

  if (rKm < floorRadiusKm) {
    // Subtle central mound (~180 m) inside 4.2 km deep cold trap (Zuber et al. 2012)
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
  // Exaggerate local micro-crest relief slightly at meter scale to mirror LOLA 5m DEM horizon masking
  const effectiveHeightKm = (mastHeightMeters / 1000) * 14;
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

  // Lunar South Pole seasonal summer solar elevation ~1.55 deg, solar disk angular diameter ~0.53 deg
  const solarElevationDeg = 1.55;
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
