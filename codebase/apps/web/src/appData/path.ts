import type { ExerciseState } from './memory'
import { activeGoals, type Goal } from './goal'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'

/**
 * Which of a path's stages are open. A stage opens when the one before it is
 * mostly solid — not perfectly, because waiting for every last item would stall
 * the whole goal on one stubborn exercise (docs/product/next-session-design.md
 * §4).
 *
 * **Stages gate what is new, and nothing else.** An exercise already in the
 * user's history keeps coming back on its own schedule whatever stage it sits
 * in: the fold owes it a review, and a gate that swallowed that would quietly
 * drop work the user had already started. What a closed stage withholds is the
 * *introduction* of its items.
 *
 * **A muted exercise is not part of the count.** The user has said they never
 * want to see it; if it still counted toward a stage's solidity it could never
 * become solid, the stage behind it would never open, and the path would be
 * stuck for good on something its owner has explicitly put down.
 */

export interface PathProgress {
  goal: Goal
  /** What the user has muted, so the rest of the scheduler counts it the same way. */
  muted: ReadonlySet<string>
  /** How solid each stage is, 0–1, stage by stage. */
  solidity: number[]
  /** Stages open for new items: every stage up to and including the first unfinished one. */
  openStages: number[]
  /** The lowest open stage with anything not yet played; null when the path has nothing left to give. */
  nextStage: number | null
}

function isSolid(state: ExerciseState | undefined): boolean {
  // `fine` and `easy` are the bands that mean "played through at the target,
  // more than once" — the fold's own definition of solid.
  return state?.band === 'fine' || state?.band === 'easy'
}

/** How far along one path is, and what it is willing to introduce next. */
export function pathProgress(
  goal: Goal,
  state: ReadonlyMap<string, ExerciseState>,
  constants: PlanConstants = PLAN_CONSTANTS,
  /** Exercises the user has muted; they count for nothing, either way. */
  muted: ReadonlySet<string> = new Set(),
): PathProgress {
  const solidity = goal.stages.map((stage) => {
    const counted = stage.items.filter((item) => !muted.has(item.exerciseId))
    const solid = counted.filter((item) => isSolid(state.get(item.exerciseId))).length
    // A stage of nothing but muted items is as done as it can be.
    return counted.length === 0 ? 1 : solid / counted.length
  })

  // The first stage is always open. Each next one opens only if every stage
  // before it has reached the threshold, so a path cannot be entered halfway.
  const openStages: number[] = []
  for (const [index] of goal.stages.entries()) {
    if (index === 0 || solidity[index - 1] >= constants.stageSolidThreshold) openStages.push(index)
    else break
  }

  const nextStage =
    openStages.find((index) =>
      goal.stages[index].items.some(
        (item) => !muted.has(item.exerciseId) && (state.get(item.exerciseId)?.band ?? 'new') === 'new',
      ),
    ) ?? null

  return { goal, muted, solidity, openStages, nextStage }
}

/** Every active path's progress, in the order the goals were made. */
export function pathsProgress(
  goals: readonly Goal[],
  state: ReadonlyMap<string, ExerciseState>,
  constants: PlanConstants = PLAN_CONSTANTS,
  muted: ReadonlySet<string> = new Set(),
): PathProgress[] {
  return activeGoals(goals).map((goal) => pathProgress(goal, state, constants, muted))
}

/**
 * The new items an active path is willing to introduce today, lowest open
 * stage first. With no active goals the whole pack is one implicit path and
 * this says nothing — the assembler falls back to catalog order.
 */
export function eligibleNewIds(progress: readonly PathProgress[]): Set<string> {
  const ids = new Set<string>()
  for (const path of progress) {
    for (const index of path.openStages) {
      for (const item of path.goal.stages[index].items) {
        if (!path.muted.has(item.exerciseId)) ids.add(item.exerciseId)
      }
    }
  }
  return ids
}

/** Which goal an exercise belongs to, for splitting a session's work by weight. */
export function goalOfExercise(progress: readonly PathProgress[]): Map<string, PathProgress> {
  const owner = new Map<string, PathProgress>()
  for (const path of progress) {
    for (const stage of path.goal.stages) {
      for (const item of stage.items) if (!owner.has(item.exerciseId)) owner.set(item.exerciseId, path)
    }
  }
  return owner
}
