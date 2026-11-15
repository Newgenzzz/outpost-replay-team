# Outpost Replay

A bilingual lunar engineering game for the Junior Astronaut Mission Trainer challenge. Lead a two-person crew through nine simulated days near Shackleton crater. Explore the outpost, preview engineering choices, then rewind to test how a different choice changes the outcome.

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
- Open a nearby station with **E**, or choose **Open Console** from the objective panel. Select an option to preview it, then choose **Apply option** to advance. Station calibration exercises are optional. Field samples have a separate collection score.
- Open the tactical map with **M** and the comparison lab with **R**. **Tab** navigates controls and **Esc** closes a dialog.
- Once Run A finishes or aborts, choose an earlier decision in **Rewind & Compare**. Try one change first. The run preserves later planned choices. If your change reaches a phase Run A never planned, choose how to handle that phase.
- Use **EN · AZ** to switch languages. **Science & Sources** explains the datasets and assumptions behind the simulation.

## Demo for judges

1. Select **Guided Demo** and apply the starting plan. Briefly explain why low solar panels can work well in clear sunlight, and what the berm is for.
2. Select **Simulate Run A**. Show how running the drilling operation during the modeled shadow drops the battery to **19.9 kWh** by hour 120.
3. Select **Rewind D3 and compare**. Both runs reach hour 216, and only the shadow decision changes. Backup fuel cells bring the hour-120 battery to **43.9 kWh** and turn mission warnings into success. Point out the cost in science return, then open **Decisions and downstream effects** or inspect the power and life-support graphs.
4. If time allows, open **Science & Sources** and show which data was observed, what was derived, and what the exercise assumes.

Allow about two minutes to talk through the three steps. **Load Demo Preset** opens the finished comparison directly.

See [SPEC.md](SPEC.md) for implementation details, [NASA_SCIENCE.md](NASA_SCIENCE.md) for source provenance, and [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) for completed work and verification.

The setting is a fictional outpost near Shackleton’s rim. See [source credits and licensing status](ATTRIBUTION.md) for software and asset attribution and the proposed license awaiting team approval.
