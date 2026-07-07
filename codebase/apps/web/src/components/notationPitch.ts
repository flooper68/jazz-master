import {
  noteName,
  pitchClass,
  type GuitarString,
  type Letter,
  type PositionedNote,
} from '@jazz-master/theory'

/**
 * MIDI numbers of the open strings, standard tuning (string 1 = high E4).
 * Theory-core notes are octave-less; the sounding octave comes from where the
 * exercise puts the note on the neck.
 */
const OPEN_STRING_MIDI: Record<GuitarString, number> = {
  1: 64,
  2: 59,
  3: 55,
  4: 50,
  5: 45,
  6: 40,
}

/** A positioned note translated to what a staff renderer needs. */
export interface StavePitch {
  /** VexFlow key string carrying the theory-core spelling verbatim (`db/4`). */
  key: string
  /** Accidental glyph code (`b`, `bb`, `#`, `##`); null for naturals. */
  accidental: string | null
  letter: Letter
  octave: number
}

/**
 * Map a positioned note to its staff pitch. The octave is derived from the
 * sounding fret; the spelling stays the theory core's. Throws when spelling
 * and position disagree (content/programmer error — fail loudly, not with a
 * misdrawn score).
 */
export function stavePitch(position: PositionedNote): StavePitch {
  const { note, string, fret } = position
  const midi = OPEN_STRING_MIDI[string] + fret
  const letterPitch = pitchClass({ letter: note.letter, accidental: 0 })
  const octaveTimes12 = midi - letterPitch - note.accidental
  if (octaveTimes12 % 12 !== 0) {
    throw new Error(
      `${noteName(note)} does not sound at string ${string} fret ${fret}`,
    )
  }
  const octave = octaveTimes12 / 12 - 1
  const name = noteName(note)
  return {
    key: `${name.toLowerCase()}/${octave}`,
    accidental: note.accidental === 0 ? null : name.slice(1),
    letter: note.letter,
    octave,
  }
}
