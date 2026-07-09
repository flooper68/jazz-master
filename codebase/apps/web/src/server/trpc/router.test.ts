import { describe, expect, it } from 'vitest'
import { defaultProfile, type PracticeProfile } from '../../appData/profile'
import type { PracticeSession } from '../../appData/session'
import { LESSONS } from '../../content'
import { generatePlan } from '../../planner/dailyPlan'
import type { StructuredLogger } from '../observability/logger'
import type { ProfileRepository } from '../db/profiles'
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
        profiles: null,
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

describe('appRouter.auth.me', () => {
  it('rejects unauthenticated callers', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        profiles: null,
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
        profiles: null,
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
        profiles: null,
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
        profiles: null,
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
        profiles: null,
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
        profiles: null,
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

describe('appRouter.profile', () => {
  it('reports unconfigured when no profile repository is available', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles: null,
      }),
    )

    await expect(caller.profile.get()).resolves.toEqual({
      status: 'unconfigured',
    })
  })

  it('returns null before onboarding has written a profile', async () => {
    const profiles = createMemoryProfileRepository()
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles,
      }),
    )

    await expect(caller.profile.get()).resolves.toEqual({
      status: 'ok',
      profile: null,
    })
  })

  it('writes and reads the authenticated profile through the repository', async () => {
    const profiles = createMemoryProfileRepository()
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles,
      }),
    )
    const profile = {
      ...defaultProfile('2026-07-09T10:00:00.000Z'),
      levels: { scales: 2, arpeggios: 1, chords: 1, standards: 3, ears: 1 },
      goalAreas: ['standards', 'scales'],
      minutesPerDay: 45,
    } satisfies PracticeProfile

    await expect(caller.profile.save(profile)).resolves.toEqual({
      status: 'ok',
      profile,
    })
    await expect(caller.profile.get()).resolves.toEqual({
      status: 'ok',
      profile,
    })
  })

  it('rejects unauthenticated profile reads before the repository is called', async () => {
    let calls = 0
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        profiles: {
          async getProfile() {
            calls += 1
            return null
          },
          async saveProfile(_clerkUserId, profile) {
            calls += 1
            return profile
          },
        } satisfies ProfileRepository,
      }),
    )

    await expect(caller.profile.get()).rejects.toMatchObject({
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

  it('preserves ordered grades, score summary, and normalized note details', async () => {
    const sessions = createMemorySessionRepository()
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        sessions,
      }),
    )
    const session = sessionRecord({
      score: 92,
      results: [
        {
          exerciseId: 'exercise-1',
          grade: 'got-it',
          score: {
            score: 92,
            tolerance: 'standard',
            components: { pitch: 100, timing: 83, completeness: 100 },
            perNote: [
              {
                expectedId: 'exercise-1-0',
                expectedNote: 'C',
                verdict: 'correct',
                timingOffsetSeconds: 0.01,
                pitchCents: 2,
              },
            ],
            extras: 0,
            analyzedAt: '2026-07-09T10:01:00.000Z',
          },
        },
        { exerciseId: 'exercise-2', grade: 'shaky' },
      ],
    })

    await caller.sessions.upsert(session)

    await expect(caller.sessions.list()).resolves.toEqual({
      status: 'ok',
      sessions: [session],
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

describe('appRouter.planner.today', () => {
  it('computes a baseline plan from the authenticated profile and curriculum', async () => {
    const profiles = createMemoryProfileRepository()
    const sessions = createMemorySessionRepository()
    const profile = defaultProfile('2026-07-09T10:00:00.000Z')
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles,
        sessions,
      }),
    )

    await profiles.saveProfile('user_123', profile)

    const result = await caller.planner.today({ date: '2026-07-09' })

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.profile).toEqual(profile)
    expect(result.sessions).toEqual([])
    expect(result.plan).toEqual(
      generatePlan(profile, [], LESSONS, planDate('2026-07-09')),
    )
    expect(result.plan.items.length).toBeGreaterThan(0)
  })

  it('uses session history when deciding lesson progress and attention', async () => {
    const profiles = createMemoryProfileRepository()
    const sessions = createMemorySessionRepository()
    const profile = defaultProfile('2026-07-09T10:00:00.000Z')
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles,
        sessions,
      }),
    )
    const missed = sessionRecord({
      lessonId: 'scales-major-open',
      completed: true,
      results: [{ exerciseId: 'scales-major-open-c', grade: 'missed' }],
    })

    await profiles.saveProfile('user_123', profile)
    await sessions.upsertSession('user_123', missed)

    const result = await caller.planner.today({ date: '2026-07-09' })

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.sessions).toEqual([missed])
    expect(result.plan.items).toContainEqual(
      expect.objectContaining({
        lessonId: 'scales-major-open',
        reason: expect.stringContaining('was missed'),
      }),
    )
  })

  it('reports missing-profile before generating a plan', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles: createMemoryProfileRepository(),
        sessions: createMemorySessionRepository(),
      }),
    )

    await expect(
      caller.planner.today({ date: '2026-07-09' }),
    ).resolves.toEqual({
      status: 'missing-profile',
    })
  })

  it('uses the caller local date instead of server wall-clock time', async () => {
    const profiles = createMemoryProfileRepository()
    const sessions = createMemorySessionRepository()
    const profile = defaultProfile('2026-07-09T10:00:00.000Z')
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles,
        sessions,
      }),
    )

    await profiles.saveProfile('user_123', profile)

    const result = await caller.planner.today({ date: '2030-02-03' })

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.plan.date).toBe('2030-02-03')
    expect(result.plan).toEqual(
      generatePlan(profile, [], LESSONS, planDate('2030-02-03')),
    )
  })

  it('returns the same server-computed plan on repeated reads with unchanged data', async () => {
    const profiles = createMemoryProfileRepository()
    const sessions = createMemorySessionRepository()
    const profile = defaultProfile('2026-07-09T10:00:00.000Z')
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles,
        sessions,
      }),
    )

    await profiles.saveProfile('user_123', profile)

    const first = await caller.planner.today({ date: '2026-07-09' })
    const second = await caller.planner.today({ date: '2026-07-09' })

    expect(first).toEqual(second)
  })

  it('reports unconfigured when a required repository is unavailable', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: 'user_123' },
        profiles: createMemoryProfileRepository(),
        sessions: null,
      }),
    )

    await expect(
      caller.planner.today({ date: '2026-07-09' }),
    ).resolves.toEqual({
      status: 'unconfigured',
    })
  })

  it('rejects unauthenticated planner reads before repositories are called', async () => {
    let calls = 0
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        profiles: {
          async getProfile() {
            calls += 1
            return null
          },
          async saveProfile(_clerkUserId, profile) {
            calls += 1
            return profile
          },
        } satisfies ProfileRepository,
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

    await expect(
      caller.planner.today({ date: '2026-07-09' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
    expect(calls).toBe(0)
  })
})

function createMemoryProfileRepository(): ProfileRepository {
  const profiles = new Map<string, PracticeProfile>()

  return {
    async getProfile(clerkUserId) {
      return profiles.get(clerkUserId) ?? null
    },
    async saveProfile(clerkUserId, profile) {
      profiles.set(clerkUserId, profile)
      return profile
    },
  }
}

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
    results: [{ exerciseId: 'exercise-1', grade: 'missed' }],
    ...overrides,
  }
}

function planDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
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
