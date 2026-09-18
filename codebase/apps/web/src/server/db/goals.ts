import { and, asc, count, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  goalInputSchema,
  prioritySchema,
  type ExercisePriority,
  type Goal,
  type GoalInput,
} from '../../appData/goal'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { exercisePriorities, goals, schema, users } from './schema'

/** Goals are a handful of things worth working toward, not a log; the cap bounds a runaway client. */
export const MOST_GOALS = 20
/** And priorities are per exercise, so the pack plus a library is the natural bound. */
export const MOST_PRIORITIES = 500

export class GoalLimitError extends Error {
  constructor() {
    super(`A user keeps at most ${MOST_GOALS} goals`)
    this.name = 'GoalLimitError'
  }
}

export class PriorityLimitError extends Error {
  constructor() {
    super(`A user keeps at most ${MOST_PRIORITIES} exercise priorities`)
    this.name = 'PriorityLimitError'
  }
}

export interface GoalRepository {
  /** Oldest first. */
  listGoals(clerkUserId: string): Promise<Goal[]>
  createGoal(clerkUserId: string, goal: GoalInput): Promise<Goal>
  /** The updated goal, or null when this user has no goal with that id. */
  updateGoal(clerkUserId: string, goalId: string, goal: GoalInput): Promise<Goal | null>
  /** True when a goal of this user's was deleted; false when there was none. */
  deleteGoal(clerkUserId: string, goalId: string): Promise<boolean>
  listPriorities(clerkUserId: string): Promise<ExercisePriority[]>
  /** Write one exercise's priority, or clear it when `priority` is null. */
  setPriority(
    clerkUserId: string,
    exerciseId: string,
    priority: ExercisePriority['priority'] | null,
    targetOverrideBpm: number | null,
  ): Promise<ExercisePriority | null>
}

interface GoalRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
  newId?: () => string
}

export function createGoalRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
  newId = () => crypto.randomUUID(),
}: GoalRepositoryOptions = {}): GoalRepository | null {
  const connectionString = resolveDatabaseConnectionString({ databaseUrl, hyperdrive })
  if (!connectionString) return null

  return {
    async listGoals(clerkUserId) {
      const db = drizzle(connectionString, { schema })
      try {
        const rows = await db
          .select()
          .from(goals)
          .where(eq(goals.clerkUserId, clerkUserId))
          .orderBy(asc(goals.createdAt))
        return rows.flatMap(serializeGoal)
      } finally {
        await db.$client.end()
      }
    },

    async createGoal(clerkUserId, goal) {
      const db = drizzle(connectionString, { schema })
      try {
        return await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()
          const [{ value: held }] = await tx
            .select({ value: count() })
            .from(goals)
            .where(eq(goals.clerkUserId, clerkUserId))
          if (held >= MOST_GOALS) throw new GoalLimitError()

          const [row] = await tx.insert(goals).values({ id: newId(), clerkUserId, goal }).returning()
          const stored = row && serializeGoal(row)[0]
          if (!stored) throw new Error('Goal row was not returned after save')
          return stored
        })
      } finally {
        await db.$client.end()
      }
    },

    async updateGoal(clerkUserId, goalId, goal) {
      const db = drizzle(connectionString, { schema })
      try {
        const [row] = await db
          .update(goals)
          .set({ goal, updatedAt: new Date() })
          // Scoped to the owner: another user's goal id matches nothing.
          .where(and(eq(goals.id, goalId), eq(goals.clerkUserId, clerkUserId)))
          .returning()
        return row ? (serializeGoal(row)[0] ?? null) : null
      } finally {
        await db.$client.end()
      }
    },

    async deleteGoal(clerkUserId, goalId) {
      const db = drizzle(connectionString, { schema })
      try {
        const rows = await db
          .delete(goals)
          .where(and(eq(goals.id, goalId), eq(goals.clerkUserId, clerkUserId)))
          .returning({ id: goals.id })
        return rows.length > 0
      } finally {
        await db.$client.end()
      }
    },

    async listPriorities(clerkUserId) {
      const db = drizzle(connectionString, { schema })
      try {
        const rows = await db
          .select()
          .from(exercisePriorities)
          .where(eq(exercisePriorities.clerkUserId, clerkUserId))
          .orderBy(asc(exercisePriorities.exerciseId))
        return rows.flatMap(serializePriority)
      } finally {
        await db.$client.end()
      }
    },

    async setPriority(clerkUserId, exerciseId, priority, targetOverrideBpm) {
      const db = drizzle(connectionString, { schema })
      try {
        return await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()

          // No priority and no override is nothing to say: the row goes.
          if (priority === null && targetOverrideBpm === null) {
            await tx
              .delete(exercisePriorities)
              .where(
                and(
                  eq(exercisePriorities.clerkUserId, clerkUserId),
                  eq(exercisePriorities.exerciseId, exerciseId),
                ),
              )
            return null
          }

          const [{ value: held }] = await tx
            .select({ value: count() })
            .from(exercisePriorities)
            .where(eq(exercisePriorities.clerkUserId, clerkUserId))
          if (held >= MOST_PRIORITIES) throw new PriorityLimitError()

          // The key is (owner, exercise), so a conflict is only ever this
          // user's own earlier answer about the same exercise.
          const [row] = await tx
            .insert(exercisePriorities)
            .values({
              clerkUserId,
              exerciseId,
              priority: priority ?? 'boosted',
              targetOverrideBpm,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [exercisePriorities.clerkUserId, exercisePriorities.exerciseId],
              set: { priority: priority ?? 'boosted', targetOverrideBpm, updatedAt: new Date() },
            })
            .returning()
          const stored = row && serializePriority(row)[0]
          if (!stored) throw new Error('Priority row was not returned after save')
          return stored
        })
      } finally {
        await db.$client.end()
      }
    },
  }
}

/**
 * A stored goal, parsed back through its own schema. A row that no longer
 * matches — written by an older shape, or edited in the database — is dropped
 * rather than handed to the scheduler half-formed.
 */
function serializeGoal(row: typeof goals.$inferSelect): Goal[] {
  const parsed = goalInputSchema.safeParse(row.goal)
  return parsed.success ? [{ id: row.id, ...parsed.data }] : []
}

function serializePriority(row: typeof exercisePriorities.$inferSelect): ExercisePriority[] {
  const parsed = prioritySchema.safeParse({
    exerciseId: row.exerciseId,
    priority: row.priority,
    targetOverrideBpm: row.targetOverrideBpm,
  })
  return parsed.success ? [parsed.data] : []
}
