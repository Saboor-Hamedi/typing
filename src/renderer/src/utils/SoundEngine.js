/**
 * SoundEngine - Premium Physical Modeling Synthesis for Typing
 * Simulates mechanical keyboard acoustics using multi-layered synthesis
 */
class SoundEngine {
  constructor() {
    this.audioCtx = null
    this.profile = 'asmr'
    this.hallEffect = true
    this.masterGain = null
    this.reverbNode = null
    this.plateNode = null
    this.limiter = null
    this.noiseBuffer = null // Pre-generated common noise
  }

  /**
   * Premium Signal Chain initialization
   */
  init() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume()
      return
    }

    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive'
      })

      // 1. Limiter (Prevents digital clipping, adds "punch")
      this.limiter = this.audioCtx.createDynamicsCompressor()
      this.limiter.threshold.setValueAtTime(-8, this.audioCtx.currentTime)
      this.limiter.ratio.setValueAtTime(12, this.audioCtx.currentTime)
      this.limiter.attack.setValueAtTime(0.003, this.audioCtx.currentTime)
      this.limiter.release.setValueAtTime(0.05, this.audioCtx.currentTime)

      // 2. Master Gain
      this.masterGain = this.audioCtx.createGain()
      this.masterGain.gain.setValueAtTime(1.2, this.audioCtx.currentTime)

      // 3. Routing
      this.limiter.connect(this.audioCtx.destination)
      this.masterGain.connect(this.limiter)

      // 4. Spatial Modeling & Pre-gen
      this.createRoomReverb()
      this.createPlateResonance()
      this.precomputeNoise()

      // Zero-latency kickstart: Play a silent click to wake up hardware
      this.kickstart()
    } catch (e) {
      console.warn('SoundEngine: Failed to reach audio hardware.', e)
    }
  }

  warmUp() {
    this.init()
  }

  kickstart() {
    if (!this.audioCtx) return
    const g = this.audioCtx.createGain()
    g.gain.value = 0
    const osc = this.audioCtx.createOscillator()
    osc.connect(g)
    g.connect(this.audioCtx.destination)
    osc.start(0)
    osc.stop(this.audioCtx.currentTime + 0.1)
  }

  precomputeNoise() {
    const duration = 2.0 // 2 seconds of noise
    const size = this.audioCtx.sampleRate * duration
    this.noiseBuffer = this.audioCtx.createBuffer(1, size, this.audioCtx.sampleRate)
    const out = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < size; i++) out[i] = Math.random() * 2 - 1
  }

  createRoomReverb() {
    const length = this.audioCtx.sampleRate * 1.8
    const impulse = this.audioCtx.createBuffer(2, length, this.audioCtx.sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 4.5)
      const comb = Math.sin(i * 0.01) * 0.2
      left[i] = (Math.random() * 2 - 1 + comb) * decay
      right[i] = (Math.random() * 2 - 1 + comb) * decay
    }

    this.reverbNode = this.audioCtx.createConvolver()
    this.reverbNode.buffer = impulse

    this.reverbGain = this.audioCtx.createGain()
    this.reverbGain.gain.setValueAtTime(0.15, this.audioCtx.currentTime)

    this.reverbNode.connect(this.reverbGain)
    this.reverbGain.connect(this.masterGain)
  }

  createPlateResonance() {
    const length = this.audioCtx.sampleRate * 0.08
    const impulse = this.audioCtx.createBuffer(2, length, this.audioCtx.sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 2)
      left[i] = (Math.random() * 2 - 1) * decay * 0.3
      right[i] = (Math.random() * 2 - 1) * decay * 0.3
    }

    this.plateNode = this.audioCtx.createConvolver()
    this.plateNode.buffer = impulse
    this.plateGain = this.audioCtx.createGain()
    this.plateGain.gain.setValueAtTime(0.4, this.audioCtx.currentTime)

    this.plateNode.connect(this.plateGain)
    this.plateGain.connect(this.masterGain)
  }

  setProfile(profile) {
    this.profile = profile
  }
  setHallEffect(enabled) {
    this.hallEffect = enabled
  }

  /**
   * Optimized: Reuses pre-computed noise buffer with random offset
   */
  getNoiseSource() {
    if (!this.noiseBuffer) this.precomputeNoise()
    const source = this.audioCtx.createBufferSource()
    source.buffer = this.noiseBuffer
    source.loop = true
    // Randomize start position for variation
    const offset = Math.random() * (source.buffer.duration - 0.5)
    return { source, offset }
  }

  playKeySound(type = 'key') {
    this.init()
    if (!this.audioCtx) return

    const now = this.audioCtx.currentTime
    const s = this.getProfileSettings()

    const pitch = 1 + (Math.random() - 0.5) * 0.06
    const velocity = 0.95 + Math.random() * 0.05
    const panVal = (Math.random() - 0.5) * 0.45

    const panner = this.audioCtx.createStereoPanner()
    panner.pan.setValueAtTime(panVal, now)
    panner.connect(this.masterGain)
    panner.connect(this.plateNode)
    if (this.hallEffect) panner.connect(this.reverbNode)

    const voiceGain = this.audioCtx.createGain()
    voiceGain.gain.setValueAtTime(velocity, now)
    voiceGain.connect(panner)

    const bodyFreqMod = type === 'space' ? 0.6 : type === 'backspace' ? 1.2 : 1.0
    const volumeMod = type === 'space' ? 1.5 : type === 'backspace' ? 0.9 : 1.0

    // --- LAYER 1: The "Body" ---
    const body = this.audioCtx.createOscillator()
    const bGain = this.audioCtx.createGain()
    body.type = s.bodyType
    body.frequency.setValueAtTime(s.bodyFreq * bodyFreqMod * pitch, now)
    body.frequency.exponentialRampToValueAtTime(s.bodyFreq * 0.6, now + s.bodyDecay)
    bGain.gain.setValueAtTime(s.bodyGain * volumeMod, now)
    bGain.gain.exponentialRampToValueAtTime(0.001, now + s.bodyDecay)
    body.connect(bGain)
    bGain.connect(voiceGain)

    // --- LAYER 2: The "Impact" (Optimized with reused buffer) ---
    const { source: noise, offset } = this.getNoiseSource()
    const nFilter = this.audioCtx.createBiquadFilter()
    const nGain = this.audioCtx.createGain()
    nFilter.type = s.noiseFilter
    nFilter.frequency.setValueAtTime(s.noiseFreq, now)
    nGain.gain.setValueAtTime(s.noiseGain * volumeMod, now)
    nGain.gain.exponentialRampToValueAtTime(0.001, now + s.noiseDecay)
    noise.connect(nFilter)
    nFilter.connect(nGain)
    nGain.connect(voiceGain)

    // --- LAYER 3: Stabilizer ---
    if (type === 'space') {
      const stab = this.audioCtx.createOscillator()
      const sGain = this.audioCtx.createGain()
      stab.type = 'triangle'
      stab.frequency.setValueAtTime(2400 * pitch, now)
      sGain.gain.setValueAtTime(0.04, now)
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      stab.connect(sGain)
      sGain.connect(voiceGain)
      stab.start(now)
      stab.stop(now + 0.05)
    }

    // --- LAYER 4: Switch Click ---
    if (s.clickGain > 0) {
      const click = this.audioCtx.createOscillator()
      const cGain = this.audioCtx.createGain()
      click.type = 'square'
      click.frequency.setValueAtTime(s.clickFreq * pitch, now)
      cGain.gain.setValueAtTime(s.clickGain, now)
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015)
      click.connect(cGain)
      cGain.connect(voiceGain)
      click.start(now)
      click.stop(now + 0.02)
    }

    body.start(now)
    noise.start(now, offset)
    body.stop(now + s.bodyDecay + 0.1)
    noise.stop(now + s.noiseDecay + 0.1)
  }

  getProfileSettings() {
    const p = {
      thocky: {
        bodyType: 'sine',
        bodyFreq: 130,
        bodyDecay: 0.16,
        bodyGain: 0.8,
        noiseFreq: 300,
        noiseDecay: 0.09,
        noiseGain: 0.35,
        noiseFilter: 'lowpass',
        clickGain: 0
      },
      creamy: {
        bodyType: 'triangle',
        bodyFreq: 280,
        bodyDecay: 0.11,
        bodyGain: 0.5,
        noiseFreq: 1200,
        noiseDecay: 0.07,
        noiseGain: 0.3,
        noiseFilter: 'bandpass',
        clickGain: 0
      },
      clicky: {
        bodyType: 'square',
        bodyFreq: 600,
        bodyDecay: 0.05,
        bodyGain: 0.2,
        noiseFreq: 3200,
        noiseDecay: 0.03,
        noiseGain: 0.4,
        noiseFilter: 'highpass',
        clickFreq: 4200,
        clickGain: 0.15
      },
      asmr: {
        bodyType: 'sine',
        bodyFreq: 95,
        bodyDecay: 0.24,
        bodyGain: 0.75,
        noiseFreq: 1500,
        noiseDecay: 0.12,
        noiseGain: 0.55,
        noiseFilter: 'bandpass',
        clickGain: 0
      },
      wood: {
        bodyType: 'triangle',
        bodyFreq: 175,
        bodyDecay: 0.13,
        bodyGain: 0.7,
        noiseFreq: 550,
        noiseDecay: 0.06,
        noiseGain: 0.4,
        noiseFilter: 'bandpass',
        clickGain: 0
      },
      raindrop: {
        bodyFreq: 1800,
        bodyDecay: 0.05,
        bodyGain: 0.3,
        bodyType: 'sine',
        noiseFreq: 4500,
        noiseDecay: 0.02,
        noiseGain: 0.2,
        noiseFilter: 'highpass',
        clickGain: 0
      },
      velvet: {
        bodyType: 'sine',
        bodyFreq: 75,
        bodyDecay: 0.28,
        bodyGain: 0.9,
        noiseFreq: 200,
        noiseDecay: 0.15,
        noiseGain: 0.4,
        noiseFilter: 'lowpass',
        clickGain: 0
      },
      zen: {
        bodyType: 'sine',
        bodyFreq: 440,
        bodyDecay: 0.1,
        bodyGain: 0.6,
        noiseFreq: 2200,
        noiseDecay: 0.3,
        noiseGain: 0.3,
        noiseFilter: 'bandpass',
        clickGain: 0
      },
      paper: {
        bodyType: 'triangle',
        bodyFreq: 120,
        bodyDecay: 0.05,
        bodyGain: 0.5,
        noiseFreq: 1800,
        noiseDecay: 0.06,
        noiseGain: 0.7,
        noiseFilter: 'highpass',
        clickGain: 0
      }
    }
    return p[this.profile] || p.thocky
  }
}

export const soundEngine = new SoundEngine()
