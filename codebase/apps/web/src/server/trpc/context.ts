import type { HyperdriveConnection } from '../db/connection'
import {
  createProfileRepository,
  type ProfileRepository,
} from '../db/profiles'
import { createUserRepository, type UserRepository } from '../db/users'

interface CreateContextOptions {
  auth?: AuthContext | null
  profiles?: ProfileRepository | null
  users?: UserRepository | null
  hyperdrive?: HyperdriveConnection | null
}

export interface AuthContext {
  clerkUserId: string | null
}

type AstroLocalsWithAuth = {
  auth?: () => { userId: string | null }
}

function hasUsersOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'users' in options
}

function hasProfilesOption(options: unknown): options is CreateContextOptions {
  return typeof options === 'object' && options !== null && 'profiles' in options
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
  const userRepository = hasUsersOption(options)
    ? options.users
    : createUserRepository({ hyperdrive })
  const profileRepository = hasProfilesOption(options)
    ? options.profiles
    : createProfileRepository({ hyperdrive })

  return { auth, profiles: profileRepository, users: userRepository }
}

export type Context = Awaited<ReturnType<typeof createContext>>
