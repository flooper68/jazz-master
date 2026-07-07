import { parseNote, type PositionedNote } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { stavePitch } from './notationPitch'

function positioned(
  name: string,
  string: PositionedNote['string'],
  fret: number,
): PositionedNote {
  return { string, fret, note: parseNote(name)!, degree: 1 }
}

describe('stavePitch', () => {
  it('derives the octave from where the note sounds', () => {
    expect(stavePitch(positioned('E', 1, 0)).key).toBe('e/4')
    expect(stavePitch(positioned('E', 6, 0)).key).toBe('e/2')
    expect(stavePitch(positioned('C', 5, 3)).key).toBe('c/3')
    expect(stavePitch(positioned('C', 2, 1)).key).toBe('c/4')
  })

  it('keeps the theory spelling verbatim in the key', () => {
    expect(stavePitch(positioned('Db', 4, 11))).toEqual({
      key: 'db/4',
      accidental: 'b',
      letter: 'D',
      octave: 4,
    })
    expect(stavePitch(positioned('F#', 6, 2))).toEqual({
      key: 'f#/2',
      accidental: '#',
      letter: 'F',
      octave: 2,
    })
  })

  it('spells enharmonics across the letter boundary with the right octave', () => {
    // Cb4 sounds B3; B#2 sounds C3 — the octave follows the letter, not the pitch.
    expect(stavePitch(positioned('Cb', 2, 0)).key).toBe('cb/4')
    expect(stavePitch(positioned('B#', 6, 8)).key).toBe('b#/2')
  })

  it('handles double accidentals', () => {
    expect(stavePitch(positioned('Bbb', 5, 0))).toEqual({
      key: 'bbb/2',
      accidental: 'bb',
      letter: 'B',
      octave: 2,
    })
  })

  it('reports naturals with no accidental glyph', () => {
    expect(stavePitch(positioned('G', 6, 3)).accidental).toBeNull()
  })

  it('throws when the spelling does not sound at the position', () => {
    expect(() => stavePitch(positioned('C', 6, 1))).toThrow(/does not sound/)
  })
})
