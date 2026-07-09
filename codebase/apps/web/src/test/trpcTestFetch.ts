import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { PracticeProfile } from '../appData/profile'
import {
  clampPlayAlongTempo,
  defaultPracticePreferences,
  type PracticePreferences,
} from '../appData/preferences'
import type { PracticeSession } from '../appData/session'
import type { ProfileRepository } from '../server/db/profiles'
import type { PreferenceRepository } from '../server/db/preferences'
import type { SessionRepository } from '../server/db/sessions'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'

export const TEST_CLERK_USER_ID = 'user_test_123'

const profiles = new Map<string, PracticeProfile>()
const preferences = new Map<string, PracticePreferences>()
const sessions = new Map<string, Map<string, PracticeSession>>()
let sessionsRepositoryAvailable = true
let preferenceReadDelayMs = 0
let preferenceWriteDelayMs = 0
let preferenceWriteFailuresRemaining = 0
let preferenceRepositoryAvailable = true
const preferenceWriteCalls: string[] = []

export function resetTrpcTestData() {
  profiles.clear()
  preferences.clear()
  sessions.clear()
  sessionsRepositoryAvailable = true
  preferenceReadDelayMs = 0
  preferenceWriteDelayMs = 0
  preferenceWriteFailuresRemaining = 0
  preferenceRepositoryAvailable = true
  preferenceWriteCalls.length = 0
}

export function seedTrpcTestProfile(profile: PracticeProfile) {
  profiles.set(TEST_CLERK_USER_ID, cloneProfile(profile))
}

export function getTrpcTestProfile(): PracticeProfile | null {
  const profile = profiles.get(TEST_CLERK_USER_ID)
  return profile ? cloneProfile(profile) : null
}

export function seedTrpcTestPreferences(seed: PracticePreferences) {
  preferences.set(TEST_CLERK_USER_ID, clonePreferences(seed))
}

export function getTrpcTestPreferences(): PracticePreferences {
  return clonePreferences(
    preferences.get(TEST_CLERK_USER_ID) ?? defaultPracticePreferences(),
  )
}

export function setTrpcTestPreferenceBehavior({
  readDelayMs = 0,
  writeDelayMs = 0,
  writeFailures = 0,
  repositoryAvailable = true,
}: {
  readDelayMs?: number
  writeDelayMs?: number
  writeFailures?: number
  repositoryAvailable?: boolean
}) {
  preferenceReadDelayMs = readDelayMs
  preferenceWriteDelayMs = writeDelayMs
  preferenceWriteFailuresRemaining = writeFailures
  preferenceRepositoryAvailable = repositoryAvailable
}

export function getTrpcTestPreferenceWriteCalls(): string[] {
  return [...preferenceWriteCalls]
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

export function setTrpcTestSessionsRepositoryAvailable(available: boolean) {
  sessionsRepositoryAvailable = available
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

const preferenceRepository = {
  async getPreferences(clerkUserId) {
    await delay(preferenceReadDelayMs)
    return getStoredPreferences(clerkUserId)
  },

  async setNotationDisplayMode(clerkUserId, mode) {
    await beforePreferenceWrite('notation')
    const current = getStoredPreferences(clerkUserId)
    preferences.set(
      clerkUserId,
      clonePreferences({ ...current, notationDisplayMode: mode }),
    )
    return mode
  },

  async setScoringTolerance(clerkUserId, tolerance) {
    await beforePreferenceWrite('scoring')
    const current = getStoredPreferences(clerkUserId)
    preferences.set(
      clerkUserId,
      clonePreferences({ ...current, scoringTolerance: tolerance }),
    )
    return tolerance
  },

  async setPlayAlongTempo(clerkUserId, exerciseId, tempoBpm) {
    await beforePreferenceWrite(`tempo:${exerciseId}`)
    const current = getStoredPreferences(clerkUserId)
    const clamped = clampPlayAlongTempo(tempoBpm)
    preferences.set(
      clerkUserId,
      clonePreferences({
        ...current,
        playAlongTempos: {
          ...current.playAlongTempos,
          [exerciseId]: clamped,
        },
      }),
    )
    return clamped
  },
} satisfies PreferenceRepository

async function beforePreferenceWrite(key: string): Promise<void> {
  preferenceWriteCalls.push(key)
  await delay(preferenceWriteDelayMs)
  if (preferenceWriteFailuresRemaining > 0) {
    preferenceWriteFailuresRemaining -= 1
    throw new Error('Preference test write failed')
  }
}

function delay(milliseconds: number): Promise<void> {
  return milliseconds > 0
    ? new Promise((resolve) => setTimeout(resolve, milliseconds))
    : Promise.resolve()
}

function getStoredPreferences(clerkUserId: string): PracticePreferences {
  return clonePreferences(
    preferences.get(clerkUserId) ?? defaultPracticePreferences(),
  )
}

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

function clonePreferences(value: PracticePreferences): PracticePreferences {
  return {
    ...value,
    playAlongTempos: { ...value.playAlongTempos },
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
        preferences: preferenceRepositoryAvailable
          ? preferenceRepository
          : null,
        sessions: sessionsRepositoryAvailable ? sessionRepository : null,
        users: null,
      }),
  })
}
