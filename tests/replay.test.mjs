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
      export * from '/src/engine/shadowPrediction.ts';
    ` : null,
  }],
  build: { write: false, minify: false, rollupOptions: { input: entry, output: { format: 'es' }, preserveEntrySignatures: 'strict' } },
});
const [{ code }] = bundle.output;
const {
  applyRunChoice, cloneRunInput, createRunInput, encodeSharedReplayUrl,
  evaluateShadowPrediction, parseSharedReplayFromUrl, recordShadowPrediction, runExperiment,
} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const urlFor = (value) => `https://example.com/game/?m=${Buffer.from(JSON.stringify(value)).toString('base64url')}`;
const decodePayload = (url) => JSON.parse(Buffer.from(new URL(url).searchParams.get('m'), 'base64url').toString('utf8'));
const choices = [2, 2, 1, 0, 0, 0];
const allSettings = { solarCalibrated: true, icePrepared: true, eclssSealed: true, busPatched: true,
  stormClamped: true, dishAligned: true, extraIceCores: 4, fieldSamplesCount: 6, stormPeakPfu: 207 };

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
