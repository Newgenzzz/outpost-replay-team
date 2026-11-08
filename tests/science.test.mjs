import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

const entry = 'outpost:science-test';
const bundle = await build({
  configFile: false, logLevel: 'silent',
  plugins: [{
    name: 'science-test-entry',
    resolveId: id => id === entry ? `\0${id}` : null,
    load: id => id === `\0${entry}` ? `
      export * from '/src/data/nasaSpaceWeather.ts';
      export * from '/src/data/nasaTelemetry.ts';
      export * from '/src/data/shackletonDem.ts';
      export * from '/src/data/lunarSiteIntelligence.ts';
    ` : null,
  }],
  build: { write: false, minify: false, rollupOptions: { input: entry, output: { format: 'es' }, preserveEntrySignatures: 'strict' } },
});
const [{ code }] = bundle.output;
const science = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const { buildStormProfileForPeak, DOSE_COEFF_MSV_PER_HR_PER_PFU, fetchLiveDonkiSpaceWeather,
  HISTORICAL_STORM_PRESETS, integrateSepDoseMsv, LUNAR_PLANNING_SITES, parseDonkiFlares,
  SEP_PROFILE, SHACKLETON_MARKERS, SHIELDING, TERRAIN_PROVENANCE } = science;

test('separates the procedural illustration from published 2 m study-point results', () => {
  assert.equal(TERRAIN_PROVENANCE.kind, 'educational-procedural');
  assert.equal(TERRAIN_PROVENANCE.georeferenced, false);
  assert.equal(TERRAIN_PROVENANCE.mastHeightExaggeration, 14);
  assert.ok(SHACKLETON_MARKERS.every(m => !('tempK' in m)));
  // Gläser et al., Table 2 (NASA NTRS 20170007365), first S row and C1 row.
  assert.deepEqual(LUNAR_PLANNING_SITES.map(s => [s.latitudeDeg, s.longitudeDeg, s.meanIlluminationPct, s.longestShadowHours]),
    [[-89.6866, 197.19, 85.5, 66], [-89.4398, 222.83, 88, 112]]);
});

test('only the documented 207 pfu peak is presented as observed; legacy stress-test amplitudes stay assumed', () => {
  assert.deepEqual(HISTORICAL_STORM_PRESETS.map(p => [p.id, p.peakPfu, p.provenance]),
    [['may2024', 207, 'observed-peak'], ['sept2017', 840, 'training-assumption'], ['quiet', 18, 'training-assumption']]);
  assert.match(HISTORICAL_STORM_PRESETS[0].summary.en, /X3\.9/);
  assert.ok(HISTORICAL_STORM_PRESETS.every(p => !('issRadLabPeakUgyPerHr' in p)));
  assert.equal('OSDR_RADLAB_MAY2024_SERIES' in science, false);
});

test('DONKI flare classes remain catalog metadata, never synthetic proton flux or dose', () => {
  const parsed = parseDonkiFlares([
    { flrID: 'fixture-X', peakTime: '2024-05-14T16:51Z', classType: 'X8.7', link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/fixture' },
    { flrID: 'fixture-M', beginTime: '2024-05-14T18:00Z', classType: 'M1.4', link: 'https://untrusted.example/flare' },
    { flrID: 'missing-class', peakTime: '2024-05-14T18:00Z' },
    { flrID: 'invalid-time', peakTime: 'invalid', classType: 'X2.0' }, null,
  ]);
  assert.equal(parsed.length, 2);
  for (const event of parsed) {
    assert.deepEqual(Object.keys(event).sort(), ['eventTime', 'flareClass', 'id', 'link']);
    assert.ok(event.link.startsWith('https://ccmc.gsfc.nasa.gov/DONKI/'));
  }
  assert.equal(parsed[0].flareClass, 'M1.4');
  assert.equal(parsed[1].flareClass, 'X8.7');
  assert.deepEqual(parseDonkiFlares({ error: 'bad feed' }), []);
});

test('live, empty and failed DONKI responses are distinct and never substitute invented cached measurements', async () => {
  const now = new Date('2026-11-08T12:00Z');
  const live = await fetchLiveDonkiSpaceWeather(async (url) => {
    assert.match(url, /DONKI\/FLR\?startDate=2026-10-09&endDate=2026-11-08/);
    return { ok: true, json: async () => [{ flrID: 'fixture', peakTime: '2026-11-08T10:00Z', classType: 'X1.0' }] };
  }, now);
  assert.equal(live.status, 'live');
  assert.equal(live.events.length, 1);
  assert.deepEqual(await fetchLiveDonkiSpaceWeather(async () => ({ ok: true, json: async () => [] }), now), { status: 'empty', events: [] });
  for (const fetcher of [async () => ({ ok: false }), async () => { throw new Error('offline'); }, async () => ({ ok: true, json: async () => ({ error: 'rate limit' }) })]) {
    assert.deepEqual(await fetchLiveDonkiSpaceWeather(fetcher, now), { status: 'unavailable', events: [] });
  }
});

test('training chart flux, dose rates and integral use the mission pulse and explicit classroom factors', () => {
  assert.equal(DOSE_COEFF_MSV_PER_HR_PER_PFU, 0.015);
  assert.deepEqual(buildStormProfileForPeak(207), SEP_PROFILE);
  for (const peak of [0, 18, 207, 840]) {
    const profile = buildStormProfileForPeak(peak);
    assert.equal(Math.max(...profile.map(p => p.protonFluxPfu)), peak);
    for (const p of profile) {
      assert.ok(Math.abs(p.unshieldedDoseMsvPerHr - p.protonFluxPfu * 0.015) < 0.00052);
      assert.ok(Math.abs(p.shieldedDoseMsvPerHr - p.protonFluxPfu * 0.015 * SHIELDING.habitat) < 0.00052);
    }
    const dose = profile.slice(1).reduce((sum, p, i) => sum + (profile[i].unshieldedDoseMsvPerHr + p.unshieldedDoseMsvPerHr) * (p.hour - profile[i].hour) / 2, 0);
    assert.ok(Math.abs(dose - integrateSepDoseMsv(0, 48) * peak / 207) < 0.03);
  }
  for (const invalid of [-1, NaN, Infinity, 5001]) assert.throws(() => buildStormProfileForPeak(invalid));
});
