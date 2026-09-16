import type {
  ChordQuality,
  FretRange,
  Letter,
  ScaleType,
} from '@jazz-master/theory'

/**
 * A note name as authored in content: natural, single flat, or single sharp.
 * Narrower than what parseNote accepts (no double accidentals) — curriculum
 * roots never need them, and the literal type catches typos at compile time.
 */
export type NoteName = Letter | `${Letter}b` | `${Letter}#`

/**
 * What an exercise asks the player to play — a reference into the theory
 * core, never a hard-coded note list. Only the kinds TASK-012/013 consume
 * exist; chord-voicing and standards material arrives with its first task.
 */
export type ExerciseMaterial =
  | { kind: 'scale'; root: NoteName; scale: ScaleType }
  | { kind: 'arpeggio'; root: NoteName; quality: ChordQuality }

/** How long to stay on an exercise: clocked or counted. */
export type ExerciseDuration =
  | { kind: 'minutes'; minutes: number }
  | { kind: 'repetitions'; count: number }

/** One playable unit: material + where on the neck + tempo + how long. The player renders it on the fretboard. */
export interface Exercise {
  /** Unique across the whole curriculum — session records key on it. */
  id: string
  title: string
  material: ExerciseMaterial
  /** Fret window the material is played in (the position, per positions.ts). */
  window: FretRange
  tempoBpm: number
  duration: ExerciseDuration
}

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
}
