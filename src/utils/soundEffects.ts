/**
 * Synthesized Web Audio API SFX Engine (Zero external dependencies or audio assets).
 * Generates subtle procedural sci-fi sound effects for classroom & mission control feedback.
 */

export type SoundEffectType =
  | 'choice'
  | 'rewind'
  | 'shadowAlert'
  | 'stormAlert'
  | 'success'
  | 'hotspot'
  | 'StepNav'
  | 'geiger'
  | 'laserDrill'
  | 'solarLock'
  | 'footstep'
  | 'roverMotor'
  | 'quindarIntro'
  | 'quindarOutro'
  | 'tourChime'
  | 'achievement'
  | 'uiClick';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        /* Ignore autoplay restrictions until user gesture */
      });
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) {
      this.play('choice');
    }
    return this.muted;
  }

  public play(type: SoundEffectType): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    try {
      switch (type) {
        case 'choice': {
          // Crisp two-tone sci-fi telemetry confirmation beep
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'StepNav': {
          // Subtle soft tick for timeline step change
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }

        case 'hotspot': {
          // Pleasant high-pitched discovery ping for 2D engineering hotspots
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(660, now);
          osc.frequency.setValueAtTime(990, now + 0.06);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }

        case 'rewind': {
          // Time-rewind descending/ascending frequency swoosh
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';

          osc1.frequency.setValueAtTime(880, now);
          osc1.frequency.exponentialRampToValueAtTime(220, now + 0.18);
          osc1.frequency.exponentialRampToValueAtTime(540, now + 0.34);

          osc2.frequency.setValueAtTime(440, now);
          osc2.frequency.exponentialRampToValueAtTime(160, now + 0.18);
          osc2.frequency.exponentialRampToValueAtTime(360, now + 0.34);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.1, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.36);
          osc2.stop(now + 0.36);
          break;
        }

        case 'shadowAlert': {
          // Deep thermal-drop warning pulse for LRO 72-hour horizon shadow
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(190, now);
          osc.frequency.linearRampToValueAtTime(135, now + 0.28);

          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.32);
          break;
        }

        case 'stormAlert': {
          // Dual-pulse DONKI solar particle radiation alert
          [0, 0.14].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(620, now + offset);
            osc.frequency.linearRampToValueAtTime(480, now + offset + 0.1);

            gain.gain.setValueAtTime(0.07, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.12);
          });
          break;
        }

        case 'success': {
          // Warm harmonic major triad arpeggio (C5 - E5 - G5 - C6)
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.07;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.06, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.35);
          });
          break;
        }

        case 'geiger': {
          // Crisp short Geiger-Müller counter click for outdoor radiation storm exposure
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1450, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.018);

          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.022);
          break;
        }

        case 'laserDrill': {
          // Sci-fi cyan laser drill harmonic pulse
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(290, now);
          osc.frequency.linearRampToValueAtTime(420, now + 0.065);

          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.075);
          break;
        }

        case 'solarLock': {
          // Bright dual-tone lock chime when solar array aligns with 1.5° grazing sun
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(740, now);
          osc.frequency.setValueAtTime(1110, now + 0.07);

          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case 'footstep': {
          // Soft low-frequency lunar regolith boot crunch
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(135, now);
          osc.frequency.exponentialRampToValueAtTime(68, now + 0.045);

          gain.gain.setValueAtTime(0.024, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'roverMotor': {
          // Subtle electric drive servo pulse for VIPER rover movement
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(165, now);
          osc.frequency.linearRampToValueAtTime(215, now + 0.055);

          gain.gain.setValueAtTime(0.022, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.065);
          break;
        }

        case 'quindarIntro': {
          // Authentic Apollo/Artemis intro Quindar tone (2,525 Hz, 250 ms)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2525, now);
          gain.gain.setValueAtTime(0.025, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case 'quindarOutro': {
          // Authentic Apollo/Artemis outro Quindar tone (2,475 Hz, 250 ms)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2475, now);
          gain.gain.setValueAtTime(0.022, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case 'tourChime': {
          // Harmonious 3-tone arpeggio (C5 - E5 - G5)
          [
            { f: 523.25, t: 0 },
            { f: 659.25, t: 0.08 },
            { f: 783.99, t: 0.16 },
          ].forEach(({ f, t }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0.04, now + t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + t);
            osc.stop(now + t + 0.22);
          });
          break;
        }

        case 'achievement': {
          // Celebratory 4-note major arpeggio with shimmering resonance
          [
            { f: 523.25, t: 0 },
            { f: 659.25, t: 0.1 },
            { f: 783.99, t: 0.2 },
            { f: 1046.5, t: 0.32 },
          ].forEach(({ f, t }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0.06, now + t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + t);
            osc.stop(now + t + 0.35);
          });
          break;
        }

        case 'uiClick': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(840, now + 0.035);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
      }
    } catch {
      // Ignore any audio context errors gracefully
    }
  }

  public speakRadio(text: string, lang: 'en' | 'az' = 'en'): void {
    if (this.muted || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      this.play('quindarIntro');
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'az' ? 'az-AZ' : 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.onend = () => {
        this.play('quindarOutro');
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis not supported or blocked
    }
  }
}

export const soundFX = new SoundEngine();
