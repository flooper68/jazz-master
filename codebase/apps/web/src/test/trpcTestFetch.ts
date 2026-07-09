import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { PracticeProfile } from '../appData/profile'
import type { PracticeSession } from '../appData/session'
import type { ProfileRepository } from '../server/db/profiles'
import type { SessionRepository } from '../server/db/sessions'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'

export const TEST_CLERK_USER_ID = 'user_test_123'

const profiles = new Map<string, PracticeProfile>()
const sessions = new Map<string, Map<string, PracticeSession>>()

export function resetTrpcTestData() {
  profiles.clear()
  sessions.clear()
}

export function seedTrpcTestProfile(profile: PracticeProfile) {
  profiles.set(TEST_CLERK_USER_ID, cloneProfile(profile))
}

export function getTrpcTestProfile(): PracticeProfile | null {
  const profile = profiles.get(TEST_CLERK_USER_ID)
  return profile ? cloneProfile(profile) : null
}

export function seedTrpcTestSessions(seedSessions: PracticeSession[]) {
  sessions.set(
    TEST_CLERK_USER_ID,
    new Map(seedSessions.map((session) => [session.id, cloneSession(session)])),
  )
}

export function getTrpcTestSessions(): PracticeSession[] {
  return listStoredSessions(TEST_CLERK_USER_ID)
}

const profileRepository = {
  async getProfile(clerkUserId) {
    const profile = profiles.get(clerkUserId)
    return profile ? cloneProfile(profile) : null
  },

  async saveProfile(clerkUserId, profile) {
    const stored = cloneProfile(profile)
    profiles.set(clerkUserId, stored)
    return cloneProfile(stored)
  },
} satisfies ProfileRepository

const sessionRepository = {
  async listSessions(clerkUserId) {
    return listStoredSessions(clerkUserId)
  },

  async upsertSession(clerkUserId, session) {
    const userSessions = sessions.get(clerkUserId) ?? new Map()
    const stored = cloneSession(session)
    userSessions.set(session.id, stored)
    sessions.set(clerkUserId, userSessions)
    return cloneSession(stored)
  },
} satisfies SessionRepository

function cloneProfile(profile: PracticeProfile): PracticeProfile {
  return {
    levels: { ...profile.levels },
    goalAreas: [...profile.goalAreas],
    minutesPerDay: profile.minutesPerDay,
    createdAt: profile.createdAt,
  }
}

function cloneSession(session: PracticeSession): PracticeSession {
  return {
    ...session,
    results: session.results.map((result) => ({
      ...result,
      ...(result.score
        ? {
            score: {
              ...result.score,
              components: { ...result.score.components },
              perNote: result.score.perNote.map((note) => ({ ...note })),
            },
          }
        : {}),
    })),
  }
}

function listStoredSessions(clerkUserId: string): PracticeSession[] {
  return [...(sessions.get(clerkUserId)?.values() ?? [])]
    .map(cloneSession)
    .sort(
      (a, b) =>
        new Date(b.startedAt).valueOf() - new Date(a.startedAt).valueOf(),
    )
}

/**
 * In-process fetch for tests: serves tRPC requests through the real fetch
 * adapter and appRouter, so jsdom tests exercise the exact wire path the
 * browser uses (batch link → adapter → router → Zod) without a server.
 * jsdom has no document.baseURI host, so relative URLs resolve against
 * localhost.
 */
export const trpcTestFetch: typeof globalThis.fetch = (input, init) => {
  const raw =
    typeof input === 'string' || input instanceof URL ? input : input.url
  const url = new URL(raw, 'http://localhost')
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: new Request(url, init),
    router: appRouter,
    createContext: () =>
      createContext({
        auth: { clerkUserId: TEST_CLERK_USER_ID },
        profiles: profileRepository,
        sessions: sessionRepository,
        users: null,
      }),
  })
}
