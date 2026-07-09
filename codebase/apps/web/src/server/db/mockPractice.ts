import { desc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { mockPracticeRows, schema } from './schema'

export interface MockPracticeInput {
  exerciseSlug: string
  exerciseTitle: string
  minutes: number
  focus?: string | null
}

export interface MockPracticeRow {
  id: string
  exerciseSlug: string
  exerciseTitle: string
  minutes: number
  focus: string | null
  createdAt: string
}

export interface MockPracticeRecordResult {
  created: MockPracticeRow
  recent: MockPracticeRow[]
}

export interface MockPracticeRepository {
  record(input: MockPracticeInput): Promise<MockPracticeRecordResult>
}

interface MockPracticeRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
  recentLimit?: number
}

export function createMockPracticeRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
  recentLimit = 5,
}: MockPracticeRepositoryOptions = {}): MockPracticeRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async record(input) {
      const db = drizzle(connectionString, { schema })

      try {
        const [created] = await db
          .insert(mockPracticeRows)
          .values({
            id: globalThis.crypto.randomUUID(),
            exerciseSlug: input.exerciseSlug,
            exerciseTitle: input.exerciseTitle,
            minutes: input.minutes,
            focus: input.focus ?? null,
          })
          .returning()

        if (!created) {
          throw new Error('Mock practice row was not returned after insert')
        }

        const recent = await db
          .select()
          .from(mockPracticeRows)
          .orderBy(desc(mockPracticeRows.createdAt))
          .limit(recentLimit)

        return {
          created: serializeMockPracticeRow(created),
          recent: recent.map(serializeMockPracticeRow),
        }
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeMockPracticeRow(
  row: typeof mockPracticeRows.$inferSelect,
): MockPracticeRow {
  return {
    id: row.id,
    exerciseSlug: row.exerciseSlug,
    exerciseTitle: row.exerciseTitle,
    minutes: row.minutes,
    focus: row.focus,
    createdAt: row.createdAt.toISOString(),
  }
}
