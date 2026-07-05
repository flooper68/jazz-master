export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/**
 * A spelled note: letter + accidental offset (-2 = bb … 2 = ##). Transpose
 * math may exceed ±2; only ±2 is nameable (see noteName).
 */
export interface Note {
  letter: Letter
  accidental: number
}

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/** Semitones of each natural letter above C. */
export const LETTER_PITCH_CLASS: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const NOTE_NAME_PATTERN = /^([A-G])(bb|b|##|#)?$/

/** Parse an ASCII note name (`Eb`, `F#`, `Bbb`); null if unparseable. */
export function parseNote(name: string): Note | null {
  const match = NOTE_NAME_PATTERN.exec(name)
  if (!match) return null
  const letter = match[1] as Letter
  const suffix = match[2] ?? ''
  const accidental = suffix.startsWith('b') ? -suffix.length : suffix.length
  return { letter, accidental }
}

/**
 * Format a note back to its ASCII name (`{B,-2}` → `Bbb`). Throws beyond
 * double accidentals — transposing exotic roots (`Bbb` dim7) can produce
 * triple flats, which have no name and would break the parse round-trip.
 */
export function noteName(note: Note): string {
  if (Math.abs(note.accidental) > 2) {
    throw new Error(
      `No name for ${note.letter} with accidental ${note.accidental}`,
    )
  }
  const suffix =
    note.accidental < 0 ? 'b'.repeat(-note.accidental) : '#'.repeat(note.accidental)
  return note.letter + suffix
}

/** Chromatic pitch class 0–11 (C = 0); enharmonics collapse (B# → 0). */
export function pitchClass(note: Note): number {
  return (((LETTER_PITCH_CLASS[note.letter] + note.accidental) % 12) + 12) % 12
}
