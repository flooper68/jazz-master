import {
  createDatabaseSmokeClient,
  type DatabaseSmokeClient,
} from '../db/smoke'

interface CreateContextOptions {
  dbSmoke?: DatabaseSmokeClient | null
}

function hasDbSmokeOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'dbSmoke' in options
}

// Request context for tRPC procedures. There is still no auth or session; the
// database handle is a server-only smoke dependency and is absent when no
// DATABASE_URL is configured.
export function createContext(options?: unknown) {
  const dbSmoke = hasDbSmokeOption(options)
    ? options.dbSmoke
    : createDatabaseSmokeClient()

  return { dbSmoke }
}

export type Context = Awaited<ReturnType<typeof createContext>>
