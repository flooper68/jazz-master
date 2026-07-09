import { describe, expect, it } from 'vitest'
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
