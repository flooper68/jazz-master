import type { ClerkKeyPairClient } from '../auth/clerkKeyPair'
import type { HyperdriveConnection } from '../db/connection'
import {
  createDatabaseSmokeClient,
  type DatabaseSmokeClient,
} from '../db/smoke'
import { createRunRepository, type RunRepository } from '../db/runs'
import { createRoutineRepository, type RoutineRepository } from '../db/routines'
import {
  createUserExerciseRepository,
  type UserExerciseRepository,
} from '../db/userExercises'
import { createUserRepository, type UserRepository } from '../db/users'
import {
  createNoopStructuredLogger,
  type RequestLogMetadata,
  type StructuredLogger,
} from '../observability/logger'

interface CreateContextOptions {
  auth?: AuthContext | null
  clerkKeys?: ClerkKeyPairClient | null
  dbSmoke?: DatabaseSmokeClient | null
  logger?: StructuredLogger
  requestMetadata?: RequestLogMetadata | null
  runs?: RunRepository | null
  routines?: RoutineRepository | null
  userExercises?: UserExerciseRepository | null
  users?: UserRepository | null
  hyperdrive?: HyperdriveConnection | null
}

export interface AuthContext {
  clerkUserId: string | null
}

type AstroLocalsWithAuth = {
  auth?: () => { userId: string | null }
}

function hasDbSmokeOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'dbSmoke' in options
}

function hasClerkKeysOption(options: unknown): options is CreateContextOptions {
  return (
    typeof options === 'object' && options !== null && 'clerkKeys' in options
  )
}

function hasUsersOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'users' in options
}

function hasRunsOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'runs' in options
}

function hasRoutinesOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'routines' in options
}

function hasUserExercisesOption(
  options: unknown,
): options is CreateContextOptions {
  return (
    typeof options === 'object' && options !== null && 'userExercises' in options
  )
}

function hasContextOptions(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null
}

function hasAuthOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'auth' in options
}

function hasLoggerOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'logger' in options
}

function hasRequestMetadataOption(
  options: unknown,
): options is CreateContextOptions {
  return (
    typeof options === 'object' &&
    options !== null &&
    'requestMetadata' in options
  )
}

export function createAuthContextFromLocals(locals: unknown): AuthContext {
  const maybeLocals = locals as AstroLocalsWithAuth | null
  const authObject =
    typeof maybeLocals?.auth === 'function' ? maybeLocals.auth() : null

  return {
    clerkUserId: authObject?.userId ?? null,
  }
}

// Request context for tRPC procedures. Auth is captured as the stable Clerk
// user ID only. Database handles are server-only dependencies and are absent
// when no DATABASE_URL or Hyperdrive binding is configured.
export function createContext(options?: unknown) {
  const auth = hasAuthOption(options)
    ? (options.auth ?? { clerkUserId: null })
    : { clerkUserId: null }
  const hyperdrive = hasContextOptions(options) ? options.hyperdrive : null
  const dbSmoke = hasDbSmokeOption(options)
    ? options.dbSmoke
    : createDatabaseSmokeClient({ hyperdrive })
  // Unlike the database handles there is no safe default here: the Clerk keys
  // live in the Worker runtime env, which only the request entry point can
  // read. Absent means the check reports `unconfigured`.
  const clerkKeys = hasClerkKeysOption(options) ? (options.clerkKeys ?? null) : null
  const logger = hasLoggerOption(options)
    ? (options.logger ?? createNoopStructuredLogger())
    : createNoopStructuredLogger()
  const requestMetadata = hasRequestMetadataOption(options)
    ? (options.requestMetadata ?? null)
    : null
  const userRepository = hasUsersOption(options)
    ? options.users
    : createUserRepository({ hyperdrive })
  const runRepository = hasRunsOption(options)
    ? options.runs
    : createRunRepository({ hyperdrive })
  const userExerciseRepository = hasUserExercisesOption(options)
    ? options.userExercises
    : createUserExerciseRepository({ hyperdrive })
  const routineRepository = hasRoutinesOption(options)
    ? options.routines
    : createRoutineRepository({ hyperdrive })

  return {
    auth,
    clerkKeys,
    dbSmoke,
    logger,
    requestMetadata,
    routines: routineRepository ?? null,
    runs: runRepository,
    userExercises: userExerciseRepository ?? null,
    users: userRepository,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
