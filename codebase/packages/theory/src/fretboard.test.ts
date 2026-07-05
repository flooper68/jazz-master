import { describe, expect, it } from 'vitest'
import {
  noteAt,
  positionsOf,
  STANDARD_TUNING,
  STRING_NUMBERS,
  type GuitarString,
} from './fretboard'
import { noteName, parseNote, pitchClass } from './note'

/** Sharp-spelled chromatic scale, the documented default for fretted notes. */
const CHROMATIC_SHARP = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

describe('STANDARD_TUNING', () => {
  it('is EADGBE with string 1 = high E', () => {
    const names = STRING_NUMBERS.map((s) => noteName(STANDARD_TUNING[s]))
    expect(names).toEqual(['E', 'B', 'G', 'D', 'A', 'E'])
  })
})

describe('noteAt', () => {
  it.each([
    [6, 0, 'E'],
    [6, 3, 'G'],
    [6, 5, 'A'],
    [5, 0, 'A'],
    [5, 3, 'C'],
    [4, 2, 'E'],
    [3, 2, 'A'],
    [2, 3, 'D'],
    [2, 1, 'C'],
    [1, 1, 'F'],
    [1, 12, 'E'],
    [1, 15, 'G'],
  ] as [GuitarString, number, string][])(
    'string %i fret %i is %s',
    (string, fret, expected) => {
      expect(noteName(noteAt(string, fret))).toBe(expected)
    },
  )

  it('is correct for every string and fret 0–15 (sharp spelling)', () => {
    for (const string of STRING_NUMBERS) {
      const openPc = pitchClass(STANDARD_TUNING[string])
      for (let fret = 0; fret <= 15; fret++) {
        const note = noteAt(string, fret)
        expect(pitchClass(note)).toBe((openPc + fret) % 12)
        expect(noteName(note)).toBe(CHROMATIC_SHARP[(openPc + fret) % 12])
      }
    }
  })

  it('rejects negative or fractional frets', () => {
    expect(() => noteAt(1, -1)).toThrow()
    expect(() => noteAt(1, 2.5)).toThrow()
  })
})

describe('positionsOf', () => {
  it('finds every E from fret 0 to 12', () => {
    expect(positionsOf(parseNote('E')!, { min: 0, max: 12 })).toEqual([
      { string: 6, fret: 0 },
      { string: 6, fret: 12 },
      { string: 5, fret: 7 },
      { string: 4, fret: 2 },
      { string: 3, fret: 9 },
      { string: 2, fret: 5 },
      { string: 1, fret: 0 },
      { string: 1, fret: 12 },
    ])
  })

  it('respects a fret-range window', () => {
    expect(positionsOf(parseNote('C')!, { min: 3, max: 8 })).toEqual([
      { string: 6, fret: 8 },
      { string: 5, fret: 3 },
      { string: 3, fret: 5 },
      { string: 1, fret: 8 },
    ])
  })

  it('accepts a bare pitch class', () => {
    expect(positionsOf(0, { min: 3, max: 8 })).toEqual(
      positionsOf(parseNote('C')!, { min: 3, max: 8 }),
    )
  })

  it('matches enharmonic spellings by pitch class', () => {
    expect(positionsOf(parseNote('Gb')!, { min: 0, max: 5 })).toEqual(
      positionsOf(parseNote('F#')!, { min: 0, max: 5 }),
    )
  })

  it('defaults to frets 0–15', () => {
    const positions = positionsOf(parseNote('G')!)
    expect(positions).toContainEqual({ string: 1, fret: 15 })
    expect(positions.every(({ fret }) => fret >= 0 && fret <= 15)).toBe(true)
  })

  it('rejects an inverted or negative range', () => {
    expect(() => positionsOf(0, { min: 5, max: 3 })).toThrow()
    expect(() => positionsOf(0, { min: -1, max: 3 })).toThrow()
  })

  it('rejects a fractional pitch class', () => {
    expect(() => positionsOf(1.5)).toThrow()
  })
})
