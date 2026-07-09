import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'

export interface DatabaseSmokeClient {
  check(): Promise<void>
}

function readDatabaseUrl(): string | undefined {
  if (typeof process === 'undefined') {
    return undefined
  }

  return process.env.DATABASE_URL
}

export function createDatabaseSmokeClient(
  databaseUrl = readDatabaseUrl(),
): DatabaseSmokeClient | null {
  const connectionString = databaseUrl?.trim()

  if (!connectionString) {
    return null
  }

  return {
    async check() {
      const db = drizzle(connectionString)

      try {
        await db.execute(sql`select 1`)
      } finally {
        await db.$client.end()
      }
    },
  }
}
