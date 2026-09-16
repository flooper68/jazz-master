import type { TabNote } from './types'

/**
 * Pure timing over a tab: where each note starts, how long one pass is, and
 * which note is current at a given point in time. The player feeds it the
 * elapsed beats since Play and reads back the cursor.
 */

/** Beat offset of each note from the start of the tab. */
export function noteStarts(notes: readonly TabNote[]): number[] {
  const starts: number[] = []
  let at = 0
  for (const note of notes) {
    starts.push(at)
    at += note.beats
  }
  return starts
}

/** Total beats in one pass through the tab. */
export function passBeats(notes: readonly TabNote[]): number {
  return notes.reduce((sum, note) => sum + note.beats, 0)
}

export interface Playhead {
  /** Index of the note sounding now. */
  noteIndex: number
  /** Passes through the tab completed before this one (0 during the first). */
  pass: number
}

/**
 * The cursor position after `elapsedBeats` of looping through the tab.
 * Returns null for an empty tab.
 */
export function playheadAt(
  notes: readonly TabNote[],
  elapsedBeats: number,
): Playhead | null {
  const length = passBeats(notes)
  if (notes.length === 0 || length <= 0) return null
  const clamped = Math.max(elapsedBeats, 0)
  const pass = Math.floor(clamped / length)
  const within = clamped - pass * length
  const starts = noteStarts(notes)
  let noteIndex = 0
  for (let i = 0; i < notes.length; i += 1) {
    if (starts[i] <= within) noteIndex = i
    else break
  }
  return { noteIndex, pass }
}

export function beatsElapsed(seconds: number, tempoBpm: number): number {
  return (seconds * tempoBpm) / 60
}
