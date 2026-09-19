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
 */

export interface PathProgress {
  goal: Goal
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
): PathProgress {
  const solidity = goal.stages.map((stage) => {
    const solid = stage.items.filter((item) => isSolid(state.get(item.exerciseId))).length
    // An empty stage is as done as it can be.
    return stage.items.length === 0 ? 1 : solid / stage.items.length
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
      goal.stages[index].items.some((item) => (state.get(item.exerciseId)?.band ?? 'new') === 'new'),
    ) ?? null

  return { goal, solidity, openStages, nextStage }
}

/** Every active path's progress, in the order the goals were made. */
export function pathsProgress(
  goals: readonly Goal[],
  state: ReadonlyMap<string, ExerciseState>,
  constants: PlanConstants = PLAN_CONSTANTS,
): PathProgress[] {
  return activeGoals(goals).map((goal) => pathProgress(goal, state, constants))
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
      for (const item of path.goal.stages[index].items) ids.add(item.exerciseId)
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
