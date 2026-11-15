# OUTPOST REPLAY — Predict. Decide. Rewind. Compare. Learn.

**Team Brochachos** · **2026 NASA International Space Apps Challenge** (*"Build a Junior Astronaut Mission Trainer"*)

- **Play Immediately (Verified Public Web Game):** <https://newgenzzz.github.io/outpost-replay-team/>
- **Source Repository:** <https://github.com/Newgenzzz/outpost-replay-team>
- **Credits, Licenses & AI Disclosure:** <https://newgenzzz.github.io/outpost-replay-team/credits.html> · [ATTRIBUTION.md](ATTRIBUTION.md) · [NASA_SCIENCE.md](NASA_SCIENCE.md)

A bilingual (`EN · AZ`) lunar & Mars mission-engineering trainer for **ages 7–12** (with an optional **Flight Engineer Mode** for educators and NASA judges). Lead a two-person crew through nine simulated days (216 hours) near Shackleton Crater's sunlit south-polar rim, explore a 2.5D outpost on foot or by rover, inspect a procedural 3D crater-shadow demonstration alongside published LOLA illumination research, rewind any decision to run a controlled counterfactual experiment, and unlock **Bonus Mission 2: Mars Jezero Global Dust Storm & 14-Min Comms Delay**.

![status](https://img.shields.io/badge/status-live%20%C2%B7%20verified-2ea44f)
![license](https://img.shields.io/badge/license-Apache--2.0%20(team%20materials)-blue)
![stack](https://img.shields.io/badge/stack-React%20%C2%B7%20TypeScript%20%C2%B7%20Vite-3178c6)
![engine](https://img.shields.io/badge/engine-Phaser%20%2B%20Three.js-6c47ff)
![languages](https://img.shields.io/badge/languages-EN%20%C2%B7%20AZ-2ea44f)

> [!NOTE]
> **Live public release verified without authentication.** Play directly at <https://newgenzzz.github.io/outpost-replay-team/> or inspect source at <https://github.com/Newgenzzz/outpost-replay-team>. Original team materials are licensed under [Apache-2.0](LICENSE) ([NOTICE](NOTICE)); see [ATTRIBUTION.md](ATTRIBUTION.md) and [public/credits.html](public/credits.html) for development-history records, AI disclosures, scientific limits, and submission-eligibility notes.

## Contents

- [At a glance](#at-a-glance)
- [Core learning loop](#core-educational-innovation-predict--decide--observe--rewind--compare--learn)
- [NASA data integration](#nasa-scientific-data-integration-source-to-feature-map)
- [Key features](#key-features)
- [Run locally](#run-locally)
- [How to play](#play)
- [Judge demo](#demo-for-judges)
- [Documentation map](#documentation-map)

## At a glance

| Item | Details |
| --- | --- |
| **Audience** | **Ages 7–12** (Cadet Mode) and educators / NASA judges (Flight Engineer Mode) |
| **Languages** | English · Azerbaijani (`EN · AZ`) |
| **Mission** | 9 simulated days / 216 hours · 6 engineering decisions (`D1`–`D6`) · 2-person crew |
| **Setting** | Fictional outpost near Shackleton Crater's south-polar rim |
| **Bonus mission** | Mars Jezero global dust storm & 14-minute one-way comms delay |
| **Stack** | React 18 · TypeScript · Vite 6 · Phaser 4 · Three.js · Recharts |
| **License** | Apache-2.0 for original team materials ([LICENSE](LICENSE) / [NOTICE](NOTICE)); third-party notices retained |
| **Status** | Live & verified at [newgenzzz.github.io/outpost-replay-team](https://newgenzzz.github.io/outpost-replay-team/) · [Source on GitHub](https://github.com/Newgenzzz/outpost-replay-team) |

## Core Educational Innovation: PREDICT → DECIDE → OBSERVE → REWIND → COMPARE → LEARN

- **Problem being solved:** Spaceflight education for ages 7–12 is often either passive storytelling with no resource trade-offs or dense engineering spreadsheets inaccessible to young students. Real lunar outpost design requires balancing competing power, life-support, radiation shielding, food, and science demands simultaneously.
- **Who the game is designed for & how to play immediately:** Built primarily for learners aged **7–12** in **Junior Cadet Mode** (plain-language story cards, visual hazard cues, hands-on station tasks, and bilingual `EN · AZ` explanations), with a 1-click **Flight Engineer Mode** exposing exact `kWh`, `kg O₂/H₂O/Food`, `mSv`, and 216-hour forecasts. Open <https://newgenzzz.github.io/outpost-replay-team/> in any modern desktop browser with zero login and click **Start guided experiment** (a focused counterfactual shadow test) or **Judge Demo** (instant finished A/B comparison), or explore the full 9-day mission on foot (`WASD`) and by Lunar Rover (`V`).
- **Central innovation — Rewind & Compare (`[R]`):** Rather than restarting from scratch after a low-score or brownout ending, **Rewind & Compare** snapshots every phase choice, fieldwork item, and preparation setting into **Run A**, lets the player branch from any completed decision (`D1`–`D6`) into **Run B**, holds other recorded settings fixed, and quantifies the exact **Benefit / Cost** deltas (`19.9 kWh` vs `43.9 kWh` at hour 120; `97 h` vs `0 h` low-reserve exposure; `−14` science points), threshold crossings (`<20 kWh` brownout, `≥50 mSv` science gate), and physical cause.
- **How NASA data informs the experience (4-tier scientific separation):** Published NASA and NOAA references anchor every station dilemma while transparently distinguishing four data tiers throughout the UI:
  1. **Real observations:** NOAA GOES `207 pfu` near-Earth proton peak (May 10, 2024) and NASA CCMC DONKI archive Alert `#30944` (`20240516-7D-001`, optional live `FLR` catalog metadata).
  2. **Published research models:** NASA LRO LOLA site-illumination rows (`Gläser et al. 2018` Table 2: `S` `85.5%` / `66 h` vs `C1` `88.0%` / `112 h`), LCROSS Cabeus water-ice estimate (`5.6 ± 2.9%`), Diviner cold-trap temperature (`~38 K`), OSDR `VEG-01A` (`33-day` ISS lettuce water-stress trial), BVAD oxygen consumption (`0.82 kg O₂/crew-day`), ISS `~98%` water recovery, and `NASA-STD-3001` (`<600 mSv` career reference).
  3. **Educational engineering approximations:** Deterministic hourly energy/O₂/H₂O/food accounting, `0.015 mSv·h⁻¹·pfu⁻¹` training flux-to-dose factor, simplified shelter transmission multipliers, and lossless storage / `90 K` thermal curves.
  4. **Fictional gameplay assumptions:** The fictional south-polar outpost site, scripted `72 h` shadow (`D3`), Mars Jezero `τ = 4.2` / `14 min` bonus scenario, and procedural 3D Shackleton horizon art (`×14` mast exaggeration).
- **Scientific limitations:** No raw LOLA/Diviner DEM raster, RadLab dosimetry time series, or Mars Trek DEM is bundled. Calculated doses, power margins, and yields are educational abstractions unsuitable for operational flight planning or crew-exposure forecasting, and no formal classroom learning-gain study has been completed yet.
- **Development history, credits & AI disclosure summary:** Team Brochachos researched the challenge, discussed ideas, and planned our approach prior to November 14, 2026, and built and finalized the official hackathon submission on **November 14–15, 2026** (`35f3349` and `8ace633`–`HEAD`). Git history also preserves earlier November 6–9 AI-generated exploratory prototype checkpoints and automated audit drafts (`fd05999`–`09e9e10`, plus November 5 Antigravity write logs for nine removed prototype SVGs); those earlier exploratory artifacts are retained transparently without rewriting history and are not presented as completed team submission development. Original team code, documentation, and procedural audio/visuals are licensed under [Apache-2.0](LICENSE) ([NOTICE](NOTICE)); see [ATTRIBUTION.md](ATTRIBUTION.md) and [public/credits.html](public/credits.html) for complete AI-tool disclosures (`OpenAI Codex`, `Google Antigravity & Gemini`, `Anthropic Claude`, and team `ChatGPT` ideation) and third-party notices for `40` bundled runtime packages.

## NASA Scientific Data Integration (Source-to-Feature Map)

**Strongest challenge-listed integration:** **NASA CCMC DONKI** (`20240516-7D-001` archive + live FLR API + `D5` 5-step Evidence-to-Decision shielding workflow connected to `Rewind & Compare`) paired with **NASA OSDR** (`VEG-01A` ISS water-stress lettuce study connected to `D2-C`), supplemented by published LRO LOLA, LCROSS, Diviner, BVAD, ISS ECLSS, NASA-STD-3001, and NOAA GOES references:

> Each row separates the **published observation** from the **classroom assumption**. A value appearing here does not imply that a raw instrument dataset is processed in-game.

| Exact NASA / Agency Source | Official Source URL | Actual Observations or Published Data Used | Component / File Using It | Educational Interaction Influenced | What Remains an Assumption |
| --- | --- | --- | --- | --- | --- |
| **NASA CCMC DONKI** (`20240516-7D-001` / Alert `#30944` & `DONKI-API/get/FLR`) | [Alert 30944](https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/30944/1) · [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | May 10, 2024 `13:35 UTC` `>10 MeV` threshold crossing (`AR 13664`); live optional recent `FLR` IDs, X-ray classes & timestamps | `src/data/nasaTelemetry.ts`, `src/data/nasaSpaceWeather.ts`, `DecisionCard.tsx` (`D5`), `NasaSensorDeckModal.tsx` | `D5` 5-step flow: archived DONKI/NOAA observation → storm warning → interactive A/B/C shielding check → cumulative `50 mSv` rule outcome → `Rewind & Compare` | `48 h` pulse timing/shape, `0.015 mSv·h⁻¹·pfu⁻¹` conversion, shielding factors (`1.00/0.25/0.15/0.06`), `50 mSv` warning rule; FLR class never converts to dose |
| **NOAA SWPC GOES** (`PRF 2541`, p. 1 — separate agency) | [PRF 2541 PDF](https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/weekly_reports/PRFs_of_SGD/2024/05/prf2541.pdf) | Observed `207 pfu` near-Earth `≥10 MeV` proton peak on May 10, 2024 (`17:45 UTC`, `X3.9` assoc.) | `src/data/nasaTelemetry.ts`, `src/data/nasaSpaceWeather.ts`, `DecisionCard.tsx` (`D5`), `EvidencePanel.tsx` | Sets default scenario storm peak (`207 pfu`) for `D5` shielding comparison & Rewind deltas | Near-Earth geosynchronous flux only (not lunar measurement); `840`/`18 pfu` presets and lunar dose conversion are classroom assumptions |
| **NASA OSDR (`VEG-01A`)** | [VEG-01A Payload](https://osdr.nasa.gov/bio/repo/data/payloads/VEG-01A) | ISS Veggie red-romaine test (May 8–June 10, 2014, `33 days`); documented water stress & direct crew watering recovery | `src/data/nasaTelemetry.ts`, `DecisionCard.tsx` (`D2`), `NasaSensorDeckModal.tsx`, `src/engine/resources.ts` | Explains water & power planning for `D2-C` Greenhouse (`25 + 5` powered growing days; pauses on brownout) | Pre-grown `25 d` tray age, `5` powered days remaining, `0.4 kg/day` water, `1.2 kWh/day`, and `1.5 kg` / `0.25 kg` food yield are classroom assumptions |
| **NASA LRO LOLA** (`Gläser et al. 2018` Table 2; `Mazarico et al. 2011`; `Zuber et al. 2012`) | [Gläser NTRS](https://ntrs.nasa.gov/citations/20170007365) · [Mazarico](https://ntrs.nasa.gov/citations/20120010094) · [LOLA](https://science.nasa.gov/mission/lro/lola/) | Site S (`−89.6866°, 197.19°`: `85.5%` disk, `66 h` max shadow) & C1 (`−89.4398°, 222.83°`: `88.0%`, `112 h`) at `2 m` over `2017–2037`; polar horizon height insight | `src/data/lunarSiteIntelligence.ts`, `src/engine/sitePowerPlanning.ts`, `LunarSiteIntelligence.tsx`, `Shackleton3DHologram.tsx` | Teaches why `88%` mean light (C1) still fails a `35 kWh` battery through `112 h` shadow, motivating `D1` `2 m` vs `10 m` solar mast placement & battery sizing | `12 kWh/day` array, `10 kWh/day` load, procedural 3D relief (`shackletonDem.ts`, `×14` mast exaggeration), and `15%` vs `40%` `D3` shadow factors are teaching models |
| **NASA BVAD** (`NASA/TP-2015-218570/REV1`) & **ISS ECLSS** | [BVAD PDF](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf) · [ISS Water](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) | Short-mission reference `0.82 kg O₂` consumed & `1.04 kg CO₂` produced per crew-day; ISS BPA `~98%` collected-water recovery | `src/data/nasaTelemetry.ts`, `src/engine/resources.ts`, `NasaSensorDeckModal.tsx`, `EvidencePanel.tsx` | Drives 2-crew hourly oxygen draw (`1.64 kg/day`) across all 216 simulated hours and contrasts nominal/outage water loops (`D2`, `D4`) | Outpost `85%`/`55%`/`20%` recovery loop, `+4 pp` D2 seal bonus, `+3 kg O₂` ISRU demonstrator, and unmodeled `CO₂` tank chemistry are assumptions |
| **NASA LCROSS** (`Cabeus Impact`, `SMD-LUN-102 Rev A`) & **LRO Diviner** (`Paige et al. 2010`) | [SMD-LUN-102](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf#page=15) · [Paige 2010](https://pubs.usgs.gov/publication/70036393) | `5.6 ± 2.9%` Cabeus regolith water-ice mass fraction; `~38 K` subsurface Cabeus cold-trap estimate | `src/data/nasaTelemetry.ts`, `src/engine/resources.ts`, `NasaSensorDeckModal.tsx`, `DecisionCard.tsx` (`D4`) | Sets `0.056` ice fraction in `D4-A` extraction (`20 kg` + cores) and frames cryogenic shadow heating demand (`D3`) | Applying Cabeus estimate to fictional Shackleton regolith (`20 kg` + `3 kg/core`), `60%/75%` treatment efficiency, and `90 K` (`−183 °C`) linear heater curve |
| **NASA-STD-3001** (`Vol. 1 Rev C`, `§4.8.2`) | [NASA-STD-3001](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_1) | `<600 mSv` career effective-dose limit and ALARA crew-health principle | `src/data/nasaTelemetry.ts`, `DecisionCard.tsx` (`D5`), `NasaSensorDeckModal.tsx`, `EvidencePanel.tsx` | Distinguishes operational NASA career limit (`600 mSv`) from the trainer's `50 mSv` Day 9 science-gate threshold | `50 mSv` threshold & `−50%` Day 9 science multiplier are classroom game rules, never compliance verification |

## Key Features

- **Dual-Layer Cadet & Flight Engineer UX:** Designed for our target **ages 7–12** Junior Astronaut audience (`Cadet Mode` with clear story cards and plain-language cause-and-effect) while offering a 1-click switch to `Engineer Mode` with full `kWh`, `kg O₂/H₂O/Food`, `mSv`, and hourly reserve forecasts for educators and NASA judges.
- **Procedural 3D Shackleton teaching scene:** Orbit the circular relief, reset its camera, and compare exaggerated mast-height effects with the Sun slider. No NASA elevation raster or thermal map is loaded. Instantaneous visibility indices and illustrative marker positions are separate from the published LOLA-derived S/C1 site-planning values.
- **Space-weather evidence and training scenarios:** The default 207 pfu peak borrows NOAA's May 2024 near-Earth GOES measurement. The 840 and 18 pfu alternatives are explicit assumptions. Optional NASA DONKI FLR records provide flare context only; no flare-class-to-proton-flux conversion is made. Radiation charts show classroom estimates, not ISS/Lunar telemetry or astronaut exposure predictions.
- **216-Hour Counterfactual Rewind Lab, PNG Patch & Shareable Replay URLs:** Inspect continuous 216-hour `hourlyHistory` telemetry curves comparing **Run A** vs **Run B**, export a custom HTML5 Canvas **Mission Patch PNG** with your Commander Callsign, or copy a `?m=` shareable replay URL that restores your exact comparison run.
- **Hands-On Station Calibrations & Fieldwork Wired to Physics:** Aligning the D1 solar mast, sealing the D2 water loop, patching the D3 HVDC bus, pre-heating the D4 cryo-extractor, mining 90K basin ice cores (`[Space]`), clamping the D5 storm bulkhead, aligning the D6 Ka-band dish, and logging lunar geology samples directly improve simulated reserves and science output.
- **Bonus Mission 2 — Mars Jezero Global Dust Storm:** Survive 3 Martian Sols under `τ = 4.2` atmospheric dust (`−82%` solar output), `−68 °C` nights, MOXIE `CO₂ → O₂` power trade-offs, and a simulated 28-minute round-trip Earth radio delay.
- **Original adaptive audio & rover vibration:** A procedural chord-and-melody score shifts between menu, exploration, and restrained tension, paired with a continuous speed-reactive dual-oscillator rover motor synthesis representing structure-borne chassis vibration. Separate master/music/effects levels and mute are available from the launch screen and HUD; preferences stay in this browser. Audio begins after a pointer or keyboard interaction and pauses cleanly when leaving the rover, opening overlays, losing window focus, or hiding the tab. Feedback represents music, suit/radio cues, and vehicle structure vibration—not sound traveling through lunar vacuum.

## Run locally

The public web deployment is live and verified at <https://newgenzzz.github.io/outpost-replay-team/> (see [GITHUB_PAGES.md](GITHUB_PAGES.md) for the workflow and [CLOUDFLARE_DIRECT_UPLOAD.md](CLOUDFLARE_DIRECT_UPLOAD.md) for the static fallback). Source is hosted at <https://github.com/Newgenzzz/outpost-replay-team>.

Supporting documentation includes [the release-candidate review](RELEASE_CANDIDATE_2026-11-15.md) (historical pre-Pages checkpoint), the [27-second gameplay storyboard](DEMO_27_SECONDS.md), [NASA_SCIENCE.md](NASA_SCIENCE.md), and [ATTRIBUTION.md](ATTRIBUTION.md). Original team materials are Apache-2.0 licensed ([LICENSE](LICENSE) / [NOTICE](NOTICE)). Public launch links directly to interactive credits, AI/timeline disclosures, and bundled third-party notices.

For presentation drafts and remaining release gates, see [SUBMISSION_KIT.md](SUBMISSION_KIT.md). Current development state and verification limits are in [CODEX_HANDOFF.md](CODEX_HANDOFF.md).

**Prerequisites:** Node.js 22 or later and npm.

From the project directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. If dependencies are already installed, start with `npm run dev`.

```sh
npm test          # deterministic engine, resource accounting and mission regressions
npm run typecheck # TypeScript
npm run build     # type check and generate dist/
npm run build:pages # build for /outpost-replay-team/ on GitHub Pages
npm run preview   # serve the production build locally
```

## Play

### Controls at a glance

| Action | Input |
| --- | --- |
| Move | `WASD`, arrow keys, or click the terrain |
| Open a station console | `E` |
| Drive / leave the rover | `V` |
| Tactical map | `M` |
| Rewind & Compare | `R` |
| Navigate controls / close a dialog | `Tab` / `Esc` |

### Starting and saving

- New players can choose **Start guided experiment** on the launch screen to predict, test a decision and compare an alternative. **Explore the full 9-day mission** retains the complete mission and fieldwork. The guided result separates battery reserve, science earned and low-reserve hours during D3 from whole-mission comparison totals.

- Progress automatically saves in this browser. After refreshing, choose **Resume current mission** or **Resume Mars bonus mission** on the launch screen. Saved inputs include both lunar runs, applied preparations, completed fieldwork, preparation drafts, recorded predictions and the guided stage; results are recalculated deterministically. Avatar position, rover state, drill heat and unfinished mini-game attempts restart. A valid shared replay loads its own inputs first; once saved, subsequent refreshes resume your edits. If browser storage is unavailable, a visible message asks you to keep the tab open. A new guided experiment still asks before replacing existing lunar progress.

### Decisions, fieldwork and rewind

- Walk with **WASD**, the arrow keys, or a click on the terrain. Use **V** to drive or leave the rover.
- Choose **Go to station** to follow a route, then open the console with **E**. You can also choose **Open console** from the mission panel. Compare the three options and choose **Apply option** to advance. Apply stays visible while you open optional exercises, science notes, and detailed forecasts. D1 calibration can improve modeled panel pointing. At D4, a field core or three console pulses unlock the option to prepare the ice extractor and recover more water with option A. Use Rewind & Compare to isolate either setting. Field samples also have a separate collection score.
- Decision cards show the modeled endpoint battery reserve and hours below 20 kWh during that phase. If a forecast aborts, it names the stop hour and cause. Exploring does not advance simulated mission time; Apply advances the phase, or recalculates a replay branch while preserving later planned choices.
- Replay marks effective preparation and fieldwork changes even when the option letter stays the same. To isolate a cause, change one option or preparation setting and Apply.
- The mission panel keeps your last applied result and a short engineering lesson. Expand **Why it changed** for the resource changes and decision explanation.
- At D3, optionally open **Predict → Experiment → Compare** and predict which shadow strategy leaves more battery at hour 120. Apply saves the prediction and its full setup through D3. Finish the run, rewind D3, and test the other strategy. Comparison uses the actual hour-120 results even if the missions end at different times. Changing earlier choices, relevant preparation/fieldwork, or the storm scenario invalidates the earlier setup.
- In **Field Samples**, select the Laser Altimetry Marker and **Go to the ridge marker**. Log it with **E** on the terrain to earn the existing field points and unlock a short question about terrain and sunlight. **Open Sunlight research** connects the investigation to the site planner's measurements, research models, and training assumptions.
- Open the tactical map with **M** and the comparison lab with **R**. **Tab** navigates controls and **Esc** closes a dialog.
- Once Run A finishes or aborts, choose an earlier decision in **Rewind & Compare**. Try one change first. The run preserves later planned choices. If your change reaches a phase Run A never planned, choose how to handle that phase.
- Fieldwork and console exercises prepare drafts. **Apply** records the selected phase's settings; discoveries do not rewrite earlier results. Rewinding copies the complete run, and editing one phase preserves other recorded phases. Sample bonuses are credited once, at the phase where their count is first applied.
- **Share Replay URL** on the Flight Certificate includes both runs' complete scenario and per-phase settings. Version 2 links reproduce those inputs; older links show a warning because omitted preparations must use defaults. Callsigns are excluded.
- Storm selections in the science deck preview a scenario. **Start new experiment with selected storm** clears A/B and starts with that peak; simply inspecting a different storm leaves the current experiment unchanged.

### Language, science and audio

- Use **EN · AZ** to switch languages. Open **Science** (**Elm** in Azerbaijani) to explore the sunlight experiment, NASA/NOAA references, DONKI space-weather catalog, OSDR research, educational calculations and the optional 3D crater demonstration.
- Open **Audio settings** / **Səs ayarları** from the speaker control on launch or the sliders icon in the HUD. Master controls the whole mix, Music controls the score, and Effects controls feedback/radio. The speaker button mutes everything without changing those levels. Music at 0% stops the score while leaving feedback available. Defaults are 80% master, 50% music and 75% effects. For classroom or judge narration, lower music or mute. Voice quality depends on installed system voices; Azerbaijani uses a short telemetry cue when no matching voice exists, with the advice still readable on screen. See [AUDIO_UPGRADE_2026-11-15.md](AUDIO_UPGRADE_2026-11-15.md) for verification and a manual listening checklist.

## Demo for judges

Use [JUDGE_DEMO.md](JUDGE_DEMO.md) for the timed three-minute rehearsal.

| Default Guided Demo result | Keep drilling | Backup fuel cells |
| --- | ---: | ---: |
| Battery at hour 120 | **19.9 kWh** | **43.9 kWh** |
| Whole-mission low-reserve hours | 97 h | 0 h |
| Science change | — | −14 points |
| Final score | 54 | 66 |

1. Select **Start guided experiment** on the launch screen. Open **Compare lunar sites** and expand the planning exercise under Sunlight. At 35 kWh, the Shackleton study point covers its longest modeled shadow and Connecting Ridge C1 falls short despite higher average illumination. Close the panel and choose **Start the shadow test**.
2. Ask a judge to choose **Keep drilling** or **Use backup fuel cells** for Run A. The banner shows the real result. Keeping the drill running during the modeled shadow leaves **19.9 kWh** at hour 120.
3. Select **Rewind & try the other plan** to try the other strategy. Both runs reach hour 216 with just one choice changed. Backup fuel cells leave **43.9 kWh** at hour 120 and the crew finishes successfully, with fewer science points. Open **Decisions and downstream effects** or inspect the power and life-support graphs to discuss the trade-off.
4. If time allows, record a prediction before choosing a plan; its feedback remains available below the comparison. Open **Science** (**Elm** in Azerbaijani) and use **Trace the evidence** in the Sunlight planner to show which data was observed, what was derived, and what the exercise assumes.

Allow two to three minutes to talk through the planning exercise and mission comparison. **Load Demo Preset** opens the finished comparison directly.

See [SPEC.md](SPEC.md) for implementation details, [NASA_SCIENCE.md](NASA_SCIENCE.md) for source provenance, and [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) for completed work and verification.

See [COMPETITION_READINESS.md](COMPETITION_READINESS.md) for earlier release-gate checklists, static deployment/rollback instructions, judge rehearsal, and submission verification items. Original-material Apache-2.0 licensing is recorded in [ATTRIBUTION.md](ATTRIBUTION.md) and [NOTICE](NOTICE); third-party runtime notices are regenerated with `node scripts/prepare-notices.mjs` and verified in CI. Both <https://newgenzzz.github.io/outpost-replay-team/> and <https://github.com/Newgenzzz/outpost-replay-team> are publicly accessible without login.

The setting is a fictional outpost near Shackleton's rim. See [source credits and licensing status](ATTRIBUTION.md) for software and asset attribution and the approved limited Apache-2.0 scope. Original team materials are licensed under [Apache-2.0](LICENSE), with [NOTICE](NOTICE) recording Copyright 2026 Team Brochachos contributors and the exclusions for third-party software and NASA/NOAA materials.

## Documentation map

| Document | Purpose |
| --- | --- |
| [RELEASE_CANDIDATE_2026-11-15.md](RELEASE_CANDIDATE_2026-11-15.md) | Historical pre-Pages release-candidate review (superseded by README & ATTRIBUTION) |
| [SUBMISSION_KIT.md](SUBMISSION_KIT.md) | Submission portal drafts, disclosures and recording template |
| [JUDGE_DEMO.md](JUDGE_DEMO.md) | Timed three-minute judge rehearsal |
| [DEMO_27_SECONDS.md](DEMO_27_SECONDS.md) | 27-second gameplay storyboard |
| [GITHUB_PAGES.md](GITHUB_PAGES.md) | GitHub Pages workflow, owner setup and verification |
| [CLOUDFLARE_DIRECT_UPLOAD.md](CLOUDFLARE_DIRECT_UPLOAD.md) | Static deployment fallback via Cloudflare Pages Direct Upload |
| [COMPETITION_READINESS.md](COMPETITION_READINESS.md) | Historical 9 Nov release-gate checklist and static runbook |
| [NASA_SCIENCE.md](NASA_SCIENCE.md) | Source ledger, equations and scientific limitations |
| [ATTRIBUTION.md](ATTRIBUTION.md) | Credits, dependency notices, development history and licensing status |
| [ASSET_PROVENANCE_2026-11-15.md](ASSET_PROVENANCE_2026-11-15.md) | Historical SVG provenance and AI-assisted origin record |
| [INDEPENDENT_AUDIT_2026-11-14.md](INDEPENDENT_AUDIT_2026-11-14.md) | Historical Nov 14 independent code, gameplay and science audit |
| [SPEC.md](SPEC.md) | Technical specification and replay contract |
| [CODEX_HANDOFF.md](CODEX_HANDOFF.md) | Historical local development checkpoint |
| [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md) | Architecture, milestones and engineering constraints |
| [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) | Chronological implementation and verification log |
| [PLAYER_EXPERIENCE_2026-11-15.md](PLAYER_EXPERIENCE_2026-11-15.md) | Player-experience improvement report |
| [AUDIO_UPGRADE_2026-11-15.md](AUDIO_UPGRADE_2026-11-15.md) | Audio implementation, verification and listening checklist |
| [COMPETITION_REVIEW.md](COMPETITION_REVIEW.md) | First-round review and prioritized improvements |
