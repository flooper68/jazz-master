/**
 * The player's metronome: a synthesized click on every beat at the exercise
 * tempo, with an accented downbeat every four beats. No samples, no network —
 * two oscillator envelopes on the Web Audio clock, scheduled a little ahead of
 * time so a busy main thread never smears the pulse.
 */

export interface ClickTrack {
  /** Start clicking at `tempoBpm`; a running track restarts from beat one. */
  start(tempoBpm: number): void
  stop(): void
  readonly playing: boolean
  /** Release the audio context; the track cannot be started again. */
  dispose(): void
}

/** The subset of AudioContext the click track drives (a test seam). */
export interface ClickAudioContext {
  readonly currentTime: number
  readonly state: AudioContextState
  resume(): Promise<void>
  close(): Promise<void>
  createOscillator(): OscillatorNode
  createGain(): GainNode
  readonly destination: AudioDestinationNode
}

interface ClickTrackOptions {
  createContext?: () => ClickAudioContext
  /** Scheduler tick, ms. */
  intervalMs?: number
  /** How far ahead of the clock beats are queued, seconds. */
  lookaheadSeconds?: number
  setInterval?: typeof globalThis.setInterval
  clearInterval?: typeof globalThis.clearInterval
}

export const BEATS_PER_BAR = 4
const CLICK_LENGTH_SECONDS = 0.07

/** Beat indices from `nextBeat` whose time (seconds from beat 0) falls before the horizon. */
export function beatsDue(
  tempoBpm: number,
  nextBeat: number,
  untilSeconds: number,
): number[] {
  if (!Number.isFinite(tempoBpm) || tempoBpm <= 0) {
    throw new Error(`Invalid tempo BPM: ${tempoBpm}`)
  }
  const secondsPerBeat = 60 / tempoBpm
  const due: number[] = []
  for (let beat = nextBeat; beat * secondsPerBeat < untilSeconds; beat += 1) {
    due.push(beat)
  }
  return due
}

export function createClickTrack({
  createContext = () => new AudioContext(),
  intervalMs = 25,
  lookaheadSeconds = 0.1,
  setInterval = globalThis.setInterval.bind(globalThis),
  clearInterval = globalThis.clearInterval.bind(globalThis),
}: ClickTrackOptions = {}): ClickTrack {
  let context: ClickAudioContext | null = null
  let disposed = false
  let timer: ReturnType<typeof setInterval> | null = null
  let startAt = 0
  let nextBeat = 0
  let secondsPerBeat = 1
  // Bumped on every start/stop so a late resume() cannot revive a stopped run.
  let generation = 0
  const queued = new Map<OscillatorNode, number>()

  function scheduleBeat(ctx: ClickAudioContext, beat: number): void {
    const time = startAt + beat * secondsPerBeat
    const accent = beat % BEATS_PER_BAR === 0
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
    oscillator.stop(time + CLICK_LENGTH_SECONDS)
    queued.set(oscillator, time + CLICK_LENGTH_SECONDS)
  }

  function tick(): void {
    if (!context) return
    const now = context.currentTime
    for (const [oscillator, end] of queued) {
      if (end < now) queued.delete(oscillator)
    }
    // A throttled background tab can wake up beats behind the clock: skip
    // them rather than firing the whole backlog at once.
    const elapsed = now - startAt
    if (nextBeat * secondsPerBeat < elapsed) {
      nextBeat = Math.ceil(elapsed / secondsPerBeat)
    }
    const horizon = now + lookaheadSeconds - startAt
    for (const beat of beatsDue(60 / secondsPerBeat, nextBeat, horizon)) {
      scheduleBeat(context, beat)
      nextBeat = beat + 1
    }
  }

  function stop(): void {
    generation += 1
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    // Silence beats already queued inside the lookahead window.
    for (const oscillator of queued.keys()) {
      try {
        oscillator.stop()
      } catch {
        // Already stopped; nothing to silence.
      }
    }
    queued.clear()
  }

  function run(ctx: ClickAudioContext): void {
    // A short lead-in so the first beat is not already in the past.
    startAt = ctx.currentTime + 0.05
    nextBeat = 0
    tick()
    timer = setInterval(tick, intervalMs)
  }

  return {
    get playing() {
      return timer !== null
    },
    start(tempoBpm) {
      if (disposed) throw new Error('Click track was disposed')
      if (!Number.isFinite(tempoBpm) || tempoBpm <= 0) {
        throw new Error(`Invalid tempo BPM: ${tempoBpm}`)
      }
      stop()
      const ctx = (context ??= createContext())
      secondsPerBeat = 60 / tempoBpm
      if (ctx.state === 'running') {
        run(ctx)
        return
      }
      // The clock is frozen while suspended; anchor the first beat only once
      // the context is actually running, and only if nothing stopped it since.
      const started = generation
      void ctx.resume().then(() => {
        if (generation === started && !disposed) run(ctx)
      })
    },
    stop,
    dispose() {
      stop()
      disposed = true
      const ctx = context
      context = null
      if (ctx) void ctx.close()
    },
  }
}
