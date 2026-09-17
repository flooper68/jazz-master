import { desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { ExerciseRun } from '../../appData/run'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { exerciseRuns, schema, users } from './schema'

export class RunOwnerMismatchError extends Error {
  constructor() {
    super('Run belongs to another user')
    this.name = 'RunOwnerMismatchError'
  }
}

export interface RunRepository {
  listRuns(clerkUserId: string): Promise<ExerciseRun[]>
  /** Insert the run, or update it in place — the rating arrives after the run does. */
  saveRun(clerkUserId: string, run: ExerciseRun): Promise<ExerciseRun>
}

interface RunRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function createRunRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: RunRepositoryOptions = {}): RunRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async listRuns(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const rows = await db
          .select()
          .from(exerciseRuns)
          .where(eq(exerciseRuns.clerkUserId, clerkUserId))
          .orderBy(desc(exerciseRuns.startedAt))
        return rows.map(serializeRun)
      } finally {
        await db.$client.end()
      }
    },

    async saveRun(clerkUserId, run) {
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
                id: exerciseRuns.id,
                clerkUserId: exerciseRuns.clerkUserId,
              })
              .from(exerciseRuns)
              .where(eq(exerciseRuns.id, run.id))
              .limit(1)
          )[0]

          if (existing && existing.clerkUserId !== clerkUserId) {
            throw new RunOwnerMismatchError()
          }

          const values = {
            id: run.id,
            clerkUserId,
            exerciseId: run.exerciseId,
            startedAt: new Date(run.startedAt),
            durationSeconds: run.durationSeconds,
            tempoBpm: run.tempoBpm,
            passes: run.passes,
            completed: run.completed,
            rating: run.rating,
            updatedAt: new Date(),
          }

          const [row] = existing
            ? await tx
                .update(exerciseRuns)
                .set(values)
                .where(eq(exerciseRuns.id, run.id))
                .returning()
            : await tx.insert(exerciseRuns).values(values).returning()

          if (!row) {
            throw new Error('Run row was not returned after save')
          }

          return serializeRun(row)
        })
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeRun(row: typeof exerciseRuns.$inferSelect): ExerciseRun {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    startedAt: row.startedAt.toISOString(),
    durationSeconds: row.durationSeconds,
    tempoBpm: row.tempoBpm,
    passes: row.passes,
    completed: row.completed,
    rating: row.rating,
  }
}
