import { describe, expect, it } from 'vitest'
import { exerciseShape } from './shape'
import type { Exercise } from './types'

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: 'x',
    title: 'x',
    area: 'scales',
    level: 1,
    tempoBpm: 60,
    duration: { kind: 'minutes', minutes: 1 },
    notes: [],
    ...overrides,
  }
}

describe('exerciseShape', () => {
  it('marks the tonic as the root when the exercise names one: A minor pentatonic is written in C, and is in A', () => {
    const notes = [
      { string: 6 as const, fret: 5, beats: 1 }, // A
      { string: 6 as const, fret: 8, beats: 1 }, // C
    ]
    const roots = (overrides: Partial<Exercise>) =>
      exerciseShape(exercise({ notes, ...overrides })).positions.filter((position) => position.role === 'root').map((position) => position.label)
    expect(roots({ key: 'C' })).toEqual(['C'])
    expect(roots({ key: 'C', tonic: 'A' })).toEqual(['A'])
    // A tonic needs no key to go with it.
    expect(roots({ tonic: 'A' })).toEqual(['A'])
  })

  it('lists each position once, labelled in the key, roots marked, low strings first', () => {
    const shape = exerciseShape(
      exercise({
        key: 'F',
        notes: [
          { string: 4, fret: 3, beats: 1 }, // F
          { string: 3, fret: 3, beats: 1 }, // Bb
          { string: 4, fret: 3, beats: 1 }, // F again
          { string: 1, fret: 1, beats: 1 }, // F
          { string: 2, fret: 6, beats: 1 }, // F
          { string: 1, fret: 4, beats: 1 }, // Ab
        ],
      }),
    )
    expect(shape.positions).toEqual([
      { string: 4, fret: 3, label: 'F', role: 'root' },
      { string: 3, fret: 3, label: 'Bb', role: 'other' },
      { string: 2, fret: 6, label: 'F', role: 'root' },
      { string: 1, fret: 1, label: 'F', role: 'root' },
      { string: 1, fret: 4, label: 'Ab', role: 'other' },
    ])
    // Frets 1–6: shown from the nut with a fret to spare.
    expect(shape.fretRange).toEqual({ min: 0, max: 7 })
  })

  it('shows a higher position without the nut and at least four frets wide', () => {
    const shape = exerciseShape(
      exercise({
        key: 'C',
        notes: [
          { string: 5, fret: 8, beats: 1 },
          { string: 4, fret: 7, beats: 1 },
        ],
      }),
    )
    expect(shape.fretRange).toEqual({ min: 6, max: 10 })
  })

  it('takes the first note as the root when there is no key', () => {
    const shape = exerciseShape(
      exercise({
        notes: [
          { string: 6, fret: 3, beats: 1 }, // G
          { string: 5, fret: 2, beats: 1 }, // B
          { string: 4, fret: 5, beats: 1 }, // G
        ],
      }),
    )
    expect(shape.positions.map((p) => `${p.label}${p.role === 'root' ? '*' : ''}`)).toEqual(['G*', 'B', 'G*'])
  })
})
