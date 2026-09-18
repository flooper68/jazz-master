import type { Exercise } from '../content'
import { goalExerciseIds, type Goal, type Stage } from './goal'
import { dayKey, type ExerciseState } from './memory'
import type { PathProgress } from './path'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'

/**
 * What happens when a path runs out. A user with time left and nothing due is
 * the good problem — they have done everything the goal asked of them today —
 * and the wrong answer is an empty session or a shrug
 * (docs/product/next-session-design.md §9).
 *
 * So the app offers more: a next stage built from the pack, made of exercises
 * that belong with the ones the goal already has and ask a little more of the
 * player. The offer is **deterministic** — the same path and the same pack give
 * the same stage every time — so accepting it is a choice the user makes, not a
 * dice roll they can reroll.
 */

export interface Exhaustion {
  /** Every item of every open stage has been played today, and no stage can open. */
  exhausted: boolean
  /** The stage the app offers to add; null when the pack has nothing that fits. */
  expansion: Stage | null
}

/** The labels a goal's own exercises share — what "more of this" means for it. */
function dominantLabels(goal: Goal, byId: ReadonlyMap<string, Exercise>) {
  const counts = { contexts: new Map<string, number>(), styles: new Map<string, number>(), techniques: new Map<string, number>() }
  let topLevel = 1
  for (const id of goalExerciseIds(goal)) {
    const exercise = byId.get(id)
    if (!exercise) continue
    topLevel = Math.max(topLevel, exercise.level)
    for (const context of exercise.contexts ?? []) counts.contexts.set(context, (counts.contexts.get(context) ?? 0) + 1)
    for (const style of exercise.styles ?? []) counts.styles.set(style, (counts.styles.get(style) ?? 0) + 1)
    for (const technique of exercise.techniques ?? []) counts.techniques.set(technique, (counts.techniques.get(technique) ?? 0) + 1)
  }
  return { counts, topLevel }
}

/** Ordering that does not depend on the runtime's locale data. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** How much an exercise looks like the ones the goal already has. */
function kinship(exercise: Exercise, counts: ReturnType<typeof dominantLabels>['counts']): number {
  const score = (values: readonly string[] | undefined, tally: Map<string, number>) =>
    (values ?? []).reduce((sum, value) => sum + (tally.get(value) ?? 0), 0)
  return (
    score(exercise.contexts, counts.contexts) +
    score(exercise.styles, counts.styles) +
    score(exercise.techniques, counts.techniques)
  )
}

/**
 * The stage a path would grow by: exercises sharing its dominant labels, not
 * already in it, a level up or at the same level it already reaches, ordered by
 * series then level then catalog order so the result never depends on a clock
 * or a seed. Null when nothing in the pack is close enough to belong.
 */
export function expansionStage(
  goal: Goal,
  catalog: readonly Exercise[],
  constants: PlanConstants = PLAN_CONSTANTS,
): Stage | null {
  const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]))
  const { counts, topLevel } = dominantLabels(goal, byId)
  const already = new Set(goalExerciseIds(goal))
  // What the path asks of its last stage, carried to the new one.
  const lastStage = goal.stages[goal.stages.length - 1]
  const lastTarget = lastStage?.items[lastStage.items.length - 1]?.targetTempoBpm

  const candidates = catalog
    .map((exercise, rank) => ({ exercise, rank, kin: kinship(exercise, counts) }))
    .filter(({ exercise, kin }) => !already.has(exercise.id) && kin > 0 && exercise.level >= topLevel)
    .sort((a, b) =>
      // Closest kin first, then the gentler step up, then a series in its own
      // order, then the catalog — every tie broken by something fixed.
      b.kin - a.kin ||
      a.exercise.level - b.exercise.level ||
      // A plain comparison, not `localeCompare`: collation differs between the
      // browser and the worker, and the offer has to be the same in both.
      compare(a.exercise.series ?? '', b.exercise.series ?? '') ||
      a.rank - b.rank,
    )
    .slice(0, constants.expansionStageItems)

  if (candidates.length === 0) return null
  return {
    title: `More like this`,
    items: candidates.map(({ exercise }) => ({
      exerciseId: exercise.id,
      targetTempoBpm: lastTarget ?? exercise.tempoBpm,
    })),
  }
}

/**
 * Whether the paths have nothing left to give today, and what to offer if so.
 * Exhaustion is not "the session was short": it is every open stage played
 * today *and* no closed stage able to open, which is the user having genuinely
 * finished what the goal had for them.
 */
export function exhaustion(
  paths: readonly PathProgress[],
  state: ReadonlyMap<string, ExerciseState>,
  catalog: readonly Exercise[],
  today: Date = new Date(),
  constants: PlanConstants = PLAN_CONSTANTS,
): Exhaustion {
  if (paths.length === 0) return { exhausted: false, expansion: null }
  const day = dayKey(today)

  // "No stage can open" needs no test of its own: `openStages` is derived from
  // the state as it stands, so a stage that could open already is. What is left
  // to ask is whether everything open has been played today — and a closed
  // stage behind it opens on more days, not on more of this one.
  const spent = paths.every((path) => {
    const openItems = path.openStages
      .flatMap((index) => path.goal.stages[index].items)
      // A muted item is never played, so waiting for it to be played today
      // would mean the path was never spent and the offer never came.
      .filter((item) => !path.muted.has(item.exerciseId))
    return openItems.length > 0 && openItems.every((item) => state.get(item.exerciseId)?.lastReview === day)
  })

  if (!spent) return { exhausted: false, expansion: null }
  // The first path with somewhere to grow is the one offered; a user with two
  // goals is asked about one thing, not handed a menu.
  for (const path of paths) {
    const stage = expansionStage(path.goal, catalog, constants)
    if (stage) return { exhausted: true, expansion: stage }
  }
  return { exhausted: true, expansion: null }
}
