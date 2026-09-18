import { describe, expect, it } from 'vitest'
import type { ExerciseRun } from '../../appData/run'
import type { StructuredLogger } from '../observability/logger'
import type { RunRepository } from '../db/runs'
import { createMemoryRunRepository } from '../../test/memoryRuns'
import type { UserRepository } from '../db/users'
import { createContext } from './context'
import { createCallerFactory } from './init'
import { appRouter } from './router'
import { STARTER_ROUTINES } from '../../content/starterRoutines'
import { createMemoryRoutineRepository } from '../../test/memoryRoutines'

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
    sessionId: null,
    ...overrides,
  }
}

describe('appRouter.routines', () => {
  const routine = { name: 'Warm-up', items: [{ exerciseId: 'scales-major-open-c' }] }

  it('creates, changes, lists and deletes a routine, for its owner only', async () => {
    const routines = createMemoryRoutineRepository()
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, routines, userExercises: null }))
    const other = createCaller(createContext({ auth: { clerkUserId: 'user_456' }, routines, userExercises: null }))

    const created = await caller.routines.create({ routine })
    expect(created).toMatchObject({ status: 'ok', routine })
    const id = created.status === 'ok' ? created.routine.id : ''

    const theirs = await other.routines.list()
    expect(theirs.status === 'ok' && theirs.routines.map((item) => item.id)).not.toContain(id)
    await expect(other.routines.update({ routineId: id, routine: { ...routine, name: 'Stolen' } })).resolves.toEqual({ status: 'not_found' })

    await expect(caller.routines.update({ routineId: id, routine: { ...routine, name: 'Warm-up II' } })).resolves.toMatchObject({
      status: 'ok',
      routine: { id, name: 'Warm-up II' },
    })
    await expect(caller.routines.delete({ routineId: id })).resolves.toEqual({ status: 'ok', deleted: true })
    await expect(caller.routines.list()).resolves.toEqual({ status: 'ok', routines: [] })
  })

  it('gives a new user the starter routines once — not again after they delete them all, and not to someone who made their own first', async () => {
    const routines = createMemoryRoutineRepository()
    const fresh = createCaller(createContext({ auth: { clerkUserId: 'user_new' }, routines, userExercises: null }))

    const first = await fresh.routines.list()
    const given = first.status === 'ok' ? first.routines : []
    expect(given.map((item) => item.name)).toEqual(STARTER_ROUTINES.map((item) => item.name))
    // Asking again gives the same routines, not a second set.
    await expect(fresh.routines.list()).resolves.toEqual(first)

    for (const item of given) await fresh.routines.delete({ routineId: item.id })
    await expect(fresh.routines.list()).resolves.toEqual({ status: 'ok', routines: [] })

    const maker = createCaller(createContext({ auth: { clerkUserId: 'user_maker' }, routines, userExercises: null }))
    await maker.routines.create({ routine })
    await expect(maker.routines.list()).resolves.toMatchObject({ status: 'ok', routines: [{ name: 'Warm-up' }] })
    const theirs = await maker.routines.list()
    expect(theirs.status === 'ok' && theirs.routines).toHaveLength(1)
  })

  it('answers a bad routine with its problems, not a transport error', async () => {
    const caller = createCaller(
      createContext({ auth: { clerkUserId: 'user_123' }, routines: createMemoryRoutineRepository(), userExercises: null }),
    )
    const result = await caller.routines.create({
      routine: { name: 'Twice', items: [{ exerciseId: 'scales-major-open-c' }, { exerciseId: 'scales-major-open-c' }, { exerciseId: 'nope' }], extra: true },
    })
    expect(result.status).toBe('invalid')

    const twice = await caller.routines.create({
      routine: { name: 'Twice', items: [{ exerciseId: 'scales-major-open-c' }, { exerciseId: 'scales-major-open-c' }, { exerciseId: 'nope' }] },
    })
    expect(twice).toEqual({
      status: 'invalid',
      problems: [
        expect.stringMatching(/^items\.1\.exerciseId: "scales-major-open-c" is already in the routine/),
        expect.stringMatching(/^items\.2\.exerciseId: no exercise "nope"/),
      ],
    })
  })

  it('reports unconfigured without a database, and refuses the signed-out', async () => {
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_123' }, routines: null, userExercises: null }))
    await expect(caller.routines.list()).resolves.toEqual({ status: 'unconfigured' })
    await expect(caller.routines.create({ routine })).resolves.toEqual({ status: 'unconfigured' })

    const signedOut = createCaller(createContext({ auth: { clerkUserId: null }, routines: createMemoryRoutineRepository() }))
    await expect(signedOut.routines.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})

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
    } satisfies UserRepository
    const caller = createCaller(createContext({ auth: { clerkUserId: 'user_wes' }, users }))

    await expect(caller.users.deleteData()).resolves.toEqual({ status: 'error', message: 'Account data could not be deleted' })
  })
})
