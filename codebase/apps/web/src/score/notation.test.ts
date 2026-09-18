import { keySignature } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { noteStarts, type TabNote } from '../content'
import { farthestStep, keySignatureGlyphs, ledgerSteps, resolveKey, staffNotes } from './notation'

/** The heads of each event; for these single notes, the one head each. */
function staff(notes: TabNote[], key: string | undefined, beatsPerBar = 4) {
  return staffNotes(notes, noteStarts(notes), beatsPerBar, resolveKey(key)).map((heads) => heads[0])
}

describe('staffNotes', () => {
  it('writes the guitar an octave up in treble clef', () => {
    // Open low E sounds E2, is written E3: two ledger lines below the staff.
    const [low, middle, high] = staff(
      [
        { string: 6, fret: 0, beats: 1 },
        { string: 2, fret: 0, beats: 1 },
        { string: 1, fret: 12, beats: 1 },
      ],
      'C',
    )
    expect(low).toEqual({ step: 23, accidental: null, midi: 40 })
    expect(middle).toEqual({ step: 34, accidental: null, midi: 59 })
    expect(high).toEqual({ step: 44, accidental: null, midi: 76 })
  })

  it('draws no accidental for notes the key signature covers', () => {
    // Bb in F major: on the key signature. B natural needs a natural sign.
    const [flat, natural] = staff(
      [
        { string: 1, fret: 6, beats: 1 },
        { string: 1, fret: 7, beats: 1 },
      ],
      'F',
    )
    expect(flat).toMatchObject({ step: 41, accidental: null })
    expect(natural).toMatchObject({ step: 41, accidental: 0 })
  })

  it('carries an accidental through the bar, then restores it', () => {
    const [sharp, again, nextBar, restored] = staff(
      [
        { string: 1, fret: 2, beats: 2 }, // F# — sharp shown
        { string: 1, fret: 2, beats: 2 }, // F# — still in force
        { string: 1, fret: 2, beats: 2 }, // F# — new bar, shown again
        { string: 1, fret: 1, beats: 2 }, // F — natural cancels it
      ],
      'C',
    )
    expect(sharp.accidental).toBe(1)
    expect(again.accidental).toBeNull()
    expect(nextBar.accidental).toBe(1)
    expect(restored.accidental).toBe(0)
  })

  it('keeps accidentals per octave', () => {
    const [low, high] = staff(
      [
        { string: 6, fret: 4, beats: 2 }, // G#2
        { string: 3, fret: 1, beats: 2 }, // G#3
      ],
      'C',
    )
    expect(low.accidental).toBe(1)
    expect(high.accidental).toBe(1)
  })

  it('gives a chord one head per string, bass first, and carries its accidentals on through the bar', () => {
    // A7 with a C# on top, then a C# on its own: the sharp is in force from the chord.
    const [chord, after] = staffNotes(
      [
        { string: 5, fret: 0, beats: 2, above: [{ string: 4, fret: 2 }, { string: 3, fret: 0 }, { string: 2, fret: 2 }] },
        { string: 2, fret: 2, beats: 2 },
      ],
      [0, 2],
      4,
      resolveKey('C'),
    )
    expect(chord.map((head) => head.midi)).toEqual([45, 52, 55, 61])
    expect(chord.map((head) => head.accidental)).toEqual([null, null, null, 1])
    expect(after).toEqual([{ step: 35, accidental: null, midi: 61 }])
  })

  it('spells chromatic notes with flats in flat keys', () => {
    const [ab] = staff([{ string: 1, fret: 4, beats: 1 }], 'F')
    // Ab5 written: A5 is step 40; a flat on it.
    expect(ab).toMatchObject({ step: 40, accidental: -1 })
  })
})

describe('keySignatureGlyphs', () => {
  it('places sharps and flats on their treble-clef lines and spaces', () => {
    expect(keySignatureGlyphs(keySignature('C'))).toEqual([])
    expect(keySignatureGlyphs(keySignature('D'))).toEqual([
      { accidental: 1, step: 38 },
      { accidental: 1, step: 35 },
    ])
    expect(keySignatureGlyphs(keySignature('Bb'))).toEqual([
      { accidental: -1, step: 34 },
      { accidental: -1, step: 37 },
    ])
    expect(keySignatureGlyphs(null)).toEqual([])
  })
})

describe('ledgerSteps', () => {
  it('lists the ledger lines a head needs', () => {
    expect(ledgerSteps(32)).toEqual([])
    expect(ledgerSteps(28)).toEqual([28])
    expect(ledgerSteps(27)).toEqual([28])
    expect(ledgerSteps(23)).toEqual([28, 26, 24])
    expect(ledgerSteps(40)).toEqual([40])
    expect(ledgerSteps(43)).toEqual([40, 42])
  })
})

describe('farthestStep', () => {
  it('picks the head farthest from the middle line, which decides where the stem goes', () => {
    expect(farthestStep([30, 36])).toBe(30)
    expect(farthestStep([32, 39])).toBe(39)
    expect(farthestStep([34])).toBe(34)
  })
})
