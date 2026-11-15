import type { SvgAsset } from './art';

/** Hand-positioned markings follow the buildings' 2.5D isometric faces (zero agency logos). */
const details: Record<string, string> = {
  habitat: `<g stroke-linecap="round"><path d="m32 73 140 43m-140 13 140 43m-115-81v63m38-52v63m40-51v63" stroke="#5b747b" stroke-width=".6" opacity=".55"/><g fill="#e4e5d6">${[34, 66, 125, 168].map((x) => `<circle cx="${x}" cy="${72 + (x - 34) * 0.29}" r="1.2"/>`).join('')}</g><path d="m102 68 40 12 25-16-40-12Z" fill="#889d9d" stroke="#d9dfd0"/><path d="m108 67 27 8m-20-13 27 8m-20-13 27 8" stroke="#48636e" stroke-width="2.5"/><path d="m32 131 25 7" stroke="#e8bd7b" stroke-width="2"/><text x="43" y="128" fill="#e6e5d1" font-size="5.8" font-family="monospace" transform="skewY(16)">SELENE / 02</text><path d="m208 80 9-6v11l-9 6Z" fill="#244751"/><circle cx="213" cy="82" r="1.5" fill="#82e3d1"/><path d="m184 145 33-23v8l-33 23Z" fill="#2e4858"/><path d="m187 148 27-19" stroke="#c9d2c8" stroke-width=".7"/></g>`,
  solar: `<g stroke="#d6ddd7" stroke-width="1" opacity=".5"><path d="m37 88 11 4m-6-9-5 5m104 25 11 4m-6-9-5 5m-93-48 10 3m94 26 10 3"/></g><path d="m220 165 7 2" stroke="#dcb06d" stroke-width="2"/>`,
  water: `<path d="m16 106 43 13m15-19 40 13" stroke="#8ee0e0" stroke-width="2"/><path d="M144 92V61l12-6" stroke="#375768" stroke-width="6"/><path d="M144 92V61l12-6" stroke="#adc6c8" stroke-width="2"/><rect x="137" y="76" width="14" height="10" rx="2" fill="#284951" stroke="#92aba9"/><path d="M140 79h7m-7 3h4" stroke="#83d6d4" stroke-width="1"/><path d="m29 48 6 2m34 7 6 2m33 8 6 2" stroke="#e5ece1" stroke-width="2"/>`,
  greenhouse: `<path d="m30 116 89 30" stroke="#39665d" stroke-width="4"/><path d="m32 115 85 29" stroke="#c8ecbf" stroke-width="1"/><g stroke="#52737c" stroke-width="2"><path d="m34 102-8 3 104 36m-88-47-8 3 105 36"/></g><path d="m157 122 15-10v4l-15 10Z" fill="#89dfc1"/><path d="m52 39 122 49" stroke="#eff1df" stroke-width="1" opacity=".25"/>`,
  shelter: `<g stroke="#7c8990" stroke-width="1.2" opacity=".75"><path d="m51 70 12-11 15 5m49-20 19 11m-81 54 15 6m73-18 19 10m-115 6 9-13"/></g><path d="m98 134 22 8" stroke="#ebc482" stroke-width="2"/><path d="m102 89 13 4v5l-13-4Z" fill="#234552"/><circle cx="108" cy="92" r="1.4" fill="#d9b774"/>`,
  battery: `<path d="m15 42 12 4m20 6 12 4m20 6 12 4" stroke="#e8ce8a" stroke-width="2"/><path d="M13 73v9l61 18 25-15" stroke="#1d3444" stroke-width="5"/><path d="M13 73v9l61 18 25-15" stroke="#728f9a" stroke-width="1.5"/>`,
  terminal: `<path d="m20 59 20 7v3l-20-7Z" fill="#365a68"/><path d="m23 60 4 1m4 1 4 1" stroke="#adcabe" stroke-width="1"/>`,
};

const finishes: Record<string, string> = {
  habitat: `<path d="m34 123 139 41v7L34 130Z" fill="#243e52" opacity=".5"/><g transform="translate(37 124) skewY(16)"><text fill="#e7e4cf" font-size="6" font-family="monospace" letter-spacing="1">SELENE COMMAND</text><text x="92" y="0" fill="#f2cc8d" font-size="10" font-family="monospace">02</text></g><path d="m34 74 5 1v42l-5-1Zm84 25 5 1v42l-5-1Zm47 14 5 1v42l-5-1Z" fill="#dce1cf" opacity=".7"/><path d="m36 77 2 .6m82 23 2 .6m47 15 2 .6m-133 1 2 .6m82 23 2 .6m47 15 2 .6" stroke="#394f5b" stroke-width="1"/><path d="m182 132 43-29v27l-43 29Z" fill="#344f65"/><path d="m186 135 35-24m-35 28 35-24m-35 28 35-24m-35 28 35-24" stroke="#8ba8ad" stroke-width="1.2"/><g transform="translate(198 48)"><path d="m-9 19 12-7 11 4-12 7Z" fill="#405b6d"/><path d="M0 16V0" stroke="#dfe1cf" stroke-width="3"/><ellipse cy="-2" rx="16" ry="8" transform="rotate(-28)" fill="#b7c6c5" stroke="#f2e8cd" stroke-width="2"/><path d="M-14 3 1-13 14-8M0-11l2-9" stroke="#6d8d9a" stroke-width="1.5"/><circle cx="2" cy="-20" r="2" fill="#d6b17a"/></g>`,
  solar: `${[
    [31, 37],
    [137, 67],
    [10, 84],
    [116, 114],
  ]
    .map(
      ([x, y]) =>
        `<g transform="translate(${x} ${y})"><path d="m4 0 74-20 25 14-74 21Z" fill="url(#solar-finish)"/><path d="m6 1 20 11 72-20" stroke="#dcf1f0" stroke-width=".6" opacity=".55"/>${[0.15, 0.35, 0.55, 0.75].map((t) => `<path d="M${78 * t} ${-22 * t}l31 17" stroke="#9cd5e1" stroke-width=".4"/>`).join('')}<path d="M45 26v13m26-23v17" stroke="#d8d7c6" stroke-width="2"/><circle cx="45" cy="40" r="3" fill="#3a5265"/></g>`,
    )
    .join('')}`,
  battery: `<g fill="#213e52" stroke="#8ca6ab" stroke-width=".5">${[0, 1, 2].map((i) => `<g transform="translate(${14 + i * 29} ${62 + i * 9})"><path d="m0 0 20 6v5L0 5Z"/><path d="m3 2 14 4" stroke="#d6b77c"/><circle cx="4" cy="-18" r="1" fill="#e3edd5"/></g>`).join('')}</g>`,
  water: `<path d="M7 78V38q0-5 5-3l8 3m119 49V44l-7-3" stroke="#233f54" stroke-width="7"/><path d="M7 78V38q0-5 5-3l8 3m119 49V44l-7-3" stroke="#a4c4c2" stroke-width="3"/><circle cx="7" cy="59" r="5" fill="#315469" stroke="#ddbb80"/><path d="M7 55v8m-4-4h8" stroke="#dfc18b" stroke-width="1.4"/><path d="m50 79 13 4v10l-13-4Z" fill="#dae1d5"/><text x="52" y="69" transform="skewY(16)" fill="#365f73" font-family="monospace" font-size="5">H2 / O2</text><path d="m18 114 24 7" stroke="#d8b581" stroke-width="2" stroke-dasharray="3 2"/>`,
  lifeSupport: `<path d="M20 91V65m0 16h8m61 19V77m0 12h-8" stroke="#243f55" stroke-width="5"/><path d="M20 91V65m0 16h8m61 19V77m0 12h-8" stroke="#9fb8b4" stroke-width="2"/><path d="M26 47q9 4 15 3m25 12 16 3" stroke="#edddab" stroke-width="1"/><path d="m97 122 16 6v5l-16-6Z" fill="#c48c59"/>`,
  greenhouse: `<path d="M20 77q3-37 36-36" stroke="#fff0cf" stroke-width="4" opacity=".3"/><path d="m27 73 111 43 47-29" stroke="#def1da" stroke-width="7" opacity=".12"/><path d="m23 100 110 39v10L23 111Z" fill="#254e54" opacity=".6"/><path d="m29 107 19 6m10 4 19 6m10 4 19 6" stroke="#bedfba" stroke-width="2"/><g transform="translate(93 126) skewY(19)"><text fill="#e3e8c6" font-size="6" font-family="monospace">BIO / 06</text></g><path d="m163 122 10-7v8l-10 7Z" fill="#f2db96" opacity=".6"/>`,
  shelter: `<path d="m23 111 28-57 49-25 62 25" stroke="#c1bba1" stroke-width="2" opacity=".45"/><path d="m51 71 8-3 14-21m-32 58 15-9m78-39 26 13m-4 17 18 12m-121 22 16 5" stroke="#3b515e" stroke-width="1.3" opacity=".45"/><path d="m82 134-1-51q22-31 51 3l4 56" stroke="#b5b7a3" stroke-width="7" fill="none"/><path d="m83 133-1-50q22-27 49 3l4 56" stroke="#405d6b" stroke-width="1" fill="none"/><path d="m94 136 36 12" stroke="#efbd76" stroke-width="4"/><path d="m98 137 4 2m5 1 4 2m5 1 4 2" stroke="#37515e" stroke-width="2"/><path d="m75 95-7 2v16l9 3" stroke="#c0cebd" stroke-width="2"/>`,
  terminal: `<path d="m13 22 33 10" stroke="#f7e6bb" stroke-width="2"/><path d="m17 27 23 7-9 0-14-3Z" fill="#e6f5de" opacity=".25"/><path d="m22 58 18 6v4l-18-6Z" fill="#244b5f"/><path d="m23 59 3 1m3 1 3 1m3 1 3 1" stroke="#daecce" stroke-width="1.5"/>`,
};

export function detailFacility(asset: SvgAsset): SvgAsset {
  const detail = (details[asset.key] ?? '') + (finishes[asset.key] ?? '');
  if (!detail) return asset;
  const defs = `<defs><linearGradient id="solar-finish" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#89d7e2" stop-opacity=".35"/><stop offset=".45" stop-color="#233e68" stop-opacity=".05"/><stop offset="1" stop-color="#425e93" stop-opacity=".4"/></linearGradient></defs>`;
  return { ...asset, svg: asset.svg.replace('</svg>', defs + detail + '</svg>') };
}

export function lifeSupport(): SvgAsset {
  return {
    key: 'lifeSupport',
    width: 150,
    height: 155,
    footprint: { x: 20, y: 98, width: 111, height: 37 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="155" viewBox="0 0 150 155" fill="none" stroke-linejoin="round"><defs><linearGradient id="tank"><stop stop-color="#dce2db"/><stop offset=".35" stop-color="#b7c9c7"/><stop offset="1" stop-color="#4c7182"/></linearGradient></defs><path d="m9 113 49-29 87 35-48 30Z" fill="#14293a" opacity=".4"/><path d="m12 101 45-28 78 29-45 29Z" fill="#526c7c" stroke="#8c9d9f"/><path d="m12 101 78 30v9l-78-29Zm78 30 45-29v9l-45 29Z" fill="#344f62"/>${[0, 1]
      .map(
        (i) =>
          `<g transform="translate(${28 + i * 42} ${30 + i * 13})"><path d="M0 8a16 16 0 0 1 32 0v66c0 13-32 13-32 0Z" fill="url(#tank)" stroke="#5b7c86" stroke-width="1.5"/><ellipse cx="16" cy="9" rx="16" ry="8" fill="#d4ddd4"/><path d="M2 32q14 9 28 0m-28 32q14 9 28 0" stroke="#507282" stroke-width="6"/><path d="M8 21v9m0 9v16" stroke="#edf0d9" stroke-width="2" opacity=".6"/><text x="10" y="55" fill="#294c60" font-size="10" font-family="monospace" font-weight="bold">O&#8322;</text><path d="M16 1v-14h15" stroke="#a4b9b8" stroke-width="4"/><circle cx="29" cy="-12" r="4" fill="#d4a66d"/></g>`,
      )
      .join('')}<path d="m27 116-6 5 77 26 24-19" stroke="#adc0bc" stroke-width="4"/><path d="m110 82 20 7v27l-20-7Z" fill="#294c61" stroke="#a6b9b7"/><path d="m114 89 12 4v11l-12-4Z" fill="#87ccc6"/><path d="m113 108 12 4" stroke="#deb570" stroke-width="2"/></svg>`,
  };
}
