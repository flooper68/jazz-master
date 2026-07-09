import type { HyperdriveConnection } from '../db/connection'
import {
  createDatabaseSmokeClient,
  type DatabaseSmokeClient,
} from '../db/smoke'
import {
  createProfileRepository,
  type ProfileRepository,
} from '../db/profiles'
import {
  createPreferenceRepository,
  type PreferenceRepository,
} from '../db/preferences'
import {
  createSessionRepository,
  type SessionRepository,
} from '../db/sessions'
import { createUserRepository, type UserRepository } from '../db/users'
import {
  createNoopStructuredLogger,
  type RequestLogMetadata,
  type StructuredLogger,
} from '../observability/logger'

interface CreateContextOptions {
  auth?: AuthContext | null
  dbSmoke?: DatabaseSmokeClient | null
  logger?: StructuredLogger
  requestMetadata?: RequestLogMetadata | null
  profiles?: ProfileRepository | null
  preferences?: PreferenceRepository | null
  sessions?: SessionRepository | null
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

function hasUsersOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'users' in options
}

function hasProfilesOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'profiles' in options
}

function hasPreferencesOption(options: unknown): options is CreateContextOptions {
  return (
    typeof options === 'object' && options !== null && 'preferences' in options
  )
}

function hasSessionsOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'sessions' in options
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
  const logger = hasLoggerOption(options)
    ? (options.logger ?? createNoopStructuredLogger())
    : createNoopStructuredLogger()
  const requestMetadata = hasRequestMetadataOption(options)
    ? (options.requestMetadata ?? null)
    : null
  const userRepository = hasUsersOption(options)
    ? options.users
    : createUserRepository({ hyperdrive })
  const profileRepository = hasProfilesOption(options)
    ? options.profiles
    : createProfileRepository({ hyperdrive })
  const preferenceRepository = hasPreferencesOption(options)
    ? options.preferences
    : createPreferenceRepository({ hyperdrive })
  const sessionRepository = hasSessionsOption(options)
    ? options.sessions
    : createSessionRepository({ hyperdrive })

  return {
    auth,
    dbSmoke,
    logger,
    requestMetadata,
    profiles: profileRepository,
    preferences: preferenceRepository,
    sessions: sessionRepository,
    users: userRepository,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
