import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { ExerciseRun } from '../appData/run'
import type { RunRepository } from '../server/db/runs'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'
import type { ExerciseInput } from '../content/exerciseInput'
import type { UserExerciseRepository } from '../server/db/userExercises'
import { createMemoryUserExerciseRepository } from './memoryUserExercises'

export const TEST_CLERK_USER_ID = 'user_test_123'

const runs = new Map<string, Map<string, ExerciseRun>>()
let runsRepositoryAvailable = true
let userExercises: UserExerciseRepository = createMemoryUserExerciseRepository()

export function resetTrpcTestData() {
  runs.clear()
  runsRepositoryAvailable = true
  userExercises = createMemoryUserExerciseRepository()
}

/** Put exercises in the test user's library; resolves to them as stored, ids included. */
export function seedTrpcTestLibrary(exercises: ExerciseInput[]) {
  return Promise.all(exercises.map((exercise) => userExercises.createExercise(TEST_CLERK_USER_ID, exercise)))
}

export function seedTrpcTestRuns(seedRuns: ExerciseRun[]) {
  runs.set(
    TEST_CLERK_USER_ID,
    new Map(seedRuns.map((run) => [run.id, { ...run }])),
  )
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
        userExercises,
        users: null,
      }),
  })
}
