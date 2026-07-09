import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'

export interface DatabaseSmokeClient {
  check(): Promise<void>
}

export interface HyperdriveConnection {
  connectionString?: string
}

interface DatabaseSmokeClientOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

function readDatabaseUrl(): string | undefined {
  if (typeof process === 'undefined') {
    return undefined
  }

  return process.env.DATABASE_URL
}

export function resolveDatabaseSmokeConnectionString({
  databaseUrl,
  hyperdrive = null,
}: DatabaseSmokeClientOptions): string | null {
  const connectionString = (
    hyperdrive?.connectionString ?? databaseUrl
  )?.trim()

  return connectionString || null
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
