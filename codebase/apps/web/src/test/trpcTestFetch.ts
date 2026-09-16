import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { PracticeSession } from '../appData/session'
import type { SessionRepository } from '../server/db/sessions'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'

export const TEST_CLERK_USER_ID = 'user_test_123'

const sessions = new Map<string, Map<string, PracticeSession>>()
let sessionsRepositoryAvailable = true

export function resetTrpcTestData() {
  sessions.clear()
  sessionsRepositoryAvailable = true
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

function cloneSession(session: PracticeSession): PracticeSession {
  return { ...session }
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
        sessions: sessionsRepositoryAvailable ? sessionRepository : null,
        users: null,
      }),
  })
}
