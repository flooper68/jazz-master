/**
 * The player's sounds, all on one Web Audio clock: a synthesized click with
 * an accented downbeat, and a plucked string (Karplus–Strong, rendered into
 * a buffer per pitch) for playing the line along. No samples, no network.
 * Everything is scheduled at an absolute context time so a busy main thread
 * never smears the pulse; the transport decides the times.
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
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer
  createBufferSource(): AudioBufferSourceNode
}

export interface PlayerAudio {
  /** Seconds on the audio clock — frozen while the context is suspended. */
  readonly now: number
  readonly state: AudioContextState
  resume(): Promise<void>
  click(time: number, accent: boolean): void
  /** A plucked string at a MIDI pitch, released after `seconds`. */
  pluck(time: number, midi: number, seconds: number, gain: number): void
  /** Silence everything, sounding or scheduled. */
  silence(): void
  /** Silence only what is scheduled to start at or after `time`. */
  cancelFrom(time: number): void
  dispose(): void
}

interface EngineOptions {
  createContext?: () => EngineAudioContext
}

const CLICK_SECONDS = 0.07
const PLUCK_RENDER_SECONDS = 2.5
const PLUCK_RELEASE_SECONDS = 0.08

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/**
 * Karplus–Strong: a burst of noise through a delay line with a two-point
 * average, which decays into a plucked-string tone at the delay's pitch.
 */
export function renderPluck(
  target: Float32Array,
  frequency: number,
  sampleRate: number,
  seed = 1,
): void {
  const period = Math.max(Math.round(sampleRate / frequency), 2)
  const line = new Float32Array(period)
  // A deterministic burst (LCG) so the same pitch always renders alike.
  let state = seed >>> 0 || 1
  for (let i = 0; i < period; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    line[i] = state / 0xffffffff - 0.5
  }
  // Slightly less than lossless, so the tone rings but does settle.
  const decay = 0.996
  let index = 0
  for (let i = 0; i < target.length; i += 1) {
    const next = (index + 1) % period
    const sample = (line[index] + line[next]) * 0.5 * decay
    target[i] = sample
    line[index] = sample
    index = next
  }
}

export function createPlayerAudio({
  createContext = () => new AudioContext(),
}: EngineOptions = {}): PlayerAudio {
  const ctx = createContext()
  let disposed = false
  const pluckCache = new Map<number, AudioBuffer>()
  const scheduled = new Map<AudioScheduledSourceNode, number>()

  function remember(source: AudioScheduledSourceNode, start: number, end: number): void {
    scheduled.set(source, start)
    source.onended = () => scheduled.delete(source)
    source.stop(end)
  }

  function pluckBuffer(midi: number): AudioBuffer {
    const cached = pluckCache.get(midi)
    if (cached) return cached
    const buffer = ctx.createBuffer(1, Math.round(PLUCK_RENDER_SECONDS * ctx.sampleRate), ctx.sampleRate)
    renderPluck(buffer.getChannelData(0), midiToFrequency(midi), ctx.sampleRate, midi)
    pluckCache.set(midi, buffer)
    return buffer
  }

  function assertLive(): void {
    if (disposed) throw new Error('Player audio was disposed')
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
    pluck(time, midi, seconds, level) {
      assertLive()
      const source = ctx.createBufferSource()
      source.buffer = pluckBuffer(midi)
      const gain = ctx.createGain()
      const release = time + Math.max(seconds, 0.05)
      gain.gain.setValueAtTime(level, time)
      gain.gain.setValueAtTime(level, release)
      gain.gain.linearRampToValueAtTime(0.0001, release + PLUCK_RELEASE_SECONDS)
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(time)
      remember(source, time, release + PLUCK_RELEASE_SECONDS)
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
