/** Original procedural score and feedback; no recordings, assets, or mission-model inputs. */
export type SoundEffectType =
  | 'choice' | 'rewind' | 'shadowAlert' | 'stormAlert' | 'success' | 'hotspot'
  | 'StepNav' | 'geiger' | 'laserDrill' | 'solarLock' | 'footstep' | 'roverMotor'
  | 'quindarIntro' | 'quindarOutro' | 'tourChime' | 'achievement' | 'uiClick'
  | 'batteryAlert' | 'failure' | 'launch' | 'backup';

export interface AudioPreferences {
  readonly muted: boolean;
  readonly master: number;
  readonly music: number;
  readonly effects: number;
}
export type AudioMusicState = 'menu' | 'exploration' | 'critical';
type AudioChannel = 'master' | 'music' | 'effects';
type BrowserHost = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
};
type Voice = { oscillator: OscillatorNode; gain: GainNode; channel: 'music' | 'effects'; startAt: number };
type RoverMotorVoice = {
  lowOsc: OscillatorNode;
  highOsc: OscillatorNode;
  lowGain: GainNode;
  highGain: GainNode;
  busGain: GainNode;
  speed: number;
};

export const AUDIO_PREFERENCES_KEY = 'outpost_audio_preferences_v1';
const DEFAULTS: AudioPreferences = Object.freeze({ muted: false, master: 0.8, music: 0.5, effects: 0.75 });
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const note = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
function holdLevel(parameter: AudioParam, now: number): void {
  if (typeof parameter.cancelAndHoldAtTime === 'function') parameter.cancelAndHoldAtTime(now);
  else {
    const current = parameter.value;
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(current, now);
  }
}
const SCORES = {
  menu: { beat: 0.85, chords: [[50, 57, 64], [46, 53, 62], [53, 60, 67], [48, 55, 62]], melody: [74, 69, 72, 76, 79, 76, 72, 69] },
  exploration: { beat: 0.72, chords: [[50, 57, 64], [55, 62, 69], [53, 60, 67], [48, 55, 64]], melody: [74, 76, 81, 79, 76, 72, 69, 76] },
  critical: { beat: 0.64, chords: [[50, 57, 60], [51, 58, 62], [50, 57, 64], [48, 55, 62]], melody: [69, 72, 69, 67, 70, 69, 67, 65] },
} as const;

/** Browser host is injectable for lifecycle/audio-graph tests. Construction never starts audio. */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private effectsBus: GainNode | null = null;
  private preferences: AudioPreferences = DEFAULTS;
  private listeners = new Set<() => void>();
  private voices = new Set<Voice>();
  private recentEffects = new Map<SoundEffectType, number>();
  private initialized = false;
  private unlocked = false;
  private resumePending = false;
  private pageHidden = false;
  private musicRequested = true;
  private musicState: AudioMusicState = 'menu';
  private musicTimer: number | null = null;
  private nextBeat = 0;
  private beatIndex = 0;
  private speechGeneration = 0;
  private speechTimers = new Set<number>();
  private utterance: SpeechSynthesisUtterance | null = null;
  private speechActive = false;
  private roverMotor: RoverMotorVoice | null = null;
  private roverStopTimer: number | null = null;

  constructor(
    private readonly host: BrowserHost | null = typeof window === 'undefined' ? null : window,
    private readonly doc: Document | null = host?.document ?? null,
  ) {
    try {
      const saved: unknown = JSON.parse(host?.localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? 'null');
      if (saved && typeof saved === 'object') {
        const value = saved as Record<string, unknown>;
        if (value.v === 1 && typeof value.muted === 'boolean' &&
            ['master', 'music', 'effects'].every((key) => typeof value[key] === 'number' && Number.isFinite(value[key]))) {
          this.preferences = Object.freeze({ muted: value.muted, master: clamp(value.master as number),
            music: clamp(value.music as number), effects: clamp(value.effects as number) });
        }
      }
    } catch { /* Restricted or malformed storage keeps the quiet defaults. */ }
  }

  public getPreferences = (): AudioPreferences => this.preferences;
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  public isMuted(): boolean { return this.preferences.muted; }

  /** Install once, without creating/resuming a context or speaking. Safe under React remounts. */
  public initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.doc?.addEventListener('visibilitychange', this.onVisibility);
    this.host?.addEventListener('pagehide', this.onPageHide);
    this.host?.addEventListener('pageshow', this.onPageShow);
  }

  /** Call from a genuine pointer/keyboard gesture. This is the only context-creation boundary. */
  public unlock(): void {
    this.initialize();
    this.unlocked = true;
    if (this.isSilent() || !this.host) return;
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const Context = this.host.AudioContext ?? this.host.webkitAudioContext;
        if (!Context) return;
        this.ctx = new Context();
        this.masterBus = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.effectsBus = this.ctx.createGain();
        this.musicBus.connect(this.masterBus);
        this.effectsBus.connect(this.masterBus);
        this.masterBus.connect(this.ctx.destination);
        this.updateLevels(true);
      }
      this.wake();
    } catch { /* Unsupported audio and denied autoplay leave all controls usable. */ }
  }

  public setMuted(muted: boolean): void {
    if (this.preferences.muted === muted) return;
    this.changePreferences({ ...this.preferences, muted });
    if (muted) this.silence();
    else { this.updateLevels(); if (this.unlocked) this.unlock(); }
  }
  public toggleMute(): boolean {
    this.setMuted(!this.preferences.muted);
    return this.preferences.muted;
  }
  public setVolume(channel: AudioChannel, value: number): void {
    if (!['master', 'music', 'effects'].includes(channel) || !Number.isFinite(value)) return;
    const normalized = clamp(value);
    if (this.preferences[channel] === normalized) return;
    this.changePreferences({ ...this.preferences, [channel]: normalized });
    if (channel !== 'music') this.cancelSpeech();
    if (this.preferences.master === 0) this.silence();
    else {
      if (this.preferences.music === 0) this.stopMusic();
      if (this.preferences.effects === 0) {
        this.stopVoices('effects');
        this.stopRoverMotor(true);
      }
      this.updateLevels();
      if (this.unlocked) this.unlock();
    }
  }

  public setMusicState(state: AudioMusicState): void {
    if (!['menu', 'exploration', 'critical'].includes(state)) return;
    this.musicRequested = true;
    if (state !== this.musicState) {
      this.musicState = state;
      this.stopMusic(true);
      this.beatIndex = 0;
    }
    this.startMusic();
  }
  /** Compatibility: existing launch buttons call this directly from their user gesture. */
  public startAmbient(): void {
    this.musicRequested = true;
    this.unlock();
    this.startMusic();
  }
  public stopAmbient(): void { this.musicRequested = false; this.stopMusic(); }

  private isHidden(): boolean { return this.pageHidden || Boolean(this.doc?.hidden); }
  private isSilent(): boolean { return this.preferences.muted || this.preferences.master === 0 || this.isHidden(); }
  private canUse(channel: 'music' | 'effects'): boolean {
    return this.unlocked && !this.isSilent() && this.preferences[channel] > 0 && this.ctx !== null &&
      (this.ctx.state === 'running' || this.resumePending);
  }
  private changePreferences(next: AudioPreferences): void {
    this.preferences = Object.freeze(next);
    try { this.host?.localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ v: 1, ...next })); }
    catch { /* Sound remains usable when browser storage is unavailable. */ }
    this.listeners.forEach((listener) => listener());
  }
  private updateLevels(immediate = false): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const silent = this.isSilent();
    const levels = [
      [this.masterBus, silent ? 0 : this.preferences.master],
      [this.musicBus, this.preferences.music * (this.speechActive ? 0.28 : 1)],
      [this.effectsBus, this.preferences.effects],
    ] as const;
    for (const [bus, value] of levels) {
      if (!bus) continue;
      holdLevel(bus.gain, now);
      if (immediate || silent || value === 0) bus.gain.setValueAtTime(value, now);
      else bus.gain.setTargetAtTime(value, now, 0.025);
    }
  }
  private wake(): void {
    const context = this.ctx;
    if (!context || this.isSilent() || !this.unlocked) return;
    this.updateLevels();
    if (context.state === 'suspended') {
      if (this.resumePending) return;
      this.resumePending = true;
      void context.resume().then(() => {
        if (this.ctx !== context) return;
        this.resumePending = false;
        if (this.isHidden()) { void context.suspend().catch(() => {}); return; }
        this.startMusic();
      }).catch(() => {
        if (this.ctx === context) { this.resumePending = false; this.silence(); }
      });
    } else this.startMusic();
  }
  private onVisibility = (): void => { if (this.isHidden()) this.pause(); else this.wake(); };
  private onPageHide = (): void => { this.pageHidden = true; this.pause(); };
  private onPageShow = (): void => { this.pageHidden = false; if (!this.isHidden()) this.wake(); };
  private pause(): void {
    this.silence();
    if (this.ctx?.state === 'running') void this.ctx.suspend().catch(() => {});
  }
  private silence(): void {
    this.stopMusic();
    this.stopVoices('effects');
    this.stopRoverMotor(true);
    this.cancelSpeech();
    this.recentEffects.clear();
    this.updateLevels(true);
  }
  private stopVoices(channel: Voice['channel'], fade = false): void {
    for (const voice of [...this.voices]) {
      if (voice.channel !== channel) continue;
      if (fade && this.ctx?.state === 'running' && voice.startAt <= this.ctx.currentTime) {
        const now = this.ctx.currentTime;
        const envelope = voice.gain.gain;
        holdLevel(envelope, now);
        envelope.linearRampToValueAtTime(0, now + 0.5);
        try { voice.oscillator.stop(now + 0.52); } catch { this.releaseVoice(voice); }
        continue;
      }
      try { voice.oscillator.stop(); } catch { /* Already ended. */ }
      this.releaseVoice(voice);
    }
  }
  private releaseVoice(voice: Voice): void {
    voice.oscillator.onended = null;
    try { voice.oscillator.disconnect(); voice.gain.disconnect(); } catch { /* Detached graph. */ }
    this.voices.delete(voice);
  }

  /** Every finite voice has a soft envelope, an end time, and explicit graph cleanup. */
  private tone(frequency: number, duration: number, level: number, channel: Voice['channel'],
    offset = 0, waveform: OscillatorType = 'sine', endFrequency?: number, attack = 0.012): void {
    const context = this.ctx;
    const bus = channel === 'music' ? this.musicBus : this.effectsBus;
    if (!context || !bus || !this.canUse(channel) || this.voices.size >= 72) return;
    let voice: Voice | null = null;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + offset;
      const end = start + duration;
      // A scheduled source must never inherit GainNode's default gain of one.
      gain.gain.setValueAtTime(0, context.currentTime);
      voice = { oscillator, gain, channel, startAt: start };
      this.voices.add(voice);
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, start);
      if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(level, start + Math.min(attack, duration / 3));
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      gain.gain.setValueAtTime(0, end + 0.015);
      oscillator.connect(gain);
      gain.connect(bus);
      oscillator.onended = () => { if (voice) this.releaseVoice(voice); };
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    } catch { if (voice) this.releaseVoice(voice); }
  }

  private startMusic(): void {
    if (!this.musicRequested || !this.canUse('music') || this.ctx?.state !== 'running' || this.musicTimer !== null || !this.host) return;
    this.nextBeat = this.ctx.currentTime + 0.04;
    this.scheduleMusic();
    this.musicTimer = this.host.setInterval(() => this.scheduleMusic(), 180);
  }
  private stopMusic(fade = false): void {
    if (this.musicTimer !== null) this.host?.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.stopVoices('music', fade);
  }
  private scheduleMusic(): void {
    if (!this.canUse('music') || !this.ctx) return;
    const score = SCORES[this.musicState];
    // Short lookahead allows context changes to react without a queued old soundtrack.
    if (this.nextBeat < this.ctx.currentTime) this.nextBeat = this.ctx.currentTime + 0.04;
    while (this.nextBeat < this.ctx.currentTime + 0.45) {
      const beat = this.beatIndex++;
      const offset = Math.max(0, this.nextBeat - this.ctx.currentTime);
      const chord = score.chords[Math.floor(beat / 4) % score.chords.length];
      if (beat % 4 === 0) {
        chord.forEach((pitch, index) => this.tone(note(pitch), score.beat * 3.6, 0.035 - index * 0.004,
          'music', offset + index * 0.035, index === 1 ? 'triangle' : 'sine', undefined, 0.16));
      }
      if (beat % 2 === 0) {
        const pitch = score.melody[Math.floor(beat / 2) % score.melody.length];
        this.tone(note(pitch), score.beat * 1.35, 0.037, 'music', offset, 'sine', undefined, 0.025);
        this.tone(note(pitch + 12), score.beat * 0.6, 0.008, 'music', offset + 0.015);
      }
      if (this.musicState !== 'menu') {
        this.tone(note(chord[0] - 12), 0.2, this.musicState === 'critical' ? 0.035 : 0.022,
          'music', offset, 'triangle', undefined, 0.025);
      }
      this.nextBeat += score.beat;
    }
  }

  /** Continuous structure-borne electric motor vibration for driving the pressurized rover. */
  public setRoverMotor(speedRatio: number): void {
    const target = Number.isFinite(speedRatio) ? clamp(speedRatio) : 0;
    if (!this.canUse('effects') || !this.ctx) {
      this.stopRoverMotor(true);
      return;
    }
    if (target <= 0.01) {
      if (this.roverMotor && this.ctx.state === 'running' && this.host) {
        this.roverMotor.speed = 0;
        if (this.roverStopTimer === null) {
          const now = this.ctx.currentTime;
          holdLevel(this.roverMotor.busGain.gain, now);
          this.roverMotor.busGain.gain.setTargetAtTime(0, now, 0.024);
          this.roverMotor.busGain.gain.setValueAtTime(0, now + 0.09);
          holdLevel(this.roverMotor.lowOsc.frequency, now);
          this.roverMotor.lowOsc.frequency.setTargetAtTime(54, now, 0.035);
          holdLevel(this.roverMotor.highOsc.frequency, now);
          this.roverMotor.highOsc.frequency.setTargetAtTime(108, now, 0.035);
          this.roverStopTimer = this.host.setTimeout(() => {
            this.roverStopTimer = null;
            this.stopRoverMotor(true);
          }, 95);
        }
      } else if (this.roverMotor) {
        this.stopRoverMotor(true);
      }
      return;
    }

    if (this.roverStopTimer !== null) {
      this.host?.clearTimeout(this.roverStopTimer);
      this.roverStopTimer = null;
    }
    const bus = this.effectsBus;
    if (!bus) {
      this.stopRoverMotor(true);
      return;
    }
    const now = this.ctx.currentTime;
    if (!this.roverMotor) {
      let lowOsc: OscillatorNode | null = null;
      let highOsc: OscillatorNode | null = null;
      let lowGain: GainNode | null = null;
      let highGain: GainNode | null = null;
      let busGain: GainNode | null = null;
      try {
        lowOsc = this.ctx.createOscillator();
        highOsc = this.ctx.createOscillator();
        lowGain = this.ctx.createGain();
        highGain = this.ctx.createGain();
        busGain = this.ctx.createGain();
        lowOsc.type = 'sine';
        highOsc.type = 'triangle';
        lowOsc.frequency.setValueAtTime(56, now);
        highOsc.frequency.setValueAtTime(112, now);
        lowGain.gain.setValueAtTime(0.7, now);
        highGain.gain.setValueAtTime(0.24, now);
        busGain.gain.setValueAtTime(0, now);
        lowOsc.connect(lowGain);
        highOsc.connect(highGain);
        lowGain.connect(busGain);
        highGain.connect(busGain);
        busGain.connect(bus);
        lowOsc.start(now);
        highOsc.start(now);
        this.roverMotor = { lowOsc, highOsc, lowGain, highGain, busGain, speed: 0 };
      } catch {
        for (const osc of [lowOsc, highOsc]) {
          try { osc?.stop(); } catch { /* Ignore partial oscillator setup error. */ }
          try { osc?.disconnect(); } catch { /* Ignore partial disconnect. */ }
        }
        for (const gain of [lowGain, highGain, busGain]) {
          try { gain?.disconnect(); } catch { /* Ignore partial disconnect. */ }
        }
        return;
      }
    }

    const accelerating = target >= this.roverMotor.speed;
    this.roverMotor.speed = target;
    const tau = accelerating ? 0.042 : 0.055;
    const lowFreq = 56 + 38 * target;
    const highFreq = 112 + 88 * target;
    const harmonicGain = 0.22 + 0.14 * target;
    const level = 0.008 + 0.026 * (target ** 0.85);
    holdLevel(this.roverMotor.lowOsc.frequency, now);
    this.roverMotor.lowOsc.frequency.setTargetAtTime(lowFreq, now, tau);
    holdLevel(this.roverMotor.highOsc.frequency, now);
    this.roverMotor.highOsc.frequency.setTargetAtTime(highFreq, now, tau);
    holdLevel(this.roverMotor.highGain.gain, now);
    this.roverMotor.highGain.gain.setTargetAtTime(harmonicGain, now, tau);
    holdLevel(this.roverMotor.busGain.gain, now);
    this.roverMotor.busGain.gain.setTargetAtTime(level, now, tau);
  }

  public stopRoverMotor(immediate = true): void {
    if (!immediate && this.roverMotor && this.canUse('effects') && this.ctx?.state === 'running') {
      this.setRoverMotor(0);
      return;
    }
    if (this.roverStopTimer !== null) {
      this.host?.clearTimeout(this.roverStopTimer);
      this.roverStopTimer = null;
    }
    const motor = this.roverMotor;
    if (!motor) return;
    this.roverMotor = null;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      holdLevel(motor.busGain.gain, now);
      motor.busGain.gain.setValueAtTime(0, now);
    }
    for (const osc of [motor.lowOsc, motor.highOsc]) {
      try { osc.stop(); } catch { /* Already stopped. */ }
      try { osc.disconnect(); } catch { /* Detached graph. */ }
    }
    for (const gain of [motor.lowGain, motor.highGain, motor.busGain]) {
      try { gain.disconnect(); } catch { /* Detached graph. */ }
    }
  }

  /** Automatic gameplay effects never create or resume audio before a gesture. */
  public play(type: SoundEffectType): void {
    if (!this.canUse('effects') || !this.ctx) return;
    const cooldowns: Partial<Record<SoundEffectType, number>> = {
      footstep: 0.12, roverMotor: 0.16, laserDrill: 0.15, geiger: 0.2,
      batteryAlert: 3, shadowAlert: 1.5, stormAlert: 2, failure: 2, launch: 0.8,
    };
    const now = this.ctx.currentTime;
    if (now - (this.recentEffects.get(type) ?? -Infinity) < (cooldowns[type] ?? 0.045)) return;
    this.recentEffects.set(type, now);
    const ping = (frequency: number, duration = 0.15, offset = 0, level = 0.075,
      waveform: OscillatorType = 'sine', end?: number) => this.tone(frequency, duration, level, 'effects', offset, waveform, end);
    const phrase = (pitches: number[], spacing = 0.09, duration = 0.3, level = 0.065) =>
      pitches.forEach((pitch, index) => ping(note(pitch), duration, index * spacing, level));
    switch (type) {
      case 'uiClick': ping(620, 0.045, 0, 0.042, 'sine', 840); break;
      case 'StepNav': ping(380, 0.07, 0, 0.045, 'triangle', 440); break;
      case 'choice': phrase([72, 76], 0.065, 0.18); break;
      case 'hotspot': phrase([76, 83], 0.075, 0.26); break;
      case 'solarLock': phrase([78, 85], 0.08, 0.28); break;
      case 'tourChime': phrase([74, 78, 81], 0.085, 0.28, 0.05); break;
      case 'success': phrase([74, 78, 81, 86], 0.11, 0.45); break;
      case 'achievement': phrase([69, 74, 78, 81, 86], 0.095, 0.4, 0.06); break;
      case 'launch': phrase([50, 57, 62, 69, 74], 0.1, 0.4, 0.07); break;
      case 'backup': phrase([50, 57, 62], 0.08, 0.3, 0.07); break;
      case 'failure': phrase([62, 58, 50], 0.17, 0.35, 0.065); break;
      case 'rewind': ping(880, 0.2, 0, 0.06, 'sine', 220); ping(220, 0.22, 0.18, 0.055, 'triangle', 540); break;
      case 'shadowAlert': ping(220, 0.35, 0, 0.07, 'triangle', 165); break;
      case 'batteryAlert': ping(392, 0.15, 0, 0.06); ping(294, 0.2, 0.19, 0.06); break;
      case 'stormAlert': ping(620, 0.16, 0, 0.065, 'triangle', 480); ping(620, 0.16, 0.22, 0.065, 'triangle', 480); break;
      case 'geiger': ping(1450, 0.025, 0, 0.028, 'triangle', 320); break;
      case 'laserDrill': ping(290, 0.095, 0, 0.035, 'triangle', 420); break;
      case 'footstep': ping(135, 0.065, 0, 0.034, 'triangle', 68); break;
      case 'roverMotor': ping(165, 0.1, 0, 0.03, 'triangle', 215); break;
      // Original synthesized radio punctuation, inspired by the familiar two-tone signal.
      case 'quindarIntro': ping(2525, 0.23, 0, 0.024); break;
      case 'quindarOutro': ping(2475, 0.23, 0, 0.022); break;
    }
  }

  private later(callback: () => void, delay: number): void {
    if (!this.host) return;
    const id = this.host.setTimeout(() => { this.speechTimers.delete(id); callback(); }, delay);
    this.speechTimers.add(id);
  }
  private cancelSpeech(): void {
    this.speechGeneration++;
    for (const timer of this.speechTimers) this.host?.clearTimeout(timer);
    this.speechTimers.clear();
    if (this.utterance) { this.utterance.onend = null; this.utterance.onerror = null; }
    this.utterance = null;
    this.speechActive = false;
    try { this.host?.speechSynthesis?.cancel(); } catch { /* Optional speech API. */ }
    this.updateLevels();
  }
  public stopRadio(): void { this.cancelSpeech(); }

  public speakRadio(text: string, lang: 'en' | 'az' = 'en'): void {
    if (!this.canUse('effects') || !this.host || !text.trim()) return;
    this.cancelSpeech();
    const generation = this.speechGeneration;
    const stillActive = () => generation === this.speechGeneration && this.canUse('effects');
    const fallback = () => {
      if (!stillActive()) return;
      this.speechActive = false;
      this.updateLevels();
      [640, 760, 580, 820, 690].forEach((frequency, index) =>
        this.tone(frequency, 0.085, 0.025, 'effects', index * 0.09));
      this.later(() => { if (stillActive()) this.play('quindarOutro'); }, 650);
    };
    this.play('quindarIntro');
    const synthesis = this.host.speechSynthesis;
    const Utterance = this.host.SpeechSynthesisUtterance;
    let voice: SpeechSynthesisVoice | undefined;
    try { voice = synthesis?.getVoices().find((entry) => entry.lang.toLowerCase().startsWith(lang)); }
    catch { /* An unavailable voice uses telemetry punctuation, with text still on screen. */ }
    if (!synthesis || !Utterance || (lang === 'az' && !voice)) { this.later(fallback, 240); return; }
    this.later(() => {
      if (!stillActive()) return;
      try {
        const utterance = new Utterance(text);
        this.utterance = utterance;
        utterance.lang = lang === 'az' ? 'az-AZ' : 'en-US';
        if (voice) utterance.voice = voice;
        utterance.volume = this.preferences.master * this.preferences.effects;
        utterance.rate = 0.98;
        utterance.pitch = 0.96;
        utterance.onend = () => {
          if (!stillActive() || this.utterance !== utterance) return;
          utterance.onend = utterance.onerror = null;
          this.utterance = null;
          this.speechActive = false;
          this.updateLevels();
          this.play('quindarOutro');
        };
        utterance.onerror = () => {
          if (!stillActive() || this.utterance !== utterance) return;
          utterance.onend = utterance.onerror = null;
          this.utterance = null;
          fallback();
        };
        this.speechActive = true;
        this.updateLevels();
        synthesis.speak(utterance);
      } catch { fallback(); }
    }, 240);
  }

  public dispose(): void {
    this.doc?.removeEventListener('visibilitychange', this.onVisibility);
    this.host?.removeEventListener('pagehide', this.onPageHide);
    this.host?.removeEventListener('pageshow', this.onPageShow);
    this.musicRequested = false;
    this.silence();
    [this.musicBus, this.effectsBus, this.masterBus].forEach((bus) => { try { bus?.disconnect(); } catch { /* Closed graph. */ } });
    const context = this.ctx;
    this.ctx = null;
    this.masterBus = this.musicBus = this.effectsBus = null;
    this.unlocked = false;
    this.resumePending = false;
    this.initialized = false;
    this.pageHidden = false;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}

export const soundFX = new SoundEngine();
export function playSfx(alias: SoundEffectType | 'confirm' | 'radio' | 'click'): void {
  soundFX.play(alias === 'confirm' ? 'choice' : alias === 'radio' ? 'quindarIntro' : alias === 'click' ? 'uiClick' : alias);
}
