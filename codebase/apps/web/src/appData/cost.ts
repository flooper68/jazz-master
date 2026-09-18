import { exerciseSeconds, type Exercise } from '../content'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'
import type { ExerciseRun } from './run'

/**
 * What an exercise costs in minutes of a session. Pure, and the only thing the
 * assembler knows about time: it fills a budget with these numbers rather than
 * counting slots (docs/product/next-session-design.md §7).
 *
 * The truth is what it has actually taken. An exercise's written length says
 * how long the playing is; the runs say how long the user was really on it,
 * pauses to find the shape included. So the cost is the median of its completed
 * runs — the median rather than the mean, because one run left open while the
 * phone rang should not double the estimate for ever. With nothing to go on the
 * written length stands in.
 *
 * On top of either goes a fixed overhead: picking it up, reading the tab,
 * finding the first note. Five two-minute exercises are not a ten-minute
 * session, and a budget that pretends they are overruns every time.
 *
 * **Cost does not know the tempo it will be played at.** A repetition-counted
 * exercise taken at 85% does take longer, but the median of past runs cannot
 * know that either, and an estimate that swings with the tempo would make the
 * plan jitter for no gain. The warm-up's slower rep is inside the overhead's
 * margin.
 */

/** The median of a non-empty list of numbers; the mean of the two middles for an even count. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** What one exercise is expected to take, in seconds, given everything it has been played. */
export function exerciseCost(
  exercise: Exercise,
  runs: readonly ExerciseRun[],
  constants: PlanConstants = PLAN_CONSTANTS,
): number {
  // A run ended early tells us nothing about how long the exercise takes.
  const played = runs.filter((run) => run.completed && run.durationSeconds > 0).map((run) => run.durationSeconds)
  const playing = played.length > 0 ? median(played) : exerciseSeconds(exercise)
  return Math.round(playing + constants.exerciseOverheadSeconds)
}

/**
 * The cost of every exercise in the catalog, from the whole run history — the
 * shape the assembler takes. Runs of an exercise no longer in the catalog are
 * ignored, as everywhere else.
 */
export function exerciseCosts(
  runs: readonly ExerciseRun[],
  catalog: readonly Exercise[],
  constants: PlanConstants = PLAN_CONSTANTS,
): Map<string, number> {
  const byExercise = new Map<string, ExerciseRun[]>()
  for (const run of runs) {
    const existing = byExercise.get(run.exerciseId)
    if (existing) existing.push(run)
    else byExercise.set(run.exerciseId, [run])
  }
  return new Map(
    catalog.map((exercise) => [exercise.id, exerciseCost(exercise, byExercise.get(exercise.id) ?? [], constants)]),
  )
}

/** When the last run ended, or null when nothing has been played; the warm-up asks. */
export function lastRunEnded(runs: readonly ExerciseRun[]): Date | null {
  let latest: number | null = null
  for (const run of runs) {
    const ended = new Date(run.startedAt).valueOf() + run.durationSeconds * 1000
    // A timestamp that will not parse is skipped rather than compared: one NaN
    // at the head of the list would otherwise lose every real run behind it.
    if (!Number.isFinite(ended)) continue
    if (latest === null || ended > latest) latest = ended
  }
  return latest === null ? null : new Date(latest)
}
