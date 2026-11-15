# Outpost Replay implementation log

Work took place in the existing `outpost-replay-practice` copy. The supplied directory had no usable Git metadata, so there is no commit history for these changes.

| Milestone | Implemented and checked |
| --- | --- |
| 1 · Audit and stabilization | Read the supplied spec and traced the active React/Phaser world and deterministic engine. The original `npm run build` passed. Opened the baseline in Chromium and inspected the world and HUD. Fixed the clipped laptop header, keyboard focus conflict, and reset of sample and drill state. |
| 2 · Scientific model | Replaced phase-level balance adjustments with hourly battery dispatch, crew-store accounting, recycling, crop growth and timed storm exposure. Added provenance for published NASA/NOAA values and clearly labeled the training curves. |
| 3 · Gameplay | Added array-incidence trade-offs, an optional pre-grown crop trial, power-limited extraction, load shedding and meaningful forecasts. Choices now preview before they commit. Kept optional station exercises and field science distinct from simulation inputs. |
| 4 · Rewind & Compare | Added true early termination and continuation through newly reachable phases. Graphs use elapsed hours, and endpoint deltas require equal elapsed time. Added outcomes, inventory, low-power hours and an accessible data table. |
| 5 · World and interface | Refined terrain and equipment art, added obstacle-aware route guidance, marked low-traction slopes, and tied facility animation and rover feedback to world state. Refined the HUD and laptop controls. |
| 6 · Instruction and demo | Added a three-stage guided demo over the same mission engine and preserved the instant comparison. Updated the bilingual briefing, feedback and science references. |
| 7 · Final verification | See the commands and browser checks below. |

## Verification

- Baseline `npm run build` passed before changes and reported a large Phaser bundle.
- The revised engine’s nine automated tests passed, including all 729 paths for conservation. Outcome enumeration yielded 504 successes, 126 warning completions and 99 aborts. 165 paths harvested crops.
- The browser’s guided demo reached hour 216 in both runs. Changing only D3 moved the shadow-end battery from 19.9 to 43.9 kWh, reduced low-reserve time from 97 hours to zero, and changed the outcome from warning to success. Science fell from 60 to 46 points.
- Production Chromium completed all six choices from a fresh start, checked keyboard calibration and the greenhouse forecast, and manually rewound D3. It also ran the guided and instant demo paths.
- A separate production run depleted water at hour 203. Rewinding D3 reached hour 216 and displayed the two end times separately without final metric deltas.
- Production Chromium verified tactical-map deployment, a click-to-move detour, station autopilot and interaction, ice drilling, rover boarding and driving, the field catalog and source links. The independent production smoke check recorded no runtime exceptions.
- Verified all five science tabs, Azerbaijani source text, chart and data-table layout, Tab focus in a dialog, and Escape to close it. Captured and inspected world, chart and comparison screenshots.
- Ran a six-decision water-abort case, copied the resulting training report, and rendered its one-page print output. The report showed the actual elapsed time of 205 hours for that route.
- Final `npm run typecheck`, `npm test` and `npm run build` passed. Vite reported the existing Phaser bundle size warning.

## Known limitations and follow-up

- The models use classroom-scale equipment, shielding factors, and scripted environmental time series. The bundled sources are selected published values. A site-specific LRO terrain, illumination and temperature reconstruction from archived products remains future work. See [NASA_SCIENCE.md](NASA_SCIENCE.md).
- Field exploration exercises have their own progress. Time and reserves advance when an engineering choice is applied.
- The practice copy includes older, inactive world and interface components. They were retained to preserve existing project material.
- Phaser remains the largest production chunk. Further bundle-size work can be evaluated against startup performance on classroom hardware.

## Recovered scientific and licensing corrections

- Preserved the practice copy's pre-edit Git checkpoint `fd05999`. The repository has no configured remote.
- Recovered and reviewed the fictional rim location labels, the separation of Earth-orbit GOES data from the training dose model, and the Apache-2.0 proposal in `ATTRIBUTION.md`. In the previous session, Chromium displayed the updated science labels and reproduced the guided D3 comparison. The approval review stopped the final combined log-write and Git check. This entry restores the missing log.
- Re-ran `npm run typecheck`, all nine existing tests, and `npm run build` against the recovered working copy. All passed. Vite reported the existing Phaser bundle-size warning.
- Rights-holder approval for the project license and provenance for inherited artwork remain pending.

## Competition upgrade

- **A · Lunar Site Intelligence.** Added a keyboard-operable planning exercise in D1 and the Sunlight tab. Two Gläser et al. Table 2 rows from NASA NTRS supply long-run average visible solar-disk fractions and longest modeled shadow durations. With a 35 kWh usable reserve, the Shackleton study point has 7.5 kWh left and C1 is short 11.7 kWh. The planning calculation has its own assumptions and the mission retains its scripted hourly environment. Local checkpoint `207c26e`. See [NASA_SCIENCE.md](NASA_SCIENCE.md).
- **B · Solar calibration.** D1's optional azimuth exercise unlocks an explicit calibration input. The training model caps incidence at 4° when applied. The choice forecast and committed run use the same input, and branching preserves or changes it at D1. Other field exercises remain optional and separate. Changes span `src/engine/{power,simulation}.ts`, `App.tsx`, `DecisionCard.tsx`, `DeltaSummary.tsx`, and the simulation tests.
- **D · Rewind.** Moved input changes above the detailed rules, labeled metric deltas with names and units, and explained how low reserve can reduce water recovery. Different elapsed times still suppress endpoint deltas.
- **C/E · Feedback and onboarding.** The world displays the simulated battery reserve state and dims the habitat below the configured reserve threshold. The onboarding strip points to choice previews and Apply. Debriefs show the battery left, correct units, and localized explanations for flight rules.
- **F · Demo.** Added a route from the demo's first stage to the Sunlight planning exercise. The three-stage D3 comparison still uses the original engine fixture. The updated [README](README.md) gives a two-to-three-minute walkthrough.

### Model regression

The nine original tests remain, plus two covering NASA site planning and calibration replay. The existing conservation check now enumerates 729 routes for each calibration setting. Uncalibrated runs reproduce 504 successes, 126 warnings, 99 aborts, and 165 harvests. Calibrated runs give 561 successes, 90 warnings, 78 aborts, and 184 harvests. The change comes from better pointing on options A and C, which can leave more electricity for recycling and the greenhouse. Option B already points at the Sun.

### Final verification

- The final `npm run typecheck`, `npm test` (11 passing), and `npm run build` completed successfully. Vite continues to report the existing Phaser size warning.
- Chromium, 1366 × 768 in English. Opened the demo's site exercise, confirmed the reserve values, and finished the guided comparison. Run A still ended with warnings and Run B succeeded. Hour-120 power was 19.9 versus 43.9 kWh and low-reserve time was 97 versus 0 hours. Captured the comparison and low-reserve world views in the browser.
- Chromium, 1600 × 900. Checked the Azerbaijani site exercise and three decision forecasts without horizontal overflow. Captured the Azerbaijani science view. Verified rover boarding, movement, and dismount with the existing controls. No browser errors were captured in the final preview tab.
- Completed a calibrated six-choice run in Chromium. The D1-C forecast changed from a 7.1 to a 6.0 kWh loss, and disabling calibration on a D1 branch retained the same choice while recording the setting change. In a separate run, water depletion at hour 203 rewound to a successful hour-216 branch. The comparison withheld endpoint deltas for the unequal run lengths.

### Remaining work

- The two research rows are long-term planning inputs. There is no verified hourly trajectory for the fictional outpost. Any follow-up that changes the mission schedule should start with a documented, dated, site-specific product and preserve the guided fixture.
- Before submitting, record rights-holder approval for the project license, verify the inherited art and reference sources, and resolve the inactive GSAP import and dependency against the 2026 terms. Then collect required notices for the distributed bundle. See [ATTRIBUTION.md](ATTRIBUTION.md).
- The tested browser layouts cover two desktop viewport sizes. Integrated-graphics performance and broader hardware coverage remain unmeasured.

## Competition gameplay and presentation pass

- Tagged the clean `581d3b3` baseline as `competition-gameplay-baseline`. TypeScript, 11 tests, and the production build passed at the start.
- Rechecked Gläser et al. Table 2 against the two study points and recomputed the 35 kWh margins (+7.5 kWh at S, −11.7 kWh at C1). These figures remain separate from the scripted mission.
- Replaced the two GSAP effects in the inactive prototype with native browser and Phaser animations. Removed the dependency and reviewed installed license metadata. TypeScript, 11 tests, and the production build passed after removal. Team license approval and inherited art provenance remain unresolved.
- **First-time play.** Added a bilingual, nonmodal mission guide that advances with the player, clarified the initial D1 objective, and added a direct route to comparison after the mission. TypeScript, 11 tests, and the production build passed. Chromium at 1366 × 768 showed the guide advancing after D1.
- **Facility feedback.** Linked greenhouse status, growth progress, and facility lights to the simulation snapshot. The HUD mirrors crop status so it is available outside the canvas. Chromium showed a ready tray at 0% and a growing tray at 60%. TypeScript, 11 tests, and the production build passed for this milestone.
- **Extractor preparation.** Recovered the D4 station integration from the interrupted working copy. Completing three thermal pulses or collecting a field core unlocks an optional run setting. When applied with D4 option A it changes the assumed efficiency from 60% to 75%, while water still scales with delivered task power. The 12-test suite covers replay and conservation across all 729 decision paths for each of the four task-setting combinations. TypeScript and the production build passed. In Chromium at 1366 × 768, three pulses unlocked the setting, the forecast rose from 0.67 to 0.84 kg, and a completed D4 branch correctly recorded disabling the setting without changing the option. Vite retained the existing Phaser chunk size warning.
- **Rewind comparison.** Moved the first changed phase’s result ahead of the final deltas. D4 shows treated water when yields differ. Equal-duration runs include a final water delta when it changes, and runs that share an outcome use a neutral heading. The power graph marks the exercise’s 20 kWh low-reserve threshold. Chromium at 1366 × 768 showed 0.84 versus 0.67 kg at hour 144 for the D4 setting change and 19.9 versus 43.9 kWh at hour 120 for the D3 preset, with a 7.28 kg final water benefit. TypeScript, 12 tests, and the production build passed.
- **Interactive Guided Demo.** Let the player choose either D3 shadow strategy for Run A. The rewind stage previews the other strategy and keeps the remaining decisions fixed. Tested drilling first in English and fuel cells first in Azerbaijani. The real simulation returned 19.9 kWh at hour 120 with drilling and 43.9 kWh with fuel cells. Fuel cells yielded a successful mission and 14 fewer science points. Reversing the comparison now displays the same absolute water delta of 7.28 kg.
- **Language and accessibility.** Localized the decision reference notes and the world movement labels. The Water ice tab distinguishes the LCROSS estimate from the exercise's assumed 60% and 75% recoveries. The radiation tabs retain the near-Earth GOES measurement, classroom conversion and transmission, and the separate NASA career limit. Moved initial dialog focus into the layout effect to prevent the close button from taking focus during fast keyboard navigation. Verified focus restoration with Escape.

### Competition pass verification

- The final `npm run typecheck`, all 12 `npm test` cases, and `npm run build` passed. The conservation test covers 2,916 combinations of decision routes and station settings. Vite still reports the existing large Phaser chunk.
- Used Chromium at 1366 × 768 in English and 1600 × 900 in Azerbaijani. Completed six decisions in both languages, checked the site planner, verified both Guided Demo orders, and inspected decision cards and comparisons with no page-level horizontal overflow. Captured decision, science, and replay views in the browser. The final preview logged no browser errors.
- In the Azerbaijani manual run, keyboard solar calibration reduced the D1-C forecast loss from 7.1 to 6.0 kWh. The greenhouse showed 0%, 60%, and a 1.5 kg harvest. A D4 branch disabled preparation while retaining option A and displayed 0.84 versus 0.67 kg with the same mission outcome. Checked rover boarding, route movement on radar, and dismount. Browser verification used the console pulses to unlock D4 preparation.
- In the final English keyboard run, Run A depleted water at hour 203. Changing only D3 reached hour 216 with a successful Run B. The comparison withheld final deltas for the unequal durations.

### Next action before submission

- Obtain the rights holders' approval for the proposed team license, verify the inherited artwork permissions, and assemble required notices for the dependencies shipped in the release. The earlier GSAP dependency issue is resolved. See [ATTRIBUTION.md](ATTRIBUTION.md).
- Browser verification covers the two requested desktop sizes. Integrated-graphics performance and the separate field-core unlock route remain unmeasured in this pass.

## Visual excellence and player experience

- **A · Baseline.** Started from clean `3e318af`. TypeScript, all 12 tests, and the production build passed. Captured the starting world, solar field, habitat, growing greenhouse, ice basin, engineering console, replay, and Guided Demo at 1366 × 768. The audit found three priorities: the objective card and shadow mask obscured terrain, equipment states were difficult to read, and the first action or main lesson competed with supporting information.
- **B · World and facilities.** Gave the desktop mission card its own space and kept route prompts clear of the control dock. Shaped the existing ridge and basin, added terrain and ramp detail, and retained the facility and collision footprints. Marked icy soil samples with flags and drew an original processor on D4's existing console footprint. Replaced the repeatedly redrawn shadow mask with a simple shade layer driven by the scripted sunlight. Shelter signs mark the storm decision, and rover lamps light patches of ground. No new environmental physics or collision surfaces were added.
- **B · State feedback and motion.** Solar output reads from the engine's terrain and orientation factors. Habitat lights and readouts follow battery and life support. Greenhouse trays, lamps, progress and harvest use crop state, and the D4 cylinder fills to show the modeled water yield. Localized the ground labels. Walking and wheel frames follow movement, and the camera follows rover boarding and dismount without snapping in normal motion mode. Nearby prompts respect station unlocks.
- **B · Verification.** TypeScript, 12 tests, and the production build passed. At 1366 × 768, Chromium showed visible routes during D3, 15% nominal solar output on the low-array plan, crop progress of 0% and 60%, and a 1.5 kg harvest. Held the drill on a marked field core, used it to unlock D4 preparation, and applied the 0.84 kg forecast. Verified rover steering, camera zoom, dismount and walking. The revised station prompt clears the dock. The existing Phaser chunk warning remains.
- **C · First-time guidance.** Prioritized the marked route, changed the guide when the player reached D1, and moved the Guided Demo into the desktop mission rail. The decision modal shows all three options and their resource changes before optional exercises and source material. Apply stays visible while scrolling, and D4 shows treated water on its option card. The drill displays core progress and a relative heat percentage and supports holding the focused button by keyboard.
- **C · Verification.** TypeScript, 12 tests, and the production build passed. In Chromium at 1366 × 768, followed the D1 route, opened the console with E, and completed calibration by keyboard. Option C's forecast moved from −7.1 to −6.0 kWh. At 1600 × 900, checked Azerbaijani option cards, sources, Apply, Escape focus restoration, and the demo panel. The console had no horizontal overflow and Apply stayed visible as disclosures expanded.
- **D · Educational feedback and replay.** Recovered the interrupted changes and removed an unused import that blocked TypeScript. The mission rail now keeps the last applied result and an expandable explanation. Rewind puts the two strategies, their outcomes, and the result at a matching phase endpoint first. It highlights resource gains and costs and provides a short engineering lesson. The graphs use consistent run colors and mark the compared phase endpoint. Detailed reserves, downstream rules, and source documentation remain accessible through disclosures. Clarified that the D1 mast's 40% training output is measured against full-light output before its pointing factor.
- **E · Unequal durations verified first.** In Chromium at 1366 × 768 in English, played C, C, C, C, A, A. Run A depleted water at hour 203. Rewinding only D3 to B produced a successful hour-216 Run B. The summary displayed the shared hour-120 battery readings of 11.4 and 34.6 kWh, showed the two actual end times, and withheld final deltas.
- **E · Full regression.** Completed English and Azerbaijani manual missions on the recovered build at 1600 × 900. Checked both demo orders and the comparison at 1366 × 768 in both languages. The demo retained 19.9 versus 43.9 kWh at hour 120, 97 versus 0 low-reserve hours, and the 14-point science trade-off. Azerbaijani keyboard calibration changed D1-C from −7.1 to −6.0 kWh. Both manual crop runs showed 60% growth and a 1.5 kg harvest. Prepared extraction displayed 0.84 kg, and a D4 preparation-only branch compared it with 0.67 kg. Checked movement, rover boarding and dismount, routes, camera input, console submission, and persistent result notes. No page-level horizontal overflow or browser errors were found in the final checks.
- **E · Automated checks and captures.** `npm run typecheck`, all 12 `npm test` cases, and `npm run build` passed after the unused import correction. The tests include conservation across 2,916 route and task-setting combinations. Inspected screenshots of the final environment, decision cards, crop harvest, demo and replay. Saved baseline and final JPEGs outside the source tree under the session's `outpost-replay-visual-qa` folder.

### Visual milestone completion

The requested visual and player-experience stages are implemented and verified. The current map and graphics are preserved. The existing Phaser bundle warning remains, and integrated-graphics frame rate has not been benchmarked. Team license approval, inherited artwork permissions, and release dependency notices remain submission tasks documented in `ATTRIBUTION.md`.

## Premium gameplay and educational upgrade

- **Baseline.** Started clean at `4ce0eaf`, tagged `premium-gameplay-baseline`. TypeScript, 12 tests, and the production build passed. Captured the current world, console, and replay in Chromium at 1366 × 768.
- **Facility responses.** Added short native Phaser outline acknowledgements for sunlight/reserve changes, crop state transitions, and extractor preparation/results. Added an intermediate crop texture and a harvest crate on the existing greenhouse footprint. D4 distinguishes preparation unlocked from applying a processing plan. Effects respect reduced motion and use current simulation and exercise state. TypeScript, 12 tests, and the production build passed. Chromium showed 60% growth, 1.5 kg harvested and 0.67 kg standard water recovery, with the original map composition preserved.
