import type { GuitarString } from '@jazz-master/theory'
import type {
  ExerciseArea,
  ExerciseContext,
  ExerciseFeel,
  ExerciseStyle,
  ExerciseTechnique,
  ExerciseVoicing,
} from './taxonomy'

/**
 * An exercise is a series of notes, written as tablature. The player renders the
 * tab and moves a cursor through it on the click's clock; nothing is resolved
 * from theory at play time. Theory helpers (scale/arpeggio generators) are
 * authoring tools that emit these notes — see `authoring.ts`.
 */

/** A place on the neck: a string and a fret on it. */
export interface StringFret {
  string: GuitarString
  fret: number
}

/**
 * One event of a tab: where to play it and how long it lasts, in beats. A
 * note is one string; a chord is that string — its lowest, the bass — with
 * more strings stacked `above` it, struck together.
 */
export interface TabNote extends StringFret {
  /** Length in beats at the exercise tempo (0.5 = an eighth in 4/4). */
  beats: number
  /**
   * The other strings of a chord, each higher in pitch than the last: the
   * note itself is the bass. Absent or empty for a single note.
   */
  above?: readonly StringFret[]
}

/** How long to stay on an exercise: clocked, or a number of passes through the tab. */
export type ExerciseDuration =
  | { kind: 'minutes'; minutes: number }
  | { kind: 'repetitions'; count: number }

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
  /**
   * The note the material is built on, when that is not the key's own tonic:
   * `A` for A minor pentatonic written in C's signature, `D` for D Dorian. It
   * is the root the neck diagram marks. Omitted: the key's tonic.
   */
  tonic?: string
  /** Beats per bar; 4 unless the exercise says otherwise. */
  beatsPerBar?: number
  /** The story and what to know before playing — the theory, the fingering — a paragraph per entry. */
  about?: readonly string[]
  /** Styles of music it belongs to; none means a fundamental, at home in all of them. */
  styles?: readonly ExerciseStyle[]
  /** The harmony it is played over. */
  contexts?: readonly ExerciseContext[]
  /** What it trains the hands to do. */
  techniques?: readonly ExerciseTechnique[]
  /** How the subdivision is felt. */
  feel?: ExerciseFeel
  /** Kinds of chord shape, for an exercise in the chords area. */
  voicings?: readonly ExerciseVoicing[]
  /** Exercises sharing a series belong together and are learned in list order: the five boxes, a scale through its keys. */
  series?: string
  /** The owner's own labels, free text; searched, never offered as a filter. */
  tags?: readonly string[]
}

export const DEFAULT_BEATS_PER_BAR = 4
