import type { SvgAsset } from './art';
import type { CrewSuitId } from './character';
import type { Bilingual, Lang } from '../types';

export interface Point {
  x: number;
  y: number;
}

export type Facing = 'up' | 'down' | 'left' | 'right';
export type ElevationTier = 'high_ridge' | 'base_plateau' | 'sunken_crater';

export const WORLD = {
  width: 1840,
  height: 1120,
  speed: 205,
  roverSpeed: 335,
  spawn: { x: 895, y: 555 },
  roverSpawn: { x: 1055, y: 635 },
} as const;

export interface BuildingPlacement {
  id: string;
  artKey: string;
  x: number;
  y: number;
  stationStep?: number;
}

export const BUILDINGS: readonly BuildingPlacement[] = [
  { id: 'solar', artKey: 'solar', x: 340, y: 345, stationStep: 1 },
  { id: 'terminal_d1', artKey: 'terminal', x: 475, y: 395, stationStep: 1 },
  { id: 'battery', artKey: 'battery', x: 585, y: 345, stationStep: 1 },
  { id: 'habitat', artKey: 'habitat', x: 895, y: 365, stationStep: 2 },
  { id: 'lifeSupport', artKey: 'lifeSupport', x: 1085, y: 405, stationStep: 2 },
  { id: 'water', artKey: 'water', x: 425, y: 745, stationStep: 3 },
  { id: 'iceProcessor', artKey: 'ice-processor', x: 1145, y: 775, stationStep: 4 },
  { id: 'shelter', artKey: 'shelter', x: 795, y: 865, stationStep: 5 },
  { id: 'greenhouse', artKey: 'greenhouse', x: 1290, y: 435, stationStep: 6 },
  { id: 'ascent', artKey: 'ascent', x: 1545, y: 445, stationStep: 6 },
] as const;

export const ROCKS = [
  { x: 165, y: 615, scale: 0.85 },
  { x: 245, y: 215, scale: 0.72 },
  { x: 1715, y: 365, scale: 1.05 },
  { x: 1675, y: 895, scale: 0.85 },
  { x: 295, y: 975, scale: 0.75 },
  { x: 965, y: 995, scale: 0.7 },
] as const;

export const IMPACT_CRATERS = [
  { x: 195, y: 795, radius: 118 },
  { x: 1685, y: 225, radius: 96 },
  { x: 1085, y: 215, radius: 58 },
  { x: 615, y: 985, radius: 72 },
  { x: 145, y: 285, radius: 52 },
  { x: 1725, y: 535, radius: 46 },
] as const;

/** A training abstraction for traversing loose regolith on crater slopes. */
export function terrainTraction(position: Point): number {
  return IMPACT_CRATERS.some(({ x, y, radius }) =>
    Math.hypot(position.x - x, (position.y - y) / 0.53) < radius,
  ) ? 0.56 : 1;
}

export const ICE_DEPOSITS: Point[] = [
  { x: 1235, y: 805 },
  { x: 1365, y: 760 },
  { x: 1505, y: 815 },
  { x: 1315, y: 925 },
  { x: 1475, y: 940 },
];

export interface FieldSampleNode {
  id: string;
  name: Bilingual;
  instrument: Bilingual;
  locationName: Bilingual;
  x: number;
  y: number;
  elevation: ElevationTier;
  scienceBonus: number;
  icon: string;
  description: Bilingual;
  nasaContext: Bilingual;
  sourceUrl: string;
}

export const FIELD_SAMPLES: readonly FieldSampleNode[] = [
  {
    id: 'sample_lola',
    name: { en: 'Laser Altimetry Marker', az: 'Lazer Altimetriyası Nişanı' },
    instrument: { en: 'LRO LOLA (Lunar Orbiter Laser Altimeter)', az: 'LRO LOLA (Ay Orbit Lazer Altimetri)' },
    locationName: { en: 'Shackleton Peak Crest (Elev +2)', az: 'Şeklton Zirvəsi (Hünd. +2)' },
    x: 285,
    y: 335,
    elevation: 'high_ridge',
    scienceBonus: 4,
    icon: '📡',
    description: {
      en: 'This training marker represents a surveyed point on the ridge. Local relief determines where the Sun is visible and which slopes are easier to cross.',
      az: 'Bu təlim nişanı silsilədə ölçülmüş bir nöqtəni göstərir. Yerli relyef Günəşin haradan göründüyünü və hansı yamacların daha rahat keçildiyini müəyyən edir.',
    },
    nasaContext: {
      en: 'The LOLA instrument on LRO times the return of laser pulses reflected by the lunar surface. These measurements help map elevations, slopes and roughness.',
      az: 'LRO-nun LOLA cihazı Ay səthindən əks olunan lazer impulslarının qayıtma vaxtını ölçür. Bu ölçmələr hündürlükləri, yamacları və səth nahamarlığını xəritələməyə kömək edir.',
    },
    sourceUrl: 'https://science.nasa.gov/mission/lro/lola/',
  },
  {
    id: 'sample_genesis',
    name: { en: 'Anorthosite Analog', az: 'Anortozit Analoqu' },
    instrument: { en: 'Apollo 15 sample 15415', az: 'Apollo 15 nümunəsi 15415' },
    locationName: { en: 'North Ridge Rock Outcrop (Elev +2)', az: 'Şimal Silsilə Qaya Çıxıntısı (Hünd. +2)' },
    x: 645,
    y: 360,
    elevation: 'high_ridge',
    scienceBonus: 4,
    icon: '🪨',
    description: {
      en: 'This training specimen represents a light-colored rock rich in plagioclase feldspar, a mineral common in the ancient lunar highlands.',
      az: 'Bu təlim nümunəsi qədim Ay yüksəkliklərində geniş yayılmış plagioklaz feldispatı ilə zəngin açıq rəngli süxuru təmsil edir.',
    },
    nasaContext: {
      en: 'Apollo 15 collected the Genesis Rock at Hadley–Apennine. It is a piece of the early lunar crust that scientists could examine in laboratories on Earth.',
      az: 'Apollo 15 ekipajı Yaranış Qayasını Hadley–Apennin bölgəsində topladı. Alimlər erkən Ay qabığının bu parçasını Yerdəki laboratoriyalarda tədqiq edə bildilər.',
    },
    sourceUrl: 'https://science.nasa.gov/solar-system/moon/genesis-rock/',
  },
  {
    id: 'sample_ilmenite',
    name: { en: 'Ilmenite Analog (FeTiO₃)', az: 'İlmenit Analoqu (FeTiO₃)' },
    instrument: { en: 'Hydrogen reduction testbed', az: 'Hidrogenlə reduksiya sınağı' },
    locationName: { en: 'Central Outpost Regolith Yard (Elev 0)', az: 'Mərkəzi Reqolit Meydançası (Hünd. 0)' },
    x: 970,
    y: 640,
    elevation: 'base_plateau',
    scienceBonus: 4,
    icon: '⚗️',
    description: {
      en: 'This training sample represents a mineral that binds oxygen in solid rock. Extracting that oxygen requires equipment and energy.',
      az: 'Bu təlim nümunəsi oksigeni bərk süxurda birləşdirən mineralı təmsil edir. Həmin oksigeni ayırmaq üçün avadanlıq və enerji lazımdır.',
    },
    nasaContext: {
      en: 'In a proposed process, heating ilmenite with hydrogen produces water. A separate electrolysis step can then split the water into oxygen and hydrogen.',
      az: 'Təklif olunan üsulda ilmeniti hidrogenlə qızdırmaq su əmələ gətirir. Daha sonra ayrıca elektroliz mərhələsi suyu oksigenə və hidrogenə ayırır.',
    },
    sourceUrl: 'https://ntrs.nasa.gov/citations/20080008755',
  },
  {
    id: 'sample_diviner',
    name: { en: 'Thermal Survey Marker', az: 'Temperatur Ölçmə Nişanı' },
    instrument: { en: 'LRO Diviner Lunar Radiometer Experiment', az: 'LRO Diviner Ay Radiometri Təcrübəsi' },
    locationName: { en: 'Cold-Trap Slope Transition (Elev -2)', az: 'Soyuq Tələ Eniş Keçidi (Hünd. -2)' },
    x: 1120,
    y: 730,
    elevation: 'sunken_crater',
    scienceBonus: 4,
    icon: '🌡️',
    description: {
      en: 'A training marker for comparing sunlit terrain with a nearby shadow. The readings at this marker are part of the scenario.',
      az: 'Günəşli ərazi ilə yaxınlıqdakı kölgəni müqayisə etmək üçün təlim nişanı. Buradakı göstəricilər ssenarinin bir hissəsidir.',
    },
    nasaContext: {
      en: 'Diviner measures infrared radiation from orbit. Thermal maps made from these observations help researchers identify polar cold traps.',
      az: 'Diviner orbitdən infraqırmızı şüalanmanı ölçür. Bu müşahidələr əsasında hazırlanan istilik xəritələri qütb soyuq tələlərini müəyyən etməyə kömək edir.',
    },
    sourceUrl: 'https://science.nasa.gov/mission/lro/spacecraft-and-instruments/',
  },
  {
    id: 'sample_ice_core',
    name: { en: 'Cold-Trap Ice Analog', az: 'Soyuq Tələ Buz Analoqu' },
    instrument: { en: 'LCROSS plume spectroscopy', az: 'LCROSS toqquşma spektroskopiyası' },
    locationName: { en: 'Permanently Shadowed Floor (Elev -2)', az: 'Daimi Kölgəli Hövzə Dibi (Hünd. -2)' },
    x: 1410,
    y: 880,
    elevation: 'sunken_crater',
    scienceBonus: 4,
    icon: '🧊',
    description: {
      en: 'This training ice core represents frozen water mixed with lunar soil. Processing it for use would take power to extract and purify the water.',
      az: 'Bu təlim nümunəsi Ay torpağı ilə qarışmış donmuş suyu təmsil edir. Suyu çıxarmaq və təmizləmək üçün enerji tələb olunur.',
    },
    nasaContext: {
      en: 'LCROSS detected evidence of water ice in material ejected by an impact in the permanently shadowed part of Cabeus crater.',
      az: 'LCROSS Cabeus kraterinin daimi kölgəli hissəsində toqquşma ilə səpələnən materialda su buzunun izlərini aşkar etdi.',
    },
    sourceUrl: 'https://science.nasa.gov/mission/lcross/',
  },
  {
    id: 'sample_crater_dosimeter',
    name: { en: 'Radiation Survey Marker', az: 'Radiasiya Ölçmə Nişanı' },
    instrument: { en: 'Cosmic Ray Telescope for Effects of Radiation', az: 'Radiasiya Təsirləri Kosmik Şüa Teleskopu' },
    locationName: { en: 'Storm Bunker Outer Berm (Elev 0)', az: 'Sığınacaq Reqolit Bəndi (Hünd. 0)' },
    x: 710,
    y: 860,
    elevation: 'base_plateau',
    scienceBonus: 4,
    icon: '🛡️',
    description: {
      en: 'This training dosimeter represents measurements taken near a regolith berm. The effect of shielding depends on material, thickness and the incoming particles.',
      az: 'Bu təlim dozimetri reqolit səddi yaxınlığında aparılan ölçmələri təmsil edir. Qoruyucu örtüyün təsiri materialdan, qalınlıqdan və gələn zərrəciklərdən asılıdır.',
    },
    nasaContext: {
      en: 'CRaTER measures the radiation environment from lunar orbit and helps scientists test models of radiation exposure and shielding.',
      az: 'CRaTER Ay orbitindən radiasiya mühitini ölçür və alimlərə radiasiya təsiri və qorunma modellərini sınamağa kömək edir.',
    },
    sourceUrl: 'https://science.nasa.gov/mission/lro/spacecraft-and-instruments/',
  },
];

export interface StationNode {
  decisionId: number;
  sectorCode: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  radius: number;
  elevation: ElevationTier;
  elevationLabel: Bilingual;
  code: Bilingual;
  name: Bilingual;
  roomName: Bilingual;
  objectiveTitle: Bilingual;
  objectiveBody: Bilingual;
}

export const STATIONS: StationNode[] = [
  {
    decisionId: 1,
    sectorCode: 'SEC-01',
    x: 475,
    y: 430,
    labelX: 475,
    labelY: 220,
    radius: 112,
    elevation: 'high_ridge',
    elevationLabel: {
      en: 'ELEVATION +2 · SUNLIT RIM CREST',
      az: 'HÜNDÜRLÜK +2 · GÜNƏŞLİ ZİRVƏ',
    },
    code: { en: 'D1 · SOLAR RIM', az: 'D1 · GÜNƏŞ ZİRVƏSİ' },
    name: { en: 'D1 Solar Array & Battery Crest', az: 'D1 Günəş Paneli və Batareya Zirvəsi' },
    roomName: { en: 'Solar Rim', az: 'Günəş Zirvəsi' },
    objectiveTitle: {
      en: 'Deploy polar solar architecture',
      az: 'Qütb günəş enerjisi arxitekturasını qurun',
    },
    objectiveBody: {
      en: 'Follow the ridge ramp to Sector 01. Press E at the console to choose a solar layout and see its trade-offs.',
      az: 'Silsilə pandusu ilə 01-ci sektora qalxın. Paneldə E düyməsini basıb günəş qurğusunu seçin və seçimlərin təsirini görün.',
    },
  },
  {
    decisionId: 2,
    sectorCode: 'SEC-02',
    x: 895,
    y: 435,
    labelX: 895,
    labelY: 165,
    radius: 118,
    elevation: 'base_plateau',
    elevationLabel: {
      en: 'ELEVATION 0 · COMMAND PLATEAU',
      az: 'HÜNDÜRLÜK 0 · KOMANDA PLATOSU',
    },
    code: { en: 'D2 · HABITAT HUB', az: 'D2 · YAŞAYIŞ MƏRKƏZİ' },
    name: { en: 'D2 Pressurized Habitat & O₂ Plaza', az: 'D2 Yaşayış Modulu və O₂ Mərkəzi' },
    roomName: { en: 'Habitat & O₂', az: 'Yaşayış və O₂' },
    objectiveTitle: {
      en: 'Configure Habitat & ISRU O₂ / Shielding',
      az: 'Yaşayış Modulu və O₂ / Qoruyucu Səddi qurun',
    },
    objectiveBody: {
      en: 'Head to the North-Central Habitat airlock in Sector 02 and press USE [E] to calibrate life support and lock Decision 2.',
      az: '02-ci Sektordakı Mərkəzi Yaşayış şlüzünə gedin və USE [E] basaraq həyat təminatını tənzimləyin.',
    },
  },
  {
    decisionId: 3,
    sectorCode: 'SEC-03',
    x: 425,
    y: 800,
    labelX: 425,
    labelY: 610,
    radius: 112,
    elevation: 'base_plateau',
    elevationLabel: {
      en: 'ELEVATION 0 · WEST REACTOR YARD',
      az: 'HÜNDÜRLÜK 0 · QƏRB REAKTOR SAHƏSİ',
    },
    code: { en: 'D3 · CRYO REACTOR', az: 'D3 · KRİO REAKTOR' },
    name: { en: 'D3 H₂/O₂ Cryo-Fuel Reactor Yard', az: 'D3 H₂/O₂ Krio-Yanacaq Reaktoru' },
    roomName: { en: 'Cryo Reactor', az: 'Krio Reaktor' },
    objectiveTitle: {
      en: 'Keep the habitat powered through 72 hours of shadow',
      az: '72 saatlıq kölgədə yaşayış modulunun enerjisini qoruyun',
    },
    objectiveBody: {
      en: 'The ridge blocks sunlight and the panels make less power. At D3, decide which systems to keep running.',
      az: 'Silsilə günəş işığının qarşısını kəsir və panellər daha az enerji verir. D3-də hansı sistemləri işlək saxlayacağınızı seçin.',
    },
  },
  {
    decisionId: 4,
    sectorCode: 'SEC-04',
    x: 1165,
    y: 815,
    labelX: 1210,
    labelY: 665,
    radius: 135,
    elevation: 'sunken_crater',
    elevationLabel: {
      en: 'ELEVATION -2 · 90 K COLD-TRAP BASIN',
      az: 'HÜNDÜRLÜK -2 · 90 K SOYUQ TƏLƏ',
    },
    code: { en: 'D4 · 90K ICE BASIN', az: 'D4 · 90K BUZ HÖVZƏSİ' },
    name: { en: 'D4 Permanently Shadowed Ice Basin', az: 'D4 Daimi Kölgəli Buz Hövzəsi' },
    roomName: { en: '90K Ice Basin', az: '90K Buz Hövzəsi' },
    objectiveTitle: {
      en: 'Drive Lunar Car & prospect 90 K ice',
      az: 'Ay Maşınını sürün və 90 K buz kəşf edin',
    },
    objectiveBody: {
      en: 'Press V to drive down the marked ramp. Hold Space at a blue survey marker to collect a core for the extractor.',
      az: 'Nişanlanmış pandusla enmək üçün V düyməsini basın. Emal qurğusu üçün nümunə götürmək istəyəndə mavi nişanın yanında Space düyməsini basılı saxlayın.',
    },
  },
  {
    decisionId: 5,
    sectorCode: 'SEC-05',
    x: 795,
    y: 915,
    labelX: 795,
    labelY: 700,
    radius: 118,
    elevation: 'base_plateau',
    elevationLabel: {
      en: 'ELEVATION 0 · SOUTH SHIELD BUNKER',
      az: 'HÜNDÜRLÜK 0 · CƏNUB SIĞINACAĞI',
    },
    code: { en: 'D5 · STORM BUNKER', az: 'D5 · FIRTINA SIĞINACAĞI' },
    name: { en: 'D5 Armored Regolith Storm Bunker', az: 'D5 Zirehli Reqolit Fırtına Sığınacağı' },
    roomName: { en: 'Storm Bunker', az: 'Sığınacaq' },
    objectiveTitle: {
      en: 'Choose how to shelter during a solar particle storm',
      az: 'Günəş zərrəcikləri fırtınasında sığınma üsulunu seçin',
    },
    objectiveBody: {
      en: 'The scenario’s particle storm has arrived. Follow the crew to the Sector 05 shelter entrance and press E to choose your crew’s exposure plan.',
      az: 'Ssenaridə zərrəcik fırtınası başlayıb. Ekipajla 05-ci sektorun sığınacaq girişinə gedin və radiasiyadan qorunma planını seçmək üçün E düyməsini basın.',
    },
  },
  {
    decisionId: 6,
    sectorCode: 'SEC-06',
    x: 1530,
    y: 490,
    labelX: 1530,
    labelY: 220,
    radius: 122,
    elevation: 'base_plateau',
    elevationLabel: {
      en: 'ELEVATION 0 · EAST LAUNCH COMPLEX',
      az: 'HÜNDÜRLÜK 0 · ŞƏRQ QALXIŞ KOMPLEKSİ',
    },
    code: { en: 'D6 · ASCENT PAD', az: 'D6 · QALXIŞ MEYDANÇASI' },
    name: { en: 'D6 Bio-Dome & Ascent Launchpad', az: 'D6 Bio-Günbəz və Qalxış Meydançası' },
    roomName: { en: 'Ascent & Bio', az: 'Qalxış və Bio' },
    objectiveTitle: {
      en: 'Final Earth downlink & mission close-out',
      az: 'Yekun Yer rabitəsi və missiya tamamlanması',
    },
    objectiveBody: {
      en: 'Proceed East to the Sector 06 Ascent Vehicle & Ka-Band Dish and press USE [E] to transmit science data and complete the run.',
      az: 'Şərqdəki 06-cı Sektor Qalxış Aparatı və Ka-Zolaq Antenasına gedin və USE [E] basaraq missiyanı tamamlayın.',
    },
  },
];

export interface AiCrewmateDef {
  id: 'leyla' | 'rashad';
  suit: CrewSuitId;
  colorHex: string;
  name: Bilingual;
  role: Bilingual;
  patrol: Point[];
  shelterPos: Point;
  stepLines: Record<number, Bilingual>;
}

export const AI_CREWMATES: readonly AiCrewmateDef[] = [
  {
    id: 'leyla',
    suit: 'engineer',
    colorHex: '#2dd4bf',
    name: { en: 'Eng. Leyla', az: 'Müh. Leyla' },
    role: { en: 'Power & ECLSS AI', az: 'Enerji və ECLSS AI' },
    patrol: [
      { x: 525, y: 445 },
      { x: 525, y: 555 },
      { x: 835, y: 555 },
      { x: 835, y: 445 },
      { x: 475, y: 555 },
      { x: 465, y: 785 },
    ],
    shelterPos: { x: 755, y: 905 },
    stepLines: {
      1: {
        en: 'A taller mast can clear the local horizon.',
        az: 'Daha hündür dirək yerli üfüqün üzərindən işıq ala bilər.',
      },
      2: {
        en: 'A regolith berm trades installation effort for shielding.',
        az: 'Reqolit səddinin quraşdırılması əmək tələb edir və radiasiyadan qoruyur.',
      },
      3: {
        en: 'Solar output has dropped. Prioritize habitat loads.',
        az: 'Günəş hasilatı azalıb. Yaşayış modulunun yükünə üstünlük verin.',
      },
      4: {
        en: 'Solar bus back online! O₂ tanks ready.',
        az: 'Günəş şini bərpa oldu! O₂ çənləri hazırdır.',
      },
      5: {
        en: 'Particle storm warning. Meet at the D5 shelter.',
        az: 'Zərrəcik fırtınası xəbərdarlığı. D5 sığınacağında görüşək.',
      },
      6: {
        en: 'Check battery & fuel-cell reserve before D6!',
        az: 'D6-dan əvvəl batareya ehtiyatını yoxlayın!',
      },
    },
  },
  {
    id: 'rashad',
    suit: 'scientist',
    colorHex: '#eab308',
    name: { en: 'Dr. Rashad', az: 'Dr. Rəşad' },
    role: { en: 'Cryo-Ice & Bio AI', az: 'Krio-Buz və Bio AI' },
    patrol: [
      { x: 1275, y: 485 },
      { x: 1275, y: 555 },
      { x: 1085, y: 555 },
      { x: 1155, y: 745 },
      { x: 1475, y: 555 },
      { x: 1495, y: 495 },
    ],
    shelterPos: { x: 835, y: 905 },
    stepLines: {
      1: {
        en: 'Near the pole, a low Sun makes ridge height matter.',
        az: 'Qütb yaxınlığında Günəş alçaqda olduğuna görə silsilənin hündürlüyü vacibdir.',
      },
      2: {
        en: 'Each crewmate breathes 0.82 kg O₂/day!',
        az: 'Hər astronavt gündə 0.82 kq O₂ tənəffüs edir!',
      },
      3: {
        en: 'A colder surface means more heating demand.',
        az: 'Səth soyuduqca qızdırma üçün daha çox enerji tələb olunur.',
      },
      4: {
        en: 'Take the Lunar Car [V] into the 90 K Ice Basin!',
        az: 'Ay Maşınını [V] 90 K Buz Hövzəsinə sürün!',
      },
      5: {
        en: 'Plan how much time to spend under cover.',
        az: 'Qoruyucu örtük altında nə qədər qalacağımızı planlaşdırın.',
      },
      6: {
        en: 'Balance the final downlink with habitat reserves.',
        az: 'Son məlumat ötürülməsi ilə yaşayış ehtiyatlarını tarazlaşdırın.',
      },
    },
  },
] as const;

export interface LiveCrewState {
  id: 'leyla' | 'rashad';
  x: number;
  y: number;
  statusText: string;
}

/** Bottom of the collision footprint is the facility's ground-contact depth. */
export function groundAnchor(art: Pick<SvgAsset, 'height' | 'footprint'>): number {
  return art.footprint ? art.footprint.y + art.footprint.height : art.height;
}

export function footprintBounds(position: Point, art: SvgAsset, scale = 1) {
  if (!art.footprint) throw new Error(`Missing footprint for ${art.key}`);
  const f = art.footprint;
  return {
    x: position.x + (f.x + f.width / 2 - art.width / 2) * scale,
    y: position.y + (f.y + f.height / 2 - groundAnchor(art)) * scale,
    width: f.width * scale,
    height: f.height * scale,
  };
}

export function groundDepth(groundY: number): number {
  return groundY;
}

export function getElevationTier(x: number, y: number): ElevationTier {
  if (x <= 705 && y <= 505) return 'high_ridge';
  if (x >= 1015 && y >= 635) return 'sunken_crater';
  return 'base_plateau';
}

export function findNearbyStation(position: Point, activeStep: number, lastAvailableStep: number): StationNode | null {
  const active = STATIONS[activeStep - 1];
  if (active && activeStep <= lastAvailableStep && Math.hypot(position.x - active.x, position.y - active.y) <= active.radius) {
    return active;
  }
  for (const st of STATIONS) {
    if (st.decisionId <= lastAvailableStep && Math.hypot(position.x - st.x, position.y - st.y) <= st.radius) {
      return st;
    }
  }
  return null;
}

export function findNearestIceIndex(position: Point, minedMask: boolean[]): number {
  let bestIdx = -1;
  let bestDist = 118;
  ICE_DEPOSITS.forEach((pt, idx) => {
    if (minedMask[idx]) return;
    const d = Math.hypot(position.x - pt.x, position.y - pt.y);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

export function findNearestSampleIndex(position: Point, collectedMask: boolean[]): number {
  let bestIdx = -1;
  let bestDist = 100;
  FIELD_SAMPLES.forEach((s, idx) => {
    if (collectedMask[idx]) return;
    const d = Math.hypot(position.x - s.x, position.y - s.y);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

export function movementVector(
  horizontal: number,
  vertical: number,
  speed: number = WORLD.speed,
): Point {
  if (![horizontal, vertical, speed].every(Number.isFinite) || speed < 0) return { x: 0, y: 0 };
  const length = Math.hypot(horizontal, vertical);
  return length === 0
    ? { x: 0, y: 0 }
    : { x: (horizontal / length) * speed, y: (vertical / length) * speed };
}

export function facingDirection(vector: Point, previous: Facing): Facing {
  if (!vector.x && !vector.y) return previous;
  const x = Math.abs(vector.x);
  const y = Math.abs(vector.y);
  const horizontal = Math.abs(x - y) < Math.max(x, y) * 0.16
    ? previous === 'left' || previous === 'right'
    : x > y;
  return horizontal
    ? vector.x > 0
      ? 'right'
      : 'left'
    : vector.y > 0
      ? 'down'
      : 'up';
}

export type CropStatus = 'idle' | 'ready' | 'growing' | 'paused' | 'harvested';

export interface WorldSnapshot {
  batteryKwh: number;
  powerLow: boolean;
  lifeSupportLow: boolean;
  lifeSupportPct: number;
  sunlightFraction: number;
  solarOutputPct: number | null;
  cropStatus: CropStatus;
  cropProgress: number;
  harvestedFoodKg: number;
  iceWaterKg: number | null;
  iceBypassed: boolean;
  stormPending: boolean;
  activeStep: number;
  lastAvailableStep: number;
  completedCount: number;
  choices: number[];
  hasBranch: boolean;
  divergedStep: number | null;
  runAChoiceLabel: string;
  controllingRover: boolean;
  minedCrystals: boolean[];
  calibratedTasks: boolean[];
  collectedSamples: boolean[];
  lang: Lang;
}

export interface WorldTelemetryPayload {
  player: Point;
  car: Point;
  drone: Point;
  tier: ElevationTier;
  nearIceIdx: number;
  nearSampleIdx: number;
  nearCar: boolean;
  crew: LiveCrewState[];
  nearbyCrewSpeech: { speaker: string; role: string; text: string; color: string } | null;
}

export interface WorldBridge {
  host: HTMLDivElement;
  paused: boolean;
  reducedMotion: boolean;
  direction: Point;
  nudgeUntil: number;
  interactRequested: boolean;
  resetRequested: boolean;
  drillHeld: boolean;
  teleportTarget: Point | null;
  walkToTarget: Point | null;
  snapshot: WorldSnapshot;
  onReady: () => void;
  onError: (message: string) => void;
  onNearby: (station: StationNode | null) => void;
  onInteract: (station: StationNode) => void;
  onTelemetry: (payload: WorldTelemetryPayload) => void;
  onToggleRover: () => void;
  onDrillTick: (nearIceIdx: number, dt: number) => void;
  onCollectSample?: (sampleIdx: number) => void;
}
