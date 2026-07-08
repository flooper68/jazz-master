import {
  secondsPerBeat,
  type PlayAlongPattern,
  type PlayAlongPatternEvent,
} from './timeline'

export type ScheduledPlayAlongEvent =
  | (Extract<PlayAlongPatternEvent, { kind: 'note' }> & {
      time: number
      durationSeconds: number
      pass: number
    })
  | (Extract<PlayAlongPatternEvent, { kind: 'click' }> & {
      time: number
      phase: 'count-in' | 'phrase'
      pass: number
    })

export interface PlayAlongSchedulerOptions {
  lookaheadSeconds?: number
}

export interface PlayAlongStartOptions {
  startTime: number
  tempoBpm: number
  loop?: boolean
  countInBeats?: number
}

interface SchedulerState {
  startTime: number
  passStartTime: number
  tempoBpm: number
  loop: boolean
  countInBeats: number
  nextCountInBeat: number
  nextEventIndex: number
  pass: number
}

const DEFAULT_LOOKAHEAD_SECONDS = 0.1

export class PlayAlongScheduler {
  readonly #pattern: PlayAlongPattern
  readonly #onEvent: (event: ScheduledPlayAlongEvent) => void
  readonly #lookaheadSeconds: number
  #state: SchedulerState | null = null

  constructor(
    pattern: PlayAlongPattern,
    onEvent: (event: ScheduledPlayAlongEvent) => void,
    options: PlayAlongSchedulerOptions = {},
  ) {
    this.#pattern = pattern
    this.#onEvent = onEvent
    this.#lookaheadSeconds =
      options.lookaheadSeconds ?? DEFAULT_LOOKAHEAD_SECONDS
  }

  get isRunning(): boolean {
    return this.#state !== null
  }

  start(options: PlayAlongStartOptions): void {
    const countInBeats = options.countInBeats ?? 4
    if (!Number.isInteger(countInBeats) || countInBeats < 0) {
      throw new Error(`Invalid count-in beats: ${countInBeats}`)
    }
    const beatSeconds = secondsPerBeat(options.tempoBpm)
    this.#state = {
      startTime: options.startTime,
      passStartTime: options.startTime + countInBeats * beatSeconds,
      tempoBpm: options.tempoBpm,
      loop: options.loop ?? false,
      countInBeats,
      nextCountInBeat: 0,
      nextEventIndex: 0,
      pass: 0,
    }
  }

  setTempoBpm(tempoBpm: number): void {
    secondsPerBeat(tempoBpm)
    if (this.#state) {
      this.#state.tempoBpm = tempoBpm
    }
  }

  stop(): void {
    this.#state = null
  }

  flush(now: number): void {
    const state = this.#state
    if (!state) return
    const horizon = now + this.#lookaheadSeconds
    this.#scheduleCountIn(state, horizon)
    this.#schedulePhraseEvents(state, horizon)
  }

  #scheduleCountIn(state: SchedulerState, horizon: number): void {
    const beatSeconds = secondsPerBeat(state.tempoBpm)
    while (state.nextCountInBeat < state.countInBeats) {
      const beat = state.nextCountInBeat
      const time = state.startTime + beat * beatSeconds
      if (time > horizon) return
      this.#onEvent({
        kind: 'click',
        id: `count-in-${beat}`,
        offsetBeats: beat,
        accent: beat === 0,
        time,
        phase: 'count-in',
        pass: -1,
      })
      state.nextCountInBeat += 1
    }
  }

  #schedulePhraseEvents(state: SchedulerState, horizon: number): void {
    const events = this.#pattern.events
    while (this.#state === state && state.passStartTime <= horizon) {
      const beatSeconds = secondsPerBeat(state.tempoBpm)
      const event = events[state.nextEventIndex]
      if (!event) {
        if (!state.loop) {
          this.stop()
          return
        }
        state.passStartTime += this.#pattern.lengthBeats * beatSeconds
        state.nextEventIndex = 0
        state.pass += 1
        continue
      }
      const time = state.passStartTime + event.offsetBeats * beatSeconds
      if (time > horizon) return
      if (event.kind === 'note') {
        this.#onEvent({
          ...event,
          time,
          durationSeconds: event.durationBeats * beatSeconds,
          pass: state.pass,
        })
      } else {
        this.#onEvent({
          ...event,
          time,
          phase: 'phrase',
          pass: state.pass,
        })
      }
      state.nextEventIndex += 1
    }
  }
}
