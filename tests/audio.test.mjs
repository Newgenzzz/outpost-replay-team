import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

const entry = 'outpost:audio-test';
const bundle = await build({
  configFile: false, logLevel: 'silent',
  plugins: [{ name: 'audio-test-entry', resolveId: (id) => id === entry ? `\0${id}` : null,
    load: (id) => id === `\0${entry}` ? `export * from '/src/utils/soundEffects.ts';` : null }],
  build: { write: false, minify: false,
    rollupOptions: { input: entry, output: { format: 'es' }, preserveEntrySignatures: 'strict' } },
});
const { SoundEngine, AUDIO_PREFERENCES_KEY } = await import(`data:text/javascript;base64,${Buffer.from(bundle.output[0].code).toString('base64')}`);

class Events {
  listeners = new Map();
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
  emit(name) { [...(this.listeners.get(name) ?? [])].forEach((fn) => fn()); }
  count(name) { return this.listeners.get(name)?.size ?? 0; }
}
class Parameter {
  events = []; scheduled = [];
  constructor(clock = () => 0) { this.clock = clock; }
  get value() {
    // Future automation does not immediately alter the current/default value.
    return this.scheduled.filter((event) => event[2] <= this.clock())
      .sort((a, b) => a[2] - b[2]).at(-1)?.[1] ?? 1;
  }
  schedule(type, value, time, constant) { const event = [type, value, time, constant]; this.events.push(event); this.scheduled.push(event); }
  setValueAtTime(value, time) { this.schedule('set', value, time); }
  linearRampToValueAtTime(value, time) { this.schedule('linear', value, time); }
  exponentialRampToValueAtTime(value, time) { this.schedule('exponential', value, time); }
  setTargetAtTime(value, time, constant) { this.schedule('target', value, time, constant); }
  cancelScheduledValues(time) { this.events.push(['cancel', time]); this.scheduled = this.scheduled.filter((event) => event[2] < time); }
  cancelAndHoldAtTime(time) {
    const held = this.value;
    this.cancelScheduledValues(time); this.schedule('hold', held, time);
  }
}
class Node {
  connections = []; disconnected = false;
  connect(node) { this.connections.push(node); }
  disconnect() { this.disconnected = true; this.connections = []; }
}
class Gain extends Node { constructor(context) { super(); this.gain = new Parameter(() => context.currentTime); } }
class Oscillator extends Node {
  onended = null; ended = false; startTime = null; stopTime = Infinity;
  constructor(context) { super(); this.context = context; this.frequency = new Parameter(() => context.currentTime); }
  start(time) { this.startTime = time; }
  stop(time = this.context.currentTime) { this.stopTime = time; if (time <= this.context.currentTime) this.finish(); }
  finish() { if (this.ended) return; this.ended = true; this.onended?.(); }
}
class Utterance { constructor(text) { this.text = text; } }

function browser({ saved = null, blockedStorage = false, speech = true, supported = true, suspended = false } = {}) {
  const contexts = [];
  const doc = new Events(); doc.hidden = false;
  const host = new Events(); host.document = doc;
  const storage = new Map(saved === null ? [] : [[AUDIO_PREFERENCES_KEY, saved]]);
  host.localStorage = {
    getItem: (key) => { if (blockedStorage) throw new Error('Blocked storage'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (blockedStorage) throw new Error('Blocked storage'); storage.set(key, value); },
  };
  const intervals = new Map(), timeouts = new Map();
  let id = 0, time = 0;
  host.setInterval = (fn) => { const key = ++id; intervals.set(key, fn); return key; };
  host.clearInterval = (key) => intervals.delete(key);
  host.setTimeout = (fn, delay) => { const key = ++id; timeouts.set(key, { fn, at: time + delay }); return key; };
  host.clearTimeout = (key) => timeouts.delete(key);
  class Context {
    state = suspended ? 'suspended' : 'running'; currentTime = 0; destination = new Node();
    gains = []; oscillators = []; resumeCalls = 0; suspendCalls = 0; closeCalls = 0;
    constructor() { contexts.push(this); }
    createGain() { const gain = new Gain(this); this.gains.push(gain); return gain; }
    createOscillator() { const oscillator = new Oscillator(this); this.oscillators.push(oscillator); return oscillator; }
    resume() { this.resumeCalls++; this.state = 'running'; return Promise.resolve(); }
    suspend() { this.suspendCalls++; this.state = 'suspended'; return Promise.resolve(); }
    close() { this.closeCalls++; this.state = 'closed'; return Promise.resolve(); }
  }
  if (supported) host.AudioContext = Context;
  if (speech) {
    host.SpeechSynthesisUtterance = Utterance;
    host.speechSynthesis = {
      voices: [{ lang: 'en-US', name: 'Test English' }], spoken: [], canceled: 0,
      getVoices() { return this.voices; },
      speak(utterance) { this.spoken.push(utterance); },
      cancel() { this.canceled++; },
    };
  }
  const advance = (ms) => {
    time += ms;
    contexts.filter((ctx) => ctx.state === 'running').forEach((ctx) => { ctx.currentTime += ms / 1000; });
    for (const [key, timer] of [...timeouts]) if (timer.at <= time) { timeouts.delete(key); timer.fn(); }
    [...intervals.values()].forEach((fn) => fn());
    contexts.forEach((ctx) => ctx.oscillators.filter((osc) => osc.stopTime <= ctx.currentTime).forEach((osc) => osc.finish()));
  };
  return { host, doc, contexts, intervals, timeouts, storage, advance, engine: new SoundEngine(host, doc) };
}

const effects = ['choice', 'rewind', 'shadowAlert', 'stormAlert', 'success', 'hotspot', 'StepNav', 'geiger', 'laserDrill',
  'solarLock', 'footstep', 'roverMotor', 'quindarIntro', 'quindarOutro', 'tourChime', 'achievement', 'uiClick',
  'batteryAlert', 'failure', 'launch', 'backup'];

test('loading and automatic gameplay calls never create, resume, queue, or speak before a user unlock', () => {
  const b = browser();
  b.engine.initialize(); b.engine.initialize();
  effects.forEach((effect) => b.engine.play(effect));
  b.engine.setMusicState('critical');
  b.engine.speakRadio('Radio before a gesture');
  assert.equal(b.contexts.length, 0);
  assert.equal(b.intervals.size + b.timeouts.size, 0);
  assert.equal(b.host.speechSynthesis.spoken.length, 0);
  assert.equal(b.doc.count('visibilitychange'), 1);
  b.engine.setVolume('music', 0);
  b.engine.unlock();
  assert.equal(b.contexts.length, 1);
  assert.equal(b.contexts[0].oscillators.length, 0, 'old effects must not replay after unlock');
  b.engine.dispose();
});

test('preferences are immutable stable snapshots, clamped and persisted without requiring audio', () => {
  const b = browser(); let notifications = 0;
  const initial = b.engine.getPreferences();
  assert.equal(initial, b.engine.getPreferences());
  assert.equal(Object.isFrozen(initial), true);
  assert.throws(() => { initial.music = 0; }, TypeError);
  const unsubscribe = b.engine.subscribe(() => notifications++);
  b.engine.setVolume('music', -2); b.engine.setVolume('effects', 2);
  b.engine.setVolume('master', NaN); b.engine.setVolume('effects', 1);
  b.engine.setMuted(true);
  assert.equal(notifications, 3);
  assert.deepEqual(b.engine.getPreferences(), { muted: true, master: 0.8, music: 0, effects: 1 });
  const restored = browser({ saved: b.storage.get(AUDIO_PREFERENCES_KEY) });
  assert.deepEqual(restored.engine.getPreferences(), b.engine.getPreferences());
  assert.equal(restored.contexts.length, 0);
  unsubscribe(); b.engine.setMuted(false); assert.equal(notifications, 3);
  const invalid = browser({ saved: '{broken' }); assert.deepEqual(invalid.engine.getPreferences(), initial);
  const blocked = browser({ blockedStorage: true });
  assert.doesNotThrow(() => blocked.engine.setVolume('master', 0.2));
  assert.equal(blocked.engine.getPreferences().master, 0.2);
  [b, restored, invalid, blocked].forEach(({ engine }) => engine.dispose());
});

test('one context and one musical scheduler route all finite voices through separate buses and clean up', () => {
  const b = browser();
  b.engine.unlock(); b.engine.startAmbient(); b.engine.startAmbient();
  b.engine.setMusicState('exploration'); b.engine.setMusicState('critical');
  effects.forEach((effect) => b.engine.play(effect));
  assert.equal(b.contexts.length, 1); assert.equal(b.intervals.size, 1);
  const ctx = b.contexts[0], [master, music, effectBus] = ctx.gains;
  assert.deepEqual(master.connections, [ctx.destination]);
  assert.deepEqual(music.connections, [master]); assert.deepEqual(effectBus.connections, [master]);
  for (const osc of ctx.oscillators.filter((osc) => !osc.disconnected)) {
    assert.equal(osc.connections.length, 1);
    assert.ok([music, effectBus].includes(osc.connections[0].connections[0]));
    assert.ok(Number.isFinite(osc.stopTime));
    assert.equal(osc.connections[0].gain.events[0][1], 0, 'voices attack from silence');
  }
  b.engine.stopAmbient(); b.advance(3000);
  assert.ok(ctx.oscillators.every((osc) => osc.disconnected));
  assert.ok(ctx.gains.slice(3).every((gain) => gain.disconnected));
  b.engine.dispose();
  assert.equal(b.intervals.size + b.timeouts.size, 0);
  assert.ok(ctx.gains.every((gain) => gain.disconnected));
  assert.equal(ctx.closeCalls, 1);
  assert.equal(b.doc.count('visibilitychange'), 0); assert.equal(b.host.count('pagehide'), 0);
});

test('master mute immediately silences active and scheduled voices, then restores only one requested score', () => {
  const b = browser(); b.engine.unlock(); b.engine.play('achievement'); b.engine.speakRadio('Pending words');
  assert.ok(b.timeouts.size > 0);
  b.engine.setMuted(true);
  const ctx = b.contexts[0];
  assert.equal(ctx.gains[0].gain.value, 0);
  assert.equal(b.intervals.size + b.timeouts.size, 0);
  assert.ok(ctx.oscillators.every((osc) => osc.disconnected));
  const count = ctx.oscillators.length;
  b.advance(2000); b.engine.play('success');
  assert.equal(ctx.oscillators.length, count);
  assert.equal(b.host.speechSynthesis.spoken.length, 0);
  b.engine.setMuted(false);
  assert.equal(b.intervals.size, 1); assert.equal(ctx.gains[0].gain.value, 0.8);
  b.engine.setVolume('master', 0); assert.equal(b.intervals.size, 0);
  b.engine.setVolume('master', 0.4); assert.equal(b.intervals.size, 1);
  b.engine.setVolume('music', 0); assert.equal(b.intervals.size, 0);
  b.engine.play('backup'); assert.ok(ctx.oscillators.slice(-3).every((osc) => !osc.disconnected));
  b.engine.setVolume('effects', 0); assert.ok(ctx.oscillators.every((osc) => osc.disconnected));
  b.engine.dispose();
});

test('hidden/page lifecycle stops audio and speech and resumes existing context without duplicate loops', async () => {
  const b = browser(); b.engine.unlock(); b.engine.speakRadio('Visibility test'); b.advance(250);
  assert.equal(b.host.speechSynthesis.spoken.length, 1);
  b.doc.hidden = true; b.doc.emit('visibilitychange');
  assert.equal(b.intervals.size + b.timeouts.size, 0);
  assert.equal(b.contexts[0].state, 'suspended');
  assert.equal(b.contexts[0].gains[0].gain.value, 0);
  assert.ok(b.contexts[0].oscillators.every((osc) => osc.disconnected));
  b.doc.hidden = false; b.doc.emit('visibilitychange'); await Promise.resolve();
  assert.equal(b.contexts.length, 1); assert.equal(b.intervals.size, 1);
  b.host.emit('pagehide'); assert.equal(b.intervals.size, 0);
  b.host.emit('pageshow'); await Promise.resolve();
  assert.equal(b.intervals.size, 1); assert.equal(b.contexts.length, 1);
  b.engine.dispose(); b.engine.initialize();
  assert.equal(b.doc.count('visibilitychange'), 1);
  assert.equal(b.contexts.length, 1, 'reinitializing lifecycle alone must remain silent');
  b.engine.dispose();
});

test('speech uses effects × master, ducks music, and late callbacks cannot speak or sound after cancel', () => {
  const b = browser(); b.engine.unlock();
  b.engine.setVolume('master', 0.5); b.engine.setVolume('effects', 0.4);
  b.engine.speakRadio('A clear radio call'); b.advance(250);
  const utterance = b.host.speechSynthesis.spoken[0];
  assert.equal(utterance.volume, 0.2); assert.equal(utterance.lang, 'en-US');
  assert.equal(utterance.voice.lang, 'en-US');
  assert.ok(b.contexts[0].gains[1].gain.value < b.engine.getPreferences().music);
  const staleError = utterance.onerror, staleEnd = utterance.onend;
  b.engine.stopAmbient();
  b.engine.setVolume('effects', 0);
  const count = b.contexts[0].oscillators.length;
  staleError(); staleEnd(); b.advance(1000);
  assert.equal(b.contexts[0].oscillators.length, count, 'canceled speech must not schedule fallback or punctuation');
  assert.equal(b.timeouts.size, 0);
  assert.equal(utterance.onerror, null); assert.equal(utterance.onend, null);
  b.engine.dispose();
});

test('missing Azerbaijani voice uses cancellable telemetry and unavailable Web Audio is harmless', () => {
  const b = browser(); b.engine.setVolume('music', 0); b.engine.unlock();
  b.engine.speakRadio('Azərbaycan dilində mətn', 'az');
  b.engine.setMuted(true); b.advance(1000);
  assert.equal(b.host.speechSynthesis.spoken.length, 0); assert.equal(b.timeouts.size, 0);
  b.engine.setMuted(false); b.engine.speakRadio('Azərbaycan dilində mətn', 'az'); b.advance(250);
  assert.equal(b.host.speechSynthesis.spoken.length, 0);
  assert.ok(b.timeouts.size > 0, 'fallback outro is tracked');
  b.engine.dispose(); assert.equal(b.timeouts.size, 0);
  const unsupported = browser({ supported: false });
  assert.doesNotThrow(() => { unsupported.engine.initialize(); unsupported.engine.unlock(); unsupported.engine.startAmbient(); effects.forEach((effect) => unsupported.engine.play(effect)); });
  assert.equal(unsupported.contexts.length, 0); assert.equal(unsupported.intervals.size, 0);
  unsupported.engine.dispose();
});

test('rapid continuous movement effects are rate limited and finished nodes release their graph', () => {
  const b = browser(); b.engine.setVolume('music', 0); b.engine.unlock();
  for (let index = 0; index < 100; index++) { b.engine.play('footstep'); b.engine.play('roverMotor'); b.engine.play('laserDrill'); }
  assert.equal(b.contexts[0].oscillators.length, 3);
  b.advance(200); assert.ok(b.contexts[0].oscillators.every((osc) => osc.disconnected));
  b.engine.play('footstep'); assert.equal(b.contexts[0].oscillators.length, 4);
  b.engine.dispose();
});

test('music state changes crossfade existing notes while mute still disconnects immediately', () => {
  const b = browser(); b.engine.unlock(); b.advance(200);
  const ctx = b.contexts[0], oldVoices = ctx.oscillators.filter((osc) => !osc.disconnected);
  b.engine.setMusicState('exploration');
  assert.equal(b.intervals.size, 1);
  assert.ok(oldVoices.every((osc) => !osc.disconnected), 'transition must retain notes through the fade');
  for (const osc of oldVoices) {
    assert.ok(Math.abs(osc.stopTime - (ctx.currentTime + 0.52)) < 0.001);
    assert.ok(osc.connections[0].gain.events.some(([type, value, at]) =>
      type === 'linear' && value === 0 && Math.abs(at - (ctx.currentTime + 0.5)) < 0.001));
  }
  b.advance(550); assert.ok(oldVoices.every((osc) => osc.disconnected));
  b.engine.setMusicState('critical'); b.engine.setMuted(true);
  assert.ok(ctx.oscillators.every((osc) => osc.disconnected), 'mute cancels active and fading notes');
  assert.equal(b.intervals.size, 0); b.engine.dispose();
});

test('raising a silent startup preference after unlock starts audio without needing a second gesture', () => {
  const saved = (values) => JSON.stringify({ v: 1, muted: false, master: 0, music: 0.5, effects: 0.75, ...values });
  for (const initial of [{}, { muted: true, master: 0.8 }]) {
    const b = browser({ saved: saved(initial) });
    b.engine.initialize(); b.engine.unlock(); assert.equal(b.contexts.length, 0);
    if (initial.muted) b.engine.setMuted(false);
    else b.engine.setVolume('master', 0.5);
    assert.equal(b.contexts.length, 1); assert.equal(b.intervals.size, 1);
    b.engine.dispose();
  }
  const noGesture = browser({ saved: saved({}) });
  noGesture.engine.setVolume('master', 0.5);
  assert.equal(noGesture.contexts.length, 0, 'preference updates alone must never unlock audio');
  noGesture.engine.dispose();
});

test('a rejected resume releases queued gesture effects and later automated calls stay silent', async () => {
  const b = browser({ suspended: true });
  const Context = b.host.AudioContext;
  b.host.AudioContext = class extends Context {
    resume() { this.resumeCalls++; return Promise.reject(new Error('Autoplay denied')); }
  };
  b.engine.unlock(); b.engine.play('choice');
  assert.ok(b.contexts[0].oscillators.length > 0, 'gesture effects can be scheduled while resume is pending');
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.ok(b.contexts[0].oscillators.every((osc) => osc.disconnected));
  const count = b.contexts[0].oscillators.length;
  b.engine.play('success'); assert.equal(b.contexts[0].oscillators.length, count);
  assert.equal(b.intervals.size, 0); b.engine.dispose();
});

test('future notes start silent and scene transitions discard them instead of fading the default gain', () => {
  const parameter = new Parameter();
  parameter.setValueAtTime(0, 1);
  assert.equal(parameter.value, 1, 'the fake must preserve default gain before a future automation event');
  const b = browser(); b.engine.unlock();
  const ctx = b.contexts[0];
  const future = ctx.oscillators.filter((osc) => osc.startTime > ctx.currentTime)
    .map((osc) => ({ osc, envelope: osc.connections[0].gain }));
  assert.ok(future.length > 0, 'the lookahead must contain future musical notes');
  assert.ok(future.every(({ envelope }) => envelope.value === 0), 'all future voices must be quiet now');
  b.engine.setMusicState('exploration');
  for (const { osc, envelope } of future) {
    assert.equal(osc.stopTime, ctx.currentTime);
    assert.equal(osc.disconnected, true);
    assert.equal(envelope.events.some(([type]) => type === 'hold'), false, 'a future source must never hold/fade its default gain');
  }
  assert.equal(b.intervals.size, 1);
  b.engine.dispose();
});

test('leaving a console cancels pending and current radio speech without muting music or effects', () => {
  const b = browser(); b.engine.setVolume('music', 0); b.engine.unlock();
  b.engine.speakRadio('Advice for the old phase'); b.engine.stopRadio(); b.advance(500);
  assert.equal(b.host.speechSynthesis.spoken.length, 0);
  assert.equal(b.timeouts.size, 0);
  b.engine.speakRadio('Advice currently speaking'); b.advance(250);
  const utterance = b.host.speechSynthesis.spoken[0], staleEnd = utterance.onend;
  b.engine.stopRadio();
  const count = b.contexts[0].oscillators.length;
  staleEnd(); b.advance(1000);
  assert.equal(b.contexts[0].oscillators.length, count);
  assert.equal(utterance.onend, null); assert.equal(b.engine.isMuted(), false);
  b.engine.play('choice'); assert.ok(b.contexts[0].oscillators.length > count);
  b.engine.dispose();
});
