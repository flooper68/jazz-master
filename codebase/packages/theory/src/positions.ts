import { arpeggio, type Chord } from './chord'
import {
  noteAt,
  STANDARD_TUNING,
  STRING_NUMBERS,
  type FretRange,
  type GuitarString,
  type Tuning,
} from './fretboard'
import { pitchClass, type Note } from './note'
import { spellScale, type Scale } from './scale'

/**
 * A fretboard position bound to what it means in a note sequence: the note
 * keeps the sequence's spelling (Eb7's seventh stays Db here even though
 * noteAt spells that fret C#), and degree is the 1-based index into the
 * sequence (scale degree for scales, chord-tone order for arpeggios).
 */
export interface PositionedNote {
  string: GuitarString
  fret: number
  note: Note
  degree: number
}

/**
 * Every position in the fret window sounding one of the given notes, ordered
 * low string (6) to high, then by fret — an ascending playable path. The
 * window is the position system: anchored ~4–5 fret windows now, and a later
 * CAGED or 3-notes-per-string layer just supplies its own windows. If two
 * notes share a pitch class, the earlier one claims the position.
 */
export function notePositions(
  notes: readonly Note[],
  window: FretRange,
  tuning: Tuning = STANDARD_TUNING,
): PositionedNote[] {
  if (
    !Number.isInteger(window.min) ||
    !Number.isInteger(window.max) ||
    window.min < 0
  ) {
    throw new Error(`Invalid fret window: ${window.min}–${window.max}`)
  }
  if (window.min > window.max) {
    throw new Error(`Invalid fret window: ${window.min}–${window.max}`)
  }
  const byPitchClass = new Map<number, { note: Note; degree: number }>()
  notes.forEach((note, i) => {
    const pc = pitchClass(note)
    if (!byPitchClass.has(pc)) {
      byPitchClass.set(pc, { note, degree: i + 1 })
    }
  })
  const positions: PositionedNote[] = []
  for (const string of [...STRING_NUMBERS].reverse()) {
    for (let fret = window.min; fret <= window.max; fret++) {
      const match = byPitchClass.get(pitchClass(noteAt(string, fret, tuning)))
      if (match) {
        positions.push({ string, fret, note: match.note, degree: match.degree })
      }
    }
  }
  return positions
}

/** Scale tones in the window — the raw material of a scale-position drill. */
export function scalePositions(
  scale: Scale,
  window: FretRange,
  tuning: Tuning = STANDARD_TUNING,
): PositionedNote[] {
  return notePositions(spellScale(scale.root, scale.type), window, tuning)
}

/** Chord tones in the window — same mechanism, fewer notes. */
export function arpeggioPositions(
  chord: Chord,
  window: FretRange,
  tuning: Tuning = STANDARD_TUNING,
): PositionedNote[] {
  return notePositions(arpeggio(chord.root, chord.quality), window, tuning)
}
