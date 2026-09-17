import { DEFAULT_VOICE, sampleUrl, voiceById, type SynthVoice, type VoiceId } from './voices'

/**
 * The player's sounds, all on one Web Audio clock: a synthesized click with
 * an accented downbeat, and a guitar voice for playing the line along — a
 * plucked-string model rendered per pitch, or a sampled instrument fetched
 * per pitch with the model standing in until it arrives. Everything is
 * scheduled at an absolute context time so a busy main thread never smears
 * the pulse; the transport decides the times.
 */

/** The subset of AudioContext the engine drives (a test seam). */
export interface EngineAudioContext {
  readonly currentTime: number
  readonly state: AudioContextState
  readonly sampleRate: number
  readonly destination: AudioDestinationNode
  resume(): Promise<void>
  close(): Promise<void>
  createOscillator(): OscillatorNode
  createGain(): GainNode
  createBiquadFilter(): BiquadFilterNode
  createWaveShaper(): WaveShaperNode
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer
  createBufferSource(): AudioBufferSourceNode
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>
}

export interface PlayerAudio {
  /** Seconds on the audio clock — frozen while the context is suspended. */
  readonly now: number
  readonly state: AudioContextState
  resume(): Promise<void>
  click(time: number, accent: boolean): void
  /** A guitar note at a MIDI pitch, released after `seconds`. */
  pluck(time: number, midi: number, seconds: number, gain: number): void
  /** Choose the guitar voice for plucks from now on. */
  setVoice(voice: VoiceId): void
  /** Get the voice ready for these pitches (loads samples); safe to call often. */
  prime(midis: readonly number[]): void
  /** Silence everything, sounding or scheduled. */
  silence(): void
  /** Silence only what is scheduled to start at or after `time`. */
  cancelFrom(time: number): void
  dispose(): void
}

interface EngineOptions {
  createContext?: () => EngineAudioContext
  /** How sample recordings are fetched (a test seam). */
  fetchSample?: (url: string) => Promise<ArrayBuffer>
  voice?: VoiceId
}

const CLICK_SECONDS = 0.07
const PLUCK_RENDER_SECONDS = 3
const PLUCK_RELEASE_SECONDS = 0.09

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/**
 * An amp's transfer curve: soft clipping that gets harder with `drive`.
 * Symmetric tanh, so a clean signal passes through the middle untouched.
 */
export function driveCurve(drive: number, samples = 1024): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(samples * 4))
  const gain = 1 + drive * 24
  for (let i = 0; i < samples; i += 1) {
    const x = (i / (samples - 1)) * 2 - 1
    curve[i] = Math.tanh(x * gain) / Math.tanh(gain)
  }
  return curve
}

/**
 * Extended Karplus–Strong: a smoothed noise burst, comb-filtered by where
 * the string is plucked, fed into a delay line whose loop filter blends the
 * last two samples (the string's loss) and loses a little every trip round.
 * The per-trip loss is set from the voice's decay time so every pitch fades
 * over about the same seconds, rather than high notes dying first.
 */
export function renderPluck(
  target: Float32Array,
  frequency: number,
  sampleRate: number,
  voice: Pick<SynthVoice, 'decaySeconds' | 'blend' | 'pickPosition' | 'excitationSmoothing'>,
  seed = 1,
): void {
  const period = Math.max(Math.round(sampleRate / frequency), 2)
  // 60 dB down after decaySeconds: that many trips round the loop.
  const decay = 0.001 ** (1 / Math.max(voice.decaySeconds * frequency, 1))
  const line = new Float32Array(period)
  // A deterministic burst (LCG) so the same pitch always renders alike.
  let state = seed >>> 0 || 1
  let smoothed = 0
  for (let i = 0; i < period; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const noise = state / 0xffffffff - 0.5
    smoothed = voice.excitationSmoothing * smoothed + (1 - voice.excitationSmoothing) * noise
    line[i] = smoothed
  }
  // Pick position: cancel the harmonics with a node at the pluck point.
  const pickDelay = Math.min(Math.max(Math.round(voice.pickPosition * period), 1), period - 1)
  const excited = new Float32Array(period)
  for (let i = 0; i < period; i += 1) {
    excited[i] = line[i] - (i >= pickDelay ? line[i - pickDelay] : 0)
  }
  line.set(excited)

  const { blend } = voice
  let index = 0
  let previous = line[period - 1]
  let peak = 0
  for (let i = 0; i < target.length; i += 1) {
    const current = line[index]
    const sample = decay * ((1 - blend) * current + blend * previous)
    target[i] = sample
    line[index] = sample
    previous = current
    index = (index + 1) % period
    if (Math.abs(sample) > peak) peak = Math.abs(sample)
  }
  if (peak > 0) {
    const normalize = 0.8 / peak
    for (let i = 0; i < target.length; i += 1) target[i] *= normalize
  }
}

export function createPlayerAudio({
  createContext = () => new AudioContext(),
  fetchSample = async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Sample ${url}: HTTP ${response.status}`)
    return response.arrayBuffer()
  },
  voice: initialVoice = DEFAULT_VOICE,
}: EngineOptions = {}): PlayerAudio {
  const ctx = createContext()
  let disposed = false
  let voiceId: VoiceId = initialVoice
  const synthCache = new Map<string, AudioBuffer>()
  const curveCache = new Map<number, Float32Array<ArrayBuffer>>()
  const sampleCache = new Map<string, AudioBuffer>()
  const sampleLoads = new Map<string, Promise<void>>()
  const scheduled = new Map<AudioScheduledSourceNode, number>()

  function remember(source: AudioScheduledSourceNode, start: number, end: number): void {
    scheduled.set(source, start)
    source.onended = () => scheduled.delete(source)
    source.stop(end)
  }

  function synthBuffer(voice: SynthVoice, midi: number): AudioBuffer {
    const key = `${voice.id}:${midi}`
    const cached = synthCache.get(key)
    if (cached) return cached
    const buffer = ctx.createBuffer(1, Math.round(PLUCK_RENDER_SECONDS * ctx.sampleRate), ctx.sampleRate)
    renderPluck(buffer.getChannelData(0), midiToFrequency(midi), ctx.sampleRate, voice, midi)
    synthCache.set(key, buffer)
    return buffer
  }

  function loadSample(instrument: string, midi: number): void {
    const url = sampleUrl(instrument, midi)
    if (sampleCache.has(url) || sampleLoads.has(url)) return
    const load = fetchSample(url)
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        if (!disposed) sampleCache.set(url, buffer)
      })
      .catch(() => {
        // The synth keeps standing in for this pitch; try again on the next prime.
        sampleLoads.delete(url)
      })
    sampleLoads.set(url, load)
  }

  function assertLive(): void {
    if (disposed) throw new Error('Player audio was disposed')
  }

  /** The buffer, tone and body for a pitch under the current voice. */
  function resolve(midi: number): { buffer: AudioBuffer; synth: SynthVoice | null; level: number } {
    const voice = voiceById(voiceId)
    if (voice.kind === 'sampled') {
      const sample = sampleCache.get(sampleUrl(voice.instrument, midi))
      if (sample) return { buffer: sample, synth: null, level: voice.level }
      loadSample(voice.instrument, midi)
      const fallback = voiceById(voice.fallback)
      const synth = fallback.kind === 'synth' ? fallback : (voiceById('nylon') as SynthVoice)
      return { buffer: synthBuffer(synth, midi), synth, level: synth.level }
    }
    return { buffer: synthBuffer(voice, midi), synth: voice, level: voice.level }
  }

  return {
    get now() {
      return ctx.currentTime
    },
    get state() {
      return ctx.state
    },
    resume() {
      assertLive()
      return ctx.resume()
    },
    click(time, accent) {
      assertLive()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(accent ? 1200 : 880, time)
      gain.gain.setValueAtTime(0.0001, time)
      gain.gain.exponentialRampToValueAtTime(accent ? 0.24 : 0.16, time + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(time)
      remember(oscillator, time, time + CLICK_SECONDS)
    },
    pluck(time, midi, seconds, gainLevel) {
      assertLive()
      const { buffer, synth, level } = resolve(midi)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      let head: AudioNode = source
      if (synth) {
        // Amp, tone and body only shape the model; recordings already carry theirs.
        if (synth.drive) {
          const amp = ctx.createWaveShaper()
          let curve = curveCache.get(synth.drive)
          if (!curve) {
            curve = driveCurve(synth.drive)
            curveCache.set(synth.drive, curve)
          }
          amp.curve = curve
          amp.oversample = '2x'
          head.connect(amp)
          head = amp
        }
        const tone = ctx.createBiquadFilter()
        tone.type = 'lowpass'
        tone.frequency.setValueAtTime(synth.toneHz, time)
        tone.Q.setValueAtTime(0.7, time)
        head.connect(tone)
        head = tone
        for (const resonance of synth.body) {
          const peak = ctx.createBiquadFilter()
          peak.type = 'peaking'
          peak.frequency.setValueAtTime(resonance.frequency, time)
          peak.Q.setValueAtTime(resonance.q, time)
          peak.gain.setValueAtTime(resonance.gainDb, time)
          head.connect(peak)
          head = peak
        }
      }
      const gain = ctx.createGain()
      const release = time + Math.max(seconds, 0.05)
      const amount = gainLevel * level
      gain.gain.setValueAtTime(amount, time)
      gain.gain.setValueAtTime(amount, release)
      gain.gain.linearRampToValueAtTime(0.0001, release + PLUCK_RELEASE_SECONDS)
      head.connect(gain)
      gain.connect(ctx.destination)
      source.start(time)
      remember(source, time, release + PLUCK_RELEASE_SECONDS)
    },
    setVoice(next) {
      voiceId = next
    },
    prime(midis) {
      if (disposed) return
      const voice = voiceById(voiceId)
      if (voice.kind !== 'sampled') return
      for (const midi of new Set(midis)) loadSample(voice.instrument, midi)
    },
    silence() {
      for (const source of scheduled.keys()) stopQuietly(source)
      scheduled.clear()
    },
    cancelFrom(time) {
      for (const [source, start] of scheduled) {
        if (start >= time) {
          stopQuietly(source)
          scheduled.delete(source)
        }
      }
    },
    dispose() {
      if (disposed) return
      this.silence()
      disposed = true
      void ctx.close()
    },
  }
}

function stopQuietly(source: AudioScheduledSourceNode): void {
  try {
    source.stop()
  } catch {
    // Never started or already stopped — nothing to silence.
  }
}
