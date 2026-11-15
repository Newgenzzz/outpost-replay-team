/** Two rows from Gläser et al. (2018), Table 2, NASA NTRS 20170007365. */
export const LUNAR_SITE_SOURCE = {
  url: 'https://ntrs.nasa.gov/citations/20170007365',
  panelHeightMeters: 2,
  startYear: 2017,
  endYear: 2037,
};

export const LUNAR_PLANNING_SITES = [
  {
    id: 'shackleton-s',
    name: { en: 'Shackleton rim (S)', az: 'Şeklton kənarı (S)' },
    latitudeDeg: -89.6866,
    longitudeDeg: 197.19,
    meanIlluminationPct: 85.5,
    longestShadowHours: 66,
  },
  {
    id: 'connecting-ridge-c1',
    name: { en: 'Connecting Ridge (C1)', az: 'Birləşdirici silsilə (C1)' },
    latitudeDeg: -89.4398,
    longitudeDeg: 222.83,
    meanIlluminationPct: 88.0,
    longestShadowHours: 112,
  },
] as const;
