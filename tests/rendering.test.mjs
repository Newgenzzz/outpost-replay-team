import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

const entry = 'outpost:rendering-test';
const bundle = await build({
  configFile: false, logLevel: 'silent',
  plugins: [{
    name: 'rendering-test-entry',
    resolveId: id => id === entry ? `\0${id}` : null,
    load: id => id === `\0${entry}` ? `export * from '/src/utils/renderPolicy.ts';` : null,
  }],
  build: { write: false, minify: false, rollupOptions: { input: entry, output: { format: 'es' }, preserveEntrySignatures: 'strict' } },
});
const [{ code }] = bundle.output;
const { destroyWorldRenderer, hologramFrameLoop, updateWorldRendering } =
  await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('hologram draws continuously only when visible and rotating', () => {
  assert.equal(hologramFrameLoop(true, true), 'always');
  assert.equal(hologramFrameLoop(true, false), 'demand');
  assert.equal(hologramFrameLoop(false, true), 'never');
  assert.equal(hologramFrameLoop(false, false), 'never');
});

const worldStub = (running = true) => {
  const calls = [];
  const game = {
    isRunning: true,
    loop: {
      running,
      sleep() { calls.push('sleep'); this.running = false; },
      wake() { calls.push('wake'); this.running = true; },
    },
    destroy(removeCanvas) { calls.push(['destroy', removeCanvas]); },
  };
  return { calls, game };
};

test('world suspension and resumption are idempotent across repeated overlay updates', () => {
  const { calls, game } = worldStub();
  for (const suspended of [false, false, true, true, true, false, false, true, false]) {
    updateWorldRendering(game, suspended);
  }
  assert.deepEqual(calls, ['sleep', 'wake', 'sleep', 'wake']);
  assert.equal(game.loop.running, true);
});

test('preboot visibility changes do not interfere with Phaser boot and apply after readiness', () => {
  const { calls, game } = worldStub(false);
  game.isRunning = false;
  updateWorldRendering(game, false);
  updateWorldRendering(game, true);
  assert.deepEqual(calls, []);
  game.isRunning = true;
  game.loop.running = true;
  updateWorldRendering(game, true);
  assert.deepEqual(calls, ['sleep']);
  updateWorldRendering(game, false);
  assert.deepEqual(calls, ['sleep', 'wake']);
});

test('sleeping-world disposal requests destruction before waking the cleanup step', () => {
  const { calls, game } = worldStub(false);
  destroyWorldRenderer(game);
  assert.deepEqual(calls, [['destroy', true], 'wake']);
  assert.equal(game.loop.running, true);
});

test('running-world disposal keeps its already scheduled cleanup step without another wake', () => {
  const { calls, game } = worldStub();
  destroyWorldRenderer(game);
  assert.deepEqual(calls, [['destroy', true]]);
});
