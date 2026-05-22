// Brennan's Soccer Showdown - Audio System
// Web Audio API synthesized sound effects

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.crowdGain = null;
    this.crowdSource = null;
    this.masterGain = null;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Whistle sound
  playWhistle(long = false) {
    if (!this.ctx || !this.enabled) return;
    const duration = long ? 1.5 : 0.4;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(2800, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Ball kick sound
  playKick(power = 0.5) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const noise = this.createNoise(0.08);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 + power * 200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2 * power, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    noise.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Goal celebration sound
  playGoal() {
    if (!this.ctx || !this.enabled) return;
    this.playWhistle(true);
    // Fanfare
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }, 300 + i * 200);
    });
  }

  // Crowd noise (continuous)
  startCrowd() {
    if (!this.ctx || !this.enabled) return;
    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0.04;

    // Brown noise for crowd ambience
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }

    this.crowdSource = this.ctx.createBufferSource();
    this.crowdSource.buffer = buffer;
    this.crowdSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    this.crowdSource.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdGain.connect(this.masterGain);
    this.crowdSource.start();
  }

  setCrowdVolume(vol) {
    if (this.crowdGain) {
      this.crowdGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);
    }
  }

  stopCrowd() {
    if (this.crowdSource) {
      this.crowdSource.stop();
      this.crowdSource = null;
    }
  }

  // Crowd cheer (burst)
  playCheer() {
    if (!this.ctx || !this.enabled) return;
    this.setCrowdVolume(0.15);
    setTimeout(() => this.setCrowdVolume(0.04), 3000);
  }

  // Bounce/post hit
  playBounce() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Tackle sound
  playTackle() {
    if (!this.ctx || !this.enabled) return;
    this.createNoise(0.12).connect(this.masterGain);
  }

  createNoise(duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;
    source.connect(gain);
    source.start();
    source.stop(this.ctx.currentTime + duration);
    return gain;
  }

  // Menu select sound
  playSelect() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playNavigate() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? 0.5 : 0;
    }
    return this.enabled;
  }
}

const audio = new AudioSystem();
