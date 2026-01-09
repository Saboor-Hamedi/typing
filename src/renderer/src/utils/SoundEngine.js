class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.profile = 'thocky'; 
    this.hallEffect = true; 
    this.reverbNode = null;
  }

  init() {
    if (!this.audioCtx) {
      // Only create context if window is available and user interaction happened
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.createReverb();
      } catch (e) {
        console.warn('AudioContext creation failed (silent if no gesture):', e);
        return;
      }
    }
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Pre-initialize everything to avoid first-key lag
  warmUp() {
    this.init();
  }

  createReverb() {
    const length = this.audioCtx.sampleRate * 2.5; 
    const impulse = this.audioCtx.createBuffer(2, length, this.audioCtx.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 3); 
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.reverbNode = this.audioCtx.createConvolver();
    this.reverbNode.buffer = impulse;

    this.reverbGain = this.audioCtx.createGain();
    this.reverbGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime); 
    
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.audioCtx.destination);
  }

  setProfile(profile) {
    this.profile = profile;
  }

  setHallEffect(enabled) {
    this.hallEffect = enabled;
  }

  getNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 0.08;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playKeySound(type = 'key') {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    
    // Add micro-randomness to pitch and gain for "organic" feel
    const jitter = (Math.random() - 0.5) * 0.05; 
    const volumeJitter = 1 + (Math.random() - 0.5) * 0.1;

    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(1.8 * volumeJitter, now); // Doubled loudness
    masterGain.connect(this.audioCtx.destination);
    
    if (this.hallEffect && this.reverbNode) {
        masterGain.connect(this.reverbNode);
    }

    // Components
    const bodyOsc = this.audioCtx.createOscillator();
    const bodyGain = this.audioCtx.createGain();

    const lowEndOsc = this.audioCtx.createOscillator();
    const lowEndGain = this.audioCtx.createGain();

    const impactNoise = this.audioCtx.createBufferSource();
    impactNoise.buffer = this.getNoiseBuffer();
    const noiseFilter = this.audioCtx.createBiquadFilter();
    const noiseGain = this.audioCtx.createGain();

    // Body Osc logic
    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterGain);

    lowEndOsc.connect(lowEndGain);
    lowEndGain.connect(masterGain);

    impactNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    if (this.profile === 'thocky') {
        // Satisfaction: Deep sub + muffled impact + micro-tail
        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(160 * (1 + jitter), now);
        bodyOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        bodyGain.gain.setValueAtTime(0.6, now); // Increased from 0.4
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        lowEndOsc.type = 'sine';
        lowEndOsc.frequency.setValueAtTime(80 * (1 + jitter), now);
        lowEndGain.gain.setValueAtTime(0.8, now); // Increased from 0.6
        lowEndGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(250, now);
        noiseGain.gain.setValueAtTime(0.12, now); // Increased from 0.08
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    } else if (this.profile === 'creamy') {
        // Satisfaction: Smooth, rounded, marble-like "pop"
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(320 * (1 + jitter), now);
        bodyOsc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        bodyGain.gain.setValueAtTime(0.2, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1000, now);
        noiseGain.gain.setValueAtTime(0.05, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    } else {
        // Best Clicky: Sharp, crisp, industrial
        bodyOsc.type = 'square';
        bodyOsc.frequency.setValueAtTime(1800 * (1 + jitter), now);
        bodyOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.02);
        bodyGain.gain.setValueAtTime(0.04, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        lowEndOsc.type = 'sine';
        lowEndOsc.frequency.setValueAtTime(250, now);
        lowEndGain.gain.setValueAtTime(0.1, now);
        lowEndGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    }

    if (type === 'space') {
        const spaceMod = 0.6;
        bodyOsc.frequency.setValueAtTime(100 * (1 + jitter), now);
        lowEndOsc.frequency.setValueAtTime(50 * (1 + jitter), now);
        bodyGain.gain.setValueAtTime(0.5, now);
        lowEndGain.gain.setValueAtTime(0.8, now);
    }

    bodyOsc.start(now);
    lowEndOsc.start(now);
    impactNoise.start(now);

    bodyOsc.stop(now + 0.2);
    lowEndOsc.stop(now + 0.2);
    impactNoise.stop(now + 0.2);
  }
}

export const soundEngine = new SoundEngine();
