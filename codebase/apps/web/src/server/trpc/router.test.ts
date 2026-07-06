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
