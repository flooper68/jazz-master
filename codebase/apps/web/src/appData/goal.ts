import { z } from 'zod'
import { MAX_TEMPO, MIN_TEMPO } from '../player/transport'

/**
 * A goal is something the user is trying to be able to do, and a **path** is
 * how the practice gets there: ordered stages of exercises, each with the
 * tempo that counts as having it (docs/product/next-session-design.md §4).
 *
 * A stage opens when the one before it is mostly solid, so the pack arrives in
 * an order that makes sense rather than all at once. Like a routine, a path
 * holds references and not copies: an exercise edited in the library is what
 * the path plays next time.
 *
 * Paths are written through the agent tools, not a form — the owner writes the
 * first ones from Claude Code over MCP, and step 5's lesson writes them after
 * that. The app's own goal page edits what is there; it does not author.
 */

export const MOST_STAGES = 12
export const MOST_STAGE_ITEMS = 20

export const GOAL_STATUSES = ['active', 'paused', 'done'] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const stageItemSchema = z.strictObject({
  /** A pack id (`scales-major-open-c`) or a library id (`user-<uuid>`). */
  exerciseId: z.string().trim().min(1).max(100),
  /**
   * What counts as having this one, for this goal. It replaces the exercise's
   * own written tempo wherever the schedule asks how fast is fast enough.
   */
  targetTempoBpm: z.number().int().min(MIN_TEMPO).max(MAX_TEMPO),
})

export const stageSchema = z.strictObject({
  /** What this stage is for, in a few words; the page falls back to its number. */
  title: z.string().trim().max(80).optional(),
  items: z.array(stageItemSchema).min(1).max(MOST_STAGE_ITEMS),
})

export const goalInputSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  /** The day it is wanted by, `YYYY-MM-DD`; nothing schedules from it yet. */
  targetDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(GOAL_STATUSES).default('active'),
  /**
   * How much of a session this goal gets when several are active, as a share
   * of the total weight. Equal weights split the work evenly.
   */
  weight: z.number().min(0.1).max(10).default(1),
  stages: z.array(stageSchema).min(1).max(MOST_STAGES),
})

export type StageItem = z.infer<typeof stageItemSchema>
export type Stage = z.infer<typeof stageSchema>
export type GoalInput = z.infer<typeof goalInputSchema>

/** A goal as stored: the input plus its identity. */
export interface Goal extends GoalInput {
  id: string
}

export const goalSchema = goalInputSchema.extend({ id: z.string().min(1) })

/** What the user has said about one exercise, over and above what the path says. */
export const PRIORITIES = ['pinned', 'boosted', 'muted'] as const
export type Priority = (typeof PRIORITIES)[number]

export const prioritySchema = z.strictObject({
  exerciseId: z.string().trim().min(1).max(100),
  priority: z.enum(PRIORITIES),
  /** Judge it against this instead of the path's target or its own. */
  targetOverrideBpm: z.number().int().min(MIN_TEMPO).max(MAX_TEMPO).nullable().default(null),
})

export type ExercisePriority = z.infer<typeof prioritySchema>

export type ParsedGoalInput = { ok: true; goal: GoalInput } | { ok: false; problems: string[] }

/**
 * Parse a goal from an untrusted source and hold it to what is known: every
 * item must name an exercise that exists for this user, and an exercise may
 * appear once in the whole path. A repeat would be two schedules for one
 * exercise, which the fold cannot represent — it keeps one state per exercise.
 */
export function parseGoalInput(input: unknown, knownExerciseIds: ReadonlySet<string>): ParsedGoalInput {
  const parsed = goalInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'goal'}: ${issue.message}`),
    }
  }
  const seen = new Set<string>()
  const problems = parsed.data.stages.flatMap((stage, stageIndex) =>
    stage.items.flatMap((item, itemIndex) => {
      const at = `stages.${stageIndex}.items.${itemIndex}.exerciseId`
      if (!knownExerciseIds.has(item.exerciseId)) {
        return [`${at}: no exercise "${item.exerciseId}" — use an id from the built-in pack or from the user's library`]
      }
      if (seen.has(item.exerciseId)) {
        return [`${at}: "${item.exerciseId}" is already in this path — an exercise belongs to one stage`]
      }
      seen.add(item.exerciseId)
      return []
    }),
  )
  return problems.length > 0 ? { ok: false, problems } : { ok: true, goal: parsed.data }
}

/** The goals that shape a session: active ones, in the order they were made. */
export function activeGoals(goals: readonly Goal[]): Goal[] {
  return goals.filter((goal) => goal.status === 'active')
}

/** Every exercise a path names, stage by stage. */
export function goalExerciseIds(goal: Goal): string[] {
  return goal.stages.flatMap((stage) => stage.items.map((item) => item.exerciseId))
}
