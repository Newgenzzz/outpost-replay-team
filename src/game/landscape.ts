import type { SvgAsset } from './art';
import { IMPACT_CRATERS } from './world';

function depression(x: number, y: number, r: number): string {
  const ring = (radius: number) =>
    Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      const k = 1 + Math.sin(a * 7) * 0.043 + Math.cos(a * 11) * 0.02;
      return `${(Math.cos(a) * radius * k).toFixed(1)},${(Math.sin(a) * radius * 0.53 * k).toFixed(1)}`;
    }).join(' ');

  const ejecta = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const inner = r * (1.08 + (i % 3) * 0.03);
    const outer = inner + r * (0.08 + (i % 4) * 0.04);
    return `<path d="M${(Math.cos(a) * inner).toFixed(1)} ${(Math.sin(a) * inner * 0.53).toFixed(1)}L${(Math.cos(a) * outer).toFixed(1)} ${(Math.sin(a) * outer * 0.53).toFixed(1)}" stroke="#c2b7a3" stroke-width="${1 + (i % 3)}" opacity=".11"/>`;
  }).join('');

  return `<g transform="translate(${x} ${y})">
    ${ejecta}
    <polygon points="${ring(r * 1.16)}" fill="#bcae98" opacity=".12"/>
    <polygon points="${ring(r * 1.06)}" fill="url(#crater-rim)"/>
    <polygon points="${ring(r)}" fill="url(#crater)"/>
    <path d="M${-r} 0C${-r * 0.9} ${-r * 0.68} ${r * 0.8} ${-r * 0.68} ${r} 0" stroke="#e9dcc3" stroke-width="2" opacity=".45"/>
    <path d="M${-r * 0.8} ${-r * 0.13}C${-r * 0.46} ${-r * 0.43} ${r * 0.52} ${-r * 0.4} ${r * 0.82} 0" stroke="#152534" stroke-width="${Math.max(3, r * 0.1)}" opacity=".68"/>
    <path d="M${-r * 0.94} ${r * 0.1}C${-r * 0.7} ${r * 0.58} ${r * 0.72} ${r * 0.59} ${r * 0.99} 0" stroke="#d4c6a9" stroke-width="2" opacity=".52"/>
    <path d="M${-r * 0.65} ${r * 0.17}q${r * 0.7} ${r * 0.3} ${r * 1.36} ${-r * 0.05}" stroke="#7d8590" stroke-width="1.2" opacity=".56"/>
  </g>`;
}

export function terrain(): SvgAsset {
  // Organic mineral regolith + 3 elevation zones baked once into one texture (zero per-frame filter cost).
  const grains = Array.from({ length: 1900 }, (_, i) => {
    const x = (((Math.sin(i * 78.233 + 2) * 43758.5453) % 1) + 1) % 1 * 1840;
    const y = (((Math.sin(i * 33.713 + 7) * 19739.371) % 1) + 1) % 1 * 1120;
    return `<path d="m${x.toFixed(1)} ${y.toFixed(1)} ${1 + (i % 3)} ${i % 2 ? 0.6 : -0.6}" stroke="${i % 4 ? '#c4b49b' : '#172837'}" stroke-width="${i % 13 === 0 ? 2 : 0.65}" opacity="${i % 4 ? 0.14 : 0.22}"/>`;
  }).join('');

  const rubble = [
    [165, 535], [190, 560], [220, 540], [1685, 290], [1660, 320],
    [1720, 620], [1655, 650], [175, 965], [225, 980], [255, 955],
    [680, 145], [715, 155], [1160, 165], [1420, 175],
  ]
    .map(
      ([x, y], i) =>
        `<g transform="translate(${x} ${y})"><ellipse cx="7" cy="4" rx="${7 + (i % 5)}" ry="4" fill="#172939" opacity=".4"/><path d="m-6 0 3-6 7 1 4 7-9 2Z" fill="#96938a"/><path d="m-3-6 7 1 4 7-7-1Z" fill="#53606b"/></g>`,
    )
    .join('');

  const pebbles = Array.from({ length: 210 }, (_, i) => {
    const x = ((i * 587.41) % 1814) + 12;
    const y = ((i * 223.69) % 976) + 125;
    const size = 1.2 + (i % 13 === 0 ? 2 : 0) + (i % 7) * 0.24;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${size})"><path d="m-1 0 1-1 3 1 2 1-4 .5Z" fill="#182937" opacity=".35"/><path d="m-1 0 .5-1.15 1.5-.2 1 1.2-1.8.55Z" fill="${i % 2 ? '#beb5a6' : '#919797'}" opacity=".59"/></g>`;
  }).join('');

  return {
    key: 'terrain',
    width: 1840,
    height: 1120,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1840" height="1120" viewBox="0 0 1840 1120" fill="none">
      <defs>
        <radialGradient id="ground" cx=".34" cy=".26" r=".88">
          <stop stop-color="#a49b88"/>
          <stop offset=".48" stop-color="#6d7074"/>
          <stop offset="1" stop-color="#354857"/>
        </radialGradient>
        <linearGradient id="crater" x1=".1" y1=".1" x2=".7" y2="1">
          <stop stop-color="#142330"/>
          <stop offset=".54" stop-color="#485464"/>
          <stop offset="1" stop-color="#9e9584"/>
        </linearGradient>
        <linearGradient id="crater-rim" x2=".7" y2="1">
          <stop stop-color="#d2c3a7"/>
          <stop offset=".55" stop-color="#89857b"/>
          <stop offset="1" stop-color="#424b54"/>
        </linearGradient>
        <linearGradient id="sunlit-ridge" x1="0" y1="0" x2=".85" y2="1">
          <stop stop-color="#a89e8a"/>
          <stop offset=".6" stop-color="#878074"/>
          <stop offset="1" stop-color="#626569"/>
        </linearGradient>
        <linearGradient id="ridge-cliff" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#4e5861"/>
          <stop offset=".55" stop-color="#283846"/>
          <stop offset="1" stop-color="#172634"/>
        </linearGradient>
        <radialGradient id="cold-trap" cx=".55" cy=".55" r=".62">
          <stop stop-color="#0d2233"/>
          <stop offset=".58" stop-color="#183448"/>
          <stop offset="1" stop-color="#2c4657"/>
        </radialGradient>
        <filter id="mineral" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".018 .025" numOctaves="3" seed="18"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="linear" slope=".17"/></feComponentTransfer>
          <feBlend in="SourceGraphic" mode="soft-light"/>
        </filter>
      </defs>

      <!-- Base Shackleton Regolith -->
      <path fill="url(#ground)" d="M0 0h1840v1120H0z"/>
      <g filter="url(#mineral)"><path d="M0 0h1840v1120H0Z" fill="url(#ground)"/></g>

      <!-- Far Northern Space-Horizon Rim Silhouette -->
      <path d="M0 118 109 80 138 87 165 58 224 75 295 73 360 82 454 71 493 59 515 60 545 44 615 68 681 71 765 92 882 70 915 72 985 52 1045 61 1071 73 1185 72 1245 86 1300 67 1370 69 1470 58 1510 46 1602 69 1685 61 1840 78V0H0Z" fill="#08131e"/>
      <path d="M0 118 109 80 138 87 165 58 224 75 295 73 360 82 454 71 493 59 515 60 545 44 615 68 681 71 765 92 882 70 915 72 985 52 1045 61 1071 73 1185 72 1245 86 1300 67 1370 69 1470 58 1510 46 1602 69 1685 61 1840 78" stroke="#ded0b4" stroke-width="2.5" opacity=".56"/>
      <path d="M0 118 109 80 138 87 165 58 224 75 295 73 360 82 454 71 493 59 515 60 545 44l-58 52-93 20-190-10-96 26L0 137Z" fill="#455260" opacity=".57"/>
      <g fill="#e8f0ec" opacity=".65">
        <circle cx="95" cy="28" r="1.3"/><circle cx="242" cy="36" r="1.6"/><circle cx="430" cy="22" r="1.1"/>
        <circle cx="670" cy="34" r="1.5"/><circle cx="885" cy="26" r="1.2"/><circle cx="1115" cy="31" r="1.7"/>
        <circle cx="1365" cy="24" r="1.2"/><circle cx="1630" cy="29" r="1.5"/><circle cx="1775" cy="38" r="1.1"/>
      </g>

      <!-- ZONE 1: NW ELEVATED SUNLIT SHACKLETON RIM CREST (+2 ELEVATION, D1 SOLAR) -->
      <path d="M40 468 195 496 420 502 615 476 705 398 715 165 510 132 195 140 40 205Z" fill="url(#sunlit-ridge)"/>
      <!-- 2.5D Extruded Rock Cliff Wall along South/East Edge of Sunlit Ridge -->
      <path d="M40 468 195 496 420 502 615 476 705 398 705 434 615 514 420 538 195 530 40 500Z" fill="url(#ridge-cliff)"/>
      <path d="M40 468 195 496 420 502 615 476 705 398" stroke="#dfd3b9" stroke-width="3" opacity=".55"/>
      <g stroke="#1b2b39" stroke-width="2" opacity=".55">
        <path d="M120 482l-6 30m95-14-5 32m115-12-4 34m125-18-4 34m115-32-4 34m95-56-4 32"/>
      </g>
      <path d="m46 472 149 29 225 6 195-26 86-75-41 56-44 36-196 27-138-12-80 8L46 494Z" fill="#75808a" opacity=".5"/>
      <path d="m53 495 64 7 49-2 88 19 79-5 82 13 99-14 72-1 36-18 73-64" stroke="#131f2b" stroke-width="3" opacity=".67"/>
      <path d="m45 293 58-16 69 14 24-18 82 7m290-70 49-12 64 18 16 35m-420 186 63 8 72-11 46 5" stroke="#d8cbb1" stroke-width="1.5" opacity=".22"/>

      <!-- ZONE 3: SE SUNKEN 90 K PERMANENTLY SHADOWED COLD-TRAP BASIN (-2 ELEVATION, D4 ICE) -->
      <path d="M1035 675 1185 622 1465 618 1695 668 1765 815 1735 995 1515 1058 1175 1048 1005 945 985 785Z" fill="#213546"/>
      <path d="M1055 702 1195 654 1458 650 1672 696 1738 825 1710 978 1505 1034 1188 1024 1032 932 1012 795Z" fill="url(#cold-trap)"/>
      <!-- Stepped Crater Rim Wall at Top of Cold-Trap Basin -->
      <path d="M1035 675 1185 622 1465 618 1695 668 1672 696 1458 650 1195 654 1055 702Z" fill="#132434" opacity=".82"/>
      <path d="M1035 675 1185 622 1465 618 1695 668" stroke="#7aa2b8" stroke-width="2.5" opacity=".4"/>
      <path d="M1055 702 1195 654 1458 650 1672 696l27 61-38-48-207-47-245 4-89 33Z" fill="#080f1e" opacity=".66"/>
      <path d="M1020 915 1084 956 1198 1014 1506 1024 1707 971l-8 17-194 47-319-7-156-92Z" fill="#7b94a0" opacity=".18"/>
      <!-- Subsurface Permafrost Crystalline Fractures -->
      <g stroke="#38bdf8" stroke-width="1.6" opacity=".24">
        <path d="m1155 790 65-24 48 18m125-32 72 22 40-15m-285 135 84-19 52 25m105-12 68-28"/>
      </g>

      <!-- Ambient Impact Craters (placed outside main walkways) -->
      ${IMPACT_CRATERS.map(({ x, y, radius }) => depression(x, y, radius)).join('')}

      ${grains}
      ${pebbles}
      ${rubble}
    </svg>`,
  };
}

export function rock(): SvgAsset {
  return {
    key: 'rock',
    width: 102,
    height: 72,
    footprint: { x: 10, y: 37, width: 73, height: 22 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="102" height="72" viewBox="0 0 102 72" fill="none" stroke-linejoin="round">
      <path d="m11 47 24-26 34 7 31 28-27 13-49-8Z" fill="#1d2c3d" opacity=".38"/>
      <path d="m9 43 16-25 22-8 29 14 10 28-29 9-34-4Z" fill="#737782"/>
      <path d="m9 43 16-25 22-8 16 22-32-5-8 30Z" fill="#a09f9e"/>
      <path d="m47 10 29 14 10 28-29 9 6-29Z" fill="#4b5868"/>
      <path d="m25 18 6 9 32 5m-32-5-8 30" stroke="#c5c0b1" stroke-width="1.5" opacity=".32"/>
      <path d="m17 45 9-4m30 8 9-4m3-20 7 4" stroke="#222f40" stroke-width="2" opacity=".5"/>
    </svg>`,
  };
}
