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
      export * from '/src/engine/runInput.ts';
      export * from '/src/engine/marsMission.ts';
      export * from '/src/engine/resources.ts';
      export * from '/src/engine/power.ts';
      export * from '/src/engine/sitePowerPlanning.ts';
      export * from '/src/engine/shadowPrediction.ts';
      export * from '/src/data/lunarSiteIntelligence.ts';
      export * from '/src/data/shackletonDem.ts';
      export * from '/src/data/nasaSpaceWeather.ts';
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
  advancePower, buildStormProfileForPeak, compareRuns, computeRimIllumination, CRATER_DEPTH_KM, CROP_TRIAL,
  applyRunChoice, cloneRunInput, createRunInput, getPhaseContext, getRunTasks, normalizePhaseTasks,
  ECLSS_BASELINES, INITIAL_RESOURCES, integrateSepDoseMsv, LCROSS_CABEUS, estimateSitePower, evaluateShadowPrediction, recordShadowPrediction,
  LUNAR_PLANNING_SITES, MISSION_DECISIONS, MISSION_DEMO, newEnvironmentDetail, phasePowerPlan,
  runExperiment, runMarsSimulation, runSimulation, sampleShackletonElevationKm, SHIELDING,
} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const phases = [24, 48, 120, 144, 192, 216];

test('evaluates a recorded D3 prediction only for tested strategies with the same setup and hour', () => {
  const a = runSimulation([2, 2, 2, 2, 0, 0]);
  const b = runSimulation([2, 2, 1, 2, 0, 0]);
  assert.equal(a.elapsedHours, 203);
  assert.equal(b.elapsedHours, 216);
  const prediction = recordShadowPrediction('backup', a.input);
  assert.equal(evaluateShadowPrediction(prediction, a, null).status, 'pending');
  const result = evaluateShadowPrediction(prediction, a, b);
  assert.equal(result.status, 'supported');
  assert.equal(result.backupKwh, b.steps[2].after.powerKwh);
  assert.equal(result.drillKwh, a.steps[2].after.powerKwh);
  assert.equal(evaluateShadowPrediction({ ...prediction, expected: 'drill' }, a, b).status, 'contradicted');
  assert.equal(evaluateShadowPrediction(prediction, a, runSimulation([1, 2, 1])).status, 'changed');
  assert.equal(evaluateShadowPrediction(prediction, a, runSimulation(b.choices, { solarCalibrated: true })).status, 'changed');
});

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

test('applies prepared extraction to the same D4-A feedstock and powered fraction', () => {
  const choices = [1, 0, 1, 0];
  const standard = runSimulation(choices);
  const prepared = runSimulation(choices, { icePrepared: true });
  const fullYieldKg = 20 * LCROSS_CABEUS.waterIceMassFraction * 0.75;
  assert.equal(standard.icePrepared, false);
  assert.equal(prepared.icePrepared, true);
  assert.deepEqual(runSimulation(choices, { icePrepared: true }), prepared);
  assert.deepEqual(prepared.steps.slice(0, 3), standard.steps.slice(0, 3));
  assert.deepEqual(prepared.steps[3].env, standard.steps[3].env);
  near(prepared.steps[3].resourceFlows.waterExtractedKg, fullYieldKg);
  near(prepared.resources.waterKg - standard.resources.waterKg, 0.168, 0.001);

  const constrainedChoices = [2, 1, 2, 0];
  const constrained = runSimulation(constrainedChoices).steps[3];
  const constrainedPrepared = runSimulation(constrainedChoices, { icePrepared: true }).steps[3];
  assert.ok(constrainedPrepared.env.unservedTaskKwh > 0);
  assert.ok(constrainedPrepared.resourceFlows.waterExtractedKg < fullYieldKg);
  near(constrainedPrepared.resourceFlows.waterExtractedKg, constrained.resourceFlows.waterExtractedKg * 1.25);

  const maintenance = [1, 0, 1, 1];
  const { input: preparedInput, ...preparedMaintenance } = runSimulation(maintenance, { icePrepared: true });
  const { input: standardInput, ...standardMaintenance } = runSimulation(maintenance);
  assert.deepEqual(preparedMaintenance, standardMaintenance);
  assert.notDeepEqual(preparedInput, standardInput); // Preserve the recorded setting even when this choice does not use it.
  const prefix = runSimulation(choices.slice(0, 3), { icePrepared: true });
  assert.equal(prefix.icePrepared, false);
  assert.deepEqual(compareRuns(prefix, prepared).changedSteps, []);
  const comparison = compareRuns(standard, prepared);
  assert.equal(comparison.firstDivergence, 4);
  assert.deepEqual(comparison.changedSteps, [4]);
  assert.deepEqual(comparison.reasons[0], { kind: 'icePreparationChanged', from: false, to: true });
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

test('conserves energy and crew stores across all 729 routes for every station setting', () => {
  const outcomes = new Set();
  const routeCount = 3 ** 6;
  const equipmentSettings = [
    {},
    { solarCalibrated: true },
    { icePrepared: true },
    { solarCalibrated: true, icePrepared: true },
    { solarCalibrated: true, icePrepared: true, eclssSealed: true, busPatched: true,
      extraIceCores: 5, stormClamped: true, dishAligned: true, fieldSamplesCount: 6, stormPeakPfu: 840 },
  ];
  for (let input = 0; input < equipmentSettings.length * routeCount; input++) {
    const choices = [...(input % routeCount).toString(3).padStart(6, '0')].map(Number);
    const result = runSimulation(choices, equipmentSettings[Math.floor(input / routeCount)]);
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

test('uses modeled site illumination and shadow duration to compare solar plans', () => {
  const [shackleton, ridge] = LUNAR_PLANNING_SITES.map((site) => estimateSitePower(site, 35));
  near(shackleton.meanGenerationKwhPerDay, 10.26);
  near(ridge.meanGenerationKwhPerDay, 10.56);
  near(shackleton.shadowEnergyKwh, 27.5);
  near(ridge.shadowEnergyKwh, 140 / 3);
  assert.ok(shackleton.reserveMarginKwh > 0);
  assert.ok(ridge.reserveMarginKwh < 0);
  near(estimateSitePower(LUNAR_PLANNING_SITES[0], 27.5).reserveMarginKwh, 0);
});

test('solar calibration changes only the modeled pointing and is recorded as a D1 replay input', () => {
  const choices = [2, 1, 1, 1, 1, 1];
  const a = runSimulation(choices);
  const b = runSimulation(choices, { solarCalibrated: true });
  assert.equal(a.solarCalibrated, false);
  assert.equal(b.solarCalibrated, true);
  assert.deepEqual(runSimulation(choices, { solarCalibrated: true }), b);
  assert.deepEqual(a.history[0], b.history[0]);
  assert.deepEqual(a.resourceHistory[0], b.resourceHistory[0]);
  near(a.steps[0].env.orientationFactor, Math.cos(25 * Math.PI / 180), 0.0005);
  near(b.steps[0].env.orientationFactor, Math.cos(4 * Math.PI / 180), 0.0005);
  assert.equal(a.steps[2].env.meanSurfaceTempK, b.steps[2].env.meanSurfaceTempK);
  near(a.steps[2].env.arrayOutputFactor / a.steps[2].env.orientationFactor,
    b.steps[2].env.arrayOutputFactor / b.steps[2].env.orientationFactor, 0.002);
  assert.ok(b.steps[0].env.generationKwh > a.steps[0].env.generationKwh);
  const comparison = compareRuns(a, b);
  assert.deepEqual(comparison.changedSteps, [1]);
  assert.deepEqual(comparison.reasons[0], { kind: 'solarCalibrationChanged', from: false, to: true });
  assert.deepEqual(runSimulation([1], { solarCalibrated: true }).history, runSimulation([1]).history);
  assert.equal(runSimulation([], { solarCalibrated: true }).solarCalibrated, false);
});

test('records 217 hourly telemetry points (hours 0..216) matching final state and truncates on abort', () => {
  const full = runSimulation(MISSION_DEMO.branch);
  assert.equal(full.hourlyHistory.length, 217);
  assert.equal(full.hourlyHistory[0].hour, 0);
  assert.equal(full.hourlyHistory.at(-1).hour, 216);
  near(full.hourlyHistory.at(-1).powerKwh, full.final.powerKwh, 0.05);
  near(full.hourlyHistory.at(-1).lifeSupportPct, full.final.lifeSupportPct, 0.05);
  near(full.hourlyHistory.at(-1).radiationMsv, full.final.radiationMsv, 0.05);

  const aborted = runSimulation([2, 1, 2, 0, 2, 0]);
  assert.equal(aborted.outcome, 'abort');
  assert.equal(aborted.hourlyHistory.at(-1).hour, aborted.elapsedHours);
});

test('wires hands-on station tasks, 90K ice cores, field samples, and storm peak scaling deterministically', () => {
  const choices = [0, 0, 1, 0, 2, 1];
  const base = runSimulation(choices);
  const upgraded = runSimulation(choices, {
    eclssSealed: true,
    busPatched: true,
    extraIceCores: 3,
    stormClamped: true,
    dishAligned: true,
    fieldSamplesCount: 2,
  });

  assert.ok(upgraded.steps[1].resourcesAfter.waterKg > base.steps[1].resourcesAfter.waterKg);
  assert.ok(upgraded.steps[2].after.powerKwh > base.steps[2].after.powerKwh);
  near(
    upgraded.steps[3].resourceFlows.waterExtractedKg - base.steps[3].resourceFlows.waterExtractedKg,
    3 * 3 * LCROSS_CABEUS.waterIceMassFraction * 0.60,
    0.005,
  );
  assert.ok(upgraded.steps[4].delta.radiationMsv < base.steps[4].delta.radiationMsv);
  near(upgraded.final.sciencePoints - base.final.sciencePoints, 4 + 2 * 2, 0.01);

  const diff = compareRuns(base, upgraded);
  assert.ok(diff.reasons.some((r) => r.kind === 'stationTaskChanged'));

  const mildStorm = runSimulation(choices, { stormPeakPfu: 18 });
  const extremeStorm = runSimulation(choices, { stormPeakPfu: 840 });
  assert.ok(extremeStorm.final.radiationMsv > base.final.radiationMsv);
  assert.ok(base.final.radiationMsv > mildStorm.final.radiationMsv);
  assert.equal(buildStormProfileForPeak(840)[5].protonFluxPfu, 840);
});

test('keeps the exaggerated procedural teaching horizon deterministic with taller-mast visibility', () => {
  assert.equal(CRATER_DEPTH_KM, 4.2);
  assert.ok(sampleShackletonElevationKm(0, 0) < -3.0);
  let mastWins = 0;
  for (let az = 0; az < 360; az += 15) {
    const low = computeRimIllumination(az, 2);
    const tall = computeRimIllumination(az, 10);
    assert.ok(tall.illuminatedPct >= low.illuminatedPct);
    if (tall.illuminatedPct > low.illuminatedPct) mastWins++;
  }
  assert.ok(mastWins > 0);
});

test('simulates Bonus Mission 2 (Mars Jezero Global Dust Storm) deterministically across survival and abort routes', () => {
  const safe = runMarsSimulation([0, 0, 0]);
  assert.equal(safe.outcome, 'success');
  assert.equal(safe.steps.length, 3);
  assert.ok(safe.powerKwh > 15);
  assert.deepEqual(runMarsSimulation([0, 0, 0]), safe);

  const reckless = runMarsSimulation([1, 1, 0]);
  assert.ok(reckless.powerKwh < safe.powerKwh || reckless.outcome !== 'success');
});

test('copies, freezes and validates committed experiment inputs without accepting mutable drafts', () => {
  const choices = [2, 2];
  const draft = { solarCalibrated: true, icePrepared: false, stormPeakPfu: 207 };
  const input = createRunInput(choices, draft);
  const before = runExperiment(input);
  choices[0] = 0;
  draft.solarCalibrated = false;
  draft.stormPeakPfu = 840;
  assert.deepEqual(runExperiment(input), before);
  assert.equal(input.phases[0].choiceIndex, 2);
  assert.equal(input.phases[0].tasks.solarCalibrated, true);
  assert.equal(input.scenario.stormPeakPfu, 207);
  assert.ok(Object.isFrozen(input) && Object.isFrozen(input.scenario) && Object.isFrozen(input.phases));
  assert.ok(input.phases.every((phase) => Object.isFrozen(phase) && Object.isFrozen(phase.tasks)));
  assert.throws(() => { input.phases[0].tasks.solarCalibrated = false; }, TypeError);
  assert.notEqual(cloneRunInput(input), input);
  assert.deepEqual(before.input, input);

  for (const stormPeakPfu of [NaN, Infinity, -1, 5001, '207', null]) {
    assert.throws(() => createRunInput([], { stormPeakPfu }));
  }
  for (const tasks of [{ eclssSealed: 'true' }, { solarCalibrated: 1 }, { fieldSamplesCount: 1.5 },
    { fieldSamplesCount: 7 }, { fieldSamplesCount: null }, { extraIceCores: -1 }, { extraIceCores: 6 }]) {
    assert.throws(() => normalizePhaseTasks(tasks));
  }
  assert.throws(() => createRunInput(Array(2)), RangeError);
  assert.throws(() => applyRunChoice(input, 4, 0, getRunTasks(input, 3)), RangeError);
});

test('commits field work at its chosen phase without retroactive credit or repeated sample awards', () => {
  const prefix = createRunInput([0, 0]);
  const previous = runExperiment(prefix);
  const pending = { ...getRunTasks(prefix, 3), busPatched: true, fieldSamplesCount: 2 };
  const applied = applyRunChoice(prefix, 3, 1, pending);
  pending.busPatched = false;
  pending.fieldSamplesCount = 6;
  const withTask = runExperiment(applied);
  assert.deepEqual(runExperiment(prefix), previous);
  assert.deepEqual(withTask.steps.slice(0, 2), previous.steps);
  assert.equal(withTask.input.phases[2].tasks.busPatched, true);
  const fieldAward = (step) => step.contributions.filter(({ label }) => label.en.startsWith('Field geology dossier'));
  assert.deepEqual(withTask.steps.slice(0, 2).flatMap(fieldAward), []);
  assert.equal(fieldAward(withTask.steps[2])[0].delta.sciencePoints, 4);

  const next = applyRunChoice(applied, 4, 0, getRunTasks(applied, 4));
  const continued = runExperiment(next);
  assert.deepEqual(continued.steps.slice(0, 3), withTask.steps);
  assert.deepEqual(fieldAward(continued.steps[3]), []);
  assert.equal(getRunTasks(applied, 4).fieldSamplesCount, 2);
  assert.equal(getPhaseContext(next, 3).fieldSamplesCount, 0);
  const resetCount = applyRunChoice(next, 4, 0, { ...getRunTasks(next, 4), fieldSamplesCount: 0 });
  const collectedAgain = applyRunChoice(resetCount, 5, 2, { ...getRunTasks(resetCount, 5), fieldSamplesCount: 2 });
  assert.equal(getPhaseContext(collectedAgain, 4).fieldSamplesCount, 0);
});

test('replacing one choice preserves later snapshots and never replaces the experiment scenario', () => {
  const original = createRunInput([0, 0, 2, 0, 2, 1], { icePrepared: true, fieldSamplesCount: 2 });
  const revised = applyRunChoice(original, 3, 1, { ...getRunTasks(original, 3), busPatched: true, stormPeakPfu: 840 });
  assert.equal(original.phases[2].choiceIndex, 2);
  assert.equal(revised.phases[2].choiceIndex, 1);
  assert.deepEqual(revised.phases.slice(0, 2), original.phases.slice(0, 2));
  assert.deepEqual(revised.phases.slice(3), original.phases.slice(3));
  assert.deepEqual(revised.scenario, original.scenario);
  assert.deepEqual(runExperiment(revised).steps.slice(0, 2), runExperiment(original).steps.slice(0, 2));
  const extended = applyRunChoice(createRunInput([0, 0]), 3, 1, getRunTasks(original, 3));
  assert.equal(extended.phases.length, 3);
});

test('orders all effective phase input differences chronologically through one comparison', () => {
  const input = createRunInput([0, 0, 1, 0, 2, 1]);
  const base = runExperiment(input);
  for (const [step, patch] of [
    [1, { solarCalibrated: true }], [2, { eclssSealed: true }], [3, { busPatched: true }],
    [4, { icePrepared: true }], [4, { extraIceCores: 3 }], [5, { stormClamped: true }],
    [6, { dishAligned: true }], [3, { fieldSamplesCount: 2 }],
  ]) {
    const changed = applyRunChoice(input, step, input.phases[step - 1].choiceIndex, { ...getRunTasks(input, step), ...patch });
    const cmp = compareRuns(base, runExperiment(changed));
    assert.deepEqual(cmp.changedSteps, [step], JSON.stringify(patch));
    assert.equal(cmp.firstDivergence, step);
  }
  const weather = cloneRunInput({ ...input, scenario: { stormPeakPfu: 840 } });
  assert.deepEqual(compareRuns(base, runExperiment(weather)).changedSteps, [5]);
  assert.equal(base.input.scenario.stormPeakPfu, 207);

  const laterTask = applyRunChoice(input, 2, 0, { ...getRunTasks(input, 2), eclssSealed: true });
  const earlierChoice = applyRunChoice(laterTask, 1, 2, getRunTasks(laterTask, 1));
  assert.deepEqual(compareRuns(base, runExperiment(earlierChoice)).changedSteps, [1, 2]);
  const short = runExperiment(createRunInput([0, 0]));
  assert.deepEqual(compareRuns(short, base).changedSteps, []);
  assert.equal(compareRuns(short, base).firstDivergence, null); // No two matching reached records for later phases.
});
