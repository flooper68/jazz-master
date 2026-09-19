import { exerciseStateAnswer, goalsAnswer, nextSessionAnswer } from '../../agentTools/descriptors'
import {
  goalInputSchema,
  parseGoalInput,
  PRIORITIES,
  stageSchema,
  type ExercisePriority,
  type Goal,
} from '../../appData/goal'
import { foldRuns } from '../../appData/memory'
import { resolveTargets } from '../../appData/targets'
import { EXERCISES, type Exercise } from '../../content'
import { GoalLimitError, PriorityLimitError, type GoalRepository } from '../db/goals'
import type { RunRepository } from '../db/runs'
import type { UserExerciseRepository } from '../db/userExercises'
import { listLibrary } from './library'

/**
 * Goals and paths as the outside sees them. tRPC (the app) and MCP (an AI
 * client) both come through here, so a path is held to the same rules whichever
 * door it arrived by: every exercise it names has to be one this user can
 * actually play, and an exercise belongs to one stage. Results are plain data
 * with a `status`, never a thrown database error.
 */

type Unavailable = { status: 'unconfigured' }
type ReadFailed = { status: 'error'; message: 'Goal read failed' }
type WriteFailed = { status: 'error'; message: 'Goal write failed' }
type PlanReadFailed = { status: 'error'; message: 'Practice plan read failed' }

export type GoalListResult =
  | ReturnType<typeof goalsAnswer>
  | Unavailable
  | ReadFailed

export type GoalWriteResult =
  | { status: 'ok'; goal: Goal }
  | { status: 'invalid'; problems: string[] }
  | { status: 'full'; message: string }
  | { status: 'not_found' }
  | Unavailable
  | WriteFailed

export type PriorityWriteResult =
  | { status: 'ok'; priority: ExercisePriority | null }
  | { status: 'invalid'; problems: string[] }
  | { status: 'full'; message: string }
  | Unavailable
  | WriteFailed

export type ExerciseStateResult = ReturnType<typeof exerciseStateAnswer> | Unavailable | ReadFailed

export type NextSessionResult = ReturnType<typeof nextSessionAnswer> | Unavailable | PlanReadFailed

export interface GoalStores {
  goals: GoalRepository | null
  userExercises: UserExerciseRepository | null
  // `undefined` as well as null: the tRPC context leaves it out when there is
  // no database at all, and both doors hand their own context in whole.
  runs?: RunRepository | null
}

/** Everything this user could put in a path: the pack plus their own library. */
async function catalogFor(stores: GoalStores, clerkUserId: string): Promise<Exercise[]> {
  const library = await listLibrary(stores.userExercises, clerkUserId)
  return library.status === 'ok' ? [...EXERCISES, ...library.exercises] : [...EXERCISES]
}

export async function listGoals(stores: GoalStores, clerkUserId: string): Promise<GoalListResult> {
  if (!stores.goals) return { status: 'unconfigured' }
  try {
    const [goals, priorities, catalog] = await Promise.all([
      stores.goals.listGoals(clerkUserId),
      stores.goals.listPriorities(clerkUserId),
      catalogFor(stores, clerkUserId),
    ])
    // Solidity is what the scheduler thinks, so it is worked out the same way:
    // the fold, against the targets the paths themselves ask for.
    const runs = stores.runs ? await stores.runs.listRuns(clerkUserId) : []
    const state = foldRuns(runs, catalog, undefined, resolveTargets(catalog, goals, priorities))
    return goalsAnswer(goals, priorities, state)
  } catch {
    return { status: 'error', message: 'Goal read failed' }
  }
}

/** Create a goal, or replace one whole when a `goalId` is given. */
export async function saveGoal(
  stores: GoalStores,
  clerkUserId: string,
  goalId: unknown,
  goal: unknown,
): Promise<GoalWriteResult> {
  if (!stores.goals) return { status: 'unconfigured' }
  if (goalId !== undefined && typeof goalId !== 'string') {
    return { status: 'invalid', problems: ['goalId: give the id of a goal from list_goals, or leave it out to create one'] }
  }
  try {
    const catalog = await catalogFor(stores, clerkUserId)
    const parsed = parseGoalInput(goal, new Set(catalog.map((exercise) => exercise.id)))
    if (!parsed.ok) return { status: 'invalid', problems: parsed.problems }

    if (goalId === undefined) {
      return { status: 'ok', goal: await stores.goals.createGoal(clerkUserId, parsed.goal) }
    }
    const updated = await stores.goals.updateGoal(clerkUserId, goalId, parsed.goal)
    return updated ? { status: 'ok', goal: updated } : { status: 'not_found' }
  } catch (error) {
    if (error instanceof GoalLimitError) return { status: 'full', message: error.message }
    return { status: 'error', message: 'Goal write failed' }
  }
}

/** Replace a goal's stages, leaving its title, status and weight where they are. */
export async function savePath(
  stores: GoalStores,
  clerkUserId: string,
  goalId: unknown,
  stages: unknown,
): Promise<GoalWriteResult> {
  if (!stores.goals) return { status: 'unconfigured' }
  if (typeof goalId !== 'string') {
    return { status: 'invalid', problems: ['goalId: give the id of a goal from list_goals'] }
  }
  const shape = stageSchema.array().safeParse(stages)
  if (!shape.success) {
    return {
      status: 'invalid',
      problems: shape.error.issues.map((issue) => `stages.${issue.path.join('.')}: ${issue.message}`),
    }
  }
  try {
    const existing = (await stores.goals.listGoals(clerkUserId)).find((goal) => goal.id === goalId)
    if (!existing) return { status: 'not_found' }
    // The rest of the goal is untouched; only the path is being replaced.
    // `safeParse`, not `parse`: an empty stage list passes the array schema and
    // would otherwise throw here, handing the caller a generic write failure in
    // place of the one thing they could act on.
    const { id: _id, ...rest } = existing
    const whole = goalInputSchema.safeParse({ ...rest, stages: shape.data })
    if (!whole.success) {
      return {
        status: 'invalid',
        problems: whole.error.issues.map((issue) => `${issue.path.join('.') || 'stages'}: ${issue.message}`),
      }
    }
    return await saveGoal(stores, clerkUserId, goalId, whole.data)
  } catch (error) {
    if (error instanceof GoalLimitError) return { status: 'full', message: error.message }
    return { status: 'error', message: 'Goal write failed' }
  }
}

export async function savePriority(
  stores: GoalStores,
  clerkUserId: string,
  exerciseId: unknown,
  priority: unknown,
  targetOverrideBpm: unknown,
): Promise<PriorityWriteResult> {
  if (!stores.goals) return { status: 'unconfigured' }
  const problems: string[] = []
  if (typeof exerciseId !== 'string' || exerciseId.trim().length === 0) {
    problems.push('exerciseId: give the id of an exercise from list_builtin_exercises or list_exercises')
  }
  if (priority !== null && !(PRIORITIES as readonly unknown[]).includes(priority)) {
    problems.push(`priority: one of ${PRIORITIES.join(', ')}, or null to clear it`)
  }
  const override =
    targetOverrideBpm === undefined || targetOverrideBpm === null ? null : Number(targetOverrideBpm)
  if (override !== null && (!Number.isInteger(override) || override <= 0)) {
    problems.push('targetOverrideBpm: a tempo in beats per minute, or null')
  }
  if (problems.length > 0) return { status: 'invalid', problems }

  try {
    const catalog = await catalogFor(stores, clerkUserId)
    if (!catalog.some((exercise) => exercise.id === exerciseId)) {
      return { status: 'invalid', problems: [`exerciseId: no exercise "${String(exerciseId)}"`] }
    }
    const saved = await stores.goals.setPriority(
      clerkUserId,
      exerciseId as string,
      priority as ExercisePriority['priority'] | null,
      override,
    )
    return { status: 'ok', priority: saved }
  } catch (error) {
    if (error instanceof PriorityLimitError) return { status: 'full', message: error.message }
    return { status: 'error', message: 'Goal write failed' }
  }
}

/**
 * The four things any plan is made from, for this user, read together. It
 * exists so that no caller has to remember the last two: leaving the paths and
 * the priorities out is exactly how the practice offered over MCP came to
 * ignore the user's goals (JM-11).
 */
async function planInputs(stores: GoalStores & { runs: RunRepository }, clerkUserId: string) {
  const [runs, catalog, goals, priorities] = await Promise.all([
    stores.runs.listRuns(clerkUserId),
    catalogFor(stores, clerkUserId),
    stores.goals ? stores.goals.listGoals(clerkUserId) : Promise.resolve([]),
    stores.goals ? stores.goals.listPriorities(clerkUserId) : Promise.resolve([]),
  ])
  return { runs, catalog, goals, priorities }
}

/** What the scheduler knows about every exercise. */
export async function exerciseState(stores: GoalStores, clerkUserId: string): Promise<ExerciseStateResult> {
  if (!stores.runs) return { status: 'unconfigured' }
  try {
    const { runs, catalog, goals, priorities } = await planInputs({ ...stores, runs: stores.runs }, clerkUserId)
    return exerciseStateAnswer(runs, catalog, goals, priorities)
  } catch {
    return { status: 'error', message: 'Goal read failed' }
  }
}

/**
 * What to practise now: the same read as `exerciseState`, answered as a plan
 * rather than as a state. The message on failure names the plan, not the runs —
 * the paths and the library are read here too, and any of them can be what went
 * wrong.
 */
export async function nextSession(stores: GoalStores, clerkUserId: string): Promise<NextSessionResult> {
  if (!stores.runs) return { status: 'unconfigured' }
  try {
    const { runs, catalog, goals, priorities } = await planInputs({ ...stores, runs: stores.runs }, clerkUserId)
    return nextSessionAnswer(runs, catalog, goals, priorities)
  } catch {
    return { status: 'error', message: 'Practice plan read failed' }
  }
}
