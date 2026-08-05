// ============================================================
// AUDIO — all sounds are synthesized with the WebAudio API.
// No external audio files, so there is nothing to license and
// the sim starts instantly.
// ============================================================
export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  // Must be called after a user gesture (browser autoplay policy).
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);

    // --- engine drone: two detuned oscillators + noise for jet hiss ---
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.0001;
    this.engineGain.connect(this.master);

    this.osc1 = ctx.createOscillator(); this.osc1.type = "sawtooth"; this.osc1.frequency.value = 60;
    this.osc2 = ctx.createOscillator(); this.osc2.type = "sawtooth"; this.osc2.frequency.value = 61.5;
    const oscFilter = ctx.createBiquadFilter(); oscFilter.type = "lowpass"; oscFilter.frequency.value = 900;
    this.oscFilter = oscFilter;
    this.osc1.connect(oscFilter); this.osc2.connect(oscFilter); oscFilter.connect(this.engineGain);
    this.osc1.start(); this.osc2.start();

    // wind noise
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer; this.windSource.loop = true;
    this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = "bandpass"; this.windFilter.frequency.value = 500;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.0001;
    this.windSource.connect(this.windFilter); this.windFilter.connect(this.windGain); this.windGain.connect(this.master);
    this.windSource.start();

    // stall warning oscillator (triggered)
    this.warnGain = ctx.createGain(); this.warnGain.gain.value = 0;
    this.warnOsc = ctx.createOscillator(); this.warnOsc.type = "square"; this.warnOsc.frequency.value = 320;
    this.warnOsc.connect(this.warnGain); this.warnGain.connect(this.master); this.warnOsc.start();

    this.enabled = true;
  }

  update(dt, { throttle, airspeedKt, onGround, stalled, propeller }) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const baseFreq = propeller ? 45 + throttle * 90 : 55 + throttle * 220;
    this.osc1.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.osc2.frequency.setTargetAtTime(baseFreq * 1.01, t, 0.08);
    this.oscFilter.frequency.setTargetAtTime(600 + throttle * 2600, t, 0.1);
    this.engineGain.gain.setTargetAtTime(0.05 + throttle * 0.22, t, 0.15);

    const windLevel = Math.min(0.22, (airspeedKt / 500) * 0.22);
    this.windGain.gain.setTargetAtTime(0.02 + windLevel, t, 0.2);
    this.windFilter.frequency.setTargetAtTime(300 + airspeedKt * 4, t, 0.2);

    this.warnGain.gain.setTargetAtTime(stalled ? 0.12 : 0, t, 0.05);
    if (stalled) this.warnOsc.frequency.setTargetAtTime(280 + Math.sin(t * 8) * 40, t, 0.02);
  }

  blip(freq = 500, dur = 0.08, type = "sine", vol = 0.18) {
    if (!this.enabled) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = vol;
    o.connect(g); g.connect(this.master);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur + 0.02);
  }

  gearSound() { this.blip(140, 0.35, "square", 0.15); }
  flapSound() { this.blip(260, 0.15, "triangle", 0.1); }
  clickSound() { this.blip(700, 0.05, "square", 0.08); }
}
