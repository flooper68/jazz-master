import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'

export interface DatabaseSmokeClient {
  check(): Promise<void>
}

interface DatabaseSmokeClientOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function resolveDatabaseSmokeConnectionString({
  databaseUrl,
  hyperdrive = null,
}: DatabaseSmokeClientOptions): string | null {
  return resolveDatabaseConnectionString({ databaseUrl, hyperdrive })
}

export function createDatabaseSmokeClient({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: DatabaseSmokeClientOptions = {}): DatabaseSmokeClient | null {
  const connectionString = resolveDatabaseSmokeConnectionString({
    databaseUrl,
    hyperdrive,
  })

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
