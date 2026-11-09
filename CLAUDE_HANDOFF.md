# OUTPOST REPLAY — development handoff

Prepared 9 November 2026. Read this before editing. Continue the existing game; do not restart its roadmap.

## Start here: preserved state

- Workspace: `/home/kanan/Desktop/outpost-replay-practice` (practice copy). Do not modify any original Antigravity folder or other checkout.
- Current branch at handoff preparation: `codex/final-science-audit`.
- Latest verified gameplay/science checkpoint: **`deca79a`**. Prior final QA: `275d550`; visual polish: `1157be6`. This handoff is saved in a subsequent documentation checkpoint; obtain its hash with `git log -1 --oneline`.
- Working tree was clean before handoff preparation. Handoff changes are documentation only. No implementation operation was interrupted; no unfinished equation/renderer patch needs resuming.
- Before work: `git status --short --branch`, `git log -12 --oneline`, and inspect any new changes made since this document. Preserve other tools' edits. Create a `codex/` branch/checkpoint before implementation. Never reset, clean, force-push, or overwrite diverged work.
- Completed work is in the current ancestry; no merging is required. Local historical branches remain recoverable. No latest changes were pushed or deployed by these audits; do not assume a remote has this version.

## Product and competition objective

A static, bilingual English/Azerbaijani junior-astronaut engineering trainer. Students operate a fictional two-person outpost near Shackleton's rim for nine days (216 hours), make six engineering decisions, perform optional station tasks, and compare reproducible outcomes after changing an earlier choice. Cadet targets ages 7–12 by team choice; Engineer exposes units and assumptions. A separate educational Mars bonus exists.

Main innovation: **Predict → Experiment → Rewind → Compare → Explain**. Preserve the immutable baseline and make one engineering trade-off memorable. Position as a NASA-informed educational model, not a NASA-validated digital twin or astronaut safety tool. Winning is not established by feature count, visual detail, or passing software tests. Actual student learning has not been independently demonstrated.

## Architecture and ownership

| Area | Important files / responsibilities |
| --- | --- |
| App orchestration | `src/App.tsx`: baseline/branch inputs, phase selection, preparations, modals, Guided Demo, mode/callsign preferences. Large component; avoid broad refactoring near release. |
| Deterministic inputs/replay | `src/engine/runInput.ts`, `sharedReplay.ts`, `shadowPrediction.ts`: complete immutable scenario/per-phase task snapshots, v2 share links, prediction comparability. |
| Simulation | `src/engine/simulation.ts`: pure hourly run; no RNG, clock or network. `power.ts`: allocation, battery, curtailment/unserved energy. `resources.ts`: oxygen, water, rations, crop/extraction. `sitePowerPlanning.ts`: separate published-site calculator. `marsMission.ts`: bonus. |
| Science/scenario content | `src/data/nasaTelemetry.ts`, `missionDecisions.ts`, `nasaSpaceWeather.ts`, `lunarSiteIntelligence.ts`, `engineeringLessons.ts`. Legacy LRO_PROFILE/SEP_PROFILE names do not mean observed time series. |
| World | `src/game/PhaserWorld.tsx`, `LunarWorld.ts`, `world.ts`, `navigation.ts`: React bridge, Phaser scene, stations, rover, walking/collision. `art.ts`, `landscape.ts`, `character.ts`, `facility-details.ts`: existing procedural art/feedback. |
| Science/3D | `src/components/NasaSensorDeckModal.tsx`, `LunarSiteIntelligence.tsx`, `ShackletonHologram.tsx` (lazy wrapper), `Shackleton3DHologram.tsx`, `hologramGeometry.ts`; `src/data/shackletonDem.ts` is procedural terrain. |
| Decisions/education | `DecisionCard.tsx`, `DecisionDebrief.tsx`, `ShadowPrediction.tsx`, `ShadowPredictionResult.tsx`, `StationTaskMiniGame.tsx`, `EvidencePanel.tsx`, `CompareCharts.tsx`, `MissionLaunchScreen.tsx`, `JudgeTourBanner.tsx`. |
| Localization/render policy | `src/i18n/strings.ts`, `LanguageContext.tsx`; some components use inline bilingual strings. `src/utils/renderPolicy.ts`, `renderDiagnostics.ts`, `playerFeedback.ts`, `soundEffects.ts`. |
| Verification/release | `tests/{simulation,replay,science,rendering}.test.mjs`; `scripts/prepare-notices.mjs`; `vite.config.ts`; `package-lock.json`. |

Technology: React18/TypeScript, Vite6, Tailwind4, Phaser4.2.1, Three0.187 with React Three Fiber8/Drei9, Recharts2, Lucide, canvas-confetti. Node22+ documented. Consult lockfile for exact versions, not package.json ranges. No backend, required private API key, downloaded image/font/audio pack or new dependency needed. `public/` holds third-party notices; visuals/audio are generated in code, with inherited authorship still requiring team confirmation.

## Completed milestones — do not repeat

| Milestone | Checkpoint | Preserved result |
| --- | --- | --- |
| M0 preservation | `86eda74` | Complete Antigravity working copy saved; older `fe6f969` retained. |
| M2 replay integrity | `44549e2` | Immutable scenario/phase preparations, truthful forecasts, v2 links, confound/unequal-endpoint handling. |
| M1 science | `080fd3f` | Procedural versus published terrain separation; removed fabricated flux/ISS traces; corrected radiation/source claims. |
| M3 accounting | `d3ddb2b` | Hourly resource/energy accounting, all five cores, bounded scores. Note actual hash starts d3, not an earlier prompt's d2 typo. |
| M4 rendering | `c3a849c` | Deferred 3D loading; covered/offscreen/paused rendering policies; cleanup/performance regressions. |
| M6 readiness | `33f4b59` | Attribution/notices, static deployment runbook, external release gates. |
| M5 usability | `f2d6fe6` | Forecast consequences, low-reserve/end-time feedback and effective-preparation replay markers. |
| Visual polish | `1157be6` | Circular relief/plinth, improved framing/materials, Reset view, baked lunar-world lighting. |
| Final QA | `275d550` | Complete manual route, demo/replay checks, artifact review and three-minute judge script. |
| Independent science audit | `deca79a` | Clearer EN/AZ oxygen extraction, crop age, fuel-cell products/untracked flows, ISS water recovery, NOAA attribution; 51 tests. |

Historical log sections record earlier counts/limitations. Latest scientific audit supersedes earlier claims, not the underlying verified mechanics.

## Scientific contract: what is real

Detailed equations, units, original citations and per-system classifications are already in `NASA_SCIENCE.md`. Reuse that research; recheck only changed claims or unavailable evidence.

| Evidence | Application and limits |
| --- | --- |
| [Gläser original Table2](https://ntrs.nasa.gov/api/citations/20170007365/downloads/20170007365.pdf#page=12) | Transcribed modeled illumination at2m over2017–2037: S 85.5%/66 h maximum shadow; C1 88%/112 h. Drives separate planning calculator. Not direct observations or the hologram's output. |
| [BVAD Rev1 Table3-22](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf?attachment=true#page=59) | Reference0.82kg O₂/1.04kg CO₂ per crew-day, under specified schedule. Oxygen drives crew ledger; no CO₂ mass/chemistry simulation. Rev1 is specified, not asserted to be latest. |
| [NOAA PRF2541 p1](https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf) | Near-Earth GOES207pfu peak, May10 2024 17:45UTC, associated X3.9. Only amplitude reused; NOAA is not NASA. Lunar pulse/time profile is fictional. |
| [NASA LCROSS context p15](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf#page=15) | Cabeus5.6±2.9% ice mass estimate. Fictional-batch analog, not a Shackleton deposit measurement. NASA cautions against transferring abundance to landing sites. |
| [DONKI documentation](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Optional FLR JSON provides catalog context, never derived pfu/dose or retroactive mission changes. Research/prototyping information. Distinct live/empty/unavailable statuses. |
| [NASA water recovery](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) | ISS98% collected-water recovery demonstration, not complete material closure or validation of lunar game hardware. |
| [VEG-01A](https://osdr.nasa.gov/bio/repo/data/payloads/VEG-01A) | Actual ISS trial May8–June10 2014 (33days). Does not establish the game's crop yield, energy, growth or nutritional conversion. |
| [NASA fuel cells](https://www.nasa.gov/general/nasa-regenerative-fuel-cell-testing/) | H₂+O₂ produces electricity, water and heat; regeneration consumes energy. Game's dedicated one-use18kWh reserve has no gas/product-water/heat ledger. |
| [NASA-STD-3001 Vol1 RevC](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_1) | Active record rechecked for handoff. §4.8 specifies ALARA and career effective dose <600mSv. Game's50mSv warning is separate and cannot demonstrate compliance. |

**Actual integration:** reference scalars and two published table rows feed simplified calculations; optional DONKI parses fetched metadata. There is no raw LOLA/Diviner/CRaTER/proton-series ingestion. DO NOT describe the procedural bowl as a NASA DEM, its artistic lighting as the numeric horizon model, or the fictional base as a verified georeferenced site. Cabeus~38K is a published subsurface estimate; the game's surface218→90K curve is scripted. Original Diviner PDF timed out in the previous audit; its abstract was verified separately. Do not report full-PDF verification retroactively.

### Highest-risk modeling boundaries — approval required for numerical changes

- **Radiation:**0.015mSv·h⁻¹·pfu⁻¹, fixed transmission suit1/habitat0.25/water0.15/berm0.06,1mSv/day background and50mSv warning are teaching assumptions. No spectral transport, geometry, secondaries or tissue weighting. No real dose/safety claim or universal shielding ranking across GCR/SEP. CRaTER is a reference, not integrated calibration.
- **Greenhouse:** tray already25days old; five additional powered days to harvest. Model1.5kg fresh greens is distinct from0.25kg ration-equivalent credit.1.2kWh/day,0.4kg water/day and paused growth are assumptions. No death, nutrients, photosynthesis or atmospheric closure; do not imply plants safely stop biology through outages.
- **Fuel cell:**18kWh supplement and spent flag are an external backup boundary. Dedicated gas supplies are abstracted, not shared tracked breathing O₂. Product water/heat untracked. Do not subtract oxygen/add water without first choosing architecture, efficiency/plumbing and obtaining approval.
- **Water:**3kg/person/day gross flow and85/55/20% recovery by power state are assumptions, with phase-local bonuses/cap. Immediate return has no wastewater tank or time delay. Nominal two-day reserve calculation is a gameplay indicator, not a guarantee during degraded recycling.
- **Conservation:** tests check electric and tracked O₂/water/ration balances over3,645 routes/settings, including curtailment/unserved loads. They do not establish full chemical/thermal closure: ISRU feed/reagents, CO₂, crop nutrients and fuel-cell products are absent. Energy uses kWh, not kW; percentage-point changes differ from relative percentages.
- **Power/terrain:**12kWh/day generation,10kWh/day base load,100kWh battery and15/40% shadow outputs are assumptions. Storage loss/rate/thermal limits not modeled. Hologram uses arbitrary terrain,×14 observer-height effect and1.55° illustrative index; not solar-disk integration or annual illumination. Artistic shadows are independent.

No new critical scientific error was demonstrated during the handoff review. These limits constrain claims and realism; do not turn them into a surprise simulation rewrite. Low-risk remaining content check: some legacy Cadet summaries quote gross activity bonuses (e.g.+8% health) while forecast cards show net reserve changes; test whether players confuse them. A new UI wording pass should use percentage points and explain gross versus net where necessary.

## Technical/visual assessment and three next priorities

No new competition-stopping runtime defect established by this focused source review; this is not a fresh complete browser/hardware audit. Existing art is acceptable and should remain. Dense technical UI and an abstract teaching relief are the main presentation weaknesses, rather than missing photorealism.

1. **Make the first experiment obvious; validate with learners.** Observe5–8 newcomers and a teacher: find first decision, explain a trade-off, rewind one choice, explain result. Record assistance/completion and actual explanations; no invented learning-gain claims. Improve only the biggest observed obstacle. Consider surfacing the already-existing optional D3 prediction, focusing the current station and emphasizing existing state feedback. Do not add duplicate tutorials/tasks or redesign the map. Acceptance: learner can explain battery→water recovery and identify what changed between A/B.
2. **Protect mission continuity.** `handleStartTour()` unconditionally calls reset; only mode/callsign are persisted, not complete mission state. Refresh also loses in-memory runs unless the user has exported a replay. This is confirmed behavior, not evidence of broken replay math. Consider a small warning/export route before replacing an active mission. Autosave is a larger versioned-input change, not automatically authorized. Preserve complete RunInput/settings and legacy-link warnings; do not serialize choices alone.
3. **Prove delivery reliability on actual hardware/host.** Test presentation laptop, network and public host after approval. Cold start, 3D open/close repeatedly, covered-world suspension, rover/keyboard, six decisions, both modes/languages at1366×768/1600×900, replay link in fresh tab, optional feed offline. Preserve build artifacts during tests. An earlier tab went blank when a rebuild removed its old lazy chunk; fresh load worked. Atomic deployments/retained old assets and a small graceful chunk-error path merit investigation, not an unverified assertion that public hosting is broken.

Known nonblocking warnings: Phaser~1,684.94kB minified chunk; Three/Fiber Clock deprecation. Do not upgrade Phaser/Three/Fiber/Drei or migrate engines to suppress a warning. Hologram~39.9 render callbacks/s measured previously, not certified GPU FPS. Zero callbacks while paused/covered were measured. Physical integrated-GPU power/memory/leak behavior, disabled-WebGL behavior, slow-network public loading and full optional Mars/field coverage are not independently certified. A WebGL error boundary exists inside the3D scene, but that alone does not prove lazy module-load failures are caught.

## Regression anchors and verification

Prior browser QA at1366×768 and1600×900 preserved both languages, walking, rover, hologram and station interactions. Latest scientific audit checked EN/AZ revised science/D2 text, AZ fuel-cell text, and complete Guided Demo. Do not claim every historical test was repeated in this documentation handoff.

- Guided Demo: default207pfu, unprepared settings; D3 drilling19.9kWh versus backup43.9kWh at hour120. Both end216h. Scores54/66, whole-mission low-reserve97/0h, science trade-off−14, final water delta+7.28kg. Distinguish phase-low-reserve1/0h from whole-mission97/0h.
- Manual EN Cadet A,C,B,A,B,B:216h, score69, crop1.5kg, extraction0.67kg. Rewind D4 to maintenance: scores69/55, equal216h endpoints, finalbattery+20kWh, extraction0.67/0kg.
- Latest suite:51 tests = 27 simulation + 9 replay + 8 science + 7 rendering. Conservation, score bounds, early aborts, complete snapshots/share-link roundtrips, confounds, unequal end times, scientific labels and mesh validity are covered. Do not replace meaningful tests with assertions that merely mirror new code.

```sh
# Run from the existing workspace; do not reinstall existing dependencies.
npm test
npm run typecheck
npm run build
git diff --check
npm run preview -- --host 127.0.0.1 --port 5230 --strictPort
# Development only, if needed:
npm run dev -- --host 127.0.0.1
# Regenerate notices after import/dependency changes, then rebuild:
node scripts/prepare-notices.mjs
```

If5230 is occupied, inspect the running server or choose another port; do not kill unrelated processes. Start browser checks after build finishes, not while replacing dist. No file:// launch. On a new machine only, install locked dependencies with `npm ci` (Node22+).

## Deployment, rights and presentation gates

Read `COMPETITION_READINESS.md`, `ATTRIBUTION.md`, and `JUDGE_DEMO.md`; do not recreate them. Static Vite `base:'./'`, no backend, query-based replay. Simplest previously reviewed route: Cloudflare Pages dashboard Direct Upload of **dist/** after approval. Recheck provider/current terms when actually deploying. No source maps/env/Git/node_modules should ship; no secrets in VITE variables. Retain source hash, complete artifact/hashes and rollback copy, upload atomically, then verify unauthenticated HTTPS/hard refresh/assets/notices/demo/replay. Local preview is not a deployed public demo.

Release blockers remain external: written prior-work/Global Judging eligibility scope, team license/inherited asset provenance, complete current2026 submission and AI-disclosure rules, publication approval, actual-host/laptop tests. A prior log reports practice-code reuse approval; its written scope was not verified. Apache2 is only a candidate, not an active team license.40 runtime package versions have collected notices; that does not grant rights to team/inherited materials. Private GitHub access alone is not open-source submission compliance.

Before November 14, prioritize organizer clarification, rights decisions, learner observation, presentation-laptop rehearsal and backup artifacts; any competition-code changes must comply with organizer rules. Verify actual event/local submission/video limits; the three-minute script is an internal rehearsal, not a verified global allowance. Lead the pitch with the controlled replay trade-off, show one evidence→model→decision chain, then real pilot feedback. Maintain local HTTP preview, screenshots and a recording as backups; no service-worker/offline-install claim.

## Restrictions for the next AI developer

- Work incrementally in this checkout; inspect Git/diffs before touching shared work. Preserve existing art direction, world layout, controls, scientific distinctions and completed features. Do not copy over another folder or restore removed unverified SVGs.
- No equations, constants, resource balance, scoring, storm shape or dose changes without **explicit user approval**. Document evidence and proposed effects first. Do not update golden outcomes to hide regression.
- No new major systems, large datasets, libraries, engine migration, dependency upgrade or broad refactor near release. A small georeferenced LOLA transect is optional future work, not a release requirement.
- Preserve deterministic full inputs, per-phase preparations, source Run A, matched-time comparison and legacy links. A renderer refactor must not change simulation time.
- Preserve EN/AZ parity, keyboard/focus/reduced-motion behavior, resource units and model labels. Never silently turn assumed values into measurements or attach NASA branding to synthetic values.
- After an approved code change: targeted tests, full suite/typecheck/build, relevant production-browser verification, implementation-log entry, separate safe Git checkpoint. Report actual evidence/limits.
- No push, merge, deployment, publication, license grant or external messages without authorization. Never expose credential values. Finish the selected task and stop.

## Handoff verification scope

Fresh handoff checks are recorded in IMPLEMENTATION_LOG.md. This pass changes documentation only: no gameplay/visual/math change and no new browser session claimed. Core sources for fuel-cell products, ISS recovery, VEG-01A dates and active radiation standard were rechecked; prior independent source-table verification is retained. Use the newest Git commit for this handoff, and `deca79a` as the last gameplay/science change.

## Latest focused follow-up: mast-height lesson

After the Universal demo-label checkpoint `6a7108e`, continued on `codex/mast-height-lesson`. The 3D lesson now starts paused at Demo S/128° with2m selected, making the existing0%/100% height-index contrast stable. Restart height lesson restores the preset and camera; animation, orbit, zoom, slider, sites and camera reset remain available. Selected marker labels identify the mast height. Short teaching guidance distinguishes equal-index directions from directions where height helps, with1.55°/×14/not-power limits visible. The established camera/art and all mission/index calculations are preserved. Tests now total52, including preset contrast and an equally lit counterexample; read the newest IMPLEMENTATION_LOG.md entry for actual browser verification and use `git log -1` for the resulting checkpoint. Do not reintroduce automatic initial Sun motion or present128° as real NASA ephemeris data.
