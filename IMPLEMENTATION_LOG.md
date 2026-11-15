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
