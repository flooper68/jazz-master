import { describe, expect, it } from 'vitest'
import { defaultProfile, type PracticeProfile } from '../../appData/profile'
import type { StructuredLogger } from '../observability/logger'
import type { ProfileRepository } from '../db/profiles'
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
