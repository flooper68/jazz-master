import { createPlayerAudio, type PlayerAudio } from '../audio/engine'
import { passBeats, type TabNote } from '../content'
import {
  createRun,
  tempoForPass,
  type LoopRegion,
  type Run,
  type RunPhase,
  type TempoLadder,
} from './plan'

/**
 * The transport: one clock for the click, the cursor and the play-along
 * voice. It owns the playback state of one exercise — position, tempo, loop
 * region, repeat count, tempo ladder — builds a run from it (plan.ts) and
 * schedules the run's events a little ahead on the audio clock. Without Web
 * Audio it still runs the cursor on the wall clock, silently.
 */

export type TransportStatus = 'stopped' | 'playing'

export interface TransportSnapshot {
  status: TransportStatus
  tempoBpm: number
  ladder: TempoLadder | null
  /** Custom loop region, or null to play the whole exercise. */
  loop: LoopRegion | null
  repeat: number | null
  countIn: boolean
  click: boolean
  voice: boolean
  /** Passes completed in the current run (or the last one, once finished). */
  pass: number
  /** True once a repeat target was reached; cleared by play, seek or stop. */
  finished: boolean
  audioUnavailable: boolean
  totalBeats: number
}

export type TransportPhase = 'idle' | RunPhase

export interface TransportPosition {
  phase: TransportPhase
  beat: number
  pass: number
  tempoBpm: number
  countInBeatsLeft: number
}

export interface TransportOptions {
  notes: readonly TabNote[]
  beatsPerBar: number
  tempoBpm: number
  repeat?: number | null
  createAudio?: () => PlayerAudio
  /** Wall clock in ms, used only when audio is unavailable. */
  now?: () => number
  setInterval?: typeof globalThis.setInterval
  clearInterval?: typeof globalThis.clearInterval
  intervalMs?: number
  lookaheadSeconds?: number
  voiceGain?: number
}

export interface Transport {
  subscribe(listener: () => void): () => void
  getSnapshot(): TransportSnapshot
  position(): TransportPosition
  play(): void
  pause(): void
  toggle(): void
  /** Pause and return to the start of the region, forgetting passes. */
  stop(): void
  seek(beat: number): void
  setTempo(bpm: number): void
  setLadder(ladder: TempoLadder | null): void
  setLoop(loop: LoopRegion | null): void
  setRepeat(repeat: number | null): void
  setCountIn(on: boolean): void
  setClick(on: boolean): void
  setVoice(on: boolean): void
  dispose(): void
  readonly disposed: boolean
}

export const MIN_TEMPO = 20
export const MAX_TEMPO = 400
const LEAD_IN_SECONDS = 0.05
const BACKLOG_TOLERANCE_SECONDS = 0.5

export function clampTempo(bpm: number): number {
  if (!Number.isFinite(bpm)) return MIN_TEMPO
  return Math.min(Math.max(Math.round(bpm), MIN_TEMPO), MAX_TEMPO)
}

export function createTransport({
  notes,
  beatsPerBar,
  tempoBpm,
  repeat = null,
  createAudio = () => createPlayerAudio(),
  now = () => performance.now(),
  setInterval = globalThis.setInterval.bind(globalThis),
  clearInterval = globalThis.clearInterval.bind(globalThis),
  intervalMs = 25,
  lookaheadSeconds = 0.12,
  voiceGain = 0.5,
}: TransportOptions): Transport {
  const totalBeats = passBeats(notes)
  if (!(totalBeats > 0)) throw new Error('A transport needs an exercise with notes')

  let snapshot: TransportSnapshot = {
    status: 'stopped',
    tempoBpm: clampTempo(tempoBpm),
    ladder: null,
    loop: null,
    repeat,
    countIn: true,
    click: true,
    voice: false,
    pass: 0,
    finished: false,
    audioUnavailable: false,
    totalBeats,
  }
  const listeners = new Set<() => void>()
  let audio: PlayerAudio | null = null
  let audioFailed = false
  let disposed = false
  let run: Run | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let scheduledUntil = 0
  let positionBeat = 0
  // Bumped on every play/pause so a late resume() cannot revive a paused run.
  let generation = 0

  function emit(patch: Partial<TransportSnapshot>): void {
    snapshot = { ...snapshot, ...patch }
    for (const listener of listeners) listener()
  }

  function clock(): number {
    return audio ? audio.now : now() / 1000
  }

  function region(): LoopRegion {
    return snapshot.loop ?? { startBeat: 0, endBeat: totalBeats }
  }

  function plan(countIn: boolean) {
    return {
      notes,
      beatsPerBar,
      region: region(),
      tempoBpm: snapshot.tempoBpm,
      ladder: snapshot.ladder,
      repeat: snapshot.repeat,
      countInBeats: countIn && snapshot.countIn ? beatsPerBar : 0,
    }
  }

  function ensureAudio(): void {
    if (audio || audioFailed) return
    try {
      audio = createAudio()
    } catch {
      audioFailed = true
      emit({ audioUnavailable: true })
    }
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function startRun(countIn: boolean, at = clock() + LEAD_IN_SECONDS): void {
    run = createRun(plan(countIn), { beat: positionBeat, pass: snapshot.pass, time: at })
    scheduledUntil = at
    clearTimer()
    timer = setInterval(tick, intervalMs)
    tick()
  }

  function tick(): void {
    if (!run) return
    const time = clock()
    // A throttled background tab wakes up behind the clock: skip the backlog
    // rather than firing it all at once.
    if (scheduledUntil < time - BACKLOG_TOLERANCE_SECONDS) scheduledUntil = time
    const horizon = time + lookaheadSeconds
    if (audio) {
      for (const event of run.eventsBetween(scheduledUntil, horizon)) {
        if (event.kind === 'click' && snapshot.click) audio.click(event.time, event.accent)
        if (event.kind === 'note' && snapshot.voice) {
          audio.pluck(event.time, event.midi, event.seconds, voiceGain)
        }
      }
    }
    scheduledUntil = Math.max(scheduledUntil, horizon)
    const at = run.positionAt(time)
    if (at.phase === 'done') {
      finishRun(at.pass)
      return
    }
    if (at.pass !== snapshot.pass) emit({ pass: at.pass })
  }

  function finishRun(pass: number): void {
    clearTimer()
    run = null
    positionBeat = region().startBeat
    generation += 1
    emit({ status: 'stopped', finished: true, pass })
  }

  /** Freeze the current position into state; the run is dropped. */
  function capture(): void {
    if (!run) return
    const at = run.positionAt(clock())
    positionBeat = at.phase === 'done' ? region().startBeat : Math.min(at.beat, region().endBeat)
    if (positionBeat >= region().endBeat) positionBeat = region().startBeat
    snapshot = { ...snapshot, pass: at.pass }
    run = null
  }

  /** Rebuild the run from the current position after a setting changed mid-play. */
  function reanchor(): void {
    if (snapshot.status !== 'playing' || !run) return
    capture()
    audio?.cancelFrom(clock())
    startRun(false, clock())
  }

  function play(): void {
    if (disposed || snapshot.status === 'playing') return
    ensureAudio()
    const patch: Partial<TransportSnapshot> = { status: 'playing' }
    if (snapshot.finished) {
      positionBeat = region().startBeat
      patch.pass = 0
      patch.finished = false
    }
    emit(patch)
    generation += 1
    const started = generation
    if (audio && audio.state !== 'running') {
      // The clock is frozen while suspended: anchor only once it runs.
      void audio.resume().then(() => {
        if (generation === started && snapshot.status === 'playing') startRun(true)
      })
      return
    }
    startRun(true)
  }

  function pause(): void {
    if (snapshot.status !== 'playing') return
    generation += 1
    capture()
    clearTimer()
    audio?.silence()
    emit({ status: 'stopped' })
  }

  function clampToRegion(beat: number): number {
    const { startBeat, endBeat } = region()
    if (!Number.isFinite(beat)) return startBeat
    return Math.min(Math.max(beat, startBeat), Math.max(endBeat - 1e-6, startBeat))
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    position() {
      if (run) {
        const at = run.positionAt(clock())
        return { ...at }
      }
      return {
        phase: 'idle',
        beat: positionBeat,
        pass: snapshot.pass,
        tempoBpm: tempoForPass(snapshot, snapshot.pass),
        countInBeatsLeft: 0,
      }
    },
    play,
    pause,
    toggle() {
      if (snapshot.status === 'playing') pause()
      else play()
    },
    stop() {
      pause()
      positionBeat = region().startBeat
      emit({ pass: 0, finished: false })
    },
    seek(beat) {
      const target = clampToRegion(beat)
      if (snapshot.status === 'playing' && run) {
        capture()
        positionBeat = target
        audio?.cancelFrom(clock())
        startRun(false, clock())
        emit({ finished: false })
        return
      }
      positionBeat = target
      emit({ finished: false })
    },
    setTempo(bpm) {
      const tempo = clampTempo(bpm)
      if (tempo === snapshot.tempoBpm) return
      emit({ tempoBpm: tempo })
      reanchor()
    },
    setLadder(ladder) {
      emit({ ladder })
      reanchor()
    },
    setLoop(loop) {
      const normalized = normalizeLoop(loop, totalBeats)
      emit({ loop: normalized, finished: false })
      const { startBeat, endBeat } = region()
      const at = this.position()
      const inside = at.beat >= startBeat && at.beat < endBeat
      if (snapshot.status === 'playing' && run) {
        capture()
        if (!inside) {
          positionBeat = startBeat
          snapshot = { ...snapshot, pass: 0 }
        }
        audio?.cancelFrom(clock())
        startRun(false, clock())
        emit({ pass: snapshot.pass })
        return
      }
      if (!inside) {
        positionBeat = startBeat
        emit({ pass: 0 })
      }
    },
    setRepeat(count) {
      const repeat = count === null ? null : Math.max(Math.round(count), 1)
      emit({ repeat, finished: false })
      reanchor()
    },
    setCountIn(on) {
      emit({ countIn: on })
    },
    setClick(on) {
      emit({ click: on })
    },
    setVoice(on) {
      emit({ voice: on })
    },
    get disposed() {
      return disposed
    },
    dispose() {
      if (disposed) return
      pause()
      disposed = true
      audio?.dispose()
      audio = null
      listeners.clear()
    },
  }
}

function normalizeLoop(loop: LoopRegion | null, totalBeats: number): LoopRegion | null {
  if (!loop) return null
  const startBeat = Math.min(Math.max(Math.min(loop.startBeat, loop.endBeat), 0), totalBeats)
  const endBeat = Math.min(Math.max(loop.startBeat, loop.endBeat), totalBeats)
  if (!(endBeat - startBeat > 0)) return null
  if (startBeat === 0 && endBeat === totalBeats) return null
  return { startBeat, endBeat }
}
