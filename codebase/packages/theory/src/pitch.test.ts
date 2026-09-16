import { describe, expect, it } from 'vitest'
import { parseNote } from './note'
import { diatonicStep, keySignature, midiOf, spellMidi } from './pitch'

describe('spellMidi', () => {
  it('spells with sharps by default and with flats in flat keys', () => {
    expect(spellMidi(60)).toEqual({ letter: 'C', accidental: 0, octave: 4 })
    expect(spellMidi(70)).toEqual({ letter: 'A', accidental: 1, octave: 4 })
    expect(spellMidi(70, keySignature('F'))).toEqual({ letter: 'B', accidental: -1, octave: 4 })
    // Ab is not in F major, but F is a flat key: prefer the flat spelling.
    expect(spellMidi(68, keySignature('F'))).toEqual({ letter: 'A', accidental: -1, octave: 4 })
    // D# is not in G major; a sharp key prefers sharps.
    expect(spellMidi(63, keySignature('G'))).toEqual({ letter: 'D', accidental: 1, octave: 4 })
  })

  it('takes the key spelling for in-key notes, even across the octave line', () => {
    // B major has E# — no: B major spells E natural; F# major spells E#.
    expect(spellMidi(65, keySignature('F#'))).toEqual({ letter: 'E', accidental: 1, octave: 4 })
    // Cb major spells B as Cb, one octave up in scientific pitch notation.
    expect(spellMidi(59, keySignature('Cb'))).toEqual({ letter: 'C', accidental: -1, octave: 4 })
  })

  it('round-trips through midiOf', () => {
    for (let midi = 40; midi < 90; midi += 1) {
      expect(midiOf(spellMidi(midi))).toBe(midi)
      expect(midiOf(spellMidi(midi, keySignature('Db')))).toBe(midi)
    }
    expect(midiOf({ letter: 'B', accidental: 1, octave: 3 })).toBe(60)
    expect(midiOf({ letter: 'C', accidental: -1, octave: 4 })).toBe(59)
  })

  it('rejects a non-integer or negative number', () => {
    expect(() => spellMidi(-1)).toThrow('Invalid MIDI number: -1')
    expect(() => spellMidi(60.5)).toThrow('Invalid MIDI number: 60.5')
  })
})

describe('diatonicStep', () => {
  it('counts letters from C0, so a staff step is one unit', () => {
    expect(diatonicStep({ letter: 'C', octave: 4 })).toBe(28)
    expect(diatonicStep({ letter: 'E', octave: 4 })).toBe(30)
    expect(diatonicStep({ letter: 'B', octave: 4 })).toBe(34)
    expect(diatonicStep({ letter: 'C', octave: 5 })).toBe(35)
  })
})

describe('keySignature', () => {
  it('knows the circle of fifths', () => {
    expect(keySignature('C')?.accidentals).toBe(0)
    expect(keySignature('G')?.accidentals).toBe(1)
    expect(keySignature('E')?.accidentals).toBe(4)
    expect(keySignature('F')?.accidentals).toBe(-1)
    expect(keySignature('Eb')?.accidentals).toBe(-3)
    expect(keySignature('G#')).toBeNull()
    expect(keySignature('nope')).toBeNull()
  })

  it('spells the major scale as the signature does', () => {
    expect(keySignature('F')?.scale.map((n) => n.letter + (n.accidental ? 'b' : ''))).toEqual([
      'F', 'G', 'A', 'Bb', 'C', 'D', 'E',
    ])
    expect(keySignature('D')?.scale).toContainEqual(parseNote('F#'))
    expect(keySignature('D')?.scale).toContainEqual(parseNote('C#'))
    expect(keySignature('D')?.tonic).toEqual(parseNote('D'))
  })
})
