export interface HyperdriveConnection {
  connectionString?: string
}

interface DatabaseConnectionOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function readDatabaseUrl(): string | undefined {
  if (typeof process === 'undefined') {
    return undefined
  }

  return process.env.DATABASE_URL
}

export function resolveDatabaseConnectionString({
  databaseUrl,
  hyperdrive = null,
}: DatabaseConnectionOptions): string | null {
  const connectionString = (
    hyperdrive?.connectionString ?? databaseUrl
  )?.trim()

  return connectionString || null
}
