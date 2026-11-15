# Outpost Replay technical specification

## Mission and architecture

Shackleton Rim Survival is a fictional nine-day exercise with a two-person crew. It runs as a static Vite, React, and TypeScript application. Phaser renders the existing isometric outpost, and Recharts renders mission traces. All simulation inputs are bundled. The original assets and legacy rendering components are retained in the practice copy.

## Contents

- [Mission and architecture](#mission-and-architecture)
- [Schedule](#schedule)
- [Model](#model)
- [Replay contract](#replay-contract)
- [Validation](#validation)
- [M3 accounting contract](#m3-accounting-contract)

| Layer | Active entry and responsibilities |
| --- | --- |
| Application | `src/main.tsx` mounts `App.tsx`. React owns the baseline and branch plans, selected phase, field inventory and overlays. |
| World | `src/game/PhaserWorld.tsx` bridges React state to `LunarWorld.ts`. The world handles terrain, characters, movement, rover, routing, facilities and field samples. |
| Domain data | `src/data/missionDecisions.ts` defines the six decision phases, choice effects and demo fixture. `nasaTelemetry.ts` separates source metadata and published values from scenario inputs. |
| Simulation | `src/engine/simulation.ts` advances the mission one hour at a time using the dispatch logic in `power.ts` and the crew and crop ledgers in `resources.ts`. There is no clock, random generator, rendering state or I/O in the engine. |
| Instruction and analysis | Station consoles and forecasts, guided demo, bilingual source panel, comparison charts and accessible numeric tables. |

## Schedule

| Phase | Mission hours | Decision |
| --- | --- | --- |
| D1 | 0–24 | Deploy and orient the solar arrays |
| D2 | 24–48 | Prepare shielding, extract oxygen or start a crop trial |
| D3 | 48–120 | Manage loads and backup power through a scripted ridge shadow |
| D4 | 120–144 | Send a crewed rover, perform maintenance or use a remote scout |
| D5 | 144–192 | Balance science and shelter during a scripted particle storm |
| D6 | 192–216 | Close out, perform an extended EVA or downlink the mission data |

## Model

- **Power.** The initial battery reserve is 60 kWh, with a 100 kWh storage limit. The modeled array generates up to 12 kWh/day before terrain and cosine-of-incidence factors. The nominal base load is 10 kWh/day, including 4 kWh/day of essential demand. A scripted surface-temperature curve contributes a simplified heater load. At each hour generation and storage serve essential loads before discretionary base load, engineering work and optional crop lighting. Storage overflow is curtailed and unmet demand is recorded. Load shedding preserves essential power.
- **Crew.** Initial stores are 18 kg oxygen, 16 kg water and 14 kg food. NASA’s BVAD oxygen reference supplies the modeled crew demand of 1.64 kg/day. Net water demand depends on recycling and available power. Life support is the minimum of equipment health and the limiting consumable reserve relative to a two-day target. Low power and outages reduce equipment health over time. A run stops when a crew store or equipment health reaches zero.
- **Ice and food.** D4 can process a fictional batch of regolith using the published LCROSS Cabeus ice estimate as an analog. The sample mass and extraction efficiency are scenario inputs. Treated water scales with task power delivered. A D2 crop tray begins with 25 days of prior growth and requires five more supported days, with hourly water and electricity use. The modeled harvest adds fresh greens, a small ration-equivalent credit and science.
- **Radiation.** A fixed 48-hour training pulse uses the published GOES peak of 207 pfu from May 2024. The engine integrates the scripted flux curve, applies a classroom flux-to-dose conversion, and accounts for time and shielding. The 50 mSv warning is a scenario threshold. See [NASA_SCIENCE.md](NASA_SCIENCE.md) for provenance and limitations.
- **Outcome.** Completion with sufficient power, life support of at least 40%, and no dose warning counts as success. Other completed runs finish with warnings. Equipment or consumable depletion triggers an immediate abort. The score is a classroom trade-off among science, reserves and modeled risk. The existing weighted formula and safety multiplier are rounded, then clamped to 0–100. Science awards are committed at phase completion after delivered-power and safety gates; hourly records retain the last committed award until then.

## Replay contract

Run A locks its choices in order. Run B copies the plan and replaces the selected decision. Both use identical starting stores and the same schedule of external events. Any plan supplied for later phases stays fixed. After an early Run A abort, the player supplies decisions for newly reachable phases. Each run records the optional D1 solar calibration and D4 extractor preparation. A branch inherits these inputs and can change them at their respective decisions. A field core or three console pulses unlock extractor preparation, which affects the water yield only when applied with D4 option A.

Charts plot phase endpoints against elapsed mission hours and stop at the last simulated hour. The UI displays endpoint metric and score deltas only when both runs end at the same hour. Result cards include the actual elapsed time, resources, brownout and outage hours, greenhouse result and cause of an abort.

The separate Lunar Site Intelligence exercise calculates long-term planning estimates from two published LOLA-derived rows. The mission’s hourly profile stays scripted. The demo compares **B, A, C, A, C, C** and **B, A, B, A, C, C**. The judge can choose which plan runs first. Both end at hour 216. Drilling through the shadow completes with warnings. Using backup fuel cells succeeds with fewer science points.

## Validation

`npm test` runs the Node test suite against the bundled TypeScript engine. Coverage includes resource and energy accounting across all 729 paths, replay determinism, growth conditions, phased radiation, mission transitions and the shared demo fixture. `npm run build` type-checks the source and creates the static output in `dist/`.

## M3 accounting contract

All five field cores are accepted: each adds 3 kg of icy regolith to D4-A’s 20 kg batch. The feed is not pure water. Treated water is feed mass × 0.056 × recovery × delivered task-power fraction. Core settings do not affect other decisions. Sample counts are cumulative inputs; only newly applied samples can earn phase credit, subject to science gates and the 100-point limit.

Battery ledgers explicitly identify curtailed generation, unserved demand and the cap on discretionary load shedding. Maintenance requests a 10 kWh reduction, but only 6 kWh of discretionary daily load can be shed; essential loads remain. Existing oxygen, net water/recycling, food and greenhouse equations are retained and checked by conservation and boundary tests.
