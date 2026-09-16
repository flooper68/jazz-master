import { LETTERS, parseNote, pitchClass, type Letter, type Note } from './note'

/**
 * Pitches with octaves — what notation and a synthesizer need, where the rest
 * of the theory core works in pitch classes. MIDI numbering: C4 = 60.
 */

/** A note plus its octave in scientific pitch notation (C4 = middle C). */
export interface SpelledPitch extends Note {
  octave: number
}

export type AccidentalPreference = 'sharps' | 'flats'

const SHARP_SPELLINGS: readonly Note[] = [
  { letter: 'C', accidental: 0 },
  { letter: 'C', accidental: 1 },
  { letter: 'D', accidental: 0 },
  { letter: 'D', accidental: 1 },
  { letter: 'E', accidental: 0 },
  { letter: 'F', accidental: 0 },
  { letter: 'F', accidental: 1 },
  { letter: 'G', accidental: 0 },
  { letter: 'G', accidental: 1 },
  { letter: 'A', accidental: 0 },
  { letter: 'A', accidental: 1 },
  { letter: 'B', accidental: 0 },
]

const FLAT_SPELLINGS: readonly Note[] = [
  { letter: 'C', accidental: 0 },
  { letter: 'D', accidental: -1 },
  { letter: 'D', accidental: 0 },
  { letter: 'E', accidental: -1 },
  { letter: 'E', accidental: 0 },
  { letter: 'F', accidental: 0 },
  { letter: 'G', accidental: -1 },
  { letter: 'G', accidental: 0 },
  { letter: 'A', accidental: -1 },
  { letter: 'A', accidental: 0 },
  { letter: 'B', accidental: -1 },
  { letter: 'B', accidental: 0 },
]

/** MIDI number of a spelled pitch (`{C, 0, 4}` → 60, `{B, 1, 3}` → 60). */
export function midiOf(pitch: SpelledPitch): number {
  return (pitch.octave + 1) * 12 + pitchClass(pitch) + accidentalOctaveCarry(pitch)
}

// B#3 sounds as C4 and Cb4 as B3: pitchClass wraps, the octave must follow.
function accidentalOctaveCarry(pitch: SpelledPitch): number {
  const raw = letterSemitones(pitch.letter) + pitch.accidental
  if (raw >= 12) return 12
  if (raw < 0) return -12
  return 0
}

function letterSemitones(letter: Letter): number {
  return pitchClass({ letter, accidental: 0 })
}

/**
 * Spell a MIDI number in the given key. In-key notes take the key's own
 * spelling (Bb in F major, A# in B major); notes outside the key follow the
 * key's accidental preference — flats in flat keys, sharps elsewhere.
 */
export function spellMidi(midi: number, key: KeySignature | null = null): SpelledPitch {
  if (!Number.isInteger(midi) || midi < 0) throw new Error(`Invalid MIDI number: ${midi}`)
  const pc = midi % 12
  const inKey = key?.scale.find((note) => pitchClass(note) === pc)
  const prefer: AccidentalPreference = key && key.accidentals < 0 ? 'flats' : 'sharps'
  const note = inKey ?? (prefer === 'flats' ? FLAT_SPELLINGS[pc] : SHARP_SPELLINGS[pc])
  const octave = Math.floor(midi / 12) - 1
  // A spelling whose letter wraps the octave boundary (Cb, B#) carries.
  const raw = letterSemitones(note.letter) + note.accidental
  const carry = raw >= 12 ? -1 : raw < 0 ? 1 : 0
  return { ...note, octave: octave + carry }
}

/**
 * Diatonic step index of a spelled pitch — C0 is 0, D0 is 1, C1 is 7. Two
 * pitches a step apart sit on adjacent line/space positions of a staff, so
 * this is what a renderer places note heads by.
 */
export function diatonicStep(pitch: Pick<SpelledPitch, 'letter' | 'octave'>): number {
  return pitch.octave * 7 + LETTERS.indexOf(pitch.letter)
}

/** Order in which sharps and flats accumulate in key signatures. */
export const SHARP_ORDER: readonly Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
export const FLAT_ORDER: readonly Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

export interface KeySignature {
  /** The major key's tonic. */
  tonic: Note
  /** Positive = that many sharps, negative = that many flats. */
  accidentals: number
  /** The seven notes of the major scale, spelled as the signature spells them. */
  scale: readonly Note[]
}

// Major keys on the circle of fifths, sharps positive.
const MAJOR_KEY_ACCIDENTALS: Record<string, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  'F#': 6,
  'C#': 7,
  F: -1,
  Bb: -2,
  Eb: -3,
  Ab: -4,
  Db: -5,
  Gb: -6,
  Cb: -7,
}

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]

/**
 * The key signature of a major key given its tonic (`F`, `Bb`, `F#`); null
 * for a tonic no standard signature spells (`G#` major, `Fb`).
 */
export function keySignature(tonic: string): KeySignature | null {
  const note = parseNote(tonic)
  const accidentals = MAJOR_KEY_ACCIDENTALS[tonic]
  if (!note || accidentals === undefined) return null
  const altered = new Map<Letter, number>()
  const order = accidentals >= 0 ? SHARP_ORDER : FLAT_ORDER
  for (const letter of order.slice(0, Math.abs(accidentals))) {
    altered.set(letter, Math.sign(accidentals))
  }
  const tonicIndex = LETTERS.indexOf(note.letter)
  const scale = MAJOR_STEPS.map((_, degree) => {
    const letter = LETTERS[(tonicIndex + degree) % 7]
    return { letter, accidental: altered.get(letter) ?? 0 }
  })
  return { tonic: note, accidentals, scale }
}
