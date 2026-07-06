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
  return createRunnerState({ lesson, sessionId: 's-1', startedAt: 0 })
}

describe('runnerReducer', () => {
  it('starts at the first exercise with no results', () => {
    const state = start()
    expect(state.exerciseIndex).toBe(0)
    expect(state.results).toEqual([])
    expect(state.finished).toBe(false)
  })

  it('records the grade and advances to the next exercise', () => {
    const state = runnerReducer(start(), { type: 'grade', grade: 'got-it' })
    expect(state.results).toEqual([{ exerciseId: 'fx-1', grade: 'got-it' }])
    expect(state.exerciseIndex).toBe(1)
    expect(state.finished).toBe(false)
  })

  it('finishes when the last exercise is graded', () => {
    const afterFirst = runnerReducer(start(), { type: 'grade', grade: 'got-it' })
    const done = runnerReducer(afterFirst, { type: 'grade', grade: 'shaky' })
    expect(done.results).toEqual([
      { exerciseId: 'fx-1', grade: 'got-it' },
      { exerciseId: 'fx-2', grade: 'shaky' },
    ])
    expect(done.finished).toBe(true)
  })

  it('ignores grades after the lesson is finished', () => {
    const done = runnerReducer(
      runnerReducer(start(), { type: 'grade', grade: 'got-it' }),
      { type: 'grade', grade: 'shaky' },
    )
    expect(runnerReducer(done, { type: 'grade', grade: 'missed' })).toBe(done)
  })
})
