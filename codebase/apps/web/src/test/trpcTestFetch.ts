import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { ExerciseRun } from '../appData/run'
import type { RunRepository } from '../server/db/runs'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'

export const TEST_CLERK_USER_ID = 'user_test_123'

const runs = new Map<string, Map<string, ExerciseRun>>()
let runsRepositoryAvailable = true

export function resetTrpcTestData() {
  runs.clear()
  runsRepositoryAvailable = true
}

export function getTrpcTestRuns(): ExerciseRun[] {
  return listStoredRuns(TEST_CLERK_USER_ID)
}

export function setTrpcTestRunsRepositoryAvailable(available: boolean) {
  runsRepositoryAvailable = available
}

const runRepository = {
  async listRuns(clerkUserId) {
    return listStoredRuns(clerkUserId)
  },

  async saveRun(clerkUserId, run) {
    const userRuns = runs.get(clerkUserId) ?? new Map()
    userRuns.set(run.id, { ...run })
    runs.set(clerkUserId, userRuns)
    return { ...run }
  },
} satisfies RunRepository

function listStoredRuns(clerkUserId: string): ExerciseRun[] {
  return [...(runs.get(clerkUserId)?.values() ?? [])]
    .map((run) => ({ ...run }))
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
        runs: runsRepositoryAvailable ? runRepository : null,
        users: null,
      }),
  })
}
