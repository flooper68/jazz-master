import { midiAt } from '@jazz-master/theory'
import type { StringFret, TabNote } from './types'

/**
 * A tab event as the strings it is played on. Most of the app can read an
 * event as one note — its bass — and does; what draws it, sounds it or
 * measures its reach on the neck reads every string through here.
 */

/** Every string of an event, bass first: the note alone, or the chord it is the bass of. */
export function stringsOf(note: TabNote): StringFret[] {
  const bass = { string: note.string, fret: note.fret }
  return note.above?.length ? [bass, ...note.above.map(({ string, fret }) => ({ string, fret }))] : [bass]
}

/** The pitches an event sounds, bass first. */
export function midisOf(note: TabNote): number[] {
  return stringsOf(note).map((position) => midiAt(position.string, position.fret))
}

/** Whether an event is a chord: more than one string struck together. */
export function isChord(note: TabNote): boolean {
  return (note.above?.length ?? 0) > 0
}
