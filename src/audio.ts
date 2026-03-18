// ─── 音频系统 ─────────────────────────────────────────────────────────────────

interface ToneOptions {
  frequency: number;
  type?: OscillatorType;
  duration?: number;
  volume?: number;
  slideTo?: number;
}

interface SeqNote {
  frequency: number;
  duration: number;
  volume?: number;
  type?: OscillatorType;
}

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  unlocked = false;
  started = false;
  noteIndex = 0;
  private loopId: ReturnType<typeof setTimeout> | null = null;
  bgmTrack = 0;

  readonly patterns: Array<Array<{ bass: number; lead: number }>> = [
    // Track 0: Classic
    [
      { bass: 130.81, lead: 261.63 }, { bass: 146.83, lead: 293.66 },
      { bass: 164.81, lead: 329.63 }, { bass: 146.83, lead: 293.66 },
      { bass: 174.61, lead: 349.23 }, { bass: 164.81, lead: 329.63 },
      { bass: 146.83, lead: 293.66 }, { bass: 130.81, lead: 261.63 },
    ],
    // Track 1: Mellow
    [
      { bass: 110, lead: 220 }, { bass: 123.47, lead: 246.94 },
      { bass: 130.81, lead: 261.63 }, { bass: 146.83, lead: 293.66 },
      { bass: 130.81, lead: 261.63 }, { bass: 123.47, lead: 246.94 },
      { bass: 110, lead: 220 }, { bass: 98, lead: 196 },
    ],
    // Track 2: Upbeat
    [
      { bass: 196, lead: 392 }, { bass: 220, lead: 440 },
      { bass: 246.94, lead: 493.88 }, { bass: 261.63, lead: 523.25 },
      { bass: 246.94, lead: 493.88 }, { bass: 220, lead: 440 },
      { bass: 196, lead: 392 }, { bass: 174.61, lead: 349.23 },
    ],
    // Track 3: Cyber (pentatonic minor, higher register)
    [
      { bass: 220, lead: 440 }, { bass: 261.63, lead: 523.25 },
      { bass: 293.66, lead: 587.33 }, { bass: 261.63, lead: 523.25 },
      { bass: 220, lead: 440 }, { bass: 196, lead: 392 },
      { bass: 174.61, lead: 349.23 }, { bass: 196, lead: 392 },
    ],
  ];

  get pattern(): Array<{ bass: number; lead: number }> {
    return this.patterns[this.bgmTrack] || this.patterns[0];
  }

  ensureContext(): boolean {
    const win = window as Window & typeof globalThis & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    if (!win.AudioContext && !win.webkitAudioContext) return false;
    if (!this.ctx) {
      const AC = win.AudioContext || win.webkitAudioContext!;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.22;
      this.sfxGain.gain.value = 1;
      this.bgmGain.gain.value = 0.22;
      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    return true;
  }

  getContext(): AudioContext | null { return this.ctx; }
  getBgmNode(): GainNode | null { return this.bgmGain; }

  unlock(): void {
    if (!this.ensureContext()) return;
    if (this.ctx!.state === 'suspended') this.ctx!.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      this.startBgm();
    }
  }

  setVolume(type: 'master' | 'sfx' | 'bgm', val: number): void {
    const v = Math.max(0, Math.min(1, val));
    if (type === 'master' && this.masterGain) this.masterGain.gain.value = v;
    else if (type === 'sfx' && this.sfxGain) this.sfxGain.gain.value = v;
    else if (type === 'bgm' && this.bgmGain) this.bgmGain.gain.value = v;
    try { localStorage.setItem('pixelSokobanVolume_' + type, String(v)); } catch {}
  }

  playTone(opts: ToneOptions): void {
    if (!this.unlocked || !this.ctx || !this.sfxGain) return;
    const { frequency, type = 'square', duration = 0.08, volume = 0.22, slideTo } = opts;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo !== undefined) {
      osc.frequency.linearRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playSequence(seq: SeqNote[]): void {
    if (!this.unlocked || !this.ctx || !this.sfxGain) return;
    let offset = 0;
    seq.forEach(note => {
      const now = this.ctx!.currentTime + offset;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = note.type || 'square';
      osc.frequency.setValueAtTime(note.frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(note.volume ?? 0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.duration);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + note.duration + 0.02);
      offset += note.duration;
    });
  }

  playSfx(name: string, moves = 0, stepFrame = 0, comboCount = 2): void {
    if (!this.unlocked) return;
    const mb = 380 + Math.min(moves, 20) * 4;

    const actions: Record<string, () => void> = {
      step: () => {
        const f = stepFrame === 0 ? mb : mb * 1.06;
        this.playTone({ frequency: f, type: 'triangle', duration: 0.07, volume: 0.38, slideTo: f + 35 });
      },
      move: () => {
        const f = stepFrame === 0 ? mb : mb * 1.06;
        this.playTone({ frequency: f, type: 'triangle', duration: 0.07, volume: 0.38, slideTo: f + 35 });
      },
      fail: () => {
        this.playTone({ frequency: 180, type: 'sawtooth', duration: 0.11, volume: 0.14, slideTo: 110 });
        this.playTone({ frequency: 90, type: 'square', duration: 0.06, volume: 0.08 });
      },
      push: () => {
        this.playTone({ frequency: 120, type: 'square', duration: 0.05, volume: 0.12 });
        this.playSequence([
          { frequency: 220, duration: 0.06, volume: 0.15, type: 'square' },
          { frequency: 300, duration: 0.07, volume: 0.13, type: 'triangle' },
        ]);
      },
      undo: () => this.playTone({ frequency: 220, type: 'triangle', duration: 0.12, volume: 0.15, slideTo: 180 }),
      clear: () => this.playSequence([
        { frequency: 261.63, duration: 0.10, volume: 0.16, type: 'triangle' },
        { frequency: 329.63, duration: 0.10, volume: 0.16, type: 'triangle' },
        { frequency: 392,    duration: 0.10, volume: 0.17, type: 'square' },
        { frequency: 523.25, duration: 0.12, volume: 0.18, type: 'square' },
        { frequency: 659.26, duration: 0.12, volume: 0.17, type: 'triangle' },
        { frequency: 783.99, duration: 0.14, volume: 0.16, type: 'triangle' },
        { frequency: 1046.5, duration: 0.20, volume: 0.18, type: 'square' },
      ]),
      win: () => this.playSequence([
        { frequency: 523.25, duration: 0.08, volume: 0.18, type: 'triangle' },
        { frequency: 659.26, duration: 0.08, volume: 0.20, type: 'triangle' },
        { frequency: 783.99, duration: 0.08, volume: 0.22, type: 'square' },
        { frequency: 1046.5, duration: 0.12, volume: 0.24, type: 'square' },
        { frequency: 1318.5, duration: 0.15, volume: 0.22, type: 'triangle' },
        { frequency: 2093,   duration: 0.30, volume: 0.18, type: 'square' },
      ]),
      hint: () => this.playTone({ frequency: 880, type: 'sine', duration: 0.15, volume: 0.08, slideTo: 1200 }),
      achievement: () => this.playSequence([
        { frequency: 523.25, duration: 0.06, volume: 0.15, type: 'triangle' },
        { frequency: 659.26, duration: 0.06, volume: 0.17, type: 'triangle' },
        { frequency: 783.99, duration: 0.08, volume: 0.19, type: 'square' },
        { frequency: 1046.5, duration: 0.10, volume: 0.21, type: 'square' },
        { frequency: 1568,   duration: 0.20, volume: 0.17, type: 'triangle' },
      ]),
      combo: () => {
        const freqs = [440, 554, 659, 784, 988];
        const f = freqs[Math.min((comboCount || 2) - 2, 4)];
        this.playSequence([
          { frequency: f,        duration: 0.05, volume: 0.18, type: 'square' },
          { frequency: f * 1.25, duration: 0.07, volume: 0.20, type: 'square' },
          { frequency: f * 1.5,  duration: 0.09, volume: 0.22, type: 'triangle' },
        ]);
      },
      boxOnGoal: () => {
        this.playSequence([
          { frequency: 523.25, duration: 0.05, volume: 0.18, type: 'square' },
          { frequency: 659.26, duration: 0.09, volume: 0.20, type: 'square' },
          { frequency: 783.99, duration: 0.14, volume: 0.18, type: 'triangle' },
          { frequency: 1046.5, duration: 0.10, volume: 0.14, type: 'triangle' },
        ]);
        this.playTone({ frequency: 130, type: 'triangle', duration: 0.2, volume: 0.06 });
      },
      ui: () => this.playTone({ frequency: 440, type: 'sine', duration: 0.08, volume: 0.12 }),
      ripple: () => this.playTone({ frequency: 880, type: 'sine', duration: 0.15, volume: 0.08, slideTo: 1200 }),
      screenshot: () => {
        this.playTone({ frequency: 2000, type: 'square', duration: 0.03, volume: 0.10 });
        this.playTone({ frequency: 800, type: 'triangle', duration: 0.06, volume: 0.06 });
      },
      comboEnd: () => this.playTone({ frequency: 330, type: 'sawtooth', duration: 0.15, volume: 0.10, slideTo: 180 }),
      deadlock: () => {
        this.playTone({ frequency: 120, type: 'sawtooth', duration: 0.12, volume: 0.12 });
        this.playTone({ frequency: 80, type: 'square', duration: 0.10, volume: 0.08 });
      },
    };

    const action = actions[name];
    if (action) action();
  }

  startBgm(): void {
    if (!this.ctx || this.started) return;
    this.started = true;
    const tick = () => {
      if (!this.unlocked || !this.ctx || !this.bgmGain) return;
      const step = this.pattern[this.noteIndex % this.pattern.length];
      this.noteIndex++;

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(step.bass, this.ctx.currentTime);
      bassGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.045, this.ctx.currentTime + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.42);
      bassOsc.connect(bassGain);
      bassGain.connect(this.bgmGain);
      bassOsc.start();
      bassOsc.stop(this.ctx.currentTime + 0.45);

      if (this.noteIndex % 2 === 1) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(step.lead, this.ctx.currentTime);
        leadGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        leadGain.gain.exponentialRampToValueAtTime(0.018, this.ctx.currentTime + 0.02);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);
        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);
        leadOsc.start();
        leadOsc.stop(this.ctx.currentTime + 0.20);
      }

      this.loopId = setTimeout(tick, 480);
    };
    tick();
  }

  stopBgm(): void {
    if (this.loopId !== null) {
      clearTimeout(this.loopId);
      this.loopId = null;
    }
    this.started = false;
    this.noteIndex = 0;
  }

  setBgmTrack(n: number): void {
    const idx = Math.max(0, Math.min(n, this.patterns.length - 1));
    if (idx === this.bgmTrack) return;
    this.bgmTrack = idx;
    if (this.started) {
      this.stopBgm();
      this.startBgm();
    }
  }
}

export const audioSystem = new AudioSystem();
