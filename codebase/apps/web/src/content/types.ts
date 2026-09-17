import type { GuitarString } from '@jazz-master/theory'

/**
 * A lesson is a series of notes, written as tablature. The player renders the
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

/** One playable unit: a tab, a tempo, and how long to loop it. */
export interface Exercise {
  /** Unique across the whole curriculum — session records key on it. */
  id: string
  title: string
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
  /** What to know before playing this one, a paragraph per entry. */
  about?: readonly string[]
}

export const DEFAULT_BEATS_PER_BAR = 4

export type LessonArea = 'scales' | 'arpeggios' | 'chords' | 'standards'

/** An ordered run of exercises plus the metadata the list (and later the planner) reads. */
export interface Lesson {
  id: string
  title: string
  area: LessonArea
  /** Difficulty tier, 1 = beginner. */
  level: number
  /** Lesson ids to complete first. */
  prerequisites: readonly string[]
  estimatedMinutes: number
  exercises: readonly Exercise[]
  /** The lesson's story — the theory, the history, why it matters — a paragraph per entry. */
  intro?: readonly string[]
}
