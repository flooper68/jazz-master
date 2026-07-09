import { describe, expect, it } from 'vitest'
import type { MockPracticeRepository } from '../db/mockPractice'
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
        dbSmoke: null,
        mockPractice: null,
        users: null,
      }),
    )

    await expect(caller.health()).resolves.toMatchObject({ status: 'ok' })
  })
})

describe('appRouter.auth.me', () => {
  it('rejects unauthenticated callers', async () => {
    const caller = createCaller(
      createContext({
        auth: { clerkUserId: null },
        dbSmoke: null,
        mockPractice: null,
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
        dbSmoke: null,
        mockPractice: null,
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
        dbSmoke: null,
        mockPractice: null,
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
        dbSmoke: null,
        mockPractice: null,
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
        dbSmoke: null,
        mockPractice: null,
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
        dbSmoke: null,
        mockPractice: null,
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

describe('appRouter.dbSmoke', () => {
  it('reports unconfigured when no database connection is available', async () => {
    const caller = createCaller(createContext({ dbSmoke: null }))
    const before = Date.now()

    const result = await caller.dbSmoke()

    expect(result.status).toBe('unconfigured')
    const checkedAt = Date.parse(result.checkedAt)
    expect(checkedAt).toBeGreaterThanOrEqual(before)
    expect(checkedAt).toBeLessThanOrEqual(Date.now())
    expect(result.checkedAt).toBe(new Date(result.checkedAt).toISOString())
  })

  it('runs the injected smoke client', async () => {
    let calls = 0
    const caller = createCaller(
      createContext({
        dbSmoke: {
          async check() {
            calls += 1
          },
        },
      }),
    )

    const result = await caller.dbSmoke()

    expect(result.status).toBe('ok')
    expect(calls).toBe(1)
  })

  it('returns a predictable error shape when the smoke query fails', async () => {
    const caller = createCaller(
      createContext({
        dbSmoke: {
          async check() {
            throw new Error('postgres://secret@localhost/db')
          },
        },
      }),
    )

    const result = await caller.dbSmoke()

    expect(result).toMatchObject({
      status: 'error',
      message: 'Database smoke check failed',
    })
  })
})

describe('appRouter.mockPractice.record', () => {
  it('reports unconfigured when no mock practice repository is available', async () => {
    const caller = createCaller(
      createContext({
        dbSmoke: null,
        mockPractice: null,
      }),
    )

    const result = await caller.mockPractice.record({
      exerciseSlug: 'autumn-leaves-arpeggios',
      exerciseTitle: 'Autumn Leaves arpeggios',
      minutes: 12,
    })

    expect(result).toEqual({ status: 'unconfigured' })
  })

  it('records mock practice data through the injected repository', async () => {
    const createdAt = new Date('2026-07-09T09:00:00.000Z').toISOString()
    const calls: unknown[] = []
    const mockPractice = {
      async record(input) {
        calls.push(input)

        return {
          created: {
            id: '11111111-1111-4111-8111-111111111111',
            exerciseSlug: input.exerciseSlug,
            exerciseTitle: input.exerciseTitle,
            minutes: input.minutes,
            focus: input.focus ?? null,
            createdAt,
          },
          recent: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              exerciseSlug: input.exerciseSlug,
              exerciseTitle: input.exerciseTitle,
              minutes: input.minutes,
              focus: input.focus ?? null,
              createdAt,
            },
          ],
        }
      },
    } satisfies MockPracticeRepository
    const caller = createCaller(
      createContext({
        dbSmoke: null,
        mockPractice,
      }),
    )

    const result = await caller.mockPractice.record({
      exerciseSlug: 'blue-bossa-ii-v-i',
      exerciseTitle: '  Blue Bossa ii-V-I  ',
      minutes: 20,
      focus: '  time feel  ',
    })

    expect(calls).toEqual([
      {
        exerciseSlug: 'blue-bossa-ii-v-i',
        exerciseTitle: 'Blue Bossa ii-V-I',
        minutes: 20,
        focus: 'time feel',
      },
    ])
    expect(result).toMatchObject({
      status: 'ok',
      created: {
        exerciseSlug: 'blue-bossa-ii-v-i',
        exerciseTitle: 'Blue Bossa ii-V-I',
        minutes: 20,
        focus: 'time feel',
      },
      recent: [
        {
          exerciseSlug: 'blue-bossa-ii-v-i',
          exerciseTitle: 'Blue Bossa ii-V-I',
        },
      ],
    })
  })

  it('returns a predictable error shape when the repository write fails', async () => {
    const caller = createCaller(
      createContext({
        dbSmoke: null,
        mockPractice: {
          async record() {
            throw new Error('postgres://secret@localhost/db')
          },
        },
      }),
    )

    const result = await caller.mockPractice.record({
      exerciseSlug: 'rhythm-changes',
      exerciseTitle: 'Rhythm Changes',
      minutes: 16,
    })

    expect(result).toEqual({
      status: 'error',
      message: 'Mock practice database write failed',
    })
  })
})
