import { describe, expect, it } from 'vitest'
import type { Lesson } from '../content'
import {
  createRunnerState,
  runnerReducer,
  toSessionRecord,
  type RunnerState,
} from './usePracticeRunner'

const lesson: Lesson = {
  id: 'fixture-lesson',
  title: 'Fixture lesson',
  area: 'scales',
  level: 1,
  prerequisites: [],
  estimatedMinutes: 2,
  exercises: [
    {
      id: 'fx-1',
      title: 'C major — open position',
      tempoBpm: 60,
      duration: { kind: 'minutes', minutes: 1 },
      notes: [{ string: 5, fret: 3, beats: 1 }],
    },
    {
      id: 'fx-2',
      title: 'G major — open position',
      tempoBpm: 60,
      duration: { kind: 'repetitions', count: 8 },
      notes: [{ string: 6, fret: 3, beats: 1 }],
    },
  ],
}

function start(): RunnerState {
  return createRunnerState({
    lesson,
    sessionId: 's-1',
    startedAt: 0,
    onSessionChange() {},
  })
}

describe('runnerReducer', () => {
  it('starts at the first exercise with nothing completed', () => {
    const state = start()
    expect(state.exerciseIndex).toBe(0)
    expect(state.activeExerciseStartedAt).toBeNull()
    expect(state.durationSeconds).toBe(0)
    expect(state.exercisesCompleted).toBe(0)
    expect(state.finished).toBe(false)
  })

  it('counts active exercise time from begin to finish and advances', () => {
    const active = runnerReducer(start(), { type: 'begin-exercise', at: 1_000 })
    expect(active.activeExerciseStartedAt).toBe(1_000)

    const next = runnerReducer(active, { type: 'finish-exercise', at: 46_400 })
    expect(next.activeExerciseStartedAt).toBeNull()
    expect(next.durationSeconds).toBe(45)
    expect(next.exerciseIndex).toBe(1)
    expect(next.exercisesCompleted).toBe(1)
    expect(next.finished).toBe(false)
  })

  it('finishes when the last exercise is finished', () => {
    const afterFirst = runnerReducer(start(), { type: 'finish-exercise', at: 0 })
    const done = runnerReducer(afterFirst, { type: 'finish-exercise', at: 0 })
    expect(done.exercisesCompleted).toBe(2)
    expect(done.finished).toBe(true)
  })

  it('ignores actions after the lesson is finished', () => {
    const done = runnerReducer(
      runnerReducer(start(), { type: 'finish-exercise', at: 0 }),
      { type: 'finish-exercise', at: 0 },
    )
    expect(runnerReducer(done, { type: 'finish-exercise', at: 0 })).toBe(done)
    expect(runnerReducer(done, { type: 'begin-exercise', at: 0 })).toBe(done)
  })
})

describe('toSessionRecord', () => {
  it('includes time still running on the active exercise', () => {
    const active = runnerReducer(
      runnerReducer(start(), { type: 'finish-exercise', at: 0 }),
      { type: 'begin-exercise', at: 10_000 },
    )
    expect(toSessionRecord(active, 25_000)).toEqual({
      id: 's-1',
      lessonId: 'fixture-lesson',
      startedAt: new Date(0).toISOString(),
      durationSeconds: 15,
      completed: false,
      exercisesCompleted: 1,
    })
  })
})
