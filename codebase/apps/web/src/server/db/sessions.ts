import { asc, desc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { ExerciseGrade, PracticeSession } from '../../appData/session'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { practiceSessionResults, practiceSessions, schema, users } from './schema'

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
        const sessionRows = await db
          .select()
          .from(practiceSessions)
          .where(eq(practiceSessions.clerkUserId, clerkUserId))
          .orderBy(desc(practiceSessions.startedAt))

        if (sessionRows.length === 0) return []

        const resultRows = await db
          .select()
          .from(practiceSessionResults)
          .where(
            inArray(
              practiceSessionResults.sessionId,
              sessionRows.map((session) => session.id),
            ),
          )
          .orderBy(
            asc(practiceSessionResults.sessionId),
            asc(practiceSessionResults.position),
          )

        return sessionRows.map((session) => serializeSession(session, resultRows))
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

          const sessionValues = {
            id: session.id,
            clerkUserId,
            lessonId: session.lessonId,
            startedAt: new Date(session.startedAt),
            durationSeconds: session.durationSeconds,
            completed: session.completed,
            updatedAt: new Date(),
          }

          const [row] = existing
            ? await tx
                .update(practiceSessions)
                .set(sessionValues)
                .where(eq(practiceSessions.id, session.id))
                .returning()
            : await tx
                .insert(practiceSessions)
                .values(sessionValues)
                .returning()

          if (!row) {
            throw new Error('Session row was not returned after upsert')
          }

          await tx
            .delete(practiceSessionResults)
            .where(eq(practiceSessionResults.sessionId, session.id))

          const resultValues = session.results.map((result, position) => ({
            sessionId: session.id,
            position,
            exerciseId: result.exerciseId,
            grade: result.grade,
          }))
          const results =
            resultValues.length > 0
              ? await tx.insert(practiceSessionResults).values(resultValues).returning()
              : []

          return serializeSession(row, results)
        })
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeSession(
  row: typeof practiceSessions.$inferSelect,
  allResults: Array<typeof practiceSessionResults.$inferSelect>,
): PracticeSession {
  return {
    id: row.id,
    lessonId: row.lessonId,
    startedAt: row.startedAt.toISOString(),
    durationSeconds: row.durationSeconds,
    completed: row.completed,
    results: allResults
      .filter((result) => result.sessionId === row.id)
      .sort((a, b) => a.position - b.position)
      .map((result) => ({
        exerciseId: result.exerciseId,
        grade: result.grade as ExerciseGrade,
      })),
  }
}
