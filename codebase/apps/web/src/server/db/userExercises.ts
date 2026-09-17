import { and, asc, count, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { LIBRARY_ID_PREFIX } from '../../content/library'
import { exerciseInputSchema, type ExerciseInput, type LibraryExercise } from '../../content/exerciseInput'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { schema, userExercises, users } from './schema'

/** A library is a practice list, not a warehouse; the cap also bounds what a runaway client can write. */
export const MOST_USER_EXERCISES = 200

export class UserExerciseLimitError extends Error {
  constructor() {
    super(`A library holds at most ${MOST_USER_EXERCISES} exercises`)
    this.name = 'UserExerciseLimitError'
  }
}

/** Ids of a user's exercises are namespaced, so they can never collide with the pack's. */
export const USER_EXERCISE_ID_PREFIX = LIBRARY_ID_PREFIX

export function userExerciseId(rowId: string): string {
  return `${USER_EXERCISE_ID_PREFIX}${rowId}`
}

/** The row id inside a library exercise id, or null for anything else (a pack id, junk). */
export function rowIdOfUserExercise(exerciseId: string): string | null {
  if (!exerciseId.startsWith(USER_EXERCISE_ID_PREFIX)) return null
  const rowId = exerciseId.slice(USER_EXERCISE_ID_PREFIX.length)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(rowId) ? rowId : null
}

export interface UserExerciseRepository {
  listExercises(clerkUserId: string): Promise<LibraryExercise[]>
  createExercise(clerkUserId: string, exercise: ExerciseInput): Promise<LibraryExercise>
  /** True when an exercise of this user's was deleted; false when there was none. */
  deleteExercise(clerkUserId: string, exerciseId: string): Promise<boolean>
}

interface UserExerciseRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
  newId?: () => string
}

export function createUserExerciseRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
  newId = () => crypto.randomUUID(),
}: UserExerciseRepositoryOptions = {}): UserExerciseRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async listExercises(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const rows = await db
          .select()
          .from(userExercises)
          .where(eq(userExercises.clerkUserId, clerkUserId))
          .orderBy(asc(userExercises.createdAt))
        return rows.flatMap((row) => {
          const exercise = storedExercise(row.id, row.exercise)
          return exercise ? [exercise] : []
        })
      } finally {
        await db.$client.end()
      }
    },

    async createExercise(clerkUserId, exercise) {
      const db = drizzle(connectionString, { schema })

      try {
        return await db.transaction(async (tx) => {
          await tx
            .insert(users)
            .values({ clerkUserId })
            .onConflictDoNothing()

          const [{ total }] = await tx
            .select({ total: count() })
            .from(userExercises)
            .where(eq(userExercises.clerkUserId, clerkUserId))
          if (total >= MOST_USER_EXERCISES) throw new UserExerciseLimitError()

          const id = newId()
          await tx.insert(userExercises).values({ id, clerkUserId, exercise })
          return { ...exercise, id: userExerciseId(id) }
        })
      } finally {
        await db.$client.end()
      }
    },

    async deleteExercise(clerkUserId, exerciseId) {
      const rowId = rowIdOfUserExercise(exerciseId)
      if (!rowId) return false
      const db = drizzle(connectionString, { schema })

      try {
        const deleted = await db
          .delete(userExercises)
          // Owner in the WHERE: another user's id deletes nothing and says nothing.
          .where(and(eq(userExercises.id, rowId), eq(userExercises.clerkUserId, clerkUserId)))
          .returning({ id: userExercises.id })
        return deleted.length > 0
      } finally {
        await db.$client.end()
      }
    },
  }
}

/**
 * A stored row as an exercise. The column is parsed again on the way out: a
 * row written under older rules, or by hand, is left out rather than handed
 * to a player that trusts its input.
 */
export function storedExercise(rowId: string, stored: unknown): LibraryExercise | null {
  const parsed = exerciseInputSchema.safeParse(stored)
  return parsed.success ? { ...parsed.data, id: userExerciseId(rowId) } : null
}
