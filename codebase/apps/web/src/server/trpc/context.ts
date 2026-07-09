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
  dbSmoke?: DatabaseSmokeClient | null
  mockPractice?: MockPracticeRepository | null
  hyperdrive?: HyperdriveConnection | null
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

// Request context for tRPC procedures. There is still no auth or session; the
// database handles are server-only dependencies and are absent when no
// DATABASE_URL or Hyperdrive binding is configured.
export function createContext(options?: unknown) {
  const hyperdrive = hasContextOptions(options) ? options.hyperdrive : null
  const dbSmoke = hasDbSmokeOption(options)
    ? options.dbSmoke
    : createDatabaseSmokeClient({
        hyperdrive,
      })
  const mockPractice = hasMockPracticeOption(options)
    ? options.mockPractice
    : createMockPracticeRepository({ hyperdrive })

  return { dbSmoke, mockPractice }
}

export type Context = Awaited<ReturnType<typeof createContext>>
