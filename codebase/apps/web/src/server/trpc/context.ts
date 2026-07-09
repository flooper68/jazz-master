import {
  createDatabaseSmokeClient,
  type DatabaseSmokeClient,
} from '../db/smoke'
import type { HyperdriveConnection } from '../db/connection'
import {
  createMockPracticeRepository,
  type MockPracticeRepository,
} from '../db/mockPractice'

interface CreateContextOptions {
  auth?: AuthContext | null
  dbSmoke?: DatabaseSmokeClient | null
  mockPractice?: MockPracticeRepository | null
  hyperdrive?: HyperdriveConnection | null
}

export interface AuthContext {
  userId: string | null
}

type AstroLocalsWithAuth = {
  auth?: () => { userId: string | null }
}

function hasDbSmokeOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'dbSmoke' in options
}

function hasMockPracticeOption(
  options: unknown,
): options is CreateContextOptions {
  return (
    typeof options === 'object' && options !== null && 'mockPractice' in options
  )
}

function hasContextOptions(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null
}

function hasAuthOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'auth' in options
}

export function createAuthContextFromLocals(locals: unknown): AuthContext {
  const maybeLocals = locals as AstroLocalsWithAuth | null
  const authObject =
    typeof maybeLocals?.auth === 'function' ? maybeLocals.auth() : null

  return {
    userId: authObject?.userId ?? null,
  }
}

// Request context for tRPC procedures. Auth is captured as the stable Clerk
// user ID only; product data reads/writes stay behind protected procedures.
// Database handles are server-only dependencies and are absent when no
// DATABASE_URL or Hyperdrive binding is configured.
export function createContext(options?: unknown) {
  const auth = hasAuthOption(options)
    ? (options.auth ?? { userId: null })
    : { userId: null }
  const hyperdrive = hasContextOptions(options) ? options.hyperdrive : null
  const dbSmoke = hasDbSmokeOption(options)
    ? options.dbSmoke
    : createDatabaseSmokeClient({
        hyperdrive,
      })
  const mockPractice = hasMockPracticeOption(options)
    ? options.mockPractice
    : createMockPracticeRepository({ hyperdrive })

  return { auth, dbSmoke, mockPractice }
}

export type Context = Awaited<ReturnType<typeof createContext>>
