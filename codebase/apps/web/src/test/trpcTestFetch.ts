import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { ExerciseRun } from '../appData/run'
import type { RunRepository } from '../server/db/runs'
import { createContext } from '../server/trpc/context'
import { appRouter } from '../server/trpc/router'
import type { ExerciseInput } from '../content/exerciseInput'
import type { PlayerRepository } from '../server/db/player'
import type { GoalRepository } from '../server/db/goals'
import type { NoteRepository } from '../server/db/notes'
import type { UserExerciseRepository } from '../server/db/userExercises'
import type { UserRepository } from '../server/db/users'
import type { PlayerPrefs } from '../appData/playerPrefs'
import { createMemoryGoalRepository } from './memoryGoals'
import { createMemoryPlayerRepository } from './memoryPlayer'
import { createMemoryNoteRepository } from './memoryNotes'
import { createMemoryUserExerciseRepository } from './memoryUserExercises'
import { createMemoryUserRepository } from './memoryUsers'

export const TEST_CLERK_USER_ID = 'user_test_123'

const runs = new Map<string, Map<string, ExerciseRun>>()
let runsRepositoryAvailable = true
let userExercises: UserExerciseRepository = createMemoryUserExerciseRepository()
let notes: NoteRepository = createMemoryNoteRepository()
let goals: GoalRepository = createMemoryGoalRepository()
let player: PlayerRepository = createMemoryPlayerRepository()
let users: UserRepository = createMemoryUserRepository()
// The account is only asked about the player's settings once a test says the
// user row exists; the rest run as they did before, with no user repository.
let usersRepositoryAvailable = false

export function resetTrpcTestData() {
  runs.clear()
  runsRepositoryAvailable = true
  userExercises = createMemoryUserExerciseRepository()
  notes = createMemoryNoteRepository()
  goals = createMemoryGoalRepository()
  player = createMemoryPlayerRepository()
  users = createMemoryUserRepository()
  usersRepositoryAvailable = false
}

/** Turn the account's stored player settings on, optionally with settings already saved. */
export async function seedTrpcTestPlayerPrefs(prefs: PlayerPrefs | null = null) {
  usersRepositoryAvailable = true
  if (prefs) await users.writePlayerPrefs(TEST_CLERK_USER_ID, prefs)
}

/** What the account holds now, for asserting what a page wrote. */
export function getTrpcTestPlayerPrefs() {
  return users.readPlayerPrefs(TEST_CLERK_USER_ID)
}

/**
 * The very repositories the tRPC router is serving here, so a test can drive
 * the MCP *server* surface over the same seeded data the browser's tools see —
 * which is how the two are held to one answer (JM-11).
 */
export function trpcTestStores(): {
  goals: GoalRepository
  player: PlayerRepository
  userExercises: UserExerciseRepository
  runs: RunRepository | null
} {
  return {
    goals,
    player,
    userExercises,
    runs: runsRepositoryAvailable ? runRepository : null,
  }
}

/** Give the test user a goal; resolves to it as stored, id included. */
export async function seedTrpcTestGoal(goal: Parameters<GoalRepository['createGoal']>[1]) {
  return goals.createGoal(TEST_CLERK_USER_ID, goal)
}

/** Put a note on one of the test user's sittings, as the closing dialog would. */
export function seedTrpcTestNote(sessionId: string, text: string) {
  return notes.saveNote(TEST_CLERK_USER_ID, sessionId, text)
}

/** The notes the test user has written, for asserting what a page saved. */
export function getTrpcTestNotes() {
  return notes.listNotes(TEST_CLERK_USER_ID)
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
        player,
        userExercises,
        users: usersRepositoryAvailable ? users : null,
      }),
  })
}
