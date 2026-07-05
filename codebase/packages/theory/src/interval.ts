import { LETTER_PITCH_CLASS, LETTERS, type Note } from './note'

/**
 * Each interval is letter steps + total semitones. Transposition moves the
 * letter first and derives the accidental from the semitone target, so
 * spelling is correct by construction (Eb + m7 = Db, never C#).
 */
const INTERVALS = {
  P1: { steps: 0, semitones: 0 },
  m2: { steps: 1, semitones: 1 },
  M2: { steps: 1, semitones: 2 },
  m3: { steps: 2, semitones: 3 },
  M3: { steps: 2, semitones: 4 },
  P4: { steps: 3, semitones: 5 },
  A4: { steps: 3, semitones: 6 },
  d5: { steps: 4, semitones: 6 },
  P5: { steps: 4, semitones: 7 },
  A5: { steps: 4, semitones: 8 },
  m6: { steps: 5, semitones: 8 },
  M6: { steps: 5, semitones: 9 },
  d7: { steps: 6, semitones: 9 },
  m7: { steps: 6, semitones: 10 },
  M7: { steps: 6, semitones: 11 },
  P8: { steps: 7, semitones: 12 },
  b9: { steps: 8, semitones: 13 },
  '9': { steps: 8, semitones: 14 },
  '#9': { steps: 8, semitones: 15 },
  '11': { steps: 10, semitones: 17 },
  '#11': { steps: 10, semitones: 18 },
  b13: { steps: 12, semitones: 20 },
  '13': { steps: 12, semitones: 21 },
} as const satisfies Record<string, { steps: number; semitones: number }>

export type IntervalName = keyof typeof INTERVALS

/** Transpose a note up by a named interval, preserving correct spelling. */
export function transpose(note: Note, interval: IntervalName): Note {
  const { steps, semitones } = INTERVALS[interval]
  const letterIndex = LETTERS.indexOf(note.letter)
  const letter = LETTERS[(letterIndex + steps) % 7]
  const octaves = Math.floor((letterIndex + steps) / 7)
  const targetPitch =
    LETTER_PITCH_CLASS[note.letter] + note.accidental + semitones
  const accidental = targetPitch - (LETTER_PITCH_CLASS[letter] + octaves * 12)
  return { letter, accidental }
}
