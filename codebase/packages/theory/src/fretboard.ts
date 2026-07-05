import { parseNote, pitchClass, type Note } from './note'

/** Guitar strings by convention: 1 = high E, 6 = low E. */
export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6

export const STRING_NUMBERS: readonly GuitarString[] = [1, 2, 3, 4, 5, 6]

/** Open-string note per string number. */
export type Tuning = Record<GuitarString, Note>

export const STANDARD_TUNING: Tuning = {
  1: parseNote('E')!,
  2: parseNote('B')!,
  3: parseNote('G')!,
  4: parseNote('D')!,
  5: parseNote('A')!,
  6: parseNote('E')!,
}

export interface FretboardPosition {
  string: GuitarString
  fret: number
}

export interface FretRange {
  min: number
  max: number
}

const DEFAULT_RANGE: FretRange = { min: 0, max: 15 }

/**
 * Fretted notes are spelled with sharps — a chromatic default, since a fret
 * position has no inherent key. Callers that know the key (chord/scale
 * drills) should label positions from spellChord/theory instead.
 */
const CHROMATIC_SHARP: readonly Note[] = [
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

function assertValidFret(fret: number): void {
  if (!Number.isInteger(fret) || fret < 0) {
    throw new Error(`Invalid fret: ${fret}`)
  }
}

/** The note sounding at a position (sharp-spelled; see CHROMATIC_SHARP). */
export function noteAt(
  string: GuitarString,
  fret: number,
  tuning: Tuning = STANDARD_TUNING,
): Note {
  assertValidFret(fret)
  return CHROMATIC_SHARP[(pitchClass(tuning[string]) + fret) % 12]
}

/**
 * All positions sounding the target's pitch class within the fret range,
 * ordered low string (6) to high, then by fret. Enharmonics match: Gb finds
 * the same positions as F#.
 */
export function positionsOf(
  target: Note | number,
  range: FretRange = DEFAULT_RANGE,
  tuning: Tuning = STANDARD_TUNING,
): FretboardPosition[] {
  assertValidFret(range.min)
  assertValidFret(range.max)
  if (range.min > range.max) {
    throw new Error(`Invalid fret range: ${range.min}–${range.max}`)
  }
  if (typeof target === 'number' && !Number.isInteger(target)) {
    throw new Error(`Invalid pitch class: ${target}`)
  }
  const targetPc =
    typeof target === 'number' ? ((target % 12) + 12) % 12 : pitchClass(target)
  const positions: FretboardPosition[] = []
  for (const string of [...STRING_NUMBERS].reverse()) {
    const openPc = pitchClass(tuning[string])
    for (let fret = range.min; fret <= range.max; fret++) {
      if ((openPc + fret) % 12 === targetPc) {
        positions.push({ string, fret })
      }
    }
  }
  return positions
}
