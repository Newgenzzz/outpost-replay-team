# OUTPOST REPLAY — independent code, gameplay and science audit

Audited for Team Brochachos on 14 November 2026. Starting branch: `codex/protect-progress-and-sharing`; clean starting HEAD: `6977994`. That commit was confirmed with Git and remains in ancestry. This report supersedes historical verification counts for this audit; earlier handoffs remain historical evidence.

> [!NOTE]
> **Historical audit snapshot at `6977994` (superseded).** Technical counts and browser evidence below describe that Nov 14 snapshot; later releases published the repository at <https://github.com/Newgenzzz/outpost-replay-team>, added adaptive audio & continuous rover vibration (`be768ff`, `649fbf9`), Apache-2.0 licensing (`LICENSE` / `NOTICE`), and verified GitHub Pages deployment at <https://newgenzzz.github.io/outpost-replay-team/>. See [README.md](README.md) and [ATTRIBUTION.md](ATTRIBUTION.md) for current status.

## Contents

1. [Confirmed problems](#1-confirmed-problems)
2. [Suspected problems and limits](#2-suspected-problems-and-limits)
3. [Fixes implemented](#3-fixes-implemented)
4. [Files changed](#4-files-changed)
5. [Automated verification](#5-automated-verification)
6. [Browser verification](#6-browser-verification)
7. [Scientific validity and NASA relevance](#7-scientific-validity-and-nasa-relevance)
8. [Competition readiness](#8-competition-readiness)
9. [Highest-value next task](#9-highest-value-next-task)

Architecture reviewed: React/TypeScript presentation and bilingual strings; Phaser exploration bridged through `PhaserWorld`; pure hourly simulation with separate power/resource ledgers and immutable per-phase `RunInput`; lazy Three.js illustration; static NASA reference scalars/planning rows plus optional DONKI fetch. The simulation owns results; world graphics illustrate snapshots and prepare drafts until Apply.

## 1. Confirmed problems

- **Refresh lost lunar progress.** Chromium reached guided step 2, then refresh returned to a fresh mission. Only training mode and callsign were in local storage. A/B inputs, fieldwork, preparations and recorded predictions were volatile.
- **Progress labels truncated at 1366×768.** The three pills were approximately 74 px wide; “Predict & Test” and “Rewind & Compare” clipped. Azerbaijani labels were longer.
- **Feedback contradicted the engine.** The guided drilling badge said +10 science although D3 awards 20 in the preset. Backup badges/debrief said +16 kWh although the model supplies 18. A shelter debrief claimed 94% shielding even when D2 had not built a berm, and ignored preparation-dependent protection. These were presentation defects, not simulation defects.
- **Mars closing discarded choices.** The modal owned its choices and was unmounted on close; reopening restarted the bonus.
- **Dose-rule wording was too narrow.** It said EVA science was halved; the existing rule gates subsequent phase science, including indoor work.
- **Replay import needed one-time handling.** Independent review of the new persistence found that retaining the original `?m=` would re-import old inputs on every refresh and replace later edits. This was fixed and browser-tested before completion.
- **OSDR attribution was incomplete in the submission kit.** The application linked VEG-01A, but the resource table omitted it and the crop explanation did little to connect its actual findings to the lesson.
- **The live DONKI endpoint returned HTTP 404.** Browser testing confirmed failure at the old `api.nasa.gov` URL. NASA's [September 2026 migration announcement](https://ccmc.gsfc.nasa.gov/news/major-updates/) identifies the current public endpoint. A browser request to that endpoint returned HTTP 200 and 13 genuine FLR records for the tested date range.

## 2. Suspected problems and limits

No new simulation-equation, accounting or replay-determinism error was demonstrated. Code review covered movement, routes/obstacles, rover transitions, station/sample proximity, all six exercises, Apply, predictions, comparison, sunlight, 3D and mission results. That does not establish every possible browser interaction is flawless.

Suitability for unfamiliar children aged 7–12 remains unverified. The interface remains dense, with small secondary telemetry and technical terms. Keyboard controls, visible focus styling, modal focus handling and labeled controls help, but this was not a complete WCAG or screen-reader audit. Physical laptop/GPU performance, disabled-WebGL behavior, public-host loading and genuine learning gains are not certified here.

## 3. Fixes implemented

- One bounded, versioned local save containing inputs and logical progress, with strict validation. A/B results are recomputed by the unchanged deterministic engine. Malformed/future saves fail closed. Partial preparation drafts stay partial so defaults cannot overwrite inherited settings.
- Saved state includes A/B phase settings, preparation drafts, completed calibrations/cores/samples, recorded prediction context, guided stage, viewed/debrief phase, language and Mars choices. Existing mode/callsign preferences remain separate. Avatar position, rover state, drill heat, unsubmitted choice/prediction selections and unfinished exercise attempts restart.
- Launch offers resume and reports local-save status. Unavailable storage is also visible during gameplay. Valid shared links override the previous local mission on initial import; after successful save, only `m` is removed from the address bar. Refresh then resumes subsequent edits. Failed saves keep the original link; invalid links can fall back to valid saved progress.
- Progress pills now read **Plan / Test / Compare** and **Plan / Sına / Müqayisə**, with number above text and no ellipsis.
- Removed stale guided option badges. Actual post-decision metrics remain the source of results. Debriefs use recorded backup energy and modeled dose, identify the actual shelter, label assumptions, and avoid unsupported safety promises. Comparison uses “reserve” at the battery threshold.
- Mars choices survive closing and refresh; its dialog and close labels are bilingual.
- Corrected EN/AZ dose-rule wording. Added the VEG-01A water-stress/crew-watering finding to existing crop notes, kept crop parameters explicitly assumed, and added OSDR to the submission kit.
- Updated optional DONKI fetching to NASA's documented `ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` endpoint without an API key. Date parameters, timeout, validation, empty/unavailable behavior and separation from mission physics are preserved.

No scientific equation, numerical parameter, dependency, game engine, graphics asset or licensing file changed.

## 4. Files changed

- Runtime: `src/App.tsx`; `src/components/{DecisionCard,DecisionDebrief,DeltaSummary,JudgeTourBanner,MarsBonusModal,MissionLaunchScreen,NasaSensorDeckModal}.tsx`.
- Input/replay and feedback: new `src/engine/missionProgress.ts`; `src/engine/sharedReplay.ts`; text only in `src/engine/simulation.ts`; new `src/utils/decisionFeedback.ts`.
- NASA fetch: `src/data/nasaSpaceWeather.ts`.
- Regression tests: `tests/replay.test.mjs`, `tests/science.test.mjs`.
- Documentation: `README.md`, `CODEX_HANDOFF.md`, `NASA_SCIENCE.md`, `SUBMISSION_KIT.md`, this report.

## 5. Automated verification

Final checks: `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`.

The test suite has **63 passing tests**: 27 simulation, 16 replay/persistence/feedback, 9 science and 11 rendering. Seven added regressions cover input/draft/fieldwork/prediction restoration, deterministic recalculation, invalid/future/unbounded saves, detached data, replay-URL consumption, actual shelter/clamp feedback and backup/low-reserve feedback. An existing science regression now checks the migrated DONKI host/path/date parameters and absence of an API key. Existing conservation tests traverse all 729 decision routes across station settings. This verifies the modeled boundary, not real hardware or complete outpost chemistry.

The existing large Phaser bundle warning remains. It is a presentation-laptop/loading risk, not a demonstrated gameplay failure. No dependency was added to conduct Chromium QA.

## 6. Browser verification

Production `dist/` was served locally with Vite preview and tested in Google Chrome/Chromium using a separate profile and software WebGL. Screenshots and temporary browser scripts are under `/tmp/outpost-audit-*`; they are QA artifacts, not shipped game assets.

- EN and AZ at **1366×768 and 1600×900**: guided entry, all three stage labels, optional prediction, both first strategies across the matrix, Run A result, rewind, A/B comparison and no page-width overflow. Measured labels fit; inspected screenshots show all guided actions inside the viewport.
- Refresh at guided steps 2 and 3: saved inputs/stage/prediction restored exactly, then comparison completed. Default endpoints remained **19.9/43.9 kWh at hour 120**, both runs ending at **216 h**, scores **54/66**, whole-mission low reserve **97/0 h**, and science difference **14 points**. D3-only science is **20/4**; it is a different quantity from the whole-mission difference.
- Full manual Cadet route **A,C,B,A,C,B**, completing all six exercises and applying every preparation, reached hour 216: success, score 70, battery 33.9 kWh, 49 science, 19.5 modeled mSv, no low reserve or outage, 1.5 kg fresh crop harvest. Refresh after D4 retained preparations and allowed completion. Wire-mismatch feedback and recovery were exercised.
- Astronaut pointer/arrow movement, rover boarding/driving/dismount (keyboard and buttons), map fast-deploy and E station opening worked. Tests used realistic key duration after an instantaneous synthetic keypress was missed.
- Imported replay: Engineer mode loaded; only `m` was consumed while another query parameter and hash remained; clearing B and refreshing retained the edit.
- Mars: a chosen Sol 1 option survived close/reopen and browser refresh.
- EN 1366×768 fieldwork: routed to the ridge marker and logged it with E; 1/6 samples and +4 field points survived refresh. Fast-deployed to D4, held Space and collected one core; 1/5 cores and the pending D4 feedstock preparation survived refresh. The other samples/cores and AZ fieldwork were not individually exercised.
- Sunlight planner: at 35 kWh, S showed 7.5 kWh remaining and C1 an 11.7 kWh shortfall; changing reserve to 60 updated C1 to 13.3 kWh remaining. Evidence buttons, mast height, site, Sun slider and lesson restart worked. Optional 3D visibly rendered; animation changed azimuth, and rim/orbit/reset controls worked. Screenshots were visually inspected.
- Corrupt save: safe fresh-start fallback, no crash. Injected storage quota failures: applying a decision still worked and a persistent message appeared in both languages, with no uncaught or console errors. Invalid replay URL: retained the valid local mission and offered resume.
- Final rebuilt DONKI UI: fetched and displayed genuine recent FLR classes/times from the migrated endpoint, with no console errors; saved mission inputs remained byte-for-byte unchanged. All **eight** production files returned HTTP200 from local preview and matched the built bytes, including third-party notices.
- Final AZ 1600×900 check: translated crop evidence, localized Mars dialog/close labels, R/Escape navigation and keyboard focus inside the comparison dialog passed, with no console errors.

Normal gameplay checks above reported no browser console errors or uncaught page errors. The old DONKI request produced an HTTP404 console error and an honest unavailable state; this prompted the endpoint fix. The initial blank 3D capture was taken before drawing completed; a later rendered capture was inspected. No disabled-WebGL, physical GPU/FPS, every optional route, full Mars route or public-host certification is claimed.

## 7. Scientific validity and NASA relevance

Primary-source checks independently reconfirmed the published reference values. The source ledger in `NASA_SCIENCE.md` provides the full boundaries.

| Area | Evidence and audit conclusion |
| --- | --- |
| Oxygen | [NASA BVAD Table 3-22](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf#page=59) gives 0.82 kg O₂/crew-day. Two-person consumption uses this reference. ISRU yield/energy and absent reactant processing remain assumptions. |
| Water/ice | Crew-store accounting balances within the model. Recovery levels/delays are simplified. [NASA LCROSS summary](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf#page=15) reports 5.6±2.9% at Cabeus, with a warning against transferring it to candidate landing sites. The fictional batch uses that central value as an analog; 60/75% recovery is assumed. |
| Illumination | [Gläser Table 2](https://ntrs.nasa.gov/api/citations/20170007365/downloads/20170007365.pdf#page=12) confirms S 85.5%/66 h and C1 88.0%/112 h at 2 m over 2017–2037. These research-derived values meaningfully drive the separate battery planner. The mission's 72-hour shadow and 15/40% outputs are assumptions. Procedural 3D is neither a LOLA DEM nor a power forecast. |
| Crops/OSDR | [VEG-01A](https://osdr.nasa.gov/bio/repo/data/payloads/VEG-01A) documents a 33-day ISS lettuce trial and watering difficulties; [NASA's Veggie fact sheet](https://www.nasa.gov/wp-content/uploads/2019/04/veggie_fact_sheet_508.pdf) describes water-stress losses. This supports a qualitative resource-planning lesson. No biological measurements are ingested/fitted; age, growth pause, water/power costs and yield remain assumptions. |
| DONKI/GOES | [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) provides optional FLR catalog context. Flare class does not determine proton flux or dose. [NOAA PRF2541 p.1](https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf) confirms the borrowed 207 pfu near-Earth peak; only amplitude, not lunar pulse timing/shape, is observationally anchored. |
| Radiation/shielding | Constant flux-to-dose scale, shielding factors, background and warning are classroom assumptions. They cannot predict actual lunar radiation doses or demonstrate compliance with [NASA-STD-3001](https://standards.nasa.gov/standard/NASA/NASA-STD-3001-VOL-1). The corrected debrief reports the actual modeled result rather than promising a fixed shielding percentage. |
| Accounting/replay | Hourly energy and tracked crew stores conserve within their tested boundary. Fuel-cell gas masses/product water/heat, crop nutrients/biomass and storage losses remain abstracted. Immutable per-phase inputs and equal-time comparisons support reproducible experiments; this is internal consistency, not real-outpost validation. |

DONKI and OSDR support context and teaching, with substantially less computational integration than BVAD, LCROSS and the illumination planner. Presenting all of them as equally data-driven would overstate the implementation. No new dataset or radiation transport model is justified for this release.

## 8. Competition readiness

| Criterion | Independent assessment |
| --- | --- |
| Impact | Clear educational question and bilingual reach. Actual comprehension, accessibility and learning benefit still need observed learner evidence. |
| Creativity | Preserving other inputs while changing a decision makes Rewind & Compare a strong, demonstrable feature. The site planner adds a useful counterexample: higher mean illumination need not mean less required storage. |
| Validity | Strong internal accounting/determinism and explicit provenance. Biology, radiation, chemistry and hardware simplifications constrain what can be claimed. |
| Relevance | Directly addresses competing power, life-support, shielding, food and science needs at an outpost. The focused lunar experiment is a clearer judging path than attempting every optional feature. |
| Presentation | The guided loop now fits the target laptop layouts and exposes an actual benefit/cost. Secondary telemetry remains dense; the first-time child experience and actual demo laptop/network remain untested. |

Three remaining weaknesses most likely to affect judging:

1. **Unvalidated first-time learning.** Observe 3–5 unfamiliar learners plus an educator, in both languages where practical. Record assistance, completion and actual benefit/cost explanations; fix the most repeated obstacle. Do not claim proven learning gains.
2. **Uneven NASA integration depth.** Demonstrate one traceable calculation, preferably the published S/C1 storage lesson or oxygen ledger. Explain openly that DONKI is catalog context and OSDR informs a qualitative lesson. No major integration is necessary to tell an honest story.
3. **Unfinished release/submission evidence.** Existing team/organizer gates remain unresolved: prior-work eligibility, approved license/authorship, actual Universal requirements, approved public playable/source links and the real presentation laptop. This audit neither clears those gates nor claims current official rules were independently verified.

Local technical quality is improved and the core demo is credible. Competition submission readiness remains conditional on those external gates and real learner evaluation. No numerical judging score is assigned.

## 9. Highest-value next task

Run the anonymous first-time learner check in `SUBMISSION_KIT.md`: launch, predict, choose, read result, rewind, compare, then explain **one benefit and one cost** without coaching. Record observed failures as well as successes. The interface supports this sequence in the audit; no child-comprehension outcome is inferred from automated play.

This report is included in the descriptive local audit-fix commit; `git log -1 --oneline` identifies it. No push, publication, deployment, license change or history rewrite is part of this audit.
