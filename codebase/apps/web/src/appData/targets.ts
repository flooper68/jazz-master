import type { Exercise } from '../content'
import { activeGoals, type Goal } from './goal'

/**
 * How fast is fast enough. An exercise is written at a tempo, but what the
 * schedule judges it against is the tempo the *goal* wants it at — the same
 * lick is one thing on the way to a blues and another on the way to bebop
 * (docs/product/next-session-design.md §4).
 *
 * Resolved here, at fold time, and never stored: the fold keeps one state per
 * exercise and asks what its target is, so moving a target moves what "solid"
 * means from the next fold onward without rewriting a single run.
 *
 * The order is what the path asks of it, then what it is written at. There is
 * no third source: the per-exercise override went with the rest of priority
 * (ADR-022) — what it did, the teacher now does by editing the path.
 */

/** The tempo each exercise is judged against, by id. */
export function resolveTargets(catalog: readonly Exercise[], goals: readonly Goal[]): Map<string, number> {
  const fromPaths = new Map<string, number>()
  // Active paths only: a paused goal stops asking anything of its exercises.
  for (const goal of activeGoals(goals)) {
    for (const stage of goal.stages) {
      for (const item of stage.items) {
        // Two active goals can want the same exercise at different tempos. The
        // higher one wins: having it at the faster tempo satisfies both, and
        // the lower one would quietly call the harder goal finished.
        const already = fromPaths.get(item.exerciseId)
        fromPaths.set(item.exerciseId, Math.max(already ?? 0, item.targetTempoBpm))
      }
    }
  }

  return new Map(catalog.map((exercise) => [exercise.id, fromPaths.get(exercise.id) ?? exercise.tempoBpm]))
}
