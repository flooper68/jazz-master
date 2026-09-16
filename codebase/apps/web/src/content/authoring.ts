import {
  parseNote,
  scalePositions,
  STANDARD_TUNING,
  type FretRange,
  type GuitarString,
  type ScaleType,
} from '@jazz-master/theory'
import type { TabNote } from './types'

/**
 * Authoring helpers: theory in, tab out. Lesson data is written as literal
 * tabs (see lessons.ts); these functions are how those tabs were produced and
 * how new ones get made, never something the player calls.
 */

// Open-string MIDI numbers in standard tuning, string 6 (low E) to 1.
const OPEN_MIDI: Record<GuitarString, number> = {
  6: 40,
  5: 45,
  4: 50,
  3: 55,
  2: 59,
  1: 64,
}

function midi(string: GuitarString, fret: number): number {
  return OPEN_MIDI[string] + fret
}

/**
 * A scale played up through a fret window and back down, one note per eighth.
 * Notes are ordered by pitch, so the tab reads as the scale sounds; the top
 * note is not repeated at the turn.
 */
export function scaleTab(
  root: string,
  scale: ScaleType,
  window: FretRange,
  beats = 0.5,
): TabNote[] {
  const parsedRoot = parseNote(root)
  if (!parsedRoot) throw new Error(`Unparseable root "${root}"`)
  const up = scalePositions({ root: parsedRoot, type: scale }, window, STANDARD_TUNING)
    .map(({ string, fret }) => ({ string, fret, beats }))
    .sort((a, b) => midi(a.string, a.fret) - midi(b.string, b.fret))
  const down = up.slice(0, -1).reverse()
  return [...up, ...down]
}
