// INTEGRATION NOTES FOR game.js:
//
// 1. 'undo' sfx: In the undo() function, change:
//      audio.playSfx('ui');
//    to:
//      audio.playSfx('undo');
//
// 2. 'boxOnGoal' sfx: In the move handler, after audio.playSfx('push'), add:
//      if (isGoal(boxNextX, boxNextY)) audio.playSfx('boxOnGoal');
//    (The existing goalFlash effect already fires at that same isGoal check above it.)
//
// 3. BGM tempo by level: startBgm() already reads state.levelIndex internally.
//    No call-site changes needed — tempo is computed inside startBgm() on each call.

function createAudioManager() {
  const manager = {
    ctx: null,
    masterGain: null,
    sfxGain: null,
    bgmGain: null,
    unlocked: false,
    started: false,
    noteIndex: 0,
    loopId: null,

    // Consecutive-move pitch tracking
    _consecutiveMoves: 0,
    _lastMoveTime: 0,

    pattern: [
      { bass: 130.81, lead: 261.63 },
      { bass: 146.83, lead: 293.66 },
      { bass: 164.81, lead: 329.63 },
      { bass: 146.83, lead: 293.66 },
      { bass: 174.61, lead: 349.23 },
      { bass: 164.81, lead: 329.63 },
      { bass: 146.83, lead: 293.66 },
      { bass: 130.81, lead: 261.63 },
    ],

    ensureContext() {
      if (!window.AudioContext && !window.webkitAudioContext) {
        return false;
      }
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
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
    },

    unlock() {
      if (!this.ensureContext()) {
        return;
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.unlocked = true;
      if (!this.started) {
        this.startBgm();
      }
    },

    // Single oscillator tone, routed through sfxGain
    playTone({ frequency, type = 'square', duration = 0.08, volume = 0.22, slideTo }) {
      if (!this.unlocked || !this.ctx) {
        return;
      }
      const now = this.ctx.currentTime;
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.sfxGain);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    },

    // Sequence of tones scheduled back-to-back
    playSequence(sequence) {
      if (!this.unlocked || !this.ctx) {
        return;
      }
      let offset = 0;
      sequence.forEach((note) => {
        const now = this.ctx.currentTime + offset;
        const oscillator = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        oscillator.type = note.type || 'square';
        oscillator.frequency.setValueAtTime(note.frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(note.volume ?? 0.18, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.duration);
        oscillator.connect(gain);
        gain.connect(this.sfxGain);
        oscillator.start(now);
        oscillator.stop(now + note.duration + 0.02);
        offset += note.duration * 0.72;
      });
    },

    // White-noise burst for percussion
    playNoise({ duration = 0.04, volume = 0.15, highpass = 2000 }) {
      if (!this.unlocked || !this.ctx) {
        return;
      }
      const now = this.ctx.currentTime;
      const bufSize = Math.floor(this.ctx.sampleRate * duration);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = highpass;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
      src.stop(now + duration + 0.01);
    },

    playSfx(type) {
      if (!this.unlocked) {
        return;
      }

      const actions = {
        // Pitch rises with consecutive moves (420→560 Hz); resets after 600ms gap
        move: () => {
          const now = performance.now();
          if (now - this._lastMoveTime > 600) this._consecutiveMoves = 0;
          this._consecutiveMoves = Math.min(this._consecutiveMoves + 1, 12);
          this._lastMoveTime = now;
          const freq = 420 + (this._consecutiveMoves - 1) * 11.6; // 420 at 1, ~548 at 12
          this.playTone({ frequency: freq, type: 'triangle', duration: 0.1, volume: 0.45 });
        },

        fail: () => {
          this._consecutiveMoves = 0;
          this.playTone({ frequency: 180, type: 'sawtooth', duration: 0.11, volume: 0.12, slideTo: 120 });
        },

        // Heavy push: low sine thud + square impact + triangle resonance
        push: () => {
          this.playTone({ frequency: 80, type: 'sine', duration: 0.08, volume: 0.55 });
          this.playSequence([
            { frequency: 200, duration: 0.06, volume: 0.28, type: 'square' },
            { frequency: 300, duration: 0.10, volume: 0.20, type: 'triangle' },
          ]);
        },

        // 8-note fanfare with reverb echo
        clear: () => {
          // Primary fanfare
          this.playSequence([
            { frequency: 523.25, duration: 0.09, volume: 0.18, type: 'triangle' },
            { frequency: 659.25, duration: 0.09, volume: 0.18, type: 'triangle' },
            { frequency: 783.99, duration: 0.09, volume: 0.19, type: 'triangle' },
            { frequency: 1046.5, duration: 0.12, volume: 0.20, type: 'square'   },
            { frequency: 783.99, duration: 0.09, volume: 0.17, type: 'triangle' },
            { frequency: 659.25, duration: 0.09, volume: 0.17, type: 'triangle' },
            { frequency: 1046.5, duration: 0.14, volume: 0.20, type: 'square'   },
            { frequency: 1046.5, duration: 0.30, volume: 0.22, type: 'square'   },
          ]);
          // Simulated reverb: quieter echo offset by 70ms
          const ctx = this.ctx;
          const sfxGain = this.sfxGain;
          const echoNotes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 1046.5, 1046.5];
          const spacing = 0.09 * 0.72;
          echoNotes.forEach((freq, i) => {
            const start = ctx.currentTime + 0.07 + i * spacing;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            g.gain.setValueAtTime(0.0001, start);
            g.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
            osc.connect(g);
            g.connect(sfxGain);
            osc.start(start);
            osc.stop(start + 0.11);
          });
        },

        // Descending slide 300→200 Hz with vibrato (LFO)
        undo: () => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          lfo.frequency.value = 12;  // vibrato rate Hz
          lfoGain.gain.value = 9;    // vibrato depth Hz
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.32, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          lfo.start(now); lfo.stop(now + 0.17);
          osc.start(now); osc.stop(now + 0.17);
        },

        // Box lands on goal: low thunk + high chime
        boxOnGoal: () => {
          this.playTone({ frequency: 150, type: 'square',   duration: 0.06, volume: 0.48 });
          this.playTone({ frequency: 880, type: 'triangle', duration: 0.22, volume: 0.16 });
        },

        ui: () => this.playTone({ frequency: 520, type: 'square', duration: 0.04, volume: 0.1 }),
      };

      actions[type]?.();
    },

    startBgm() {
      if (!this.ctx || this.started) {
        return;
      }
      this.started = true;

      // Tempo speeds up with level; floor at 250ms
      const levelIndex = (typeof state !== 'undefined' && state.levelIndex) ? state.levelIndex : 0;
      const tempo = Math.max(250, 430 - levelIndex * 8);

      const tick = () => {
        if (!this.unlocked || !this.ctx) {
          return;
        }

        const step = this.pattern[this.noteIndex % this.pattern.length];
        this.noteIndex += 1;

        // Bass voice
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

        // Harmony: major third above bass (~1.26x)
        const harmOsc = this.ctx.createOscillator();
        const harmGain = this.ctx.createGain();
        harmOsc.type = 'triangle';
        harmOsc.frequency.setValueAtTime(step.bass * 1.26, this.ctx.currentTime);
        harmGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        harmGain.gain.exponentialRampToValueAtTime(0.022, this.ctx.currentTime + 0.02);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.38);
        harmOsc.connect(harmGain);
        harmGain.connect(this.bgmGain);
        harmOsc.start();
        harmOsc.stop(this.ctx.currentTime + 0.40);

        // Lead melody (every other step)
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
          leadOsc.stop(this.ctx.currentTime + 0.2);
        }

        // Percussion: noise burst every 4 steps
        if (this.noteIndex % 4 === 0) {
          this.playNoise({ duration: 0.04, volume: 0.14, highpass: 2500 });
        }
      };

      tick();
      this.loopId = window.setInterval(tick, tempo);
    },
  };

  return manager;
}
