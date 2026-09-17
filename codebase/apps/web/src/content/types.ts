import type { GuitarString } from '@jazz-master/theory'

/**
 * An exercise is a series of notes, written as tablature. The player renders the
 * tab and moves a cursor through it on the click's clock; nothing is resolved
 * from theory at play time. Theory helpers (scale/arpeggio generators) are
 * authoring tools that emit these notes — see `authoring.ts`.
 */

/** One note of a tab: where to play it and how long it lasts, in beats. */
export interface TabNote {
  string: GuitarString
  fret: number
  /** Length in beats at the exercise tempo (0.5 = an eighth in 4/4). */
  beats: number
}

/** How long to stay on an exercise: clocked, or a number of passes through the tab. */
export type ExerciseDuration =
  | { kind: 'minutes'; minutes: number }
  | { kind: 'repetitions'; count: number }

export type ExerciseArea = 'scales' | 'arpeggios' | 'chords' | 'standards'

/**
 * The blueprint of one playable unit: a tab, a tempo, how long to loop it,
 * and the metadata the list (and later the planner) reads.
 */
export interface Exercise {
  /** Unique across the pack — the URL names it, and later run records will key on it. */
  id: string
  title: string
  area: ExerciseArea
  /** Difficulty tier, 1 = beginner. */
  level: number
  tempoBpm: number
  duration: ExerciseDuration
  notes: readonly TabNote[]
  /**
   * Major key the notation is spelled in (`F`, `Bb`, `F#`), which also sets
   * the key signature. Omitted: C major, sharps for anything chromatic.
   */
  key?: string
  /** Beats per bar; 4 unless the exercise says otherwise. */
  beatsPerBar?: number
  /** The story and what to know before playing — the theory, the fingering — a paragraph per entry. */
  about?: readonly string[]
}

export const DEFAULT_BEATS_PER_BAR = 4
