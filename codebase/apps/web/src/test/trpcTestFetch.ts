import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { ExerciseRun } from '../appData/run'
import type { RunRepository } from '../server/db/runs'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'
import type { ExerciseInput } from '../content/exerciseInput'
import type { RoutineInput } from '../appData/routine'
import type { GoalRepository } from '../server/db/goals'
import type { NoteRepository } from '../server/db/notes'
import type { RoutineRepository } from '../server/db/routines'
import type { UserExerciseRepository } from '../server/db/userExercises'
import { createMemoryGoalRepository } from './memoryGoals'
import { createMemoryNoteRepository } from './memoryNotes'
import { createMemoryRoutineRepository } from './memoryRoutines'
import { createMemoryUserExerciseRepository } from './memoryUserExercises'

export const TEST_CLERK_USER_ID = 'user_test_123'

const runs = new Map<string, Map<string, ExerciseRun>>()
let runsRepositoryAvailable = true
let userExercises: UserExerciseRepository = createMemoryUserExerciseRepository()
let routines: RoutineRepository = createMemoryRoutineRepository()
let routinesRepositoryAvailable = true
let notes: NoteRepository = createMemoryNoteRepository()
let goals: GoalRepository = createMemoryGoalRepository()

export function resetTrpcTestData() {
  runs.clear()
  runsRepositoryAvailable = true
  userExercises = createMemoryUserExerciseRepository()
  routines = createMemoryRoutineRepository()
  routinesRepositoryAvailable = true
  notes = createMemoryNoteRepository()
  goals = createMemoryGoalRepository()
}

/** Give the test user a goal; resolves to it as stored, id included. */
export async function seedTrpcTestGoal(goal: Parameters<GoalRepository['createGoal']>[1]) {
  return goals.createGoal(TEST_CLERK_USER_ID, goal)
}

/** The notes the test user has written, for asserting what a page saved. */
export function getTrpcTestNotes() {
  return notes.listNotes(TEST_CLERK_USER_ID)
}

/** Put routines in the test user's account; resolves to them as stored, ids included. */
export async function seedTrpcTestRoutines(seedRoutines: RoutineInput[]) {
  const stored = []
  // In order, so the list comes back oldest first as seeded.
  for (const routine of seedRoutines) stored.push(await routines.createRoutine(TEST_CLERK_USER_ID, routine))
  return stored
}

export function getTrpcTestRoutines() {
  return routines.listRoutines(TEST_CLERK_USER_ID)
}

export function setTrpcTestRoutinesRepositoryAvailable(available: boolean) {
  routinesRepositoryAvailable = available
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
        goals,
        notes,
        routines: routinesRepositoryAvailable ? routines : null,
        userExercises,
        users: null,
      }),
  })
}
