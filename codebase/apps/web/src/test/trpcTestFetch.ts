import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { PracticeProfile } from '../appData/profile'
import type { ProfileRepository } from '../server/db/profiles'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'

export const TEST_CLERK_USER_ID = 'user_test_123'

const profiles = new Map<string, PracticeProfile>()

export function resetTrpcTestData() {
  profiles.clear()
}

export function seedTrpcTestProfile(profile: PracticeProfile) {
  profiles.set(TEST_CLERK_USER_ID, cloneProfile(profile))
}

export function getTrpcTestProfile(): PracticeProfile | null {
  const profile = profiles.get(TEST_CLERK_USER_ID)
  return profile ? cloneProfile(profile) : null
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

function cloneProfile(profile: PracticeProfile): PracticeProfile {
  return {
    levels: { ...profile.levels },
    goalAreas: [...profile.goalAreas],
    minutesPerDay: profile.minutesPerDay,
    createdAt: profile.createdAt,
  }
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
        users: null,
      }),
  })
}
