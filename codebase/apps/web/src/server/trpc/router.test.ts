import { describe, expect, it } from 'vitest'
import type { PracticeSession } from '../../appData/session'
import type { StructuredLogger } from '../observability/logger'
import {
  SessionOwnerMismatchError,
  type SessionRepository,
} from '../db/sessions'
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

describe('appRouter.sessions', () => {
  it('reports unconfigured when no session repository is available', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        sessions: null,
      }),
    )

    await expect(caller.sessions.list()).resolves.toEqual({
      status: 'unconfigured',
    })
  })

  it('writes and reads sessions for the authenticated user only', async () => {
    const sessions = createMemorySessionRepository()
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        sessions,
      }),
    )
    const otherCaller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_456' },
        sessions,
      }),
    )
    const session = sessionRecord()

    await expect(caller.sessions.upsert(session)).resolves.toEqual({
      status: 'ok',
      session,
    })
    await expect(caller.sessions.list()).resolves.toEqual({
      status: 'ok',
      sessions: [session],
    })
    await expect(otherCaller.sessions.list()).resolves.toEqual({
      status: 'ok',
      sessions: [],
    })
  })

  it('updates a session in place as the run progresses', async () => {
    const sessions = createMemorySessionRepository()
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        sessions,
      }),
    )
    const started = sessionRecord({ exercisesCompleted: 1 })

    await caller.sessions.upsert(started)
    await caller.sessions.upsert({
      ...started,
      durationSeconds: 300,
      completed: true,
      exercisesCompleted: 3,
    })

    await expect(caller.sessions.list()).resolves.toEqual({
      status: 'ok',
      sessions: [
        { ...started, durationSeconds: 300, completed: true, exercisesCompleted: 3 },
      ],
    })
  })

  it('rejects attempts to overwrite another user session', async () => {
    const sessions = createMemorySessionRepository()
    const session = sessionRecord()
    const ownerCaller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        sessions,
      }),
    )
    const otherCaller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_456' },
        sessions,
      }),
    )

    await ownerCaller.sessions.upsert(session)

    await expect(otherCaller.sessions.upsert(session)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Session belongs to another user',
    })
  })

  it('rejects unauthenticated session reads before the repository is called', async () => {
    let calls = 0
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        sessions: {
          async listSessions() {
            calls += 1
            return []
          },
          async upsertSession(_clerkUserId, session) {
            calls += 1
            return session
          },
        } satisfies SessionRepository,
      }),
    )

    await expect(caller.sessions.list()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
    expect(calls).toBe(0)
  })
})

function createMemorySessionRepository(): SessionRepository {
  const sessions = new Map<
    string,
    { clerkUserId: string; session: PracticeSession }
  >()

  return {
    async listSessions(clerkUserId) {
      return [...sessions.values()]
        .filter((stored) => stored.clerkUserId === clerkUserId)
        .map((stored) => cloneSession(stored.session))
        .sort(
          (a, b) =>
            new Date(b.startedAt).valueOf() - new Date(a.startedAt).valueOf(),
        )
    },
    async upsertSession(clerkUserId, session) {
      const existing = sessions.get(session.id)

      if (existing && existing.clerkUserId !== clerkUserId) {
        throw new SessionOwnerMismatchError()
      }

      const stored = cloneSession(session)
      sessions.set(session.id, { clerkUserId, session: stored })
      return cloneSession(stored)
    },
  }
}

function sessionRecord(
  overrides: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    id: crypto.randomUUID(),
    lessonId: 'lesson-1',
    startedAt: '2026-07-09T10:00:00.000Z',
    durationSeconds: 120,
    completed: false,
    exercisesCompleted: 0,
    ...overrides,
  }
}

function cloneSession(session: PracticeSession): PracticeSession {
  return { ...session }
}
