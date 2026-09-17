import type { Exercise, TabNote } from './types'

/**
 * Pure timing over a tab: where each note starts, how long one pass is, and
 * which note sounds at a beat. The player's transport (player/plan.ts) turns
 * clock time into beats and reads the cursor back from here.
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

/** How long the exercise asks for at its written tempo, in seconds. */
export function exerciseSeconds(exercise: Exercise): number {
  if (exercise.duration.kind === 'minutes') return exercise.duration.minutes * 60
  return (exercise.duration.count * passBeats(exercise.notes) * 60) / exercise.tempoBpm
}

/** Index of the note sounding at a beat of a single pass, or null before the first onset. */
export function noteIndexAt(notes: readonly TabNote[], beat: number): number | null {
  const starts = noteStarts(notes)
  let index: number | null = null
  for (let i = 0; i < starts.length; i += 1) {
    if (starts[i] <= beat + 1e-9) index = i
    else break
  }
  return index
}
