import { describe, expect, it } from 'vitest'
import type { Exercise } from './types'
import { validateExercises } from './validate'

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    title: 'C major, open position',
    area: 'scales',
    level: 1,
    tempoBpm: 80,
    duration: { kind: 'minutes', minutes: 5 },
    notes: [
      { string: 5, fret: 3, beats: 2 },
      { string: 4, fret: 0, beats: 2 },
    ],
    ...overrides,
  }
}

describe('validateExercises', () => {
  it('accepts a consistent exercise set', () => {
    expect(validateExercises([exercise(), exercise({ id: 'ex-2' })])).toEqual([])
  })

  it('flags a note off the neck or with no length', () => {
    const problems = validateExercises([
      exercise({
        notes: [
          { string: 7 as never, fret: 0, beats: 0.5 },
          { string: 5, fret: -1, beats: 0.5 },
          { string: 5, fret: 2.5, beats: 0.5 },
          { string: 5, fret: 3, beats: 0 },
        ],
      }),
    ])
    const messages = problems.map((problem) => problem.message)
    expect(messages).toEqual([
      'note 0: string must be 1–6, got 7',
      'note 1: fret must be a non-negative integer, got -1',
      'note 2: fret must be a non-negative integer, got 2.5',
      'note 3: beats must be positive, got 0',
      'exercise ends mid-bar: 1.5 beats in 4/4',
    ])
    expect(problems[0]).toMatchObject({ exerciseId: 'ex-1' })
  })

  it('flags an exercise that ends in the middle of a bar', () => {
    const problems = validateExercises([
      exercise({ notes: [{ string: 5, fret: 3, beats: 1.5 }] }),
    ])
    expect(problems.map((p) => p.message)).toEqual(['exercise ends mid-bar: 1.5 beats in 4/4'])
    const waltz = validateExercises([
      exercise({ beatsPerBar: 3, notes: [{ string: 5, fret: 3, beats: 3 }] }),
    ])
    expect(waltz).toEqual([])
  })

  it('flags an exercise with no notes', () => {
    const problems = validateExercises([exercise({ notes: [] })])
    expect(problems.map((problem) => problem.message)).toEqual(['exercise has no notes'])
  })

  it('flags non-positive tempo and duration', () => {
    const broken = exercise({
      tempoBpm: 0,
      duration: { kind: 'repetitions', count: -3 },
    })
    const messages = validateExercises([broken]).map((p) => p.message)
    expect(messages).toContain('tempo must be positive, got 0')
    expect(messages).toContain('duration must be positive, got -3')
  })

  it('flags a bad level', () => {
    const messages = validateExercises([exercise({ level: 0 })]).map((p) => p.message)
    expect(messages).toEqual(['level must be a positive integer, got 0'])
  })

  it('flags a reused exercise id (the URL names it)', () => {
    expect(validateExercises([exercise(), exercise({ title: 'again' })])).toEqual([
      { exerciseId: 'ex-1', message: 'duplicate exercise id "ex-1"' },
    ])
  })
})
