import { describe, expect, it } from 'vitest'
import type { Lesson } from '../content'
import {
  createRunnerState,
  runnerReducer,
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
      material: { kind: 'scale', root: 'C', scale: 'ionian' },
      window: { min: 0, max: 4 },
      tempoBpm: 60,
      duration: { kind: 'minutes', minutes: 1 },
      display: ['fretboard'],
    },
    {
      id: 'fx-2',
      title: 'G7 arpeggio — open position',
      material: { kind: 'arpeggio', root: 'G', quality: '7' },
      window: { min: 0, max: 4 },
      tempoBpm: 60,
      duration: { kind: 'repetitions', count: 8 },
      display: ['fretboard'],
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
  it('starts at the first exercise with no results', () => {
    const state = start()
    expect(state.exerciseIndex).toBe(0)
    expect(state.activeExerciseStartedAt).toBeNull()
    expect(state.durationSeconds).toBe(0)
    expect(state.results).toEqual([])
    expect(state.finished).toBe(false)
  })

  it('counts active exercise time from begin to completion', () => {
    const active = runnerReducer(start(), { type: 'begin-exercise', at: 1_000 })
    expect(active.activeExerciseStartedAt).toBe(1_000)

    const completed = runnerReducer(active, {
      type: 'complete-exercise',
      at: 46_400,
    })
    expect(completed.activeExerciseStartedAt).toBeNull()
    expect(completed.durationSeconds).toBe(45)
  })

  it('records the grade and advances to the next exercise', () => {
    const state = runnerReducer(start(), { type: 'grade', grade: 'got-it', at: 0 })
    expect(state.results).toEqual([{ exerciseId: 'fx-1', grade: 'got-it' }])
    expect(state.exerciseIndex).toBe(1)
    expect(state.finished).toBe(false)
  })

  it('completes active time when a grade is recorded directly', () => {
    const active = runnerReducer(start(), { type: 'begin-exercise', at: 2_000 })
    const state = runnerReducer(active, {
      type: 'grade',
      grade: 'got-it',
      at: 62_000,
    })
    expect(state.durationSeconds).toBe(60)
    expect(state.activeExerciseStartedAt).toBeNull()
    expect(state.exerciseIndex).toBe(1)
  })

  it('finishes when the last exercise is graded', () => {
    const afterFirst = runnerReducer(start(), {
      type: 'grade',
      grade: 'got-it',
      at: 0,
    })
    const done = runnerReducer(afterFirst, {
      type: 'grade',
      grade: 'shaky',
      at: 0,
    })
    expect(done.results).toEqual([
      { exerciseId: 'fx-1', grade: 'got-it' },
      { exerciseId: 'fx-2', grade: 'shaky' },
    ])
    expect(done.finished).toBe(true)
  })

  it('ignores grades after the lesson is finished', () => {
    const done = runnerReducer(
      runnerReducer(start(), { type: 'grade', grade: 'got-it', at: 0 }),
      { type: 'grade', grade: 'shaky', at: 0 },
    )
    expect(runnerReducer(done, { type: 'grade', grade: 'missed', at: 0 })).toBe(
      done,
    )
  })
})
