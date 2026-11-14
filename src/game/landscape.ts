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
    <g transform="scale(${r / 100})">
      <path d="M-99-4-83-28-52-43-23-51 13-53 50-46 81-30 101-2 70-17 40-23 5-25-38-20-71-10Z" fill="#182733" opacity=".86"/>
      <path d="M-92 13-74 27-43 40-8 46 22 42 61 35 92 13 79 34 45 47 11 53-26 49-61 42-84 29Z" fill="#c1b49b" opacity=".57"/>
      <path d="m-93-18 24-18 33-12 39-5 21 3m18 1 31 14 18 18m-155 49 36 13 37 5 34-4m13-3 22-11 17-15" stroke="#e3d4b8" stroke-width="2" opacity=".57"/>
      <path d="m-76-10 26-10 27 2 17-6m-49 56 21 5 20-4m27 5 27-8 19-10 18-3" stroke="#71818a" stroke-width="1.7" opacity=".72"/>
    </g>
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
          <stop stop-color="#afa48e"/>
          <stop offset=".50" stop-color="#63737c"/>
          <stop offset="1" stop-color="#2d465c"/>
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
          <stop stop-color="#c0b39a"/>
          <stop offset=".6" stop-color="#8d8c7f"/>
          <stop offset="1" stop-color="#586570"/>
        </linearGradient>
        <linearGradient id="ridge-cliff" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#526978"/>
          <stop offset=".55" stop-color="#253e53"/>
          <stop offset="1" stop-color="#10253b"/>
        </linearGradient>
        <radialGradient id="cold-trap" cx=".55" cy=".55" r=".62">
          <stop stop-color="#365268"/>
          <stop offset=".58" stop-color="#243d52"/>
          <stop offset="1" stop-color="#112438"/>
        </radialGradient>
        <linearGradient id="space-sky" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#02060d"/>
          <stop offset=".68" stop-color="#061220"/>
          <stop offset="1" stop-color="#0e2235"/>
        </linearGradient>
        <linearGradient id="sun-shaft" x1="0.2" y1="0" x2="0.65" y2="1">
          <stop stop-color="#fef08a" stop-opacity=".22"/>
          <stop offset=".5" stop-color="#fde047" stop-opacity=".08"/>
          <stop offset="1" stop-color="#fde047" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Base Shackleton Regolith -->
      <path fill="url(#ground)" d="M0 0h1840v1120H0z"/>
      <path d="M0 590 196 606 318 584 536 594 694 571 914 592 1085 562 1266 583 1448 552 1692 582 1840 555v62l-164 30-220-37-160 41-192-21-184 25-221-24-153 28-204-20-137 23L0 637Z" fill="#cec0a9" opacity=".11"/>
      <path d="M0 691 166 654 281 670 319 724 259 757 109 784 0 813Zm615 35 125-50 174 12 55 43-37 42-157-14-131 30ZM936 205l181-19 128 26 100-18 159 28-58 56-174-17-119 24-118-42-114 26Z" fill="#3a4c58" opacity=".24"/>

      <!-- Subtle Topographic Contour Lines across the Plateau -->
      <g stroke="#d8cbb3" stroke-width="1.1" stroke-dasharray="8 6" opacity=".18" fill="none">
        <path d="M35 535 Q 360 565 735 505 T 1520 515 L 1810 495"/>
        <path d="M45 645 Q 480 615 920 640 T 1790 610"/>
        <path d="M85 885 Q 520 845 940 895"/>
      </g>

      <!-- Far Northern Space-Horizon Rim Silhouette, Starfield, Grazing Sun & Crescent Earth (Framed in visible viewport y=0..205) -->
      <path d="M0 192 95 152 142 164 198 126 268 148 345 142 425 156 495 134 555 112 628 144 712 148 795 168 885 142 948 146 1015 118 1085 138 1155 148 1235 142 1310 158 1390 132 1475 136 1555 114 1635 142 1735 134 1840 152V0H0Z" fill="url(#space-sky)"/>
      <!-- Distant secondary lunar mountain range -->
      <path d="M0 192 95 152 142 164 198 126 268 148 345 142 425 156 495 134 555 112 628 144 712 148 795 168 885 142 948 146 1015 118 1085 138 1155 148 1235 142 1310 158 1390 132 1475 136 1555 114 1635 142 1735 134 1840 152 L1840 198 1715 178 1595 188 1460 172 1325 192 1190 182 1035 168 910 188 785 196 645 178 535 162 415 186 265 178 135 194 0 212Z" fill="#2c3d4b" opacity=".82"/>
      ${Array.from({ length: 120 }, (_, i) => {
        const sx = (((Math.sin(i * 91.7 + 4) * 43758.5453) % 1) + 1) % 1 * 1820 + 10;
        const sy = (((Math.sin(i * 47.3 + 9) * 24631.193) % 1) + 1) % 1 * 132 + 6;
        const sr = (0.75 + (i % 5) * 0.38).toFixed(1);
        const col = i % 6 === 0 ? '#7dd3fc' : i % 4 === 0 ? '#fef08a' : '#f8fafc';
        return `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr}" fill="${col}" opacity="${(0.5 + (i % 4) * 0.15).toFixed(2)}"/>`;
      }).join('')}
      <!-- 1.55 deg Grazing South-Polar Horizon Sun, Lens Flare & Diagonal Light Shafts -->
      <polygon points="555,112 180,490 695,485" fill="url(#sun-shaft)"/>
      <g transform="translate(555 112)">
        <ellipse cx="0" cy="0" rx="135" ry="44" fill="#fde047" opacity=".2"/>
        <ellipse cx="0" cy="0" rx="68" ry="24" fill="#fef08a" opacity=".38"/>
        <line x1="-165" y1="0" x2="165" y2="0" stroke="#fef9c3" stroke-width="1.8" opacity=".68"/>
        <line x1="-75" y1="-22" x2="75" y2="22" stroke="#fef08a" stroke-width="1" opacity=".35"/>
        <circle cx="0" cy="0" r="15" fill="#fffbeb"/>
      </g>
      <!-- Crescent Blue-Marble Earth hanging in the Polar Sky -->
      <g transform="translate(1245 84)">
        <circle cx="0" cy="0" r="32" fill="#38bdf8" opacity=".16"/>
        <circle cx="0" cy="0" r="22" fill="#082f49"/>
        <path d="M-6 -21 A22 22 0 0 1 -6 21 A15 21 0 0 0 -6 -21Z" fill="#0ea5e9"/>
        <path d="M3 -15 A17 17 0 0 1 9 12 A13 16 0 0 0 3 -15Z" fill="#e0f2fe" opacity=".82"/>
      </g>
      <path d="M0 192 95 152 142 164 198 126 268 148 345 142 425 156 495 134 555 112 628 144 712 148 795 168 885 142 948 146 1015 118 1085 138 1155 148 1235 142 1310 158 1390 132 1475 136 1555 114 1635 142 1735 134 1840 152" stroke="#fde68a" stroke-width="2.8" opacity=".76"/>

      <!-- ZONE 1: NW ELEVATED SUNLIT SHACKLETON RIM CREST (+2 ELEVATION, D1 SOLAR) -->
      <path d="M40 468 118 480 195 496 278 489 420 502 482 494 562 486 615 476 663 434 705 398 694 330 715 165 618 154 510 132 401 147 310 136 195 140 132 167 40 205Z" fill="url(#sunlit-ridge)"/>
      <!-- 2.5D Extruded Rock Cliff Wall along South/East Edge of Sunlit Ridge -->
      <path d="M40 468 118 480 195 496 278 489 420 502 482 494 562 486 615 476 663 434 705 398 705 434 669 457 615 514 561 520 487 529 420 538 280 523 195 530 117 513 40 500Z" fill="url(#ridge-cliff)"/>
      <path d="M40 468 118 480 195 496 278 489 420 502 482 494 562 486 615 476 663 434 705 398" stroke="#dfd3b9" stroke-width="3" opacity=".65"/>
      <g stroke="#1b2b39" stroke-width="2" opacity=".55">
        <path d="M120 482l-6 30m95-14-5 32m115-12-4 34m125-18-4 34m115-32-4 34m95-56-4 32"/>
      </g>
      <path d="m46 472 149 29 86-6 139 12 195-26 86-75-41 56-44 36-196 27-138-12-80 8L46 494Z" fill="#75808a" opacity=".5"/>
      <path d="m53 495 64 7 49-2 88 19 79-5 82 13 99-14 72-1 36-18 73-64" stroke="#131f2b" stroke-width="3" opacity=".67"/>
      <path d="m45 293 58-16 69 14 24-18 82 7m290-70 49-12 64 18 16 35m-420 186 63 8 72-11 46 5" stroke="#d8cbb1" stroke-width="1.5" opacity=".22"/>
      <path d="m43 213 113-48 91-17 60 13-56 30-82 2-58 46-69 13Zm522 25 46-36 57 12 31 31-14 45-41-18-48 4Z" fill="#bdac8d" opacity=".22"/>

      <!-- ZONE 3: SE SUNKEN 90 K PERMANENTLY SHADOWED COLD-TRAP BASIN (-2 ELEVATION, D4 ICE) -->
      <path d="M1035 675 1108 652 1185 622 1300 615 1388 628 1465 618 1558 632 1612 655 1695 668 1745 748 1765 815 1754 883 1756 925 1735 995 1601 1041 1515 1058 1374 1043 1276 1058 1175 1048 1082 1005 1005 945 999 854 985 785Z" fill="#253543"/>
      <path d="M1055 702 1195 654 1302 643 1391 658 1458 650 1534 659 1588 680 1672 696 1716 762 1738 825 1726 888 1730 928 1710 978 1590 1021 1505 1034 1376 1019 1278 1035 1188 1024 1106 992 1032 932 1027 857 1012 795Z" fill="url(#cold-trap)"/>
      <!-- Stepped Crater Rim Wall at Top of Cold-Trap Basin -->
      <path d="M1035 675 1108 652 1185 622 1300 615 1388 628 1465 618 1558 632 1612 655 1695 668 1672 696 1588 680 1534 659 1458 650 1391 658 1302 643 1195 654 1055 702Z" fill="#182633" opacity=".9"/>
      <path d="M1035 675 1108 652 1185 622 1300 615 1388 628 1465 618 1558 632 1612 655 1695 668" stroke="#a1a8a6" stroke-width="2.5" opacity=".42"/>
      <path d="m1181 628 15 21m85-31 21 25m121-18 11 26m112-17-12 25m75-5-21 26m76-10 8 26m67 59-24 7m45 51-22 12m9 63-21 1" stroke="#536778" stroke-width="3" opacity=".65"/>
      <path d="m1027 864 31 38 60 28 66 63 103 19 88-14 126 20 71-13 136-45-12 19-103 41-89 14-128-15-98 16-90-11-82-39-73-55Z" fill="#819095" opacity=".25"/>
      <path d="m1138 759 57-17 56 12 50-16m78 31 42-14 54 15 39-9m-305 147 48-26 75 11 55 27m65-20 58-18 62-6" stroke="#7dd3fc" stroke-width="1.6" opacity=".36"/>
      <ellipse cx="1370" cy="855" rx="250" ry="95" fill="#0ea5e9" opacity=".08"/>

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
