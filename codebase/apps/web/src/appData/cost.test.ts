import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import { exerciseCost, exerciseCosts, lastRunEnded } from './cost'
import { PLAN_CONSTANTS } from './planConstants'
import type { ExerciseRun } from './run'

/** What an exercise is expected to take: what it has taken, or what it is written for. */

const OVERHEAD = PLAN_CONSTANTS.exerciseOverheadSeconds

function exercise(id: string, duration: Exercise['duration'], tempoBpm = 120): Exercise {
  return {
    id,
    title: id,
    area: 'technique',
    level: 1,
    tempoBpm,
    duration,
    // Four beats a pass, so a repetition count is arithmetic.
    notes: [
      { string: 1, fret: 0, beats: 1 },
      { string: 1, fret: 2, beats: 1 },
      { string: 1, fret: 3, beats: 1 },
      { string: 1, fret: 5, beats: 1 },
    ],
  }
}

let counter = 0

function run(exerciseId: string, durationSeconds: number, { completed = true, day = '2026-01-09' } = {}): ExerciseRun {
  counter += 1
  return {
    id: `run-${counter}`,
    exerciseId,
    startedAt: new Date(`${day}T10:00:00`).toISOString(),
    durationSeconds,
    tempoBpm: 120,
    passes: 4,
    completed,
    difficulty: 'good',
    sessionId: null,
  }
}

describe('exerciseCost', () => {
  it('takes the written length when the exercise has never been played', () => {
    expect(exerciseCost(exercise('clocked', { kind: 'minutes', minutes: 2 }), [])).toBe(120 + OVERHEAD)
    // Eight passes of four beats at 120 BPM: sixteen seconds of playing.
    expect(exerciseCost(exercise('counted', { kind: 'repetitions', count: 8 }), [])).toBe(16 + OVERHEAD)
  })

  it('takes what it has actually taken, once there are runs', () => {
    const item = exercise('counted', { kind: 'repetitions', count: 8 })
    const runs = [run(item.id, 100), run(item.id, 140), run(item.id, 120)]
    expect(exerciseCost(item, runs)).toBe(120 + OVERHEAD)
  })

  it('takes the median, so one run left open does not set the estimate for ever', () => {
    const item = exercise('counted', { kind: 'repetitions', count: 8 })
    const ordinary = [run(item.id, 100), run(item.id, 110), run(item.id, 120)]
    const withAnOutlier = [...ordinary, run(item.id, 4000)]
    expect(exerciseCost(item, ordinary)).toBe(110 + OVERHEAD)
    // The mean would be over a thousand seconds; the median moves by five.
    expect(exerciseCost(item, withAnOutlier)).toBe(115 + OVERHEAD)
  })

  it('ignores runs that were ended early — they say nothing about how long it takes', () => {
    const item = exercise('clocked', { kind: 'minutes', minutes: 2 })
    expect(exerciseCost(item, [run(item.id, 10, { completed: false })])).toBe(120 + OVERHEAD)
  })

  it('adds the overhead to every exercise: five two-minute items are not a ten-minute session', () => {
    const item = exercise('clocked', { kind: 'minutes', minutes: 2 })
    expect(exerciseCost(item, []) * 5).toBeGreaterThan(10 * 60)
  })
})

describe('exerciseCosts', () => {
  it('costs the whole catalog, and ignores runs of an exercise that is gone', () => {
    const catalog = [exercise('a', { kind: 'minutes', minutes: 1 }), exercise('b', { kind: 'minutes', minutes: 3 })]
    const costs = exerciseCosts([run('a', 90), run('gone-since', 600)], catalog)
    expect([...costs.keys()]).toEqual(['a', 'b'])
    expect(costs.get('a')).toBe(90 + OVERHEAD)
    expect(costs.get('b')).toBe(180 + OVERHEAD)
  })
})

describe('lastRunEnded', () => {
  it('is null before anything has been played', () => {
    expect(lastRunEnded([])).toBeNull()
  })

  it('is the end of the latest run, not its start', () => {
    const runs = [run('a', 600, { day: '2026-01-09' }), run('a', 300, { day: '2026-01-08' })]
    expect(lastRunEnded(runs)).toEqual(new Date('2026-01-09T10:10:00'))
  })
})
