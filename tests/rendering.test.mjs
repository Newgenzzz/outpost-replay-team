import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

const entry = 'outpost:rendering-test';
const bundle = await build({
  configFile: false, logLevel: 'silent',
  plugins: [{
    name: 'rendering-test-entry',
    resolveId: id => id === entry ? `\0${id}` : null,
    load: id => id === `\0${entry}` ? `export * from '/src/utils/renderPolicy.ts'; export * from '/src/components/hologramGeometry.ts';` : null,
  }],
  build: { write: false, minify: false, rollupOptions: { input: entry, output: { format: 'es' }, preserveEntrySignatures: 'strict' } },
});
const [{ code }] = bundle.output;
const {
  buildHologramRelief,
  buildPolarStarfield,
  computeSightlineGeometry,
  destroyWorldRenderer,
  hologramFrameLoop,
  updateWorldRendering,
} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

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

test('circular relief has finite upward faces, a closed display skirt and a lower triangle budget', () => {
  const { terrain, skirt } = buildHologramRelief();
  const positions = terrain.getAttribute('position');
  const normals = terrain.getAttribute('normal');
  for (let i = 0; i < positions.count; i++) {
    assert.ok(Math.hypot(positions.getX(i), positions.getZ(i)) <= 6.000001);
    assert.ok(Number.isFinite(positions.getY(i)));
    assert.ok(Number.isFinite(normals.getY(i)) && normals.getY(i) > 0);
  }
  for (const mesh of [terrain, skirt]) {
    assert.ok([...mesh.index.array].every(index => index >= 0 && index < mesh.getAttribute('position').count));
  }
  const side = skirt.getAttribute('position');
  assert.deepEqual([...side.array.slice(0, 6)], [...side.array.slice(-6)]);
  assert.ok((terrain.index.count + skirt.index.count) / 3 < 84 * 84 * 2);
  terrain.dispose(); skirt.dispose();
});

test('relief display geometry is deterministic across recreation', () => {
  const a = buildHologramRelief();
  const b = buildHologramRelief();
  for (const name of ['terrain', 'skirt']) {
    for (const attribute of ['position', 'normal']) {
      assert.deepEqual(a[name].getAttribute(attribute).array, b[name].getAttribute(attribute).array);
    }
    a[name].dispose(); b[name].dispose();
  }
});

test('3D solar sightline geometry contrasts blocked 2 m vs clear 10 m at the 128 deg lesson azimuth', () => {
  const low = computeSightlineGeometry(128, 2, 'S');
  const tall = computeSightlineGeometry(128, 10, 'S');
  assert.equal(low.isBlocked, true);
  assert.equal(low.illuminatedPct, 0);
  assert.equal(tall.isBlocked, false);
  assert.equal(tall.illuminatedPct, 100);
  assert.ok(tall.collectorWorld[1] > low.collectorWorld[1]);
  assert.deepEqual(low.altCollectorWorld, tall.collectorWorld);
  assert.ok(Math.hypot(low.ridgeWorld[0], low.ridgeWorld[2]) <= 6);
  assert.ok(tall.rayOverRidgeWorld[1] > tall.ridgeWorld[1]);
});

test('polar starfield dome is deterministic and finite', () => {
  const a = buildPolarStarfield(120);
  const b = buildPolarStarfield(120);
  assert.equal(a.getAttribute('position').count, 120);
  assert.deepEqual(a.getAttribute('position').array, b.getAttribute('position').array);
  assert.deepEqual(a.getAttribute('color').array, b.getAttribute('color').array);
  assert.ok([...a.getAttribute('position').array].every(Number.isFinite));
  a.dispose();
  b.dispose();
});
