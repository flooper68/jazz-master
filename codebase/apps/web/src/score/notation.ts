import {
  diatonicStep,
  FLAT_ORDER,
  keySignature,
  midiAt,
  SHARP_ORDER,
  spellMidi,
  type KeySignature,
  type Letter,
} from '@jazz-master/theory'
import { stringsOf, type TabNote } from '../content'

/**
 * From a tab to staff positions: guitar is written in treble clef an octave
 * above where it sounds, spelled in the exercise's key, with accidentals
 * that carry through the bar like a copyist would write them.
 */

export interface StaffNote {
  /** Diatonic step of the written pitch (see diatonicStep); E4 on the bottom line is 30. */
  step: number
  /** Accidental to draw before the head, or null when the key/bar already implies it. */
  accidental: -1 | 0 | 1 | null
  midi: number
}

/** The bottom line of the treble staff. */
export const BOTTOM_LINE_STEP = 30
/** The middle line (B4): stems flip direction here. */
export const MIDDLE_LINE_STEP = 34
export const TOP_LINE_STEP = 38

// Where each sharp and flat sits in a treble-clef key signature.
const SHARP_STEPS: Record<Letter, number> = { F: 38, C: 35, G: 39, D: 36, A: 33, E: 37, B: 34 }
const FLAT_STEPS: Record<Letter, number> = { B: 34, E: 37, A: 33, D: 36, G: 32, C: 35, F: 31 }

export interface KeySignatureGlyph {
  accidental: -1 | 1
  step: number
}

export function keySignatureGlyphs(key: KeySignature | null): KeySignatureGlyph[] {
  if (!key || key.accidentals === 0) return []
  const order = key.accidentals > 0 ? SHARP_ORDER : FLAT_ORDER
  const steps = key.accidentals > 0 ? SHARP_STEPS : FLAT_STEPS
  const accidental = key.accidentals > 0 ? 1 : -1
  return order.slice(0, Math.abs(key.accidentals)).map((letter) => ({ accidental, step: steps[letter] }))
}

/** Width a clef, key signature and time signature take before the first bar. */
export function notationInset(key: KeySignature | null): number {
  return 34 + keySignatureGlyphs(key).length * 8 + 22
}

export function resolveKey(key: string | undefined): KeySignature | null {
  return key === undefined ? null : keySignature(key)
}

/**
 * The heads to draw for each tab event, bass first: one for a note, one per
 * string for a chord. Accidentals carry through the bar in the order the
 * heads are read, low to high within a chord.
 */
export function staffNotes(
  notes: readonly TabNote[],
  starts: readonly number[],
  beatsPerBar: number,
  key: KeySignature | null,
): StaffNote[][] {
  const inKey = new Map<Letter, number>()
  for (const note of key?.scale ?? []) inKey.set(note.letter, note.accidental)
  // Accidentals in force, by letter and octave, reset at every bar line.
  let bar = -1
  let inForce = new Map<string, number>()
  return notes.map((note, index) => {
    const thisBar = Math.floor(starts[index] / beatsPerBar + 1e-9)
    if (thisBar !== bar) {
      bar = thisBar
      inForce = new Map()
    }
    return stringsOf(note).map(({ string, fret }): StaffNote => {
      const midi = midiAt(string, fret)
      const pitch = spellMidi(midi + 12, key)
      const slot = `${pitch.letter}${pitch.octave}`
      const implied = inForce.get(slot) ?? inKey.get(pitch.letter) ?? 0
      let accidental: StaffNote['accidental'] = null
      if (pitch.accidental !== implied) {
        accidental = Math.sign(pitch.accidental) as -1 | 0 | 1
        inForce.set(slot, pitch.accidental)
      }
      return { step: diatonicStep(pitch), accidental, midi }
    })
  })
}

/** Of an event's heads, the one that decides its stem: farthest from the middle line. */
export function farthestStep(steps: readonly number[]): number {
  return steps.reduce((a, b) => (Math.abs(b - MIDDLE_LINE_STEP) > Math.abs(a - MIDDLE_LINE_STEP) ? b : a))
}

/** Ledger line steps a head at `step` needs, outside the five lines. */
export function ledgerSteps(step: number): number[] {
  const steps: number[] = []
  for (let s = BOTTOM_LINE_STEP - 2; s >= step; s -= 2) steps.push(s)
  for (let s = TOP_LINE_STEP + 2; s <= step; s += 2) steps.push(s)
  return steps
}
