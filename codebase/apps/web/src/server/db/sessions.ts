import { asc, desc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import type {
  ExerciseGrade,
  ExerciseResult,
  PracticeSession,
  ScoreTolerancePreset,
  ScoreVerdict,
} from '../../appData/session'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import {
  practiceSessionResults,
  practiceSessionScoreNotes,
  practiceSessions,
  schema,
  users,
} from './schema'

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

        const ids = sessionRows.map((session) => session.id)
        const resultRows = await db
          .select()
          .from(practiceSessionResults)
          .where(inArray(practiceSessionResults.sessionId, ids))
          .orderBy(
            asc(practiceSessionResults.sessionId),
            asc(practiceSessionResults.position),
          )
        const noteRows = await db
          .select()
          .from(practiceSessionScoreNotes)
          .where(inArray(practiceSessionScoreNotes.sessionId, ids))
          .orderBy(
            asc(practiceSessionScoreNotes.sessionId),
            asc(practiceSessionScoreNotes.resultPosition),
            asc(practiceSessionScoreNotes.notePosition),
          )

        return sessionRows.map((session) =>
          serializeSession(session, resultRows, noteRows),
        )
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

          const now = new Date()
          const sessionValues = {
            id: session.id,
            clerkUserId,
            lessonId: session.lessonId,
            startedAt: new Date(session.startedAt),
            durationSeconds: session.durationSeconds,
            completed: session.completed,
            score: session.score ?? null,
            updatedAt: now,
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
            score: result.score?.score ?? null,
            tolerance: result.score?.tolerance ?? null,
            pitchScore: result.score?.components.pitch ?? null,
            timingScore: result.score?.components.timing ?? null,
            completenessScore: result.score?.components.completeness ?? null,
            extras: result.score?.extras ?? null,
            analyzedAt: result.score ? new Date(result.score.analyzedAt) : null,
          }))
          const results =
            resultValues.length > 0
              ? await tx.insert(practiceSessionResults).values(resultValues).returning()
              : []

          const noteValues = session.results.flatMap((result, resultPosition) =>
            result.score
              ? result.score.perNote.map((note, notePosition) => ({
                  sessionId: session.id,
                  resultPosition,
                  notePosition,
                  expectedId: note.expectedId,
                  expectedNote: note.expectedNote,
                  verdict: note.verdict,
                  timingOffsetSeconds: note.timingOffsetSeconds,
                  pitchCents: note.pitchCents,
                }))
              : [],
          )
          const notes =
            noteValues.length > 0
              ? await tx.insert(practiceSessionScoreNotes).values(noteValues).returning()
              : []

          return serializeSession(row, results, notes)
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
  allNotes: Array<typeof practiceSessionScoreNotes.$inferSelect>,
): PracticeSession {
  const results = allResults
    .filter((result) => result.sessionId === row.id)
    .sort((a, b) => a.position - b.position)
    .map((result) => serializeResult(result, allNotes))

  return {
    id: row.id,
    lessonId: row.lessonId,
    startedAt: row.startedAt.toISOString(),
    durationSeconds: row.durationSeconds,
    completed: row.completed,
    results,
    ...(row.score === null ? {} : { score: row.score }),
  }
}

function serializeResult(
  row: typeof practiceSessionResults.$inferSelect,
  allNotes: Array<typeof practiceSessionScoreNotes.$inferSelect>,
): ExerciseResult {
  const score =
    row.score === null ||
    row.tolerance === null ||
    row.pitchScore === null ||
    row.timingScore === null ||
    row.completenessScore === null ||
    row.extras === null ||
    row.analyzedAt === null
      ? undefined
      : {
          score: row.score,
          tolerance: row.tolerance as ScoreTolerancePreset,
          components: {
            pitch: row.pitchScore,
            timing: row.timingScore,
            completeness: row.completenessScore,
          },
          perNote: allNotes
            .filter(
              (note) =>
                note.sessionId === row.sessionId &&
                note.resultPosition === row.position,
            )
            .sort((a, b) => a.notePosition - b.notePosition)
            .map((note) => ({
              expectedId: note.expectedId,
              expectedNote: note.expectedNote,
              verdict: note.verdict as ScoreVerdict,
              timingOffsetSeconds: note.timingOffsetSeconds,
              pitchCents: note.pitchCents,
            })),
          extras: row.extras,
          analyzedAt: row.analyzedAt.toISOString(),
        }

  return {
    exerciseId: row.exerciseId,
    grade: row.grade as ExerciseGrade,
    ...(score ? { score } : {}),
  }
}
