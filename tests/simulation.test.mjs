import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

// Bundle the pure TypeScript modules with the same resolver used by the game.
// The test process neither starts a server nor writes a build to disk.
const testEntry = 'outpost:simulation-test';
const bundle = await build({
  configFile: false,
  logLevel: 'silent',
  plugins: [{
    name: 'simulation-test-entry',
    resolveId: (id) => id === testEntry ? `\0${id}` : null,
    load: (id) => id === `\0${testEntry}` ? `
      export * from '/src/engine/simulation.ts';
      export * from '/src/engine/resources.ts';
      export * from '/src/engine/power.ts';
      export * from '/src/data/missionDecisions.ts';
      export * from '/src/data/nasaTelemetry.ts';
    ` : null,
  }],
  build: {
    write: false,
    minify: false,
    rollupOptions: { input: testEntry, output: { format: 'es' }, preserveEntrySignatures: 'strict' },
  },
});
const [{ code }] = bundle.output;
const {
  advancePower, compareRuns, CROP_TRIAL, ECLSS_BASELINES, INITIAL_RESOURCES, integrateSepDoseMsv, LCROSS_CABEUS,
  MISSION_DECISIONS, MISSION_DEMO, newEnvironmentDetail, phasePowerPlan, runSimulation, SHIELDING,
} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const phases = [24, 48, 120, 144, 192, 216];

function near(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test('starts, advances, and validates a deterministic mission prefix', () => {
  const empty = runSimulation([]);
  assert.equal(empty.complete, false);
  assert.equal(empty.elapsedHours, 0);
  assert.equal(empty.score, null);
  assert.deepEqual(empty.resources, INITIAL_RESOURCES);

  const choices = Object.freeze([0, 1, 2]);
  const partial = runSimulation(choices);
  assert.deepEqual(partial.steps.map((step) => step.endHour), phases.slice(0, 3));
  assert.equal(partial.elapsedHours, 120);
  assert.equal(partial.outcome, 'in-progress');
  assert.deepEqual(runSimulation(choices), partial);
  assert.throws(() => runSimulation([0, 3]), RangeError);
  assert.throws(() => runSimulation([0.5]), RangeError);
  assert.throws(() => runSimulation(Array(2)), RangeError);
});

test('uses the BVAD oxygen input, closed-loop water, and actual solar incidence', () => {
  const aligned = runSimulation([1, 0, 2]);
  const tilted = runSimulation([2, 0, 2]);
  const mast = runSimulation([0, 0, 2]);
  near(aligned.steps[0].resourceFlows.oxygenUsedKg, 2 * ECLSS_BASELINES.o2KgPerCrewDay);
  near(aligned.steps[0].resourceFlows.waterUsedKg, 6);
  near(aligned.steps[0].resourceFlows.waterRecoveredKg, 5.1);
  near(aligned.steps[0].env.generationKwh, 12);
  near(tilted.steps[0].env.generationKwh, 12 * Math.cos(25 * Math.PI / 180), 0.001);
  assert.equal(aligned.steps[2].env.inShadow, true);
  assert.equal(aligned.steps[2].env.simulatedHours, 72);
  assert.equal(aligned.steps[2].env.meanSurfaceTempK, mast.steps[2].env.meanSurfaceTempK);
  assert.ok(mast.steps[2].env.generationKwh > aligned.steps[2].env.generationKwh);
});

test('sheds only discretionary demand and distinguishes task shortages from essential outages', () => {
  const serviced = runSimulation([1, 0, 1, 1]).steps[3];
  near(serviced.env.loadKwh, 10);
  near(serviced.env.loadReductionKwh, 6);
  near(serviced.resourceFlows.waterRecoveredKg, 6 * 0.93);

  const drilling = MISSION_DECISIONS[2].choices[2];
  const plan = phasePowerPlan(drilling, [], 72);
  const env = newEnvironmentDetail(1);
  const blackedOut = advancePower(env, plan, 108, new Set(), INITIAL_RESOURCES, 0);
  assert.equal(blackedOut.outage, true);
  assert.equal(blackedOut.batteryKwh, 0);
  assert.equal(blackedOut.taskPowerFraction, 0);
  assert.ok(env.unservedKwh > env.unservedTaskKwh);

  const traverse = MISSION_DECISIONS[3].choices[0];
  const sunny = newEnvironmentDetail(1);
  const short = advancePower(sunny, phasePowerPlan(traverse, [], 24), 120, new Set(), INITIAL_RESOURCES, 0);
  assert.equal(short.outage, false);
  assert.ok(sunny.unservedTaskKwh > 0);
});

test('harvests only after five powered days and accounts for supplemental food', () => {
  const harvest = runSimulation([0, 2, 1, 1, 1, 1]);
  const stalled = runSimulation([1, 2, 2, 0, 0, 0]);
  assert.equal(harvest.resourceHistory[2].cropGrowthDays, CROP_TRIAL.ageAtInstallDays);
  assert.equal(harvest.resources.cropGrowthDays, CROP_TRIAL.harvestAgeDays);
  assert.equal(harvest.resources.harvestedFoodKg, CROP_TRIAL.harvestKg);
  near(harvest.steps.reduce((hours, step) => hours + step.resourceFlows.cropHours, 0), 5 * 24);
  near(harvest.steps.reduce((kg, step) => kg + step.resourceFlows.rationAddedKg, 0), CROP_TRIAL.rationEquivalentKg);
  near(harvest.steps.reduce((kg, step) => kg + step.resourceFlows.cropWaterKg, 0), 5 * CROP_TRIAL.waterKgPerDay);
  assert.equal(stalled.resources.harvestedFoodKg, 0);
  assert.ok(stalled.resources.cropGrowthDays < CROP_TRIAL.harvestAgeDays);
  assert.ok(stalled.steps.some((step) => step.env.lowPowerHours > 0 && step.resourceFlows.cropHours === 0));
});

test('applies LCROSS ice fraction only to processed training feedstock', () => {
  const powered = runSimulation([1, 0, 1, 0]).steps[3];
  const interrupted = runSimulation([2, 1, 2, 0]).steps[3];
  const expected = 20 * LCROSS_CABEUS.waterIceMassFraction * 0.60;
  near(powered.resourceFlows.waterExtractedKg, expected);
  assert.ok(interrupted.env.unservedTaskKwh > 0);
  assert.ok(interrupted.resourceFlows.waterExtractedKg < expected);
});

test('integrates the same storm across shelter choices and weights EVA by timing', () => {
  const first = integrateSepDoseMsv(0, 24);
  const second = integrateSepDoseMsv(24, 48);
  near(first + second, integrateSepDoseMsv(0, 48));
  const prefix = [1, 0, 1, 1];
  const [eva, habitat, berm] = [0, 1, 2].map((choice) => runSimulation([...prefix, choice]).steps[4]);
  const water = runSimulation([1, 1, 1, 1, 2]).steps[4];
  near(eva.delta.radiationMsv, 2 + first * SHIELDING.evaSuit + second * SHIELDING.habitat, 0.11);
  near(habitat.delta.radiationMsv, 2 + (first + second) * SHIELDING.habitat, 0.11);
  near(berm.delta.radiationMsv, 2 + (first + second) * SHIELDING.regolithBerm, 0.11);
  near(water.delta.radiationMsv, 2 + (first + second) * SHIELDING.waterWall, 0.11);
  assert.ok(berm.delta.radiationMsv < water.delta.radiationMsv);
  assert.ok(water.delta.radiationMsv < habitat.delta.radiationMsv);
  assert.ok(habitat.delta.radiationMsv < eva.delta.radiationMsv);
});

test('rewinds only the shadow choice and compares complete equal-duration judge runs', () => {
  const a = runSimulation(MISSION_DEMO.baseline);
  const b = runSimulation(MISSION_DEMO.branch);
  const comparison = compareRuns(a, b);
  assert.deepEqual(comparison.changedSteps, [MISSION_DEMO.rewindStep]);
  assert.deepEqual(a.history.slice(0, 3), b.history.slice(0, 3));
  assert.deepEqual(a.resourceHistory.slice(0, 3), b.resourceHistory.slice(0, 3));
  assert.deepEqual(a.steps.map((step) => step.endHour), phases);
  assert.deepEqual(b.steps.map((step) => step.endHour), phases);
  assert.equal(a.steps[2].env.generationKwh, b.steps[2].env.generationKwh);
  assert.equal(a.steps[2].env.meanSurfaceTempK, b.steps[2].env.meanSurfaceTempK);
  assert.equal(a.outcome, 'warning');
  assert.equal(b.outcome, 'success');
  assert.ok(b.final.powerKwh > a.final.powerKwh);
  assert.ok(b.resources.waterKg > a.resources.waterKg);
  assert.ok(b.final.sciencePoints < a.final.sciencePoints);
  assert.deepEqual(compareRuns(a, runSimulation(MISSION_DEMO.baseline)).changedSteps, []);
  assert.deepEqual(runSimulation(MISSION_DEMO.baseline), a);
});

test('aborts inside a phase and stops adding time and reserves', () => {
  const terminal = runSimulation([2, 1, 2, 0, 2, 0]);
  assert.equal(terminal.outcome, 'abort');
  assert.equal(terminal.complete, true);
  assert.equal(terminal.abortCause, 'water');
  assert.equal(terminal.resources.waterKg, 0);
  assert.equal(terminal.final.lifeSupportPct, 0);
  assert.equal(terminal.lifeSupportDepletedStep, 6);
  assert.ok(terminal.elapsedHours < 216);
  assert.equal(terminal.elapsedHours, terminal.steps.at(-1).endHour);
  assert.equal(terminal.steps.at(-1).env.simulatedHours, terminal.elapsedHours - 192);
});

test('conserves energy and crew stores across every one of the 729 routes', () => {
  const outcomes = new Set();
  for (let path = 0; path < 3 ** 6; path++) {
    const result = runSimulation([...path.toString(3).padStart(6, '0')].map(Number));
    outcomes.add(result.outcome);
    assert.equal(result.history.length, result.steps.length + 1);
    assert.equal(result.resourceHistory.length, result.history.length);
    for (const step of result.steps) {
      const { before, after, env, resourceFlows: flows, resourcesBefore, resourcesAfter } = step;
      const energyChange = env.generationKwh + env.supplementalGenerationKwh - env.loadKwh + env.loadReductionKwh -
        env.heaterKwh - env.taskLoadKwh - env.greenhouseLoadKwh - env.curtailedKwh + env.unservedKwh;
      near(after.powerKwh - before.powerKwh, energyChange, 0.106);
      near(resourcesAfter.oxygenKg - resourcesBefore.oxygenKg, flows.oxygenAddedKg - flows.oxygenUsedKg, 0.0011);
      near(resourcesAfter.waterKg - resourcesBefore.waterKg,
        flows.waterAddedKg - flows.waterUsedKg + flows.waterRecoveredKg - flows.cropWaterKg, 0.0011);
      near(resourcesAfter.foodKg - resourcesBefore.foodKg, flows.rationAddedKg - flows.rationUsedKg, 0.0011);
      assert.ok(after.powerKwh >= 0 && after.powerKwh <= 100);
      assert.ok(after.lifeSupportPct >= 0 && after.lifeSupportPct <= 100);
      assert.ok(after.radiationMsv >= before.radiationMsv);
      assert.ok(after.sciencePoints >= 0 && after.sciencePoints <= 100);
      assert.ok(Object.values(resourcesAfter).every((value) => value >= 0));
      for (const [metric, delta] of Object.entries(step.delta)) {
        near(step.contributions.reduce((total, contribution) => total + (contribution.delta[metric] ?? 0), 0), delta);
      }
    }
  }
  assert.deepEqual(outcomes, new Set(['success', 'warning', 'abort']));
});
