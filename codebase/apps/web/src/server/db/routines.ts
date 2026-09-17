import { and, asc, count, eq, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { routineInputSchema, type Routine, type RoutineInput } from '../../appData/routine'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { practiceRoutines, schema, users } from './schema'

/** Routines are a handful of prepared sessions, not a log; the cap also bounds what a runaway client can write. */
export const MOST_ROUTINES = 50

export class RoutineLimitError extends Error {
  constructor() {
    super(`A user keeps at most ${MOST_ROUTINES} routines`)
    this.name = 'RoutineLimitError'
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** A routine id is its row id; anything else (junk from a URL or a client) names no routine. */
export function isRoutineId(routineId: string): boolean {
  return UUID.test(routineId)
}

export interface RoutineRepository {
  /** Oldest first. */
  listRoutines(clerkUserId: string): Promise<Routine[]>
  /**
   * Give a user their starter routines, once: the first call for a user marks
   * them as started and, if they have no routines yet, stores these. Every
   * later call does nothing — also after the user deleted them all. True when
   * routines were stored.
   */
  giveStarterRoutines(clerkUserId: string, starters: readonly RoutineInput[]): Promise<boolean>
  createRoutine(clerkUserId: string, routine: RoutineInput): Promise<Routine>
  /** The updated routine, or null when this user has no routine with that id. */
  updateRoutine(clerkUserId: string, routineId: string, routine: RoutineInput): Promise<Routine | null>
  /** True when a routine of this user's was deleted; false when there was none. */
  deleteRoutine(clerkUserId: string, routineId: string): Promise<boolean>
}

interface RoutineRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
  newId?: () => string
}

export function createRoutineRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
  newId = () => crypto.randomUUID(),
}: RoutineRepositoryOptions = {}): RoutineRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async listRoutines(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const rows = await db
          .select()
          .from(practiceRoutines)
          .where(eq(practiceRoutines.clerkUserId, clerkUserId))
          .orderBy(asc(practiceRoutines.createdAt))
        return rows.flatMap((row) => storedRoutine(row.id, row.routine) ?? [])
      } finally {
        await db.$client.end()
      }
    },

    async giveStarterRoutines(clerkUserId, starters) {
      const db = drizzle(connectionString, { schema })

      try {
        return await db.transaction(async (tx) => {
          await tx
            .insert(users)
            .values({ clerkUserId })
            .onConflictDoNothing()

          // Claim the one-time mark. Two requests racing for it serialize on the
          // row: the second finds it set and gets nothing back.
          const claimed = await tx
            .update(users)
            .set({ starterRoutinesAt: new Date() })
            .where(and(eq(users.clerkUserId, clerkUserId), isNull(users.starterRoutinesAt)))
            .returning({ clerkUserId: users.clerkUserId })
          if (claimed.length === 0) return false

          const [{ total }] = await tx
            .select({ total: count() })
            .from(practiceRoutines)
            .where(eq(practiceRoutines.clerkUserId, clerkUserId))
          // Someone who already made routines keeps just those.
          if (total > 0 || starters.length === 0) return false

          // Spaced a millisecond apart so "oldest first" keeps the order they are written in.
          const now = Date.now()
          await tx.insert(practiceRoutines).values(
            starters.map((routine, index) => ({
              id: newId(),
              clerkUserId,
              routine,
              createdAt: new Date(now + index),
            })),
          )
          return true
        })
      } finally {
        await db.$client.end()
      }
    },

    async createRoutine(clerkUserId, routine) {
      const db = drizzle(connectionString, { schema })

      try {
        return await db.transaction(async (tx) => {
          await tx
            .insert(users)
            .values({ clerkUserId })
            .onConflictDoNothing()

          const [{ total }] = await tx
            .select({ total: count() })
            .from(practiceRoutines)
            .where(eq(practiceRoutines.clerkUserId, clerkUserId))
          if (total >= MOST_ROUTINES) throw new RoutineLimitError()

          const id = newId()
          await tx.insert(practiceRoutines).values({ id, clerkUserId, routine })
          // Making a routine is starting: whoever makes their own first is never handed the starters later.
          await tx
            .update(users)
            .set({ starterRoutinesAt: new Date() })
            .where(and(eq(users.clerkUserId, clerkUserId), isNull(users.starterRoutinesAt)))
          return { ...routine, id }
        })
      } finally {
        await db.$client.end()
      }
    },

    async updateRoutine(clerkUserId, routineId, routine) {
      if (!isRoutineId(routineId)) return null
      const db = drizzle(connectionString, { schema })

      try {
        const updated = await db
          .update(practiceRoutines)
          .set({ routine, updatedAt: new Date() })
          // Owner in the WHERE: another user's id changes nothing and says nothing.
          .where(and(eq(practiceRoutines.id, routineId), eq(practiceRoutines.clerkUserId, clerkUserId)))
          .returning({ id: practiceRoutines.id })
        return updated.length > 0 ? { ...routine, id: routineId } : null
      } finally {
        await db.$client.end()
      }
    },

    async deleteRoutine(clerkUserId, routineId) {
      if (!isRoutineId(routineId)) return false
      const db = drizzle(connectionString, { schema })

      try {
        const deleted = await db
          .delete(practiceRoutines)
          .where(and(eq(practiceRoutines.id, routineId), eq(practiceRoutines.clerkUserId, clerkUserId)))
          .returning({ id: practiceRoutines.id })
        return deleted.length > 0
      } finally {
        await db.$client.end()
      }
    },
  }
}

/**
 * A stored row as a routine. The column is parsed again on the way out: a row
 * written under older rules, or by hand, is left out rather than handed on.
 * Whether its exercises still exist is not checked here — an exercise deleted
 * since is the reader's to skip, not a reason to hide the routine.
 */
export function storedRoutine(rowId: string, stored: unknown): Routine | null {
  const parsed = routineInputSchema.safeParse(stored)
  return parsed.success ? { ...parsed.data, id: rowId } : null
}
