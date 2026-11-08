# Outpost Replay

A bilingual (`EN · AZ`) lunar & Mars mission engineering trainer built for the **2026 NASA International Space Apps Challenge — "Build a Junior Astronaut Mission Trainer"**. Lead a two-person crew through nine simulated days (216 hours) near Shackleton Crater’s sunlit south-polar rim, explore a 2.5D WebGL outpost, inspect a procedural 3D crater shadow demonstration alongside published LOLA illumination research, rewind any decision to run a controlled counterfactual experiment, and unlock **Bonus Mission 2: Mars Jezero Global Dust Storm & 14-Min Comms Delay**.

## Key Features

- **Dual-Layer Cadet & Flight Engineer UX:** Designed for the official **ages 7–12** Junior Astronaut audience (`Cadet Mode` with clear story cards and plain-language cause-and-effect) while offering a 1-click switch to `Engineer Mode` with full `kWh`, `kg O₂/H₂O/Food`, `mSv`, and hourly reserve forecasts for educators and NASA judges.
- **Procedural 3D Shackleton teaching scene:** Rotate the existing crater and compare exaggerated mast-height effects. No NASA elevation raster or thermal map is loaded. Instantaneous visibility indices and illustrative marker positions are separate from the published LOLA-derived S/C1 site-planning values.
- **Space-weather evidence and training scenarios:** The default 207 pfu peak borrows NOAA's May 2024 near-Earth GOES measurement. The 840 and 18 pfu alternatives are explicit assumptions. Optional NASA DONKI FLR records provide flare context only; no flare-class-to-proton-flux conversion is made. Radiation charts show classroom estimates, not ISS/Lunar telemetry or astronaut exposure predictions.
- **216-Hour Counterfactual Rewind Lab, PNG Patch & Shareable Replay URLs:** Inspect continuous 216-hour `hourlyHistory` telemetry curves comparing **Run A** vs **Run B**, export a custom HTML5 Canvas **Mission Patch PNG** with your Commander Callsign, or copy a `?m=` shareable replay URL that restores your exact comparison run.
- **Hands-On Station Calibrations & Fieldwork Wired to Physics:** Aligning the D1 solar mast, sealing the D2 water loop, patching the D3 HVDC bus, pre-heating the D4 cryo-extractor, mining 90K basin ice cores (`[Space]`), clamping the D5 storm bulkhead, aligning the D6 Ka-band dish, and logging lunar geology samples directly improve simulated reserves and science output.
- **Bonus Mission 2 — Mars Jezero Global Dust Storm:** Survive 3 Martian Sols under `τ = 4.2` atmospheric dust (`−82%` solar output), `−68 °C` nights, MOXIE `CO₂ → O₂` power trade-offs, and a simulated 28-minute round-trip Earth radio delay.

## Run locally

From the project directory, with Node.js 22 or later and npm installed:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. If dependencies are already installed, start with `npm run dev`.

```sh
npm test          # deterministic engine, resource accounting and mission regressions
npm run typecheck # TypeScript
npm run build     # type check and generate dist/
npm run preview   # serve the production build locally
```

## Play

- Walk with **WASD**, the arrow keys, or a click on the terrain. Use **V** to drive or leave the rover.
- Choose **Go to station** to follow a route, then open the console with **E**. You can also choose **Open console** from the mission panel. Compare the three options and choose **Apply option** to advance. Apply stays visible while you open optional exercises, science notes, and detailed forecasts. D1 calibration can improve modeled panel pointing. At D4, a field core or three console pulses unlock the option to prepare the ice extractor and recover more water with option A. Use Rewind & Compare to isolate either setting. Field samples also have a separate collection score.
- The mission panel keeps your last applied result and a short engineering lesson. Expand **Why it changed** for the resource changes and decision explanation.
- At D3, optionally open **Predict → Experiment → Compare** and predict which shadow strategy leaves more battery at hour 120. Apply saves the prediction and its full setup through D3. Finish the run, rewind D3, and test the other strategy. Comparison uses the actual hour-120 results even if the missions end at different times. Changing earlier choices, relevant preparation/fieldwork, or the storm scenario invalidates the earlier setup.
- In **Field Samples**, select the Laser Altimetry Marker and **Go to the ridge marker**. Log it with **E** on the terrain to earn the existing field points and unlock a short question about terrain and sunlight. **Open Sunlight research** connects the investigation to the site planner’s measurements, research models, and training assumptions.
- Open the tactical map with **M** and the comparison lab with **R**. **Tab** navigates controls and **Esc** closes a dialog.
- Once Run A finishes or aborts, choose an earlier decision in **Rewind & Compare**. Try one change first. The run preserves later planned choices. If your change reaches a phase Run A never planned, choose how to handle that phase.
- Fieldwork and console exercises prepare drafts. **Apply** records the selected phase's settings; discoveries do not rewrite earlier results. Rewinding copies the complete run, and editing one phase preserves other recorded phases. Sample bonuses are credited once, at the phase where their count is first applied.
- **Share Replay URL** on the Flight Certificate includes both runs' complete scenario and per-phase settings. Version 2 links reproduce those inputs; older links show a warning because omitted preparations must use defaults. Callsigns are excluded.
- Storm selections in the science deck preview a scenario. **Start new experiment with selected storm** clears A/B and starts with that peak; simply inspecting a different storm leaves the current experiment unchanged.
- Use **EN · AZ** to switch languages. **Science & Sources** explains the datasets and assumptions behind the simulation.

## Demo for judges

1. Select **Guided Demo**. Open **Compare lunar sites** and expand the planning exercise under Sunlight. At 35 kWh, the Shackleton study point covers its longest modeled shadow and Connecting Ridge C1 falls short despite higher average illumination. Close the panel and apply the fictional mission’s starting plan.
2. Ask a judge to choose **Keep drilling** or **Use backup fuel cells** for Run A. The banner shows the real result. Keeping the drill running during the modeled shadow leaves **19.9 kWh** at hour 120.
3. Select **Rewind D3 and compare** to try the other strategy. Both runs reach hour 216 with just one choice changed. Backup fuel cells leave **43.9 kWh** at hour 120 and the crew finishes successfully, with fewer science points. Open **Decisions and downstream effects** or inspect the power and life-support graphs to discuss the trade-off.
4. If time allows, open **Science & Sources** and use **Trace the evidence** in the Sunlight planner to show which data was observed, what was derived, and what the exercise assumes. The optional prediction exercise is available in manual play and does not add a step to the demo.

Allow two to three minutes to talk through the planning exercise and mission comparison. **Load Demo Preset** opens the finished comparison directly.

See [SPEC.md](SPEC.md) for implementation details, [NASA_SCIENCE.md](NASA_SCIENCE.md) for source provenance, and [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) for completed work and verification.

See [COMPETITION_READINESS.md](COMPETITION_READINESS.md) for the audit, static deployment instructions, release blockers and submission checklist. Regenerate shipped software notices with `node scripts/prepare-notices.mjs` before the final build. Public deployment requires team approval.

The setting is a fictional outpost near Shackleton’s rim. See [source credits and licensing status](ATTRIBUTION.md) for software and asset attribution and the proposed license awaiting team approval.
