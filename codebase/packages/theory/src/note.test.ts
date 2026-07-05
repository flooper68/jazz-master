import { describe, expect, it } from 'vitest'
import { noteName, parseNote, pitchClass } from './note'

describe('parseNote / noteName', () => {
  it.each([
    ['C', 'C', 0],
    ['F#', 'F', 1],
    ['Bb', 'B', -1],
    ['Cb', 'C', -1],
    ['E#', 'E', 1],
    ['Bbb', 'B', -2],
    ['F##', 'F', 2],
  ])('round-trips %s', (name, letter, accidental) => {
    const note = parseNote(name)
    expect(note).toEqual({ letter, accidental })
    expect(noteName(note!)).toBe(name)
  })

  it.each(['H', 'e', 'Cb#', '', 'C♭', 'B♯', 'Cbbb', ' C'])(
    'rejects %j',
    (input) => {
      expect(parseNote(input)).toBeNull()
    },
  )

  it('refuses to name notes beyond double accidentals', () => {
    expect(() => noteName({ letter: 'E', accidental: -3 })).toThrow()
    expect(() => noteName({ letter: 'F', accidental: 3 })).toThrow()
  })
})

describe('pitchClass', () => {
  it.each([
    ['C', 0],
    ['B#', 0],
    ['Db', 1],
    ['C#', 1],
    ['E', 4],
    ['Fb', 4],
    ['E#', 5],
    ['Gb', 6],
    ['F#', 6],
    ['Cb', 11],
    ['Bbb', 9],
    ['F##', 7],
  ])('%s → %i', (name, pc) => {
    expect(pitchClass(parseNote(name)!)).toBe(pc)
  })
})
