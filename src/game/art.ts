import { detailFacility, lifeSupport } from './facility-details';
import { terrain, rock } from './landscape';
import { CHARACTER, aiDrone, crewmate, type CrewSuitId } from './character';

/**
 * Original 2.5D vector artwork for the Shackleton Outpost.
 * All shapes are authored here; zero remote images, fonts, or agency logos are used.
 */
export interface SvgAsset {
  key: string;
  svg: string;
  width: number;
  height: number;
  /** Rectangular ground collision footprint in local texture coordinates. */
  footprint?: { x: number; y: number; width: number; height: number };
}

const colors = {
  ground: '#354148',
  groundDark: '#26333b',
  shadow: '#10212b',
  shell: '#dcdcd2',
  roof: '#f5e6cc',
  wall: '#d2d9cf',
  side: '#5d7e91',
  outline: '#233e49',
  glass: '#143d4d',
  teal: '#80ddca',
  amber: '#e9b96e',
};

function svg(key: string, width: number, height: number, content: string, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" stroke-linejoin="round" stroke-linecap="round">
    <defs>
      <linearGradient id="${key}-roof" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${colors.roof}"/><stop offset="1" stop-color="#b0c2bd"/></linearGradient>
      <linearGradient id="${key}-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d7dacc"/><stop offset="1" stop-color="#8ca4a8"/></linearGradient>
      <linearGradient id="${key}-glass" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#4a8796"/><stop offset="1" stop-color="#153845"/></linearGradient>
      ${defs}
    </defs>${content}</svg>`;
}

function asset(
  key: string,
  width: number,
  height: number,
  content: string,
  footprint?: SvgAsset['footprint'],
  defs = '',
): SvgAsset {
  return {
    key,
    width,
    height,
    svg: svg(key, width, height, content, defs),
    ...(footprint ? { footprint } : {}),
  };
}

function habitat(): SvgAsset {
  return asset(
    'habitat',
    260,
    210,
    `
    <path d="m24 140 151 49 74-34-151-51Z" fill="${colors.shadow}" opacity=".42"/>
    <path d="m42 127-2 26 15 5 3-27m102 28-1 27 16 5 2-27m45-44 1 26 11-7-1-24" fill="#53727c" stroke="#1f3b49" stroke-width="2"/>
    <path d="m28 61 147 43v73L28 134Z" fill="url(#habitat-wall)" stroke="${colors.outline}" stroke-width="2"/>
    <path d="m175 104 58-40v72l-58 41Z" fill="#52728a" stroke="${colors.outline}" stroke-width="2"/>
    <path d="m28 61 58-40 147 43-58 40Z" fill="url(#habitat-roof)" stroke="#e0e4d6" stroke-width="2"/>
    <path d="m37 58 50-33 137 40-50 33Z" fill="#d5d8c7"/>
    <path d="m48 52 135 39m-98-66-10 34m50-22-10 34m50-22-10 34" stroke="#e5e6d9" stroke-width="2" opacity=".7"/>
    <path d="m28 69 147 43 58-40" stroke="${colors.amber}" stroke-width="3"/>
    <path d="m28 119 147 43 58-40" stroke="#dae0d6" stroke-width="2" opacity=".38"/>
    <path d="m39 79 45 13v25l-45-13Zm88 26 35 10v25l-35-10Z" fill="#173c4d" stroke="#e0e5d9" stroke-width="2"/>
    <path d="m43 84 37 11v15l-37-11Zm88 26 27 8v15l-27-8Z" fill="url(#habitat-glass)"/>
    <path d="m43 84 37 11m51 15 27 8" stroke="#9df5df" stroke-width="2"/>
    <path d="m56 88v18m13-14v18m75 23v-20" stroke="#b2d9d2" stroke-width="1.5" opacity=".65"/>
    <path d="m91 96 27 8v43l-27-8Z" fill="#244652" stroke="#e1e5d9" stroke-width="2"/>
    <path d="m97 105 15 4v16l-15-4Z" fill="#7dd9cd"/>
    <path d="m109 132 5 1" stroke="#e8dcb2" stroke-width="2"/>
    <path d="m91 141-21 15 27 8 21-17" fill="#657e83" stroke="#c0cfc8" stroke-width="2"/>
    <path d="m85 146 27 8m-33-4 27 8m-33-4 27 8" stroke="#abbeb8" stroke-width="1.4"/>
    <path d="m187 110 29-20v28l-29 20Z" fill="#173c4d" stroke="#aec6c2" stroke-width="2"/>
    <path d="m192 111 19-13v17l-19 13Z" fill="#6fbcc1"/>
    <path d="m106 38 17-10 36 11-17 11Z" fill="#e8e8da" stroke="#a6b8b2"/>
    <path d="m106 38 36 12v9l-36-11Zm36 12 17-11v9l-17 11Z" fill="#6c878d"/>
    <path d="m117 38 18 6m-10-10 18 6m-10-10 18 6" stroke="#7e9698" stroke-width="2"/>
    <path d="M64 37V7" stroke="#d1dcd3" stroke-width="2"/>
    <path d="m64 8 20 5-20 9Z" fill="#93e0bd"/>
    <circle cx="62" cy="47" r="5" fill="#243f4b"/><circle cx="62" cy="46" r="2.6" fill="#b7f3ce"/>
    <path d="m137 84 15 4" stroke="#718c91" stroke-width="2"/>
    <path d="m134 85 1 4m6-2 1 4m6-2 1 4" stroke="#718c91" stroke-width="1"/>
  `,
    { x: 37, y: 107, width: 188, height: 62 },
  );
}

function solar(active: boolean): SvgAsset {
  const key = active ? 'solar' : 'solar-off';
  const panels = [
    [31, 37],
    [137, 67],
    [10, 84],
    [116, 114],
  ]
    .map(
      ([x, y]) => `
    <g transform="translate(${x} ${y})">
      <path d="M43 22v24m28-31v22" stroke="#5f7f8a" stroke-width="5"/>
      <path d="m-4 28 87-25 36 20-88 26Z" fill="#0d2533" opacity=".3" transform="translate(5 15)"/>
      <path d="m0 0 78-22 31 17-78 23Z" fill="${active ? '#163e59' : '#243847'}" stroke="${active ? '#dbd2ae' : '#7c9299'}" stroke-width="2"/>
      <path d="m0 0 78-22 31 17-78 23Z" fill="url(#${key}-cells)" opacity="${active ? '.9' : '.25'}"/>
      <path d="m12 7 78-22m-64 30 78-23M19-5l31 17m-11-23 31 17m-11-23 31 17" stroke="${active ? '#a5d5dc' : '#7b8d96'}" stroke-width=".85" opacity="${active ? '.82' : '.5'}"/>
      <path d="m2 0 76-21" stroke="${active ? '#c1ece5' : '#7c9299'}" stroke-width="1.4"/>
      <circle cx="34" cy="21" r="2.3" fill="${active ? '#91e9c7' : '#c5a270'}"/>
    </g>`,
    )
    .join('');
  return asset(
    key,
    270,
    190,
    `
    <path d="m17 131 141 47 96-47-141-45Z" fill="#142a35" opacity=".3"/>
    <path d="m39 103 41 14 66 21 48 14" stroke="#162e3c" stroke-width="7"/>
    <path d="m39 103 41 14 66 21 48 14" stroke="#94acae" stroke-width="1.3" stroke-dasharray="3 4"/>
    ${panels}
    <path d="m207 153 18-11 23 7-18 12Z" fill="#a6bab5"/>
    <path d="m207 153 23 8v16l-23-8Zm23 8 18-12v16l-18 12Z" fill="#5e7d87" stroke="#9fb8b8"/>
    <path d="m213 158 11 4v7l-11-4Z" fill="${active ? '#8adfc5' : '#ab8053'}"/>
  `,
    { x: 22, y: 65, width: 224, height: 101 },
    `<pattern id="${key}-cells" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 0h12v8" stroke="#7cb6cc" stroke-width=".6" opacity=".35"/></pattern>`,
  );
}

function water(): SvgAsset {
  const tanks = [0, 1, 2]
    .map(
      (i) => `<g transform="translate(${25 + i * 38} ${36 + i * 10})">
    <path d="M0 0v48c0 13 32 13 32 0V0Z" fill="url(#water-wall)" stroke="#607f89" stroke-width="1.5"/>
    <ellipse cx="16" rx="16" ry="9" fill="#dae0d3" stroke="#a8beb9"/>
    <path d="M0 12c0 11 32 11 32 0M0 37c0 11 32 11 32 0" stroke="#537582" stroke-width="4"/>
    <path d="M11 18v15" stroke="#284959" stroke-width="7"/><path d="M11 21v10" stroke="#96e7d9" stroke-width="3"/>
    <path d="M16-4v-10h13" stroke="#b0c3bf" stroke-width="3"/>
    <circle cx="29" cy="-14" r="3" fill="#deb66e"/>
  </g>`,
    )
    .join('');
  return asset(
    'water',
    170,
    130,
    `
    <ellipse cx="90" cy="109" rx="69" ry="17" fill="#122a35" opacity=".45"/>
    <path d="m13 82 48-28 91 28-48 31Z" fill="#294653" stroke="#77969f" stroke-width="2"/>
    ${tanks}
    <path d="m22 89-8 11 88 27 29-18" stroke="#a5b9b3" stroke-width="5"/>
    <path d="m25 97 23 8" stroke="#e6be77" stroke-width="5"/>
  `,
    { x: 20, y: 66, width: 128, height: 46 },
  );
}

function greenhouse(key: string, plantScale: number, harvested = false): SvgAsset {
  const plants = Array.from(
    { length: 5 },
    (_, i) => `<g transform="translate(${47 + i * 23} ${91 + i * 7})">
    <path d="m-12 10 12-7 16 5-12 8Z" fill="#263e3b" stroke="#9ab5a4"/>
    <path d="m-12 10 16 6 12-8v4l-12 8-16-6Z" fill="#143038"/>
    ${plantScale > 0 ? `<g transform="translate(0 ${7 * (1 - plantScale)}) scale(1 ${plantScale})">
      <path d="M1 7V-15" stroke="#c7e3a5" stroke-width="1.5"/>
      ${[-1, 1]
      .map((side) =>
        [0, 1, 2]
          .map(
            (k) =>
              `<path d="M1 ${2 - k * 5}Q${side * 16} ${-1 - k * 6} ${side * (8 - k)} ${-12 - k * 5}Q${side * 1} ${-11 - k * 4} 1 ${2 - k * 5}Z" fill="${k % 2 ? '#a3c98b' : '#6da789'}" stroke="#c0dab0" stroke-width=".4"/>`,
          )
          .join(''),
      )
      .join('')}
    </g>` : ''}
  </g>`,
  ).join('');
  return asset(
    key,
    220,
    170,
    `
    <path d="m18 117 128 42 70-37-132-43Z" fill="#132b36" opacity=".4"/>
    <path d="m17 97 65-42 121 39-65 45Z" fill="#153e43" stroke="#5d8f91" stroke-width="2"/>
    <path d="m17 97 121 42v19L17 116Zm121 42 65-45v19l-65 45Z" fill="#62858a" stroke="#a5c5bb" stroke-width="1.4"/>
    <path d="M17 97V72c0-32 31-49 58-31l128 53-65 45Z" fill="url(#greenhouse-dome)"/>
    <path d="m32 92 111 37m-108-25 111 37" stroke="#1b393d" stroke-width="4"/>
    ${plants}
    <path d="M17 72c0-32 31-49 58-31l128 53" stroke="#d0ded0" stroke-width="3"/>
    <path d="M17 72v25m24-30c0-18 7-27 16-31m10 40c0-18 7-27 16-31m10 40c0-18 7-27 16-31m10 40c0-18 7-27 16-31m10 40c0-18 7-27 16-31m10 40c0-18 7-27 16-31" stroke="#aecdc0" stroke-width="2.2"/>
    <path d="m21 70 121 45 55-34" stroke="#e3f2d8" stroke-opacity=".35" stroke-width="1.2"/>
    <path d="m24 112 106 37" stroke="#91b9af" stroke-width="3"/>
    <path d="m150 133 32-22v19l-32 22Z" fill="#1c4550" stroke="#c2d5c7" stroke-width="2"/>
    <path d="m156 132 19-13v10l-19 13Z" fill="#8ac7ba"/>
    <path d="m143 154 30 8 22-15-13-13" fill="#63808a" stroke="#92b0ac" stroke-width="1.3"/>
    ${harvested ? '<path d="m73 125 14-8 27 9-14 9Z" fill="#bbd39c" stroke="#d8e4bc"/><path d="m73 125 27 10v12l-27-9Zm27 10 14-9v12l-14 9Z" fill="#48644e" stroke="#a6bf91"/><path d="m77 129 19 7m-19-3 19 7" stroke="#b6d394" stroke-width="2"/>' : ''}
  `,
    { x: 23, y: 91, width: 174, height: 55 },
    `<linearGradient id="greenhouse-dome" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="#75b8a5" stop-opacity=".7"/><stop offset="1" stop-color="#143c46" stop-opacity=".9"/></linearGradient>`,
  );
}

function shelter(): SvgAsset {
  return asset(
    'shelter',
    200,
    165,
    `
    <ellipse cx="106" cy="137" rx="86" ry="23" fill="#132b35" opacity=".4"/>
    <path d="m16 112 30-65 56-25 65 29 24 66-55 29-91-14Z" fill="#738382" stroke="#3d5962" stroke-width="2"/>
    <path d="m16 112 45-38 41-52 65 29-37 13-29-15-41 50-15 33Z" fill="#a0aaa0"/>
    <path d="m45 132 15-33 41-50 29 15 6 82-43-13Z" fill="#667d80"/>
    <path d="m93 132-1-46q14-19 34 2l2 54Z" fill="#1d3c49" stroke="#d5d9c6" stroke-width="4"/>
    <path d="m99 128-1-38q9-12 22 1l2 43" stroke="#a8d7ca" stroke-width="3"/>
    <path d="m105 98 12 4v17l-12-4Z" fill="#315e69"/>
    <path d="m85 136 44 15 20-13" stroke="#dfb672" stroke-width="4" stroke-dasharray="6 5"/>
    <path d="m33 109 14-5m21-39 10-13m73 42 12 4m-96 26 11 4" stroke="#c1c6b6" stroke-opacity=".4" stroke-width="2"/>
    <path d="m147 65 9-5 12 5-9 6Z" fill="#a8b6aa"/><path d="m147 65 12 6v10l-12-5Z" fill="#4b6670"/>
    <circle cx="115" cy="77" r="3" fill="#c2e2b0"/>
  `,
    { x: 28, y: 87, width: 153, height: 52 },
  );
}

function terminal(): SvgAsset {
  return asset(
    'terminal',
    74,
    94,
    `
    <ellipse cx="41" cy="83" rx="28" ry="9" fill="#122a35" opacity=".45"/>
    <path d="m13 73 23-13 25 9-23 15Z" fill="#5e8088" stroke="#a2bbb5"/>
    <path d="m28 45 16 5v25l-16-5Z" fill="#acbfb4" stroke="#456a76" stroke-width="2"/>
    <path d="m44 50 9-6v24l-9 7Z" fill="#567b84"/>
    <path d="m12 19 17-10 36 11-17 11Z" fill="#d4e0cc" stroke="#acc2b5"/>
    <path d="m12 19 36 12v30L12 49Z" fill="#87a79f" stroke="#bdcebc" stroke-width="1.5"/>
    <path d="m48 31 17-11v30L48 61Z" fill="#4d747e" stroke="#a0bab0"/>
    <path d="m17 26 25 8v19l-25-8Z" fill="#143b49"/>
    <circle cx="30" cy="39" r="5" fill="#a0e8bd"/>
    <path d="m30 30 0-2m0 19v2m-8-13-2-1m18 7 2 1m-16-11-2-2m14 16 2 2" stroke="#a0e8bd" stroke-width="1.4"/>
    <path d="m19 48 8 3" stroke="#79c1ad" stroke-width="1.4"/>
    <circle cx="39" cy="53" r="1.5" fill="#f0c878"/>
  `,
    { x: 21, y: 57, width: 34, height: 24 },
  );
}

/** Compact regolith processor and clear collection cylinder on the D4 console footprint. */
function iceProcessor(): SvgAsset {
  return asset('ice-processor', 74, 94, `
    <ellipse cx="40" cy="80" rx="33" ry="10" fill="#122532" opacity=".6"/>
    <path d="m7 69 28-16 34 11-28 17Z" fill="#6d8b8f" stroke="#b8c7b6"/>
    <path d="m7 69 34 12 28-17v5L41 86 7 74Z" fill="#294654" stroke="#829da1"/>
    <path d="m10 27 16-11 25 7-15 12Z" fill="#dddecb" stroke="#b4c3b7"/>
    <path d="m10 27 26 8v28L10 55Z" fill="#9cafa7" stroke="#d7dccc"/>
    <path d="m36 35 15-12v28L36 63Z" fill="#456570" stroke="#8faeb0"/>
    <path d="m13 32 19 6v15l-19-6Z" fill="#173947"/>
    <path d="m16 40 3-3 3 6 3-2 4 3" stroke="#b2d9d3" stroke-width="1.4"/>
    <path d="m16 56 16 5" stroke="#dfb475" stroke-width="2.6"/>
    <path d="m18 23 4-14 21 5-4 13Z" fill="#223d4d" stroke="#d7dbce"/>
    <path d="m23 14 14 4m-15 0 14 4" stroke="#9ba9a5" stroke-width="1.5"/>
    <path d="M45 41l13-7q5-3 5 2v11" stroke="#1d3546" stroke-width="5"/>
    <path d="M45 41l13-7q5-3 5 2v11" stroke="#d7ac71" stroke-width="2"/>
    <path d="M53 47h16v19c0 7-16 7-16 0Z" fill="#2a5467" stroke="#a1c7cc" stroke-width="1.5"/>
    <path d="M57 51v15m7-11h3m-3 5h3" stroke="#d2e9e4" stroke-width="1" opacity=".74"/>
    <ellipse cx="61" cy="47" rx="8" ry="3.5" fill="#a3bdb9" stroke="#d1d9ca"/>
    <path d="m19 72 16 6m-12-8 16 6" stroke="#ded1a4" stroke-width="1.5"/>
  `, { x: 21, y: 57, width: 34, height: 24 });
}

function battery(): SvgAsset {
  const units = [0, 1, 2]
    .map(
      (i) => `<g transform="translate(${11 + i * 29} ${37 + i * 9})">
    <path d="m0 0 20-12 26 7-20 13Z" fill="#c0d0c1"/>
    <path d="m0 0 26 8v32L0 32Z" fill="#91aea2" stroke="#b9cdc0"/>
    <path d="m26 8 20-13v32L26 40Z" fill="#466e7b"/>
    <path d="m6 10 13 4v15l-13-4Z" fill="#1c4352"/>
    <path d="m8 14 9 3m-9 2 9 3m-9 2 9 3" stroke="#a1e6bf" stroke-width="2"/>
    <path d="m31 13 10-6m-10 11 10-6m-10 11 10-6" stroke="#7599a0" stroke-width="2"/>
  </g>`,
    )
    .join('');
  return asset(
    'battery',
    130,
    112,
    `<ellipse cx="66" cy="90" rx="57" ry="17" fill="#102a36" opacity=".4"/>${units}`,
    { x: 14, y: 54, width: 100, height: 39 },
  );
}

/** D6 Lunar Ascent Vehicle, Service Gantry & Deep-Space Ka-Band Downlink Dish */
function ascent(): SvgAsset {
  return asset(
    'ascent',
    230,
    235,
    `
    <ellipse cx="118" cy="196" rx="96" ry="26" fill="#102532" opacity=".46"/>
    <!-- Isometric Octagonal Blast Launchpad -->
    <path d="m22 174 72-36 112 34-72 38Z" fill="#4c6472" stroke="#9cb4b8" stroke-width="2"/>
    <path d="m22 174 112 36v10L22 184Zm112 36 72-38v10l-72 38Z" fill="#2c4454" stroke="#6a8591" stroke-width="1.5"/>
    <path d="m52 173 46-22 72 22-46 24Z" fill="#213542" stroke="#e2b96f" stroke-width="2" stroke-dasharray="6 4"/>

    <!-- Umbilical Service Gantry Tower (Left) -->
    <path d="M58 172V64l18-8v114" fill="#3b5668" stroke="#9ab2b6" stroke-width="1.6"/>
    <path d="M58 84l18 8m-18 16 18 8m-18 16 18 8m-18 16 18 8M76 76l-18 16m18 8-18 16m18 8-18 16" stroke="#b7cbc9" stroke-width="1.2"/>
    <path d="M76 88h26m-26 26h24" stroke="#d5b06e" stroke-width="3"/>

    <!-- Gold Foil Descent Stage + Landing Legs -->
    <path d="M92 156 76 178m62-22 18 22m-48-18-8 24m24-24 10 24" stroke="#cfd8d2" stroke-width="3.2"/>
    <ellipse cx="74" cy="179" rx="7" ry="3" fill="#9fb4b6"/>
    <ellipse cx="158" cy="179" rx="7" ry="3" fill="#9fb4b6"/>
    <path d="m88 128 28-14 32 14v28l-32 14-28-14Z" fill="url(#kapton-foil)" stroke="#7c5b2b" stroke-width="1.8"/>
    <path d="M116 114v56m-28-42 28 14 32-14" stroke="#fce29a" stroke-width="1.2" opacity=".7"/>

    <!-- Pressurized Crew Ascent Cabin -->
    <path d="M94 82c0-20 48-20 48 0v42c0 10-48 10-48 0Z" fill="url(#ascent-wall)" stroke="#314e5e" stroke-width="2"/>
    <ellipse cx="118" cy="76" rx="22" ry="11" fill="#e9ece0" stroke="#7c969c" stroke-width="1.5"/>
    <path d="m104 92 12 4v13l-12-4Zm18 4 12-4v13l-12 4Z" fill="#173e4f" stroke="#c8ded8" stroke-width="1.6"/>
    <path d="m106 95 8 3m18 0 8-3" stroke="#8ff0dc" stroke-width="1.8"/>
    <path d="M118 65V42" stroke="#dce4dc" stroke-width="2.5"/>
    <circle cx="118" cy="40" r="3.5" fill="#7ee8cf"/>

    <!-- Ka-Band High-Gain Earth Downlink Dish (Right) -->
    <g transform="translate(178 134)">
      <path d="M0 32V6" stroke="#c7d4d0" stroke-width="4"/>
      <ellipse cx="2" cy="2" rx="22" ry="12" transform="rotate(-28)" fill="#d8e2dd" stroke="#5b7c88" stroke-width="2"/>
      <ellipse cx="2" cy="2" rx="13" ry="7" transform="rotate(-28)" fill="#89b4be" opacity=".55"/>
      <path d="M-8-4 8-16m-2 18 2-18" stroke="#456573" stroke-width="1.8"/>
      <circle cx="8" cy="-16" r="2.8" fill="#f0c373"/>
    </g>
    <text x="86" y="199" fill="#d9e4dc" font-size="6.5" font-family="monospace" letter-spacing="1.5">ASCENT / 06</text>
  `,
    { x: 36, y: 142, width: 162, height: 64 },
    `<linearGradient id="kapton-foil" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8d87c"/><stop offset=".5" stop-color="#d49b38"/><stop offset="1" stop-color="#7c531b"/></linearGradient>`,
  );
}

/** Six-wheel training rover with separate parked, occupied and rolling textures. */
function lunarCar(occupied: boolean, rolling = false): SvgAsset {
  const key = occupied ? (rolling ? 'lunar-car-rolling' : 'lunar-car-occupied') : 'lunar-car';
  const pilotHelmet = occupied
    ? `<g transform="translate(52 29)">
        <ellipse cx="14" cy="11" rx="9" ry="9.5" fill="#f2f4e6" stroke="#355260" stroke-width="1.4"/>
        <path d="M8 9q6-4 12 0v5q-6 5-12 0Z" fill="#f4be62" stroke="#5c4428" stroke-width="1"/>
        <path d="M10 9l4-1" stroke="#fff9df" stroke-width="1.3"/>
      </g>`
    : '';
  return asset(
    key,
    152,
    116,
    `
    <ellipse cx="76" cy="95" rx="64" ry="16" fill="#0e222e" opacity=".48"/>
    <!-- Back / Far Rocker-Bogie Wheels -->
    <g fill="#182e3b" stroke="#6c8790" stroke-width="2.5">
      <ellipse cx="38" cy="70" rx="8" ry="11"/>
      <ellipse cx="74" cy="64" rx="8" ry="11"/>
      <ellipse cx="111" cy="64" rx="8" ry="11"/>
    </g>
    <!-- Chassis Deck & Sample Cryo-Rack -->
    <path d="m18 56 44-24 72 23-44 26Z" fill="#cfd8cd" stroke="#5b7882" stroke-width="2"/>
    <path d="m18 56 72 25v14L18 70Zm72 25 44-26v14L90 95Z" fill="#6f8c94" stroke="#b9ccc5" stroke-width="1.6"/>
    <path d="m22 62 64 22" stroke="#ebb969" stroke-width="3"/>
    <path d="m27 73 19 9 19-2 27 12 24-11 13-7" stroke="#243c4d" stroke-width="5"/>
    <path d="m29 73 17 7 20-2 26 12 24-11 13-7" stroke="#b2c4c5" stroke-width="1.8"/>
    <path d="m92 83 39-24v9L92 92Z" fill="#496776" stroke="#a8bec0"/>
    <path d="m99 83 20-12m-20 16 20-12" stroke="#203b4d" stroke-width="1.4"/>

    <!-- Rear Cryo-Core Canister Bay -->
    <rect x="26" y="34" width="10" height="18" rx="3" fill="#38bdf8" stroke="#1e3d4f" stroke-width="1.5"/>
    <rect x="39" y="31" width="10" height="18" rx="3" fill="#67e8f9" stroke="#1e3d4f" stroke-width="1.5"/>

    <!-- Pressurized Rover Cabin & Panoramic Canopy -->
    <path d="m44 48 28-18 44 15-26 19Z" fill="#ecefe2" stroke="#6d8a91" stroke-width="1.8"/>
    <path d="m44 48 46 16v14L44 62Z" fill="#9fb5b2" stroke="#dce5dd" stroke-width="1.4"/>
    <path d="m49 53 26 9v8l-26-9Z" fill="#426579" stroke="#d5ddcf"/>
    <path d="m52 55 14 5m-14-1 9 3" stroke="#d5b778" stroke-width="1.2"/>
    <path d="m52 34 22-12 34 12-18 15-38-5Z" fill="url(#${key}-glass)" stroke="#d9e7e2" stroke-width="1.8"/>
    ${pilotHelmet}
    <path d="m58 34 16-8 24 8" stroke="#aef6e5" stroke-width="1.4" opacity=".75"/>

    <!-- Roof Radar Mast & Telemetry Beacon -->
    <path d="M74 22V7" stroke="#d8e3dc" stroke-width="2.6"/>
    <path d="m66 8 10-4 9 3v7l-10 4-9-3Z" fill="#dce6dd" stroke="#62818a" stroke-width="1.4"/>
    <circle cx="81" cy="10" r="2.5" fill="${occupied ? '#4ade80' : '#38bdf8'}"/>

    <!-- Front Articulated Cryo-Laser Drill Arm & Twin Halogen Headlights -->
    <path d="m118 64 18 7-6 9" stroke="#d9a85c" stroke-width="3.5"/>
    <circle cx="132" cy="78" r="4" fill="#38bdf8" stroke="#e0f2fe" stroke-width="1.3"/>
    <circle cx="98" cy="78" r="3.6" fill="${occupied ? '#fef08a' : '#cbd5e1'}"/>
    <circle cx="122" cy="64" r="3.6" fill="${occupied ? '#fef08a' : '#cbd5e1'}"/>
    <circle cx="20" cy="63" r="2.2" fill="#f0a085"/>

    <!-- Near rocker-bogie wheels and titanium mesh treads -->
    ${[[26, 75], [65, 88], [109, 91]].map(([x, y]) => `<g transform="translate(${x} ${y})">
      <ellipse rx="10" ry="13" fill="#172c3b" stroke="#3d5968" stroke-width="2.3"/>
      <ellipse rx="6.8" ry="10.2" fill="#304d5d" stroke="#b0c4bf" stroke-width="1.5"/>
      <path d="${rolling ? 'M-5-4h10M-6 3h12m-9 5h6' : 'M-3-8h6M-6-2h12M-5 5h10'}" stroke="#829d9d" stroke-width="1.2"/>
      <circle r="2.6" fill="#e9d3a4"/>
    </g>`).join('')}
  `,
    { x: 20, y: 58, width: 110, height: 40 },
  );
}

/** Survey marker at a fictional icy regolith sampling point. */
function iceCrystal(mined: boolean): SvgAsset {
  return asset(
    mined ? 'ice-crystal-mined' : 'ice-crystal',
    68,
    72,
    `
    <ellipse cx="34" cy="60" rx="29" ry="9" fill="#142733" opacity=".68"/>
    <path d="m8 57 10-13 12-3 12 4 9-1 10 14-20 6-22-2Z" fill="#526370" stroke="#283e4d" stroke-width="1.4"/>
    <path d="m9 56 10-12 12-3-6 10 15 4 12-10 7 13-21 4-19-2Z" fill="#809195"/>
    ${mined
      ? '<ellipse cx="34" cy="52" rx="7" ry="3.3" fill="#20313f" stroke="#adb9b3"/><path d="m46 40 4 4 7-9" stroke="#c2e5cb" stroke-width="2"/>'
      : '<path d="m14 55 9-5 3 4 7 1m6 2 8-7 5 2" stroke="#b8d6df" stroke-width="2"/><path d="M34 50V23" stroke="#c8d4ce" stroke-width="2"/><path d="m34 24 14 3-14 7Z" fill="#8ecfdf" stroke="#d1e6e7" stroke-width=".9"/>'}
  `,
  );
}

/** Collectible NASA Scientific Field Sample Beacon (uncollected glowing geode & surveyed flag states) */
function fieldSample(collected: boolean): SvgAsset {
  const key = collected ? 'field-sample-collected' : 'field-sample';
  if (collected) {
    return asset(
      key,
      48,
      56,
      `
      <ellipse cx="24" cy="50" rx="14" ry="4" fill="#0b1b26" opacity=".5"/>
      <line x1="24" y1="14" x2="24" y2="50" stroke="#64748b" stroke-width="2.4"/>
      <polygon points="24,14 42,22 24,30" fill="#22c55e" opacity=".9" stroke="#86efac" stroke-width="1.2"/>
      <circle cx="24" cy="14" r="2.5" fill="#fde047"/>
    `,
    );
  }
  return asset(
    key,
    48,
    56,
    `
    <ellipse cx="24" cy="50" rx="18" ry="5.5" fill="#f59e0b" opacity=".3"/>
    <line x1="24" y1="36" x2="24" y2="50" stroke="#94a3b8" stroke-width="2.5"/>
    <polygon points="24,8 38,24 24,40 10,24" fill="url(#sample-gold-grad)" stroke="#fef08a" stroke-width="1.8"/>
    <polygon points="24,14 32,24 24,34 16,24" fill="#ffffff" opacity=".45"/>
    <circle cx="24" cy="6" r="3" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.2"/>
  `,
    undefined,
    `<linearGradient id="sample-gold-grad" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#fef08a"/><stop offset=".45" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></linearGradient>`,
  );
}

const SUIT_VARIANTS: CrewSuitId[] = ['commander', 'engineer', 'scientist'];

/** Full SVG texture manifest pre-rasterized once into Phaser Canvas textures at startup. */
export const GAME_ART: SvgAsset[] = [
  terrain(),
  rock(),
  ...[
    habitat(),
    solar(true),
    solar(false),
    water(),
    greenhouse('greenhouse', 0),
    greenhouse('greenhouse-tray', 0.6),
    greenhouse('greenhouse-mid', 0.8),
    greenhouse('greenhouse-growing', 1),
    greenhouse('greenhouse-harvested', 0, true),
    shelter(),
    terminal(),
    iceProcessor(),
    battery(),
    lifeSupport(),
    ascent(),
  ].map(detailFacility),
  lunarCar(false),
  lunarCar(true),
  lunarCar(true, true),
  iceCrystal(false),
  iceCrystal(true),
  fieldSample(false),
  fieldSample(true),
  aiDrone(0),
  aiDrone(1),
  crewmate('ghost', 'down', 0, true),
  crewmate('ghost', 'down', 1, true),
  ...SUIT_VARIANTS.flatMap((suit) =>
    (['down', 'up', 'left', 'right'] as const).flatMap((direction) => [
      ...Array.from({ length: CHARACTER.walkFrames }, (_, frame) =>
        crewmate(suit, direction, frame),
      ),
      crewmate(suit, direction, 0, true),
      crewmate(suit, direction, 1, true),
    ]),
  ),
];

export function svgDataUri(source: string): string {
  const bytes = new TextEncoder().encode(source);
  return `data:image/svg+xml;base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}`;
}
