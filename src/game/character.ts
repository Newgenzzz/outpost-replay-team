import type { SvgAsset } from './art';
import type { Facing } from './world';

/** Logical pixels; physics remains an 18×10 footprint at the boot contact. */
export const CHARACTER = {
  width: 80,
  height: 104,
  groundX: 40,
  groundY: 95,
  bodyWidth: 18,
  bodyHeight: 10,
  walkFrames: 8,
} as const;

export type CrewSuitId = 'commander' | 'engineer' | 'scientist' | 'ghost';

interface SuitPalette {
  shellTop: string;
  shellMid: string;
  shellLow: string;
  shellShadow: string;
  trim: string;
  trimDark: string;
  visorTop: string;
  visorMid: string;
  visorDeep: string;
  pack: string;
  led: string;
  badge: string;
  opacity?: number;
}

const SUIT_PALETTES: Record<CrewSuitId, SuitPalette> = {
  commander: {
    shellTop: '#fff5df',
    shellMid: '#e6ead9',
    shellLow: '#bccfce',
    shellShadow: '#7395a4',
    trim: '#d2935c',
    trimDark: '#425e6a',
    visorTop: '#fbe2a1',
    visorMid: '#e6ad5e',
    visorDeep: '#6a4b38',
    pack: '#314d60',
    led: '#92e5d2',
    badge: '01',
  },
  engineer: {
    shellTop: '#e6f9ff',
    shellMid: '#cdeaf3',
    shellLow: '#8ec5d6',
    shellShadow: '#4b7e96',
    trim: '#2dd4bf',
    trimDark: '#1d4f63',
    visorTop: '#fef08a',
    visorMid: '#38bdf8',
    visorDeep: '#1e3a5f',
    pack: '#1e4258',
    led: '#5eead4',
    badge: '02',
  },
  scientist: {
    shellTop: '#f3fce6',
    shellMid: '#dcebd0',
    shellLow: '#a8c9a5',
    shellShadow: '#5b826d',
    trim: '#eab308',
    trimDark: '#365848',
    visorTop: '#fde68a',
    visorMid: '#f59e0b',
    visorDeep: '#4b3b28',
    pack: '#2f4f46',
    led: '#bef264',
    badge: '03',
  },
  ghost: {
    shellTop: '#e0e7ff',
    shellMid: '#a5b4fc',
    shellLow: '#67e8f9',
    shellShadow: '#4338ca',
    trim: '#c084fc',
    trimDark: '#312e81',
    visorTop: '#f5d0fe',
    visorMid: '#818cf8',
    visorDeep: '#1e1b4b',
    pack: '#312e81',
    led: '#67e8f9',
    badge: 'RA',
    opacity: 0.72,
  },
};

/**
 * Articulated 2.5D space-suited crewmate sprite generator (8-frame walk + 2-frame idle).
 * Supports Commander (YOU), AI Crewmates (Engineer Leyla & Scientist Rashad), and Run A Ghost.
 */
export function crewmate(
  suit: CrewSuitId,
  direction: Facing,
  frame: number,
  idle = false,
): SvgAsset {
  const pal = SUIT_PALETTES[suit];
  const phase = (frame / CHARACTER.walkFrames) * Math.PI * 2;
  const stride = idle ? 0 : Math.sin(phase) * 3.8;
  const bounce = idle ? (frame ? -0.55 : 0) : -Math.abs(Math.sin(phase)) * 1.8;
  const sway = idle ? 0 : Math.cos(phase) * 0.9;
  const rear = direction === 'up';
  const profile = direction === 'left' || direction === 'right';
  const prefix = suit === 'commander' ? 'astronaut' : `crew-${suit}`;
  const key = `${prefix}-${direction}-${idle ? 'idle-' : ''}${frame}`;
  const gid = `${suit}-${direction}-${idle ? 'i' : 'w'}${frame}`;

  const leg = (x: number, offset: number, far = false) =>
    `<g opacity="${far ? 0.82 : 1}" transform="translate(${x} ${offset})">
      <path d="M-6 69H6L7 82 5 91H-6L-8 81Z" fill="url(#fab-${gid})" stroke="#223846" stroke-width="1.5"/>
      <path d="M-6 71H5v9H-6Z" fill="url(#cer-${gid})"/>
      <path d="M-5 82H5" stroke="${pal.trim}" stroke-width="2.4"/>
      <path d="M-7 87H6l5 5v4H-10v-5Z" fill="url(#cer-${gid})" stroke="#223846" stroke-width="1.5"/>
      <path d="M-9 94H10" stroke="#1e3240" stroke-width="3"/>
      <path d="M-5 89H4m-9 2H6" stroke="#84969b" stroke-width="1"/>
      <path d="M-8 95h2m3 0h2m3 0h2m3 0h2" stroke="#c6b996" stroke-width=".8"/>
    </g>`;

  const arm = (x: number, offset: number) =>
    `<g transform="translate(${x} ${offset})">
      <path d="M0 48q-4 6-3 15l4 9" stroke="#243b49" stroke-width="11" stroke-linecap="round"/>
      <path d="M0 48q-4 6-3 15" stroke="url(#cer-${gid})" stroke-width="8" stroke-linecap="round"/>
      <path d="M-6 64l7 1" stroke="${pal.trim}" stroke-width="3.2"/>
      <ellipse cx="1" cy="73" rx="5" ry="6" fill="#d0dad5" stroke="#2c4858" stroke-width="1.5"/>
      <path d="M-2 72l5 1" stroke="#6b8790" stroke-width="1.5"/>
    </g>`;

  const torso = `<path d="M26 44Q40 38 54 44l4 23-7 9H29l-8-9Z" fill="url(#cer-${gid})" stroke="#263d4a" stroke-width="1.8"/>
    <path d="m25 48 5 14-3 7m28-21-5 14 3 7" stroke="${pal.trim}" stroke-width="2.2"/>
    <path d="m26 68 28 1-3 7H29Z" fill="${pal.trimDark}"/>
    <rect x="36" y="69" width="8" height="5" rx="1" fill="${pal.trim}"/>`;

  const pack = `<g>
    <rect x="24" y="41" width="32" height="32" rx="6.5" fill="${pal.pack}" stroke="#edf0df" stroke-width="2"/>
    <rect x="28" y="45" width="24" height="21" rx="3" fill="#90acac"/>
    <path d="M32 48h16v11H32Z" fill="#183140"/>
    <path d="M35 51h10m-10 4h7" stroke="${pal.led}" stroke-width="1.6"/>
    <path d="M28 69h24" stroke="${pal.trim}" stroke-width="3.2"/>
    <path d="M21 47v19m38-19v19" stroke="#dedfce" stroke-width="4"/>
    <path d="M54 44V27" stroke="#829da3" stroke-width="2"/>
    <circle cx="54" cy="27" r="2.4" fill="${pal.led}"/>
  </g>`;

  const face = rear
    ? `<path d="M28 20q12-5 24 0v15H28Z" fill="#c6d3cb"/>
       <path d="M32 24h16m-16 5h16" stroke="#77939b" stroke-width="2"/>
       <path d="M34 38h12" stroke="${pal.trim}" stroke-width="3"/>`
    : `<path d="M21 20Q40 8 59 20v11Q41 49 22 31Z" fill="#132938" stroke="#597682" stroke-width="2"/>
       <path d="M24 21Q40 11 56 21v10Q40 43 25 30Z" fill="url(#vis-${gid})"/>
       <path d="M26 22q6-5 13-5l-7 18-6-6Z" fill="#fff4cc" opacity=".68"/>
       <path d="M27 30l7-4 4 2 6-4 10 5-7 5-13 1Z" fill="#4c6271" opacity=".4"/>
       <path d="m39 29 6-6 9 6-7 3-7 3Z" fill="#2c333a" opacity=".45"/>
       <path d="M28 21l7-2" stroke="#fff9e6" stroke-width="2"/>`;

  const helmet = `<ellipse cx="40" cy="25" rx="21.5" ry="22.5" fill="url(#cer-${gid})" stroke="#355260" stroke-width="1.9"/>
    <path d="M25 11q15-12 31 3" stroke="#fff7df" stroke-width="2.5" fill="none"/>
    <path d="M25 39q15 13 31-1" stroke="${pal.trimDark}" stroke-width="5" fill="none"/>
    <path d="M25 40q15 10 30-1" stroke="${pal.trim}" stroke-width="2.2" fill="none"/>
    <rect x="16" y="23" width="6" height="12" rx="3" fill="${pal.trim}" stroke="#2f4c5a"/>
    <rect x="58" y="23" width="6" height="12" rx="3" fill="${pal.trim}" stroke="#263f51"/>
    ${face}
    <rect x="33" y="4.5" width="14" height="4.5" rx="2.2" fill="${pal.pack}"/>
    <path d="M36 6.7h8" stroke="${pal.led}" stroke-width="1.8"/>`;

  const front = `${leg(31, stride)}${leg(49, -stride)}${arm(22, -stride * 0.6)}${arm(58, stride * 0.6)}${torso}${
    rear
      ? pack
      : `<path d="M28 47h24v15H28Z" fill="#b7cecc" stroke="#688790"/>
         <rect x="31" y="49" width="10" height="8" rx="1" fill="#153748"/>
         <path d="M33 51h6m-6 3h4" stroke="${pal.led}" stroke-width="1.3"/>
         <circle cx="46" cy="53" r="2.4" fill="${pal.trim}"/>
         <path d="M29 60h20" stroke="#f1ecce" stroke-width="1"/>
         <path d="M51 62q13 4 11-12" stroke="#1c3646" stroke-width="4" fill="none"/>
         <path d="M51 62q13 4 11-12" stroke="${pal.trim}" stroke-width="2" fill="none"/>
         <path d="m23 45 5 2m24-2 5-2" stroke="${pal.trim}" stroke-width="4.2"/>
         <rect x="17" y="51" width="5" height="7" rx="1" fill="${pal.led}"/>
         <text x="43" y="61" fill="#274657" font-size="4.4" font-weight="bold" font-family="monospace">${pal.badge}</text>`
  }${helmet}`;

  const side = `${leg(45, -stride, true)}
    <rect x="48" y="42" width="18" height="31" rx="5.5" fill="${pal.pack}" stroke="#bed3ca" stroke-width="2"/>
    <path d="M54 47h7v17h-7Z" fill="#9eb9b6"/>
    <path d="M51 69h12" stroke="${pal.trim}" stroke-width="3.2"/>
    <path d="M60 44V27" stroke="#71939d" stroke-width="2"/>
    <circle cx="60" cy="27" r="2.3" fill="${pal.led}"/>
    ${leg(34, stride)}
    <path d="M30 44q11-7 23 2l2 24-13 6-16-5Z" fill="url(#cer-${gid})" stroke="#2b4758" stroke-width="1.8"/>
    <path d="M29 68h24v5l-12 3-14-5Z" fill="${pal.trimDark}"/>
    ${arm(36, stride * 0.7)}
    <path d="m32 47 8 1" stroke="${pal.trim}" stroke-width="4.2"/>
    <path d="M30 51h7v6h-7Z" fill="${pal.led}"/>
    <ellipse cx="39" cy="25" rx="20.5" ry="22.5" fill="url(#cer-${gid})" stroke="#355363" stroke-width="1.9"/>
    <path d="M19 20q9-10 20-3l1 18q-15 6-23-5Z" fill="#152f3e" stroke="#6c8c95" stroke-width="1.5"/>
    <path d="M21 21q8-7 15-3v14q-10 3-16-4Z" fill="url(#vis-${gid})"/>
    <path d="M23 22l5-3v12l-5-4Z" fill="#fff4c4" opacity=".68"/>
    <path d="M22 29l5-3 8 3v2q-8 3-13-2Z" fill="#42566a" opacity=".42"/>
    <path d="M34 6q18 0 22 17" stroke="#fff1d7" stroke-width="2.5" fill="none"/>
    <rect x="42" y="23" width="12" height="12" rx="5" fill="${pal.trim}" stroke="#365967" stroke-width="1.5"/>
    <circle cx="48" cy="29" r="3" fill="#e6eee0"/>
    <path d="M30 42q11 6 20-1" stroke="${pal.trimDark}" stroke-width="4"/>`;

  return {
    key,
    width: 80,
    height: 104,
    footprint: { x: 31, y: 90, width: 18, height: 10 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="104" viewBox="0 0 80 104" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <defs>
        <linearGradient id="cer-${gid}" x1=".15" y1="0" x2=".85" y2="1">
          <stop stop-color="${pal.shellTop}"/>
          <stop offset=".4" stop-color="${pal.shellMid}"/>
          <stop offset=".74" stop-color="${pal.shellLow}"/>
          <stop offset="1" stop-color="${pal.shellShadow}"/>
        </linearGradient>
        <linearGradient id="fab-${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="${pal.shellLow}"/>
          <stop offset="1" stop-color="${pal.trimDark}"/>
        </linearGradient>
        <linearGradient id="vis-${gid}" x1="0" y1="0" x2=".65" y2="1">
          <stop stop-color="${pal.visorTop}"/>
          <stop offset=".42" stop-color="${pal.visorMid}"/>
          <stop offset="1" stop-color="${pal.visorDeep}"/>
        </linearGradient>
        <radialGradient id="shd-${gid}">
          <stop stop-color="#0b1a28" stop-opacity=".72"/>
          <stop offset="1" stop-color="#0b1a28" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g opacity="${pal.opacity ?? 1}">
        <ellipse cx="42" cy="96" rx="28" ry="7" fill="url(#shd-${gid})"/>
        <g transform="translate(${sway} ${bounce})">
          ${direction === 'right' ? '<g transform="translate(80 0) scale(-1 1)">' : ''}
          ${profile ? side : front}
          ${direction === 'right' ? '</g>' : ''}
        </g>
      </g>
    </svg>`,
  };
}

/** Backwards-compatible helper for Commander (player) sprites. */
export function astronaut(direction: Facing, frame: number, idle = false): SvgAsset {
  return crewmate('commander', direction, frame, idle);
}

/** Autonomous 2.5D Hovering AI Recon Drone ("SPARK-9") with twin rotors & cyan scanner eye. */
export function aiDrone(frame: number): SvgAsset {
  const rotorSpin = frame === 0 ? 'M8 22h16M40 22h16' : 'M11 21l10 2M43 23l10-2';
  return {
    key: `ai-drone-${frame}`,
    width: 64,
    height: 68,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="68" viewBox="0 0 64 68" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <defs>
        <linearGradient id="dr-body-${frame}" x1=".2" y1="0" x2=".8" y2="1">
          <stop stop-color="#f4f7ec"/>
          <stop offset=".55" stop-color="#bdd2d4"/>
          <stop offset="1" stop-color="#537889"/>
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="59" rx="18" ry="5" fill="#0d2130" opacity=".45"/>
      <ellipse cx="32" cy="59" rx="11" ry="3" fill="#67e8f9" opacity=".28"/>
      <path d="M16 24H8m48 0h-8" stroke="#62808e" stroke-width="3"/>
      <ellipse cx="16" cy="22" rx="10" ry="3.5" fill="#1e3846" stroke="#8fb3bd" stroke-width="1.4"/>
      <ellipse cx="48" cy="22" rx="10" ry="3.5" fill="#1e3846" stroke="#8fb3bd" stroke-width="1.4"/>
      <path d="${rotorSpin}" stroke="#a5f3fc" stroke-width="1.8"/>
      <path d="M32 14V6" stroke="#9ab5ba" stroke-width="2"/>
      <circle cx="32" cy="5" r="2.5" fill="#5eead4"/>
      <ellipse cx="32" cy="28" rx="16" ry="13" fill="url(#dr-body-${frame})" stroke="#294554" stroke-width="1.8"/>
      <path d="M18 28q14 6 28 0" stroke="#e5b873" stroke-width="2.2"/>
      <ellipse cx="32" cy="30" rx="8.5" ry="5.5" fill="#102938" stroke="#698d99" stroke-width="1.4"/>
      <circle cx="32" cy="30" r="3.4" fill="#38bdf8"/>
      <circle cx="30.8" cy="28.8" r="1.2" fill="#e0f2fe"/>
      <path d="M24 39l-3 5m19-5l3 5" stroke="#557583" stroke-width="2"/>
    </svg>`,
  };
}
