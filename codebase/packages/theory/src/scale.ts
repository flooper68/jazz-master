import { transpose, type IntervalName } from './interval'
import { parseNote, type Note } from './note'

/**
 * Scale formulas as interval stacks over the root, like CHORD_FORMULAS.
 * Adding a scale is a data change: the jazz-first set covers the major modes,
 * melodic minor (jazz minor), harmonic minor, pentatonics, and blues.
 */
const SCALE_FORMULAS = {
  ionian: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'],
  dorian: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'],
  phrygian: ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7'],
  lydian: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'M7'],
  mixolydian: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'],
  aeolian: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'],
  locrian: ['P1', 'm2', 'm3', 'P4', 'd5', 'm6', 'm7'],
  melodicMinor: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'],
  harmonicMinor: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'],
  majorPentatonic: ['P1', 'M2', 'M3', 'P5', 'M6'],
  minorPentatonic: ['P1', 'm3', 'P4', 'P5', 'm7'],
  blues: ['P1', 'm3', 'P4', 'd5', 'P5', 'm7'],
} as const satisfies Record<string, readonly IntervalName[]>

export type ScaleType = keyof typeof SCALE_FORMULAS

export const SCALE_TYPES = Object.keys(SCALE_FORMULAS) as ScaleType[]

/**
 * Spell a scale as correctly-named notes. A string root is a programmer
 * convenience and throws if unparseable, matching spellChord.
 */
export function spellScale(root: Note | string, type: ScaleType): Note[] {
  const rootNote = typeof root === 'string' ? parseNote(root) : root
  if (!rootNote) {
    throw new Error(`Invalid scale root: ${String(root)}`)
  }
  return SCALE_FORMULAS[type].map((interval) => transpose(rootNote, interval))
}
