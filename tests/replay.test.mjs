import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

const entry = 'outpost:replay-test';
const bundle = await build({
  configFile: false,
  logLevel: 'silent',
  plugins: [{
    name: 'replay-test-entry',
    resolveId: (id) => id === entry ? `\0${id}` : null,
    load: (id) => id === `\0${entry}` ? `
      export * from '/src/engine/simulation.ts';
      export * from '/src/engine/runInput.ts';
      export * from '/src/engine/sharedReplay.ts';
      export * from '/src/engine/missionProgress.ts';
      export * from '/src/utils/decisionFeedback.ts';
      export * from '/src/engine/shadowPrediction.ts';
      export * from '/src/utils/playerFeedback.ts';
    ` : null,
  }],
  build: { write: false, minify: false, rollupOptions: { input: entry, output: { format: 'es' }, preserveEntrySignatures: 'strict' } },
});
const [{ code }] = bundle.output;
const {
  applyRunChoice, cloneRunInput, createRunInput, encodeSharedReplayUrl,
  parseMissionProgress, serializeMissionProgress, decisionConsequenceFeedback, urlWithoutImportedReplay,
  evaluateShadowPrediction, parseSharedReplayFromUrl, recordShadowPrediction, runExperiment, phasePreparationChanged,
} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const urlFor = (value) => `https://example.com/game/?m=${Buffer.from(JSON.stringify(value)).toString('base64url')}`;
const decodePayload = (url) => JSON.parse(Buffer.from(new URL(url).searchParams.get('m'), 'base64url').toString('utf8'));
const choices = [2, 2, 1, 0, 0, 0];
const allSettings = { solarCalibrated: true, icePrepared: true, eclssSealed: true, busPatched: true,
  stormClamped: true, dishAligned: true, extraIceCores: 4, fieldSamplesCount: 6, stormPeakPfu: 207 };

const missionProgress = (overrides = {}) => ({
  a: createRunInput([2, 2, 2]), b: null,
  pendingTasks: { 4: { icePrepared: true, extraIceCores: 2 } },
  calibratedTasks: [false, false, false, true, false, false],
  minedCrystals: [true, false, true, false, false],
  collectedSamples: [false, true, false, false, true, false],
  marsChoices: [0, 1],
  prediction: recordShadowPrediction('backup', createRunInput([2, 2, 2])),
  viewStep: 4, debriefStep: 3, demoStage: null, legacyReplay: false, lang: 'az', ...overrides,
});

test('saved mission restores exact inputs, drafts, fieldwork, prediction and recalculated A/B results', () => {
  const progress = missionProgress({ a: createRunInput(choices, allSettings),
    b: applyRunChoice(createRunInput(choices, allSettings), 3, 2, allSettings), viewStep: 3 });
  const restored = parseMissionProgress(serializeMissionProgress(progress));
  assert.deepEqual(restored, progress);
  assert.deepEqual(runExperiment(restored.a), runExperiment(progress.a));
  assert.deepEqual(runExperiment(restored.b), runExperiment(progress.b));
  assert.deepEqual(restored.pendingTasks[4], { icePrepared: true, extraIceCores: 2 });
  assert.equal(Object.hasOwn(restored.pendingTasks[4], 'solarCalibrated'), false);
  assert.equal(JSON.stringify(JSON.parse(serializeMissionProgress(progress))).includes('hourlyHistory'), false);
});

test('saved mission supports before-first-decision preparations and all guided experiment stages', () => {
  const setup = missionProgress({ a: createRunInput([]), prediction: null, viewStep: 1,
    debriefStep: null, demoStage: 'setup', pendingTasks: { 1: { solarCalibrated: true } } });
  assert.deepEqual(parseMissionProgress(serializeMissionProgress(setup)), setup);
  const shadow = missionProgress({ a: createRunInput([2, 2]), viewStep: 3,
    debriefStep: null, demoStage: 'shadow', prediction: null });
  assert.deepEqual(parseMissionProgress(serializeMissionProgress(shadow)), shadow);
  const rewind = missionProgress({ a: createRunInput(choices), demoStage: 'rewind' });
  assert.deepEqual(parseMissionProgress(serializeMissionProgress(rewind)), rewind);
});

test('saved missions reject corrupt, unbounded, future and invalid scoped input data', () => {
  const good = JSON.parse(serializeMissionProgress(missionProgress()));
  const mutate = (fn) => { const value = structuredClone(good); fn(value); return value; };
  const invalid = [
    { ...good, v: 2 }, { ...good, lang: 'other' }, { ...good, demoStage: 'unknown' },
    { ...good, viewStep: 6 }, { ...good, debriefStep: 4 }, { ...good, legacyReplay: 'false' },
    { ...good, pendingTasks: { 7: {} } }, { ...good, pendingTasks: { '01': {} } },
    { ...good, pendingTasks: { 4: { icePrepared: 'true' } } },
    { ...good, pendingTasks: { 4: { stormPeakPfu: 18 } } },
    { ...good, pendingTasks: { 4: { extraIceCores: 6 } } },
    { ...good, pendingTasks: { 4: { fieldSamplesCount: 1.5 } } },
    { ...good, calibratedTasks: [true] }, { ...good, minedCrystals: Array(5).fill(1) },
    { ...good, collectedSamples: null }, { ...good, score: 100 },
    { ...good, marsChoices: [0, 1, 2, 0] }, { ...good, marsChoices: [3] }, { ...good, marsChoices: ['0'] },
    mutate((v) => delete v.a.phases[0].tasks.busPatched),
    mutate((v) => v.a.scenario.stormPeakPfu = -1),
    mutate((v) => v.a.phases[0].choiceIndex = 3),
    mutate((v) => v.prediction.context.phases.pop()),
  ];
  for (const value of invalid) assert.equal(parseMissionProgress(JSON.stringify(value)), null);
  for (const raw of [null, '', '{', 'null', '[]', 'x'.repeat(32769)]) assert.equal(parseMissionProgress(raw), null);
  assert.throws(() => serializeMissionProgress(missionProgress({ viewStep: 6 })), RangeError);
});

test('saved mission parsing detaches restored data from mutable drafts and does not serialize results', () => {
  const progress = missionProgress();
  const raw = serializeMissionProgress(progress);
  const restored = parseMissionProgress(raw);
  progress.pendingTasks[4].extraIceCores = 5;
  progress.minedCrystals[0] = false;
  assert.equal(restored.pendingTasks[4].extraIceCores, 2);
  assert.equal(restored.minedCrystals[0], true);
  assert.equal(Object.isFrozen(restored.a.phases[0].tasks), true);
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ['v', ...Object.keys(restored)].sort());
});

test('v2 shared replay restores both complete input snapshots and exact computed results', () => {
  const a = createRunInput(choices, allSettings);
  let b = createRunInput(choices, { ...allSettings, stormPeakPfu: 840 });
  b = applyRunChoice(b, 3, 2, { ...allSettings, busPatched: false });
  const prediction = recordShadowPrediction('backup', a);
  const beforeA = runExperiment(a);
  const beforeB = runExperiment(b);
  const url = encodeSharedReplayUrl('https://example.com/game/?old=yes#previous', { a, b, m: 'engineer', prediction, callsign: 'PRIVATE CALLSIGN' });
  const restored = parseSharedReplayFromUrl(url);
  assert.ok(restored);
  assert.equal(restored.legacy, false);
  assert.equal(restored.m, 'engineer');
  assert.deepEqual(restored.a, a);
  assert.deepEqual(restored.b, b);
  assert.deepEqual(restored.prediction, prediction);
  assert.deepEqual(runExperiment(restored.a), beforeA);
  assert.deepEqual(runExperiment(restored.b), beforeB);
  assert.equal(beforeA.outcome, 'success');
  assert.notEqual(runExperiment(createRunInput(choices)).outcome, beforeA.outcome);
  assert.equal(JSON.stringify(decodePayload(url)).includes('PRIVATE CALLSIGN'), false);
  assert.equal(new URL(url).hash, '');
  assert.equal(new URL(url).searchParams.has('old'), false);
});

test('a safely saved replay import removes only its input parameter and leaves invalid links untouched', () => {
  const url = new URL(encodeSharedReplayUrl('https://example.com/game/', { a: createRunInput([1, 0]), b: null, m: 'cadet' }));
  url.searchParams.set('view', 'science');
  url.hash = 'sunlight';
  assert.equal(urlWithoutImportedReplay(url.toString()), 'https://example.com/game/?view=science#sunlight');
  for (const invalid of ['https://example.com/game/?m=bad&view=science#sunlight', 'https://example.com/game/?view=science', 'bad url']) {
    assert.equal(urlWithoutImportedReplay(invalid), null);
  }
});

test('shared replay retains phase chronology rather than flattening new preparations into D1', () => {
  let input = createRunInput([2, 2, 1, 0, 0, 0]);
  input = applyRunChoice(input, 2, 2, { eclssSealed: true, fieldSamplesCount: 1 });
  input = applyRunChoice(input, 4, 0, { icePrepared: true, extraIceCores: 3, fieldSamplesCount: 2 });
  const restored = parseSharedReplayFromUrl(encodeSharedReplayUrl('https://example.com/', { a: input, b: null, m: 'cadet' }));
  assert.ok(restored);
  assert.deepEqual(restored.a, input);
  assert.deepEqual(runExperiment(restored.a), runExperiment(input));
  assert.equal(restored.a.phases[0].tasks.fieldSamplesCount, 0);
  assert.equal(restored.a.phases[1].tasks.fieldSamplesCount, 1);
  assert.equal(restored.a.phases[3].tasks.fieldSamplesCount, 2);
});

test('legacy replay links explicitly mark missing preparations as assumed defaults', () => {
  const restored = parseSharedReplayFromUrl(urlFor({ a: choices, b: [2, 2, 2], m: 'engineer', p: 18 }));
  assert.ok(restored);
  assert.equal(restored.legacy, true);
  assert.deepEqual(restored.a, createRunInput(choices, { stormPeakPfu: 18 }));
  assert.deepEqual(restored.b, createRunInput([2, 2, 2], { stormPeakPfu: 18 }));
  assert.equal(restored.prediction, null);
  assert.equal(parseSharedReplayFromUrl(encodeSharedReplayUrl('https://example.com/', restored)).legacy, false);
  assert.equal(encodeSharedReplayUrl('https://example.com/game/?m=old', { a: createRunInput([]), b: null, m: 'cadet' }), 'https://example.com/game/');
});

test('malformed, incomplete and unsupported shared replay payloads fail closed', () => {
  const good = { v: 2, a: createRunInput([1, 0, 2]), b: null, m: 'cadet' };
  const mutate = (fn) => { const value = structuredClone(good); fn(value); return value; };
  const invalid = [
    { ...good, v: 3 }, { ...good, m: 'unknown' }, { ...good, a: createRunInput([]) },
    { ...good, callsign: 'unrecognized' },
    mutate(v => delete v.a.phases[0].tasks.busPatched),
    mutate(v => v.a.phases[0].tasks.busPatched = 'true'),
    mutate(v => v.a.phases[0].tasks.extraIceCores = 6),
    mutate(v => v.a.phases[0].tasks.extraIceCores = 1.5),
    mutate(v => v.a.phases[0].tasks.fieldSamplesCount = 7),
    mutate(v => v.a.phases[0].choiceIndex = 3),
    mutate(v => v.a.scenario.stormPeakPfu = -1),
    mutate(v => v.a.scenario.stormPeakPfu = 5001),
    mutate(v => v.a.scenario.stormPeakPfu = Infinity),
    mutate(v => v.a.phases.push(...v.a.phases, ...v.a.phases)),
    { ...good, b: { phases: [] } },
    { ...good, prediction: { expected: 'guess', context: good.a } },
    { ...good, prediction: { expected: 'backup', context: createRunInput([1, 0]) } },
    { a: [1, 0, 3] }, { a: [1], p: -1 }, { a: [1], b: 'bad' },
  ];
  for (const value of invalid) assert.equal(parseSharedReplayFromUrl(urlFor(value)), null);
  for (const url of ['bad url', 'https://example.com/', 'https://example.com/?m=%%%%', 'https://example.com/?m=e30', `https://example.com/?m=${'x'.repeat(32769)}`]) {
    assert.equal(parseSharedReplayFromUrl(url), null);
  }
});

test('predictions reject new preparation and field confounders and changed scenarios', () => {
  const a = runExperiment(createRunInput([2, 2, 2, 2, 0, 0]));
  const base = createRunInput([2, 2, 1, 2, 0, 0]);
  const prediction = recordShadowPrediction('backup', a.input);
  assert.equal(evaluateShadowPrediction(prediction, a, runExperiment(base)).status, 'supported');
  for (const [step, patch] of [[1, { solarCalibrated: true }], [2, { eclssSealed: true }], [3, { busPatched: true }], [2, { fieldSamplesCount: 1 }]]) {
    const b = runExperiment(applyRunChoice(base, step, base.phases[step - 1].choiceIndex, patch));
    assert.equal(evaluateShadowPrediction(prediction, a, b).status, 'changed');
  }
  assert.equal(evaluateShadowPrediction(prediction, a, runExperiment(createRunInput([2, 2, 1], { stormPeakPfu: 840 }))).status, 'changed');
  assert.equal(evaluateShadowPrediction(prediction, a, null).status, 'pending');
});

test('prediction context ignores later phase changes and total mission length, but checks actual D3 endpoints', () => {
  const a = runExperiment(createRunInput([2, 2, 2, 2, 0, 0]));
  const base = createRunInput([2, 2, 1, 2, 0, 0]);
  const b = runExperiment(applyRunChoice(base, 5, 2, { stormClamped: true }));
  const prediction = recordShadowPrediction('backup', a.input);
  assert.equal(a.elapsedHours, 203);
  assert.equal(b.elapsedHours, 216);
  assert.equal(evaluateShadowPrediction(prediction, a, b).status, 'supported');
  const incomplete = { ...b, steps: b.steps.map((step, index) => index === 2 ? { ...step, endHour: 119 } : step) };
  assert.equal(evaluateShadowPrediction(prediction, a, incomplete).status, 'incomplete');
  const tie = { ...b, steps: b.steps.map((step, index) => index === 2 ? { ...step, after: { ...step.after, powerKwh: a.steps[2].after.powerKwh } } : step) };
  assert.equal(evaluateShadowPrediction(recordShadowPrediction('tie', a.input), a, tie).status, 'supported');
  assert.equal(evaluateShadowPrediction(recordShadowPrediction('drill', a.input), a, b).status, 'contradicted');
});

test('recorded predictions are immutable snapshots and cannot be created before D3', () => {
  const draft = structuredClone(createRunInput([2, 2, 2]));
  const prediction = recordShadowPrediction('backup', draft);
  draft.phases[1].tasks.eclssSealed = true;
  draft.scenario.stormPeakPfu = 840;
  assert.equal(prediction.context.phases[1].tasks.eclssSealed, false);
  assert.equal(prediction.context.scenario.stormPeakPfu, 207);
  assert.throws(() => { prediction.context.phases[1].tasks.eclssSealed = true; }, TypeError);
  assert.throws(() => recordShadowPrediction('backup', createRunInput([2, 2])), RangeError);
  assert.deepEqual(cloneRunInput(prediction.context), prediction.context);
});

test('replay preparation markers cover every effective station and field setting', () => {
  const a = createRunInput([0, 0, 0, 0, 0, 0]);
  for (const [index, setting, value] of [[0, 'solarCalibrated', true], [1, 'eclssSealed', true],
    [2, 'busPatched', true], [3, 'icePrepared', true], [3, 'extraIceCores', 5],
    [4, 'stormClamped', true], [5, 'dishAligned', true], [1, 'fieldSamplesCount', 2]]) {
    const b = applyRunChoice(a, index + 1, 0, { ...a.phases[index].tasks, [setting]: value });
    assert.equal(phasePreparationChanged(a, b, index), true, setting);
    assert.equal(phasePreparationChanged(a, a, index), false);
  }
});

test('preparation markers exclude choices, storm setup, irrelevant flags and missing phases', () => {
  const a = createRunInput([0, 0, 0, 1, 0, 0]);
  assert.equal(phasePreparationChanged(a, applyRunChoice(a, 2, 1, a.phases[1].tasks), 1), false);
  assert.equal(phasePreparationChanged(a, createRunInput([0, 0, 0, 1, 0, 0], { stormPeakPfu: 840 }), 4), false);
  assert.equal(phasePreparationChanged(a, applyRunChoice(a, 4, 1, { ...a.phases[3].tasks, icePrepared: true, extraIceCores: 5 }), 3), false);
  assert.equal(phasePreparationChanged(a, createRunInput([]), 0), false);
});

test('debrief shelter feedback reflects the recorded berm and actual dose with or without clamps', () => {
  for (const berm of [false, true]) {
    const doses = [];
    for (const stormClamped of [false, true]) {
      const result = runExperiment(createRunInput([0, berm ? 0 : 1, 1, 2, 2], { stormClamped }));
      const step = result.steps[4];
      assert.equal(step.choiceId, 'D5-C');
      const feedback = decisionConsequenceFeedback(step);
      assert.equal(feedback.warn, false);
      assert.match(feedback.text.en, berm ? /Regolith-berm shelter/ : /Water-wall shelter/);
      assert.match(feedback.text.az, berm ? /Reqolit səddli sığınacaq/ : /Su divarlı sığınacaq/);
      const dose = Number.isInteger(step.delta.radiationMsv) ? String(step.delta.radiationMsv) : step.delta.radiationMsv.toFixed(1);
      assert.ok(feedback.text.en.includes(`${dose} mSv`));
      assert.ok(feedback.text.az.includes(`${dose} mSv`));
      assert.match(feedback.text.en, /training assumption/);
      assert.match(feedback.text.az, /təlim fərziyyəsi/);
      assert.doesNotMatch(feedback.text.en, /94%/);
      doses.push(step.delta.radiationMsv);
    }
    assert.ok(doses[1] < doses[0], 'the displayed recorded dose must include the clamp benefit');
  }
});

test('debrief reports supplied backup energy and prioritizes actual low reserve over a safe promise', () => {
  const result = runExperiment(createRunInput([0, 0, 1]));
  const step = result.steps[2];
  assert.equal(step.env.supplementalGenerationKwh, 18);
  const feedback = decisionConsequenceFeedback(step);
  assert.match(feedback.text.en, /supplied 18 kWh/);
  assert.match(feedback.text.az, /18 kVt·s/);
  assert.doesNotMatch(feedback.text.en, /16 kWh|heaters stayed powered|safe/);
  const lowReserveStep = runExperiment(createRunInput([1, 0, 2])).steps[2];
  assert.ok(lowReserveStep.env.lowPowerHours > 0);
  assert.equal(decisionConsequenceFeedback(lowReserveStep).warn, true);
});
