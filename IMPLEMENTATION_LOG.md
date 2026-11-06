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
