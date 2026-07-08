import type { PositionedNote } from '@jazz-master/theory'
import type { Sampler as SmplrSampler, Storage as SmplrStorage } from 'smplr'
import { createFluidGuitarPreset } from './guitarSampler'
import { midiForPosition } from './notes'
import { PlayAlongScheduler, type ScheduledPlayAlongEvent } from './scheduler'
import {
  createClickPattern,
  createExercisePattern,
  type PlayAlongPattern,
} from './timeline'

export interface PlayAlongEngineOptions {
  audioContext?: AudioContext
  lookaheadSeconds?: number
  tickMs?: number
}

export interface PlayResolvedExerciseOptions {
  positions: readonly PositionedNote[]
  tempoBpm: number
  loop?: boolean
  countInBeats?: number
}

export interface PlayMetronomeOptions {
  tempoBpm: number
  loop?: boolean
  countInBeats?: number
}

export interface PlayAlongEngine {
  playResolvedExercise(options: PlayResolvedExerciseOptions): Promise<void>
  playMetronome(options: PlayMetronomeOptions): Promise<void>
  setTempoBpm(tempoBpm: number): void
  stop(): void
  dispose(): void
}

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

type SmplrModule = typeof import('smplr')

const DEFAULT_TICK_MS = 25
const START_DELAY_SECONDS = 0.05

export function createPlayAlongEngine(
  options: PlayAlongEngineOptions = {},
): PlayAlongEngine {
  return new BrowserPlayAlongEngine(options)
}

class BrowserPlayAlongEngine implements PlayAlongEngine {
  readonly #context: AudioContext
  readonly #lookaheadSeconds: number
  readonly #tickMs: number
  #sampler: SmplrSampler | null = null
  #smplrModule: SmplrModule | null = null
  #scheduler: PlayAlongScheduler | null = null
  #intervalId: number | null = null

  constructor(options: PlayAlongEngineOptions) {
    this.#context = options.audioContext ?? createAudioContext()
    this.#lookaheadSeconds = options.lookaheadSeconds ?? 0.1
    this.#tickMs = options.tickMs ?? DEFAULT_TICK_MS
  }

  async playResolvedExercise(options: PlayResolvedExerciseOptions): Promise<void> {
    await resumeAudioContext(this.#context)
    const pattern = createExercisePattern(options.positions)
    const midiNotes = options.positions.map(midiForPosition)
    const sampler = await this.#loadSampler(midiNotes)
    this.#startPattern(pattern, options.tempoBpm, {
      loop: options.loop ?? true,
      countInBeats: options.countInBeats ?? 4,
      onEvent: (event) => this.#scheduleEvent(event, sampler),
    })
  }

  async playMetronome(options: PlayMetronomeOptions): Promise<void> {
    await resumeAudioContext(this.#context)
    this.#startPattern(createClickPattern(), options.tempoBpm, {
      loop: options.loop ?? true,
      countInBeats: options.countInBeats ?? 0,
      onEvent: (event) => this.#scheduleEvent(event, null),
    })
  }

  setTempoBpm(tempoBpm: number): void {
    this.#scheduler?.setTempoBpm(tempoBpm)
  }

  stop(): void {
    if (this.#intervalId !== null) {
      window.clearInterval(this.#intervalId)
      this.#intervalId = null
    }
    this.#scheduler?.stop()
    this.#scheduler = null
    this.#sampler?.stop()
  }

  dispose(): void {
    this.stop()
    this.#sampler?.dispose()
    this.#sampler = null
  }

  async #loadSampler(midiNotes: readonly number[]): Promise<SmplrSampler> {
    this.#sampler?.dispose()
    const smplr = await this.#loadSmplr()
    const sampler = smplr.Sampler(this.#context, {
      preset: createFluidGuitarPreset(midiNotes),
      storage: createSampleStorage(smplr),
      velocity: 96,
      volume: 92,
    })
    this.#sampler = sampler
    await sampler.ready
    return sampler
  }

  async #loadSmplr(): Promise<SmplrModule> {
    this.#smplrModule ??= await import('smplr')
    return this.#smplrModule
  }

  #startPattern(
    pattern: PlayAlongPattern,
    tempoBpm: number,
    options: {
      loop: boolean
      countInBeats: number
      onEvent: (event: ScheduledPlayAlongEvent) => void
    },
  ): void {
    this.stop()
    const scheduler = new PlayAlongScheduler(pattern, options.onEvent, {
      lookaheadSeconds: this.#lookaheadSeconds,
    })
    scheduler.start({
      startTime: this.#context.currentTime + START_DELAY_SECONDS,
      tempoBpm,
      loop: options.loop,
      countInBeats: options.countInBeats,
    })
    this.#scheduler = scheduler
    this.#intervalId = window.setInterval(
      () => scheduler.flush(this.#context.currentTime),
      this.#tickMs,
    )
    scheduler.flush(this.#context.currentTime)
  }

  #scheduleEvent(
    event: ScheduledPlayAlongEvent,
    sampler: SmplrSampler | null,
  ): void {
    if (event.kind === 'note') {
      sampler?.start({
        note: event.midi,
        time: event.time,
        duration: event.durationSeconds,
        velocity: event.velocity,
      })
      return
    }
    scheduleClick(this.#context, event.time, event.accent)
  }
}

function createAudioContext(): AudioContext {
  const constructors = window as WindowWithWebkitAudio
  const AudioContextConstructor =
    constructors.AudioContext ?? constructors.webkitAudioContext
  if (!AudioContextConstructor) {
    throw new Error('Web Audio is not available in this browser')
  }
  return new AudioContextConstructor()
}

async function resumeAudioContext(context: AudioContext): Promise<void> {
  if (context.state === 'suspended') {
    await context.resume()
  }
}

function createSampleStorage(smplr: SmplrModule): SmplrStorage {
  try {
    if (window.isSecureContext && 'caches' in window) {
      return smplr.CacheStorage('jazz-master-play-along-samples-v1')
    }
  } catch {
    // Local HTTP dev and restricted browser modes fall back to ordinary fetches.
  }
  return smplr.HttpStorage
}

function scheduleClick(
  context: AudioContext,
  time: number,
  accent: boolean,
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'square'
  oscillator.frequency.setValueAtTime(accent ? 1200 : 880, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(accent ? 0.24 : 0.16, time + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(time)
  oscillator.stop(time + 0.07)
}
