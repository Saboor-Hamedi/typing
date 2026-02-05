/**
 * SoundEngine - Custom Web Audio API synthesis for typing sounds
 * Generates realistic mechanical keyboard sounds without external samples
 */
class SoundEngine {
  constructor() {
    this.audioCtx = null
    this.profile = 'asmr'
    this.hallEffect = true
    this.reverbNode = null
  }

  /**
   * Initialize AudioContext and reverb
   * Must be called after user interaction due to browser autoplay policies
   */
  init() {
    if (!this.audioCtx) {
      // Only create context if window is available and user interaction happened
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        this.createReverb()
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('AudioContext creation failed (silent if no gesture):', e)
        }
        return
      }
    }
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  /**
   * Pre-initialize audio context to avoid first-key lag
   * Should be called on first user interaction
   */
  warmUp() {
    this.init()
  }

  /**
   * Create convolution reverb for hall effect
   * Generates impulse response with exponential decay
   */
  createReverb() {
    const length = this.audioCtx.sampleRate * 2.5
    const impulse = this.audioCtx.createBuffer(2, length, this.audioCtx.sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 3)
      left[i] = (Math.random() * 2 - 1) * decay
      right[i] = (Math.random() * 2 - 1) * decay
    }

    this.reverbNode = this.audioCtx.createConvolver()
    this.reverbNode.buffer = impulse

    this.reverbGain = this.audioCtx.createGain()
    this.reverbGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime)
    
    this.reverbNode.connect(this.reverbGain)
    this.reverbGain.connect(this.audioCtx.destination)
  }

  /**
   * Set sound profile
   * @param {string} profile - 'thocky', 'creamy', or 'clicky'
   */
  setProfile(profile) {
    this.profile = profile
  }

  /**
   * Enable/disable hall effect reverb
   * @param {boolean} enabled - Whether to enable reverb
   */
  setHallEffect(enabled) {
    this.hallEffect = enabled
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

  /**
   * Play a synthesized mechanical key sound
   * @param {string} type - 'key', 'space', or 'backspace'
   */
  playKeySound(type = 'key') {
    this.init()
    if (!this.audioCtx) return
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }

    const now = this.audioCtx.currentTime
    
    // Add micro-randomness to pitch and gain for "organic" feel
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.05
    const volumeJitter = 1 + (Math.random() - 0.5) * 0.1

    const masterGain = this.audioCtx.createGain()
    masterGain.gain.setValueAtTime(0.8 * volumeJitter, now) 
    masterGain.connect(this.audioCtx.destination)
    
    if (this.hallEffect && this.reverbNode) {
        masterGain.connect(this.reverbNode)
    }

    // Sound profile definitions
    const settings = {
      thocky: {
        body: { type: 'sine', freq: 160, decay: 0.12, gain: 0.6 },
        low: { type: 'sine', freq: 80, decay: 0.15, gain: 0.8 },
        noise: { filter: 'lowpass', freq: 250, decay: 0.05, gain: 0.15 }
      },
      creamy: {
        body: { type: 'triangle', freq: 320, decay: 0.1, gain: 0.4 },
        low: { type: 'sine', freq: 120, decay: 0.12, gain: 0.3 },
        noise: { filter: 'bandpass', freq: 1200, decay: 0.04, gain: 0.1 }
      },
      clicky: {
        body: { type: 'square', freq: 1800, decay: 0.02, gain: 0.05 },
        low: { type: 'sine', freq: 400, decay: 0.06, gain: 0.15 },
        noise: { filter: 'highpass', freq: 3000, decay: 0.015, gain: 0.12 }
      },
      raindrop: {
        body: { type: 'sine', freq: 2200, decay: 0.04, gain: 0.08 },
        noise: { filter: 'highpass', freq: 5000, decay: 0.01, gain: 0.03 }
      },
      wood: {
        body: { type: 'triangle', freq: 180, decay: 0.1, gain: 0.5 },
        low: { type: 'sine', freq: 90, decay: 0.12, gain: 0.4 },
        noise: { filter: 'bandpass', freq: 400, decay: 0.04, gain: 0.15 }
      },
      asmr: {
        body: { type: 'sine', freq: 110, decay: 0.18, gain: 0.4 },
        low: { type: 'sine', freq: 55, decay: 0.25, gain: 0.6 },
        noise: { filter: 'lowpass', freq: 350, decay: 0.1, gain: 0.15 }
      }
    }

    const s = settings[this.profile] || settings.thocky
    
    // 1. Body Component
    const bodyOsc = this.audioCtx.createOscillator()
    const bodyGain = this.audioCtx.createGain()
    bodyOsc.type = s.body.type
    bodyOsc.frequency.setValueAtTime(s.body.freq * pitchJitter, now)
    bodyOsc.frequency.exponentialRampToValueAtTime(s.body.freq * 0.5, now + s.body.decay)
    bodyGain.gain.setValueAtTime(s.body.gain, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + s.body.decay)
    bodyOsc.connect(bodyGain)
    bodyGain.connect(masterGain)

    // 2. Low End Component
    if (s.low) {
      const lowOsc = this.audioCtx.createOscillator()
      const lowGain = this.audioCtx.createGain()
      lowOsc.type = s.low.type
      lowOsc.frequency.setValueAtTime(s.low.freq * pitchJitter, now)
      lowGain.gain.setValueAtTime(s.low.gain, now)
      lowGain.gain.exponentialRampToValueAtTime(0.001, now + s.low.decay)
      lowOsc.connect(lowGain)
      lowGain.connect(masterGain)
      lowOsc.start(now)
      lowOsc.stop(now + s.low.decay + 0.05)
    }

    // 3. Impact Noise
    const impactNoise = this.audioCtx.createBufferSource()
    impactNoise.buffer = this.getNoiseBuffer()
    const noiseFilter = this.audioCtx.createBiquadFilter()
    const noiseGain = this.audioCtx.createGain()
    noiseFilter.type = s.noise.filter
    noiseFilter.frequency.setValueAtTime(s.noise.freq, now)
    noiseGain.gain.setValueAtTime(s.noise.gain, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + s.noise.decay)
    
    impactNoise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(masterGain)

    // Modification for Spacebar (deeper, more resonance)
    if (type === 'space') {
      bodyOsc.frequency.setValueAtTime(s.body.freq * 0.6 * pitchJitter, now)
      masterGain.gain.setValueAtTime(1.2 * volumeJitter, now)
    }

    bodyOsc.start(now)
    impactNoise.start(now)
    bodyOsc.stop(now + s.body.decay + 0.05)
    impactNoise.stop(now + s.noise.decay + 0.05)
  }
}

export const soundEngine = new SoundEngine();
