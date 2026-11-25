// Web Audio API Synthesizer with Dynamic Engine RPM for TURBO DRIFT
(function (global) {
  class HighwayAudio {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.muted = false;
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineGain = null;
      this.engineFilter = null;
    }

    unlock() {
      if (!this.ctx) {
        const Ctx = global.AudioContext || global.webkitAudioContext;
        if (!Ctx) return;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.25;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(muted ? 0 : 0.25, this.ctx.currentTime, 0.02);
      }
    }

    startEngine() {
      this.unlock();
      if (!this.ctx || this.engineOsc1) return;
      const now = this.ctx.currentTime;

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(220, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0, now);

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = "sawtooth";
      this.engineOsc1.frequency.setValueAtTime(55, now);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = "triangle";
      this.engineOsc2.frequency.setValueAtTime(110, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.master);

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
    }

    updateEngine(speedKmh, boosting, active) {
      if (!this.ctx || !this.engineOsc1 || !this.engineGain) return;
      const now = this.ctx.currentTime;
      if (!active || this.muted) {
        this.engineGain.gain.setTargetAtTime(0, now, 0.08);
        return;
      }
      // Simulate realistic 6-speed gear shifts in RPM sawtooth curve
      const norm = Math.max(0, Math.min(1.4, speedKmh / 260));
      const gearProgress = (norm * 4.2) % 1;
      const baseFreq = 46 + norm * 32 + gearProgress * 38 + (boosting ? 22 : 0);
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.98, now, 0.05);
      this.engineFilter.frequency.setTargetAtTime(boosting ? 420 : 210 + norm * 120, now, 0.06);
      this.engineGain.gain.setTargetAtTime(boosting ? 0.14 : 0.085, now, 0.08);
    }

    _tone(type, f1, f2, dur, vol = 0.2, delay = 0) {
      if (this.muted || !this.ctx || !this.master) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, f1), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + dur);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    }

    _noise(dur, vol = 0.25) {
      if (this.muted || !this.ctx || !this.master) return;
      const count = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, count, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < count; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / count);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      src.connect(gain);
      gain.connect(this.master);
      src.start();
    }

    horn() {
      this._tone("sawtooth", 415, 410, 0.26, 0.14, 0);
      this._tone("sawtooth", 518, 512, 0.26, 0.12, 0);
    }

    jump() {
      this._tone("sine", 220, 680, 0.26, 0.16);
    }

    land() {
      this._noise(0.14, 0.2);
      this._tone("triangle", 130, 55, 0.14, 0.18);
    }

    click() {
      this._tone("triangle", 820, 520, 0.04, 0.12);
    }

    coin() {
      this._tone("sine", 987.77, 1318.51, 0.09, 0.14);
    }

    powerup() {
      this._tone("triangle", 523.25, 783.99, 0.08, 0.18, 0);
      this._tone("triangle", 783.99, 1046.5, 0.12, 0.18, 0.06);
    }

    nearMiss() {
      this._tone("sine", 420, 880, 0.08, 0.11);
    }

    crash() {
      this._noise(0.35, 0.36);
      this._tone("sawtooth", 160, 42, 0.32, 0.28);
    }

    shieldBreak() {
      this._tone("square", 620, 180, 0.22, 0.2);
    }

    gameOver() {
      [392, 349.23, 293.66, 220].forEach((f, idx) => {
        this._tone("sawtooth", f, f * 0.9, 0.2, 0.18, idx * 0.16);
      });
    }
  }

  global.HighwayAudio = HighwayAudio;
})(window);
