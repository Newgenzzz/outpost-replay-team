import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

const entry = 'outpost:rendering-test';
const bundle = await build({
  configFile: false, logLevel: 'silent',
  plugins: [{
    name: 'rendering-test-entry',
    resolveId: id => id === entry ? `\0${id}` : null,
    load: id => id === `\0${entry}` ? `export * from '/src/utils/renderPolicy.ts'; export * from '/src/components/hologramGeometry.ts'; export { computeRimIllumination } from '/src/data/shackletonDem.ts';` : null,
  }],
  build: { write: false, minify: false, rollupOptions: { input: entry, output: { format: 'es' }, preserveEntrySignatures: 'strict' } },
});
const [{ code }] = bundle.output;
const {
  buildHologramRelief,
  buildPolarStarfield,
  computeHorizonDiagram,
  computeRimIllumination,
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

test('separate horizon diagram retains the contrasting 128 deg mast-height lesson', () => {
  const low = computeHorizonDiagram(128, 2, 'S');
  const tall = computeHorizonDiagram(128, 10, 'S');
  assert.equal(low.visibility, 'hidden');
  assert.equal(low.illuminatedPct, 0);
  assert.equal(tall.visibility, 'clear');
  assert.equal(tall.illuminatedPct, 100);
  assert.ok(tall.horizonY > low.horizonY, 'a lower angular horizon exposes more Sun');
  assert.equal(low.sunCenterY, tall.sunCenterY);
});

test('horizon diagram faithfully represents the index at every degree without moving the Sun or claiming relief ray geometry', () => {
  for (const site of ['S', 'C1']) {
    for (let azimuth = 0; azimuth <= 360; azimuth++) {
      const low = computeHorizonDiagram(azimuth, 2, site);
      const tall = computeHorizonDiagram(azimuth, 10, site);
      assert.equal(low.sunCenterY, tall.sunCenterY);
      assert.equal(low.sunRadius, tall.sunRadius);
      assert.ok(tall.illuminatedPct >= low.illuminatedPct);
      for (const [height, g] of [[2, low], [10, tall]]) {
        const source = computeRimIllumination(azimuth, height, site);
        assert.equal(g.illuminatedPct, source.illuminatedPct);
        assert.equal(g.blockingRidgeDeg, source.blockingRidgeDeg);
        const top = g.sunCenterY - g.sunRadius;
        const bottom = g.sunCenterY + g.sunRadius;
        assert.ok(g.horizonY >= top && g.horizonY <= bottom);
        const visibleHeightPct = (g.horizonY - top) / (bottom - top) * 100;
        assert.ok(Math.abs(visibleHeightPct - g.illuminatedPct) < 1e-9);
        assert.equal(g.visibility, g.illuminatedPct === 0 ? 'hidden' : g.illuminatedPct === 100 ? 'clear' : 'partial');
        assert.equal(g.solarElevationDeg, 1.55);
        assert.ok(Object.values(g).filter(v => typeof v === 'number').every(Number.isFinite));
      }
    }
  }
});

test('partial sunlight at 120 deg is shown as partial, never a fully blocked ray', () => {
  const partial = computeHorizonDiagram(120, 2, 'S');
  assert.equal(partial.illuminatedPct, 76);
  assert.equal(partial.visibility, 'partial');
  assert.ok(partial.horizonY > partial.sunCenterY - partial.sunRadius);
  assert.ok(partial.horizonY < partial.sunCenterY + partial.sunRadius);
  assert.equal(computeHorizonDiagram(124, 2, 'S').visibility, 'hidden');
  assert.equal(computeHorizonDiagram(124, 10, 'S').visibility, 'clear');
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
