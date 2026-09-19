import { describe, expect, it } from 'vitest'
import type { ExerciseRun } from '../../appData/run'
import type { StructuredLogger } from '../observability/logger'
import type { RunRepository } from '../db/runs'
import { LONGEST_NOTE } from '../../appData/note'
import { createMemoryGoalRepository } from '../../test/memoryGoals'
import { createMemoryNoteRepository } from '../../test/memoryNotes'
import { createMemoryRunRepository } from '../../test/memoryRuns'
import type { UserRepository } from '../db/users'
import { createContext } from './context'
import { createCallerFactory } from './init'
import { appRouter } from './router'

const createCaller = createCallerFactory(appRouter)

describe('appRouter.health', () => {
  it('reports ok with the current time as an ISO datetime', async () => {
    const caller = createCaller(createContext())
    const before = Date.now()

    const result = await caller.health()

    expect(result.status).toBe('ok')
    const time = Date.parse(result.time)
    expect(time).toBeGreaterThanOrEqual(before)
    expect(time).toBeLessThanOrEqual(Date.now())
    expect(result.time).toBe(new Date(result.time).toISOString())
  })

  it('stays public when no authenticated Clerk user is present', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        users: null,
      }),
    )

    await expect(caller.health()).resolves.toMatchObject({ status: 'ok' })
  })
})

describe('appRouter.dbSmoke', () => {
  it('reports unconfigured and emits a structured unconfigured log when no smoke client is available', async () => {
    const events: Array<Record<string, unknown>> = []
    const caller = createCaller(
      createContext({
        dbSmoke: null,
        logger: {
          emit(_level, event) {
            events.push(event)
          },
        } satisfies StructuredLogger,
        requestMetadata: { requestId: 'req_test' },
      }),
    )

    await expect(caller.dbSmoke()).resolves.toMatchObject({
      status: 'unconfigured',
    })
    expect(events).toEqual([
      {
        event: 'db.smoke.completed',
        procedure: 'dbSmoke',
        route: '/trpc/dbSmoke',
        requestId: 'req_test',
        outcome: 'unconfigured',
        status: 200,
        errorKind: 'unconfigured_runtime',
      },
    ])
  })

  it('reports an error and emits a structured failure log when the smoke query fails', async () => {
    const events: Array<Record<string, unknown>> = []
    const caller = createCaller(
      createContext({
        dbSmoke: {
          async check() {
            throw new Error('connection failed')
          },
        },
        logger: {
          emit(_level, event) {
            events.push(event)
          },
        } satisfies StructuredLogger,
        requestMetadata: { requestId: 'req_test' },
      }),
    )

    await expect(caller.dbSmoke()).resolves.toMatchObject({
      status: 'error',
      message: 'Database smoke check failed',
    })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      event: 'db.smoke.completed',
      procedure: 'dbSmoke',
      route: '/trpc/dbSmoke',
      requestId: 'req_test',
      outcome: 'error',
      status: 503,
      errorKind: 'query_or_connectivity_failure',
    })
  })
})

describe('appRouter.clerkKeys', () => {
  function collectingLogger(events: Array<Record<string, unknown>>) {
    return {
      emit(_level, event) {
        events.push(event)
      },
    } satisfies StructuredLogger
  }

  it('reports unconfigured when the runtime exposes no Clerk key pair', async () => {
    const events: Array<Record<string, unknown>> = []
    const caller = createCaller(
      createContext({
        clerkKeys: null,
        logger: collectingLogger(events),
        requestMetadata: { requestId: 'req_test' },
      }),
    )

    await expect(caller.clerkKeys()).resolves.toMatchObject({
      status: 'unconfigured',
    })
    expect(events).toEqual([
      {
        event: 'clerk.keys.completed',
        procedure: 'clerkKeys',
        route: '/trpc/clerkKeys',
        requestId: 'req_test',
        outcome: 'unconfigured',
        status: 200,
        errorKind: 'unconfigured_runtime',
      },
    ])
  })

  it('reports ok when both keys resolve to the same Clerk instance', async () => {
    const caller = createCaller(
      createContext({
        clerkKeys: { check: async () => 'ok' as const },
      }),
    )

    await expect(caller.clerkKeys()).resolves.toMatchObject({ status: 'ok' })
  })

  // The ISSUE-011 condition: this is what the deployed probe must surface.
  it('reports a mismatch and logs it when the keys resolve to different instances', async () => {
    const events: Array<Record<string, unknown>> = []
    const caller = createCaller(
      createContext({
        clerkKeys: { check: async () => 'mismatch' as const },
        logger: collectingLogger(events),
        requestMetadata: { requestId: 'req_test' },
      }),
    )

    await expect(caller.clerkKeys()).resolves.toMatchObject({
      status: 'mismatch',
      message:
        'Clerk publishable and secret keys resolve to different instances',
    })
    expect(events[0]).toMatchObject({
      event: 'clerk.keys.completed',
      outcome: 'error',
      status: 503,
      errorKind: 'instance_mismatch',
    })
  })

  it('reports a sanitized error and logs it when the check itself fails', async () => {
    const events: Array<Record<string, unknown>> = []
    const caller = createCaller(
      createContext({
        clerkKeys: {
          check: async () => {
            throw new Error('JWKS request failed with status 401')
          },
        },
        logger: collectingLogger(events),
        requestMetadata: { requestId: 'req_test' },
      }),
    )

    const result = await caller.clerkKeys()

    expect(result).toMatchObject({
      status: 'error',
      message: 'Clerk key pair check failed',
    })
    expect(JSON.stringify(result)).not.toContain('401')
    expect(events[0]).toMatchObject({
      outcome: 'error',
      status: 503,
      errorKind: 'check_failed',
    })
  })
})

describe('appRouter.auth.me', () => {
  it('rejects unauthenticated callers', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        users: null,
      }),
    )

    await expect(caller.auth.me()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  })

  it('returns the authenticated Clerk user ID from context', async () => {
    let calls = 0
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        users: {
          async ensureUser(clerkUserId: string) {
            calls += 1

            return {
              clerkUserId,
              createdAt: '2026-07-09T10:00:00.000Z',
              updatedAt: '2026-07-09T10:00:00.000Z',
            }
          },
        },
      }),
    )

    await expect(caller.auth.me()).resolves.toEqual({ clerkUserId: 'user_123' })
    expect(calls).toBe(0)
  })
})

describe('appRouter.users.ensure', () => {
  it('reports unconfigured when no user repository is available', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        users: null,
      }),
    )

    await expect(caller.users.ensure()).resolves.toEqual({
      status: 'unconfigured',
    })
  })

  it('creates a Clerk-keyed user row on first authenticated access', async () => {
    const createdAt = '2026-07-09T10:00:00.000Z'
    const calls: string[] = []
    const users = {
      async ensureUser(clerkUserId: string) {
        calls.push(clerkUserId)

        return {
          clerkUserId,
          createdAt,
          updatedAt: createdAt,
        }
      },
      async deleteUser() {},
      async readPlayerPrefs() {
        return null
      },
      async writePlayerPrefs(_clerkUserId, prefs) {
        return prefs
      },
    } satisfies UserRepository
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        users,
      }),
    )

    await expect(caller.users.ensure()).resolves.toEqual({
      status: 'ok',
      user: {
        clerkUserId: 'user_123',
        createdAt,
        updatedAt: createdAt,
      },
    })
    expect(calls).toEqual(['user_123'])
  })

  it('reuses the same Clerk-keyed user row on repeat authenticated access', async () => {
    const createdAt = '2026-07-09T10:00:00.000Z'
    const calls: string[] = []
    let createdRows = 0
    const storedUsers = new Map<
      string,
      {
        clerkUserId: string
        createdAt: string
        updatedAt: string
      }
    >()
    const users = {
      async ensureUser(clerkUserId: string) {
        calls.push(clerkUserId)
        const existing = storedUsers.get(clerkUserId)

        if (existing) return existing

        createdRows += 1
        const created = {
          clerkUserId,
          createdAt,
          updatedAt: createdAt,
        }
        storedUsers.set(clerkUserId, created)

        return created
      },
      async deleteUser() {},
      async readPlayerPrefs() {
        return null
      },
      async writePlayerPrefs(_clerkUserId, prefs) {
        return prefs
      },
    } satisfies UserRepository
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        users,
      }),
    )

    const first = await caller.users.ensure()
    const second = await caller.users.ensure()

    expect(first).toEqual(second)
    expect(calls).toEqual(['user_123', 'user_123'])
    expect(createdRows).toBe(1)
    expect(storedUsers.size).toBe(1)
  })

  it('rejects unauthenticated access before user rows can be read or created', async () => {
    let calls = 0
    const users = {
      async ensureUser(clerkUserId: string) {
        calls += 1

        return {
          clerkUserId,
          createdAt: '2026-07-09T10:00:00.000Z',
          updatedAt: '2026-07-09T10:00:00.000Z',
        }
      },
      async deleteUser() {},
      async readPlayerPrefs() {
        return null
      },
      async writePlayerPrefs(_clerkUserId, prefs) {
        return prefs
      },
    } satisfies UserRepository
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        users,
      }),
    )

    await expect(caller.users.ensure()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
    expect(calls).toBe(0)
  })
})

describe('appRouter.runs', () => {
  it('reports unconfigured when no run repository is available', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        runs: null,
      }),
    )

    await expect(caller.runs.list()).resolves.toEqual({
      status: 'unconfigured',
    })
    await expect(caller.runs.save(runRecord())).resolves.toEqual({
      status: 'unconfigured',
    })
  })

  it('writes and reads runs for the authenticated user only', async () => {
    const runs = createMemoryRunRepository()
    const caller = createCaller(
      createContext({ auth: { clerkUserId: 'user_123' }, runs }),
    )
    const otherCaller = createCaller(
      createContext({ auth: { clerkUserId: 'user_456' }, runs }),
    )
    const run = runRecord()

    await expect(caller.runs.save(run)).resolves.toEqual({
      status: 'ok',
      run,
    })
    await expect(caller.runs.list()).resolves.toEqual({
      status: 'ok',
      runs: [run],
    })
    await expect(otherCaller.runs.list()).resolves.toEqual({
      status: 'ok',
      runs: [],
    })
  })

  it('updates a run in place when its answer arrives', async () => {
    const runs = createMemoryRunRepository()
    const caller = createCaller(
      createContext({ auth: { clerkUserId: 'user_123' }, runs }),
    )
    const run = runRecord()

    await caller.runs.save(run)
    await caller.runs.save({ ...run, difficulty: 'hard' })

    await expect(caller.runs.list()).resolves.toEqual({
      status: 'ok',
      runs: [{ ...run, difficulty: 'hard' }],
    })
  })

  it('keeps a feel with the run it belongs to, and rejects one outside the three', async () => {
    const runs = createMemoryRunRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, runs }))
    const run = runRecord()

    await caller.runs.save({ ...run, feel: 'loved' })
    await expect(caller.runs.list()).resolves.toEqual({ status: 'ok', runs: [{ ...run, feel: 'loved' }] })

    await expect(
      caller.runs.save(runRecord({ feel: 'delighted' } as unknown as Partial<ExerciseRun>)),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it.each(['', 'fine', 7, 'Easy'])('rejects a difficulty of %s', async (difficulty) => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        runs: createMemoryRunRepository(),
      }),
    )

    await expect(
      // A difficulty outside the four is exactly what the schema is for.
      caller.runs.save(runRecord({ difficulty } as Partial<ExerciseRun>)),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('rejects attempts to overwrite another user run', async () => {
    const runs = createMemoryRunRepository()
    const run = runRecord()
    const ownerCaller = createCaller(
      createContext({ auth: { clerkUserId: 'user_123' }, runs }),
    )
    const otherCaller = createCaller(
      createContext({ auth: { clerkUserId: 'user_456' }, runs }),
    )

    await ownerCaller.runs.save(run)

    await expect(otherCaller.runs.save(run)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Run belongs to another user',
    })
  })

  it('reports a failed write without leaking the cause', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        runs: {
          async listRuns() {
            throw new Error('connection refused')
          },
          async saveRun() {
            throw new Error('connection refused')
          },
        } satisfies RunRepository,
      }),
    )

    await expect(caller.runs.save(runRecord())).resolves.toEqual({
      status: 'error',
      message: 'Run database write failed',
    })
    await expect(caller.runs.list()).resolves.toEqual({
      status: 'error',
      message: 'Run database read failed',
    })
  })

  it('rejects unauthenticated run reads before the repository is called', async () => {
    let calls = 0
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        runs: {
          async listRuns() {
            calls += 1
            return []
          },
          async saveRun(_clerkUserId, run) {
            calls += 1
            return run
          },
        } satisfies RunRepository,
      }),
    )

    await expect(caller.runs.list()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
    expect(calls).toBe(0)
  })
})

function runRecord(overrides: Partial<ExerciseRun> = {}): ExerciseRun {
  return {
    id: crypto.randomUUID(),
    exerciseId: 'scales-major-open-c',
    startedAt: '2026-09-17T10:00:00.000Z',
    durationSeconds: 120,
    tempoBpm: 60,
    passes: 6,
    completed: true,
    difficulty: null,
    feel: null,
    sessionId: null,
    ...overrides,
  }
}

describe('appRouter.users.deleteData', () => {
  it('deletes what the app saved under the signed-in user, and only theirs', async () => {
    const deleted: string[] = []
    const users = {
      async ensureUser(clerkUserId: string) {
        return { clerkUserId, createdAt: '2026-07-09T10:00:00.000Z', updatedAt: '2026-07-09T10:00:00.000Z' }
      },
      async deleteUser(clerkUserId: string) {
        deleted.push(clerkUserId)
      },
      async readPlayerPrefs() {
        return null
      },
      async writePlayerPrefs(_clerkUserId, prefs) {
        return prefs
      },
    } satisfies UserRepository
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_wes' }, users }))

    await expect(caller.users.deleteData()).resolves.toEqual({ status: 'ok' })
    expect(deleted).toEqual(['user_wes'])
  })

  it('refuses a signed-out caller', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: null }, users: null }))

    await expect(caller.users.deleteData()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('reports an error rather than ok when the delete fails, so the account is left alone', async () => {
    const users = {
      async ensureUser(clerkUserId: string) {
        return { clerkUserId, createdAt: '2026-07-09T10:00:00.000Z', updatedAt: '2026-07-09T10:00:00.000Z' }
      },
      async deleteUser() {
        throw new Error('connection refused')
      },
      async readPlayerPrefs() {
        return null
      },
      async writePlayerPrefs(_clerkUserId, prefs) {
        return prefs
      },
    } satisfies UserRepository
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_wes' }, users }))

    await expect(caller.users.deleteData()).resolves.toEqual({ status: 'error', message: 'Account data could not be deleted' })
  })
})

describe('session notes over tRPC', () => {
  const sessionId = '55555555-5555-4555-8555-555555555555'

  it('reports unconfigured rather than failing when there is no database', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, notes: null }))

    await expect(caller.notes.list()).resolves.toEqual({ status: 'unconfigured' })
    await expect(caller.notes.save({ sessionId, text: 'anything' })).resolves.toEqual({ status: 'unconfigured' })
  })

  it('refuses a signed-out caller', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: null }, notes: createMemoryNoteRepository() }))

    await expect(caller.notes.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(caller.notes.save({ sessionId, text: 'anything' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('writes and reads notes for the authenticated user only', async () => {
    const notes = createMemoryNoteRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, notes }))
    const otherCaller = createCaller(createContext({ auth: { clerkUserId: 'user_456' }, notes }))

    const saved = await caller.notes.save({ sessionId, text: 'The ii–V finally sat in the pocket.' })
    expect(saved).toMatchObject({ status: 'ok', note: { sessionId, text: 'The ii–V finally sat in the pocket.' } })

    await expect(caller.notes.list()).resolves.toMatchObject({
      status: 'ok',
      notes: [{ sessionId, text: 'The ii–V finally sat in the pocket.' }],
    })
    // Another user's sitting is not theirs to read.
    await expect(otherCaller.notes.list()).resolves.toEqual({ status: 'ok', notes: [] })
  })

  it('cannot be written over by another user, however the session id was come by', async () => {
    const notes = createMemoryNoteRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, notes }))
    const otherCaller = createCaller(createContext({ auth: { clerkUserId: 'user_456' }, notes }))

    await caller.notes.save({ sessionId, text: 'Mine.' })
    // The same session id from another account writes that account's own note.
    await otherCaller.notes.save({ sessionId, text: 'Not yours.' })

    await expect(caller.notes.list()).resolves.toMatchObject({ status: 'ok', notes: [{ text: 'Mine.' }] })
    await expect(otherCaller.notes.list()).resolves.toMatchObject({ status: 'ok', notes: [{ text: 'Not yours.' }] })
  })

  it('cannot be cleared by another user either — the emptying path is scoped too', async () => {
    // The path that is easiest to leave unscoped, because it writes nothing:
    // an empty note is a delete, and a delete keyed on the sitting alone would
    // wipe whoever's note happened to be sitting under that id.
    const notes = createMemoryNoteRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, notes }))
    const otherCaller = createCaller(createContext({ auth: { clerkUserId: 'user_456' }, notes }))

    await caller.notes.save({ sessionId, text: 'Mine, and I am keeping it.' })
    await expect(otherCaller.notes.save({ sessionId, text: '' })).resolves.toEqual({ status: 'ok', note: null })

    await expect(caller.notes.list()).resolves.toMatchObject({
      status: 'ok',
      notes: [{ text: 'Mine, and I am keeping it.' }],
    })
  })

  it('rewrites the note in place, and clearing it removes it', async () => {
    const notes = createMemoryNoteRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, notes }))

    await caller.notes.save({ sessionId, text: 'First thought.' })
    await caller.notes.save({ sessionId, text: 'Second thought.' })
    await expect(caller.notes.list()).resolves.toMatchObject({ status: 'ok', notes: [{ text: 'Second thought.' }] })

    await expect(caller.notes.save({ sessionId, text: '   ' })).resolves.toEqual({ status: 'ok', note: null })
    await expect(caller.notes.list()).resolves.toEqual({ status: 'ok', notes: [] })
  })

  it('refuses a note longer than one paragraph, and a session id that is not one', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, notes: createMemoryNoteRepository() }))

    await expect(caller.notes.save({ sessionId, text: 'x'.repeat(LONGEST_NOTE + 1) })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    await expect(caller.notes.save({ sessionId: 'not-a-uuid', text: 'hello' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
  })
})

describe('goals and paths over tRPC', () => {
  const path = {
    title: 'Play a blues in F',
    stages: [{ items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 120 }] }],
  }

  it('reports unconfigured rather than failing when there is no database', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, goals: null }))

    await expect(caller.goals.list()).resolves.toEqual({ status: 'unconfigured' })
    await expect(caller.goals.create(path)).resolves.toEqual({ status: 'unconfigured' })
  })

  it('refuses a signed-out caller', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: null }, goals: createMemoryGoalRepository() }))

    await expect(caller.goals.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(caller.goals.create(path)).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('writes and reads goals for the authenticated user only', async () => {
    const goals = createMemoryGoalRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, goals }))
    const otherCaller = createCaller(createContext({ auth: { clerkUserId: 'user_456' }, goals }))

    const made = await caller.goals.create(path)
    expect(made).toMatchObject({ status: 'ok', goal: { title: 'Play a blues in F', status: 'active', weight: 1 } })

    await expect(caller.goals.list()).resolves.toMatchObject({ status: 'ok', goals: [{ title: 'Play a blues in F' }] })
    await expect(otherCaller.goals.list()).resolves.toMatchObject({ status: 'ok', goals: [] })
  })

  it('will not let one user change or delete another user’s goal', async () => {
    const goals = createMemoryGoalRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, goals }))
    const otherCaller = createCaller(createContext({ auth: { clerkUserId: 'user_456' }, goals }))
    const made = await caller.goals.create(path)
    const goalId = made.status === 'ok' ? made.goal.id : ''

    // The same answer as an id that never existed, so the reply never tells one
    // user that another's goal is there.
    await expect(otherCaller.goals.update({ goalId, goal: { ...path, title: 'Mine now' } })).resolves.toEqual({
      status: 'not_found',
    })
    await expect(otherCaller.goals.delete({ goalId })).resolves.toEqual({ status: 'ok', deleted: false })

    await expect(caller.goals.list()).resolves.toMatchObject({ status: 'ok', goals: [{ title: 'Play a blues in F' }] })
  })

  it('refuses a path with no stages', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, goals: createMemoryGoalRepository() }))

    await expect(caller.goals.create({ title: 'Nothing', stages: [] })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('holds the app to the same path rules an assistant is held to', async () => {
    // The app's own door used to check the shape and nothing else, so it could
    // store a path naming exercises that do not exist, or the same exercise in
    // two stages — which the fold cannot represent, since it keeps one state
    // per exercise. Both doors go through the library now.
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, goals: createMemoryGoalRepository() }))

    const unknown = await caller.goals.create({
      title: 'Made up',
      stages: [{ items: [{ exerciseId: 'no-such-exercise', targetTempoBpm: 100 }] }],
    })
    expect(unknown).toMatchObject({ status: 'invalid' })
    if (unknown.status === 'invalid') expect(unknown.problems[0]).toContain('no-such-exercise')

    const twice = await caller.goals.create({
      title: 'Twice',
      stages: [
        { items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 100 }] },
        { items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 140 }] },
      ],
    })
    expect(twice).toMatchObject({ status: 'invalid' })
    if (twice.status === 'invalid') expect(twice.problems[0]).toContain('already in this path')

    await expect(caller.goals.list()).resolves.toMatchObject({ status: 'ok', goals: [] })
  })
})
