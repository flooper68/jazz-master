/** Difficulty as the player felt it, 1 (easy) to 10 (hard). Seven is not on offer: it is the non-answer. */
export const RATING_MIN = 1
export const RATING_MAX = 10
export const RATING_SKIPPED = 7

export function isRating(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= RATING_MIN &&
    value <= RATING_MAX &&
    value !== RATING_SKIPPED
  )
}

/** One played-through run of one exercise, recorded when it reaches the summary. */
export interface ExerciseRun {
  id: string
  exerciseId: string
  /** ISO 8601 timestamp of the first Play. */
  startedAt: string
  /** Time spent playing; setup and pauses are excluded. */
  durationSeconds: number
  /** The tempo the run ended at — the written one unless it was changed or ramped. */
  tempoBpm: number
  /** Whole passes through the tab. */
  passes: number
  /** True when the timer ran out or the passes were done; false when ended early with Finish. */
  completed: boolean
  /** How hard it felt, if the player said. */
  rating: number | null
}

/** What the player knows about a run when it ends — everything but its identity and rating. */
export type RunOutcome = Pick<
  ExerciseRun,
  'startedAt' | 'durationSeconds' | 'tempoBpm' | 'passes' | 'completed'
>
