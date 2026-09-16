import { desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PracticeSession } from '../../appData/session'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { practiceSessions, schema, users } from './schema'

export class SessionOwnerMismatchError extends Error {
  constructor() {
    super('Session belongs to another user')
    this.name = 'SessionOwnerMismatchError'
  }
}

export interface SessionRepository {
  listSessions(clerkUserId: string): Promise<PracticeSession[]>
  upsertSession(
    clerkUserId: string,
    session: PracticeSession,
  ): Promise<PracticeSession>
}

interface SessionRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function createSessionRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: SessionRepositoryOptions = {}): SessionRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async listSessions(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const rows = await db
          .select()
          .from(practiceSessions)
          .where(eq(practiceSessions.clerkUserId, clerkUserId))
          .orderBy(desc(practiceSessions.startedAt))
        return rows.map(serializeSession)
      } finally {
        await db.$client.end()
      }
    },

    async upsertSession(clerkUserId, session) {
      const db = drizzle(connectionString, { schema })

      try {
        return await db.transaction(async (tx) => {
          await tx
            .insert(users)
            .values({ clerkUserId })
            .onConflictDoNothing()

          const existing = (
            await tx
              .select({
                id: practiceSessions.id,
                clerkUserId: practiceSessions.clerkUserId,
              })
              .from(practiceSessions)
              .where(eq(practiceSessions.id, session.id))
              .limit(1)
          )[0]

          if (existing && existing.clerkUserId !== clerkUserId) {
            throw new SessionOwnerMismatchError()
          }

          const values = {
            id: session.id,
            clerkUserId,
            lessonId: session.lessonId,
            startedAt: new Date(session.startedAt),
            durationSeconds: session.durationSeconds,
            completed: session.completed,
            exercisesCompleted: session.exercisesCompleted,
            updatedAt: new Date(),
          }

          const [row] = existing
            ? await tx
                .update(practiceSessions)
                .set(values)
                .where(eq(practiceSessions.id, session.id))
                .returning()
            : await tx.insert(practiceSessions).values(values).returning()

          if (!row) {
            throw new Error('Session row was not returned after upsert')
          }

          return serializeSession(row)
        })
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeSession(
  row: typeof practiceSessions.$inferSelect,
): PracticeSession {
  return {
    id: row.id,
    lessonId: row.lessonId,
    startedAt: row.startedAt.toISOString(),
    durationSeconds: row.durationSeconds,
    completed: row.completed,
    exercisesCompleted: row.exercisesCompleted,
  }
}
