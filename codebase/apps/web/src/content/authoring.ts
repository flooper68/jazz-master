import {
  midiAt,
  parseNote,
  scalePositions,
  STANDARD_TUNING,
  type FretRange,
  type ScaleType,
} from '@jazz-master/theory'
import type { TabNote } from './types'

/**
 * Authoring helpers: theory in, tab out. Lesson data is written as literal
 * tabs (see lessons.ts); these functions are how those tabs were produced and
 * how new ones get made, never something the player calls.
 */

/**
 * A scale played up through a fret window and back down, one note per eighth.
 * Notes are ordered by pitch, so the tab reads as the scale sounds; the top
 * note is not repeated at the turn, and the final root is held to the end of
 * its bar so the exercise closes on a bar line.
 */
export function scaleTab(
  root: string,
  scale: ScaleType,
  window: FretRange,
  beats = 0.5,
  beatsPerBar = 4,
): TabNote[] {
  const parsedRoot = parseNote(root)
  if (!parsedRoot) throw new Error(`Unparseable root "${root}"`)
  const up = scalePositions({ root: parsedRoot, type: scale }, window, STANDARD_TUNING)
    .map(({ string, fret }) => ({ string, fret, beats }))
    .sort((a, b) => midiAt(a.string, a.fret) - midiAt(b.string, b.fret))
  const down = up.slice(0, -1).reverse()
  const tab = [...up, ...down]
  const total = tab.length * beats
  const remainder = (beatsPerBar - (total % beatsPerBar)) % beatsPerBar
  const last = tab[tab.length - 1]
  tab[tab.length - 1] = { ...last, beats: last.beats + remainder }
  return tab
}
