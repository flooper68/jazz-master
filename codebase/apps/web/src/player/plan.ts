import { midiAt } from '@jazz-master/theory'
import { noteStarts, type TabNote } from '../content'

/**
 * Pure timing for one run of the player. A run is a region of the exercise
 * played some number of passes, each pass possibly at a different tempo, on
 * a clock in seconds. Nothing here touches audio or the DOM: the transport
 * asks a run where the cursor is at a time and which events fall in a
 * window, and schedules from the answers.
 */

/** A half-open beat range of the exercise: `[startBeat, endBeat)`. */
export interface LoopRegion {
  startBeat: number
  endBeat: number
}

/**
 * Progressive tempo: starting from the run's tempo, add `stepBpm` every
 * `everyPasses` passes until `toBpm` is reached, then hold.
 */
export interface TempoLadder {
  stepBpm: number
  everyPasses: number
  toBpm: number
}

export interface RunPlan {
  notes: readonly TabNote[]
  beatsPerBar: number
  region: LoopRegion
  tempoBpm: number
  ladder: TempoLadder | null
  /** Passes to play, or null to loop until stopped. */
  repeat: number | null
  /** Clicks before the first pass starts; 0 for none. */
  countInBeats: number
}

export interface RunStart {
  /** Beat the run begins at — inside the region; a seek mid-pass is a partial first pass. */
  beat: number
  /** Passes already completed before this run. */
  pass: number
  /** Clock time the run is anchored at. */
  time: number
}

export type RunPhase = 'count-in' | 'playing' | 'done'

export interface RunPosition {
  phase: RunPhase
  beat: number
  pass: number
  tempoBpm: number
  /** Count-in only: beats still to click before the first note, fractional. */
  countInBeatsLeft: number
}

export type RunEvent =
  | { kind: 'click'; time: number; accent: boolean; pass: number }
  | { kind: 'note'; time: number; noteIndex: number; midi: number; seconds: number; pass: number }

/** Tempo of a given pass under the plan's ladder. */
export function tempoForPass(plan: Pick<RunPlan, 'tempoBpm' | 'ladder'>, pass: number): number {
  const { ladder } = plan
  if (!ladder || ladder.everyPasses < 1 || ladder.stepBpm === 0) return plan.tempoBpm
  const steps = Math.floor(Math.max(pass, 0) / ladder.everyPasses)
  const raw = plan.tempoBpm + steps * ladder.stepBpm
  return ladder.stepBpm > 0 ? Math.min(raw, Math.max(ladder.toBpm, plan.tempoBpm)) : Math.max(raw, Math.min(ladder.toBpm, plan.tempoBpm))
}

export interface Run {
  readonly plan: RunPlan
  readonly start: RunStart
  positionAt(time: number): RunPosition
  /** Clock time of a beat within a pass (pass counted from the run's own first pass). */
  timeOf(pass: number, beat: number): number
  /** Every click and note onset with `from <= time < to`, in time order. */
  eventsBetween(from: number, to: number): RunEvent[]
  /** Clock time the run completes, or null for an endless loop. */
  readonly endTime: number | null
}

export function createRun(plan: RunPlan, start: RunStart): Run {
  const { region } = plan
  const regionBeats = region.endBeat - region.startBeat
  if (!(regionBeats > 0)) throw new Error('A run needs a non-empty region')
  const firstBeat = Math.min(Math.max(start.beat, region.startBeat), region.endBeat)
  const starts = noteStarts(plan.notes)
  const passesLeft = plan.repeat === null ? null : Math.max(plan.repeat - start.pass, 0)

  const tempoOf = (localPass: number) => tempoForPass(plan, start.pass + localPass)
  const passStartBeat = (localPass: number) => (localPass === 0 ? firstBeat : region.startBeat)
  const passSeconds = (localPass: number) =>
    ((region.endBeat - passStartBeat(localPass)) * 60) / tempoOf(localPass)

  // Pass start times, grown on demand — an endless loop has no last pass.
  const passStartTimes: number[] = [start.time + (plan.countInBeats * 60) / tempoOf(0)]
  const passStartTime = (localPass: number): number => {
    while (passStartTimes.length <= localPass) {
      const previous = passStartTimes.length - 1
      passStartTimes.push(passStartTimes[previous] + passSeconds(previous))
    }
    return passStartTimes[localPass]
  }
  const endTime = passesLeft === null ? null : passStartTime(passesLeft)

  const localPassAt = (time: number): number => {
    let localPass = 0
    while (passStartTime(localPass + 1) <= time) localPass += 1
    return localPass
  }

  function positionAt(time: number): RunPosition {
    const firstPassStart = passStartTime(0)
    if (passesLeft === 0 || (endTime !== null && time >= endTime)) {
      return {
        phase: 'done',
        beat: region.endBeat,
        pass: start.pass + (passesLeft ?? 0),
        tempoBpm: tempoOf(Math.max((passesLeft ?? 1) - 1, 0)),
        countInBeatsLeft: 0,
      }
    }
    if (time < firstPassStart) {
      return {
        phase: 'count-in',
        beat: firstBeat,
        pass: start.pass,
        tempoBpm: tempoOf(0),
        countInBeatsLeft: ((firstPassStart - time) * tempoOf(0)) / 60,
      }
    }
    const localPass = localPassAt(time)
    const tempoBpm = tempoOf(localPass)
    const beat = passStartBeat(localPass) + ((time - passStartTime(localPass)) * tempoBpm) / 60
    return {
      phase: 'playing',
      beat: Math.min(beat, region.endBeat),
      pass: start.pass + localPass,
      tempoBpm,
      countInBeatsLeft: 0,
    }
  }

  function timeOf(localPass: number, beat: number): number {
    return passStartTime(localPass) + ((beat - passStartBeat(localPass)) * 60) / tempoOf(localPass)
  }

  function passEvents(localPass: number): RunEvent[] {
    const events: RunEvent[] = []
    const pass = start.pass + localPass
    const tempoBpm = tempoOf(localPass)
    const from = passStartBeat(localPass)
    if (localPass === 0 && plan.countInBeats > 0) {
      const secondsPerBeat = 60 / tempoBpm
      for (let k = 0; k < plan.countInBeats; k += 1) {
        events.push({
          kind: 'click',
          time: start.time + k * secondsPerBeat,
          accent: k === 0,
          pass,
        })
      }
    }
    for (let beat = Math.ceil(from); beat < region.endBeat; beat += 1) {
      events.push({
        kind: 'click',
        time: timeOf(localPass, beat),
        accent: beat % plan.beatsPerBar === 0,
        pass,
      })
    }
    plan.notes.forEach((note, noteIndex) => {
      const onset = starts[noteIndex]
      if (onset < from || onset >= region.endBeat) return
      const beats = Math.min(note.beats, region.endBeat - onset)
      events.push({
        kind: 'note',
        time: timeOf(localPass, onset),
        noteIndex,
        midi: midiAt(note.string, note.fret),
        seconds: (beats * 60) / tempoBpm,
        pass,
      })
    })
    return events.sort((a, b) => a.time - b.time || (a.kind === 'click' ? -1 : 1))
  }

  function eventsBetween(from: number, to: number): RunEvent[] {
    if (!(to > from)) return []
    const events: RunEvent[] = []
    const lastLocalPass = passesLeft === null ? Infinity : passesLeft - 1
    // The first pass's events begin with its count-in, before the pass itself.
    const passBegins = (localPass: number) =>
      localPass === 0 ? start.time : passStartTime(localPass)
    for (let localPass = 0; localPass <= lastLocalPass; localPass += 1) {
      if (passBegins(localPass) >= to) break
      if (passStartTime(localPass + 1) <= from) continue
      for (const event of passEvents(localPass)) {
        if (event.time >= from && event.time < to) events.push(event)
      }
    }
    return events
  }

  return { plan, start, positionAt, timeOf, eventsBetween, endTime }
}
