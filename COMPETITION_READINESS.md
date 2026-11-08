# Competition readiness audit · 7 November 2026

Baseline: clean local checkpoint `d5d6608`. Gameplay and artwork remain unchanged. This is an audit, not a declaration of submission eligibility or redistribution clearance.

## Scientific review

| Judge claim | Evidence and interpretation | Finding |
| --- | --- | --- |
| Lunar illumination | [Mazarico/LOLA record](https://ntrs.nasa.gov/citations/20120010094) confirms terrain-derived illumination modeling, including the particularly well-lit rim location. | The UI correctly calls this research, with a separate scripted 72-hour reduced-light scenario. No fictional base coordinates are assigned. |
| Site comparison | [Gläser accepted manuscript record](https://ntrs.nasa.gov/citations/20170007365) confirms LOLA terrain, hourly 2017–2037 modeling and 2 m panel height. | Existing Table 2 extract remains 85.5%/66 h and 88%/112 h. The PDF timed out during this audit; exact rows rely on the earlier documented transcription, not a fresh PDF check. |
| Battery planning | `sitePowerPlanning.ts`: constant 10 kWh/day × shadow hours / 24. | At 35 kWh: 27.5 kWh demand leaves 7.5; 46.666… kWh demand leaves −11.666… (displayed −11.7). No heat/storage losses in this planning exercise. |
| Mission solar power | `power.ts`: 12 kWh/day × scripted terrain factor × cosine pointing factor; hourly allocation and finite 100 kWh storage. | Equipment capacity, 15%/40% shadow output, 20 kWh threshold and calibration cap are training assumptions. They are not site-validated engineering predictions. Conservation tests pass. |
| Crew resources | [NASA BVAD](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf), Table 3-22, with [NASA carbon-dioxide brief](https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/) corroborating 0.82 kg oxygen and 1.04 kg CO₂ per reference crew-day. | Two-crew oxygen ledger uses 1.64 kg/day. Water/rations, recycling stress and crop effects remain assumptions; CO₂ is explanatory context. BVAD PDF retrieval timed out; indexed NASA text and the NASA brief corroborate these values. |
| Radiation | [NOAA PRF 2541](https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf), [NASA DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/Alert/30944/1), [NASA-STD-3001 Vol. 1](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_1). | Near-Earth GOES amplitude is separated from the fictional lunar storm. Dose coefficient 0.015, shielding transmission and background are assumptions, not radiation transport. Rev C is still listed active; its career reference is separate from the scenario warning. DONKI could not be freshly retrieved. |
| Rewind result | Existing engine regression plus fresh Chromium Guided Demo. | D3 drilling 19.9 versus backup 43.9 kWh at hour 120; 97 versus 0 low-reserve hours; backup costs 14 science points. Both demo runs end at 216 h. Prediction regression retains unequal-duration safeguards. |

No demonstrated mathematical error required a change. See [NASA_SCIENCE.md](NASA_SCIENCE.md) for the complete source/assumption ledger. Published measurements, derived research and the fictional exercise remain distinct. A linked citation does not imply that the full underlying archive is ingested or that static values are live telemetry.

## Rights and attribution

Reviewed the [official 2026 participant terms](https://www.spaceappschallenge.org/legal/) (updated 7 August 2026). They require source and applicable third-party license documentation and sufficient redistribution rights. They specify an Apache-2.0 distribution default when no qualifying license is specified. No team license was selected or granted in this audit.

- **Release blocker:** rights holders must approve a license and its scope; the existing candidate Apache text remains a proposal. Add the approved root LICENSE and correct copyright holders only after approval.
- **Resolved asset cleanup:** all nine unverified inherited SVGs formerly in `public/assets/` and unused legacy prototype files were removed and replaced with original code-generated inline SVGs (`src/components/DecisionCard.tsx`, `src/components/MissionLaunchScreen.tsx`), procedural Phaser canvas textures (`src/game/art.ts`, `src/game/landscape.ts`), and parameterized 3D LOLA elevation geometry (`src/data/shackletonDem.ts`). No external raster, embedded remote image, agency logo, audio recording or font file is shipped in `public/`.
- Regenerate `public/THIRD_PARTY_NOTICES.txt` from the production module graph via `node scripts/prepare-notices.mjs` (now including active `three`, `@react-three/fiber`, and `@react-three/drei` runtime notices alongside Phaser, React, Recharts, and transitive packages), then rebuild `dist/`. Review embedded upstream components before release; this collection is not a blanket rights certification.
- [ATTRIBUTION.md](ATTRIBUTION.md) covers direct development dependencies too. Do not redistribute node_modules; a source/dependency distribution has a broader notice scope than dist/. Scientific citations and artwork credit remain separate from software notices. NASA-hosted research is not automatically all NASA-owned; retain authors, DOI and record-specific permissions. No NASA endorsement is claimed.
- Disclose AI assistance used for code, documentation and any art/reference inputs accurately. Verify the final 2026 guide's disclosure/branding requirements. Do not infer permission for inherited artwork from this assistant's involvement.

## Production reliability and performance

Fresh local production preview at port 5207 rendered the scene and accepted held astronaut/rover input, boarding/dismount, console opening and applying D1. Rover map position changed from (1055,635) to (1223,635). Guided Demo completed the real two-run comparison above. Azerbaijani science labels rendered correctly. Captured preview warning/error log was empty.

The browser tool exposes DOM, screenshots and console logs, but not usable Performance/heap/FPS/GPU profiling (Performance access was unavailable). Thus no initial-load milliseconds, FPS, memory-leak or integrated-GPU benchmark is claimed. The older preview tab failed to reload; a new preview process of the current dist/ worked. Localhost results do not measure classroom-network download time.

Measured build sizes: Phaser 1,684.94 kB minified / 381.36 kB gzip; charts 560.85 / 159.00 kB; application 383.52 / 122.36 kB; CSS 101.37 / 17.33 kB (Vite decimal kB). Phaser is imported by the active world and isolated as its own chunk. Three/react-three packages are installed for retained prototypes but absent from the active runtime module graph. The warning is real bundle size, not evidence of low frame rate. No optimization or dependency removal was justified by the functional observations. Test a real integrated-GPU laptop and a cold public connection before the demo.

## Static deployment plan · approval required before publishing

Recommend **Cloudflare Pages Direct Upload** of prebuilt dist/: [official instructions](https://developers.cloudflare.com/pages/get-started/direct-upload/). It avoids publishing the repository or installing a CLI. Direct Upload projects cannot later switch in place to Git integration; create a separate project if automation is wanted later.

1. Resolve release blockers above. With existing dependencies: `node scripts/prepare-notices.mjs`, `npm run typecheck`, `npm test`, `npm run build`.
2. Inspect dist/. Only upload its contents, never the workspace, .git, node_modules or temporary QA files. `base: './'` already supports relative static assets; no backend, API key, server function or routing rule is required for this single-page game.
3. After approval, use the provider dashboard's Direct Upload with dist/. No deployment was performed here.
4. Open the resulting HTTPS address in an unauthenticated browser, hard-refresh, check all asset responses, EN/AZ, controls and Guided Demo. Record the tested URL in the project submission. This public-host check is still pending.
5. Keep a local copy of the same dist/ and use `npm run preview -- --host 127.0.0.1` as a backup on the demonstration laptop. Serve over HTTP; do not rely on double-clicking index.html.

The build has no source maps by default. Inspected tracked files/public assets for common private-key and token signatures and env files; no matches were found. This is a bounded scan, not a guarantee. Added env ignore rules. Only public/ is copied wholesale by Vite, so review every future addition there. All client-side code and bundled values are public by design. Never place credentials in VITE variables.

Final artifact verification: all 15 files in dist/ returned HTTP 200 with byte-for-byte matching content from the local production preview, including THIRD_PARTY_NOTICES.txt. No .env files, source maps, Git metadata or node_modules were present in dist/. Final TypeScript, all 13 tests, production build and whitespace checks passed. The application, CSS, chart and Phaser output hashes remain identical to the baseline; the notice asset is the only added production file.

## Submission checklist

Verified global sources: [2026 event page](https://www.spaceappschallenge.org/2026/), [challenge statement](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/), [participant terms](https://www.spaceappschallenge.org/legal/). The event page lists November 14–15, registration, a maximum of six team members, and submission via the team's Project tab, closing November 15 at 23:59 local time. Confirm the applicable event/time-zone rule in the final guide.

The resources/FAQ pages failed retrieval and no current 2026 submission/judging guide was verified. Search returned older 2025 and staging/2023 material; their video/slide limits are **not** treated as 2026 requirements. The 2–3 minute live walkthrough in README is an internal presentation plan, not an official video allowance.

- [ ] **Official submission:** register the team/event, confirm membership and eligibility, complete every required project field and submit before the applicable deadline. Confirm whether this pre-event practice work may be submitted and how it must be disclosed; preserve the development history.
- [x] **Challenge relevance:** outpost decisions connect power, life support, radiation protection and crops to outcomes; use the official challenge title in the submission.
- [ ] **NASA references:** transfer the actual source list and methodology into the project form, distinguishing NASA research, NOAA observations and assumptions. Reopen the timed-out documents before final submission.
- [ ] **Open-source licensing:** approve the team's license, establish artwork rights, review bundled notices and include all applicable credits.
- [ ] **Public playable demo:** approve deployment, publish only the reviewed artifact and test its unauthenticated HTTPS URL. No public URL has been verified in this audit.
- [ ] **Demonstration video:** check the final 2026 format/time/size rules, record the real engine, credit resources and AI assistance, and confirm required media permissions. A live-demo duration is not a video requirement.
- [x] **Scientific methodology:** source/assumption ledger and deterministic tests exist; explain that dose and resource estimates are educational rather than operational forecasts.
- [ ] **Judge presentation:** rehearse README's starting plan → shadow choice → consequence → rewind → lesson on the actual laptop; explain the science-point cost.
- [ ] **Backup:** rehearse local preview plus saved screenshots and a prerecorded demonstration; verify offline availability of local game assets (external reference links still need internet).
- [ ] **Final testing:** current 13 tests, TypeScript and build pass; after approved deployment run public URL, cold-load, real integrated-GPU laptop and requested desktop layout checks again.
- [ ] **Local event:** ask the chosen Local Lead about pitch slots, language, local deadlines and presentation rules. No local event was identified; these are not global requirements. Check final global rules for AI disclosure and media/branding; do not reuse older limits.
