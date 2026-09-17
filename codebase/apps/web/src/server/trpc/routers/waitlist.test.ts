import { describe, expect, it } from 'vitest'
import { normalizeEmail, type WaitlistRepository, type WaitlistSignup } from '../../db/waitlist'
import { createContext } from '../context'
import { createCallerFactory } from '../init'
import { appRouter } from '../router'

const createCaller = createCallerFactory(appRouter)

function memoryWaitlist(): WaitlistRepository & { signups: WaitlistSignup[] } {
  const signups: WaitlistSignup[] = []
  return {
    signups,
    async join(signup) {
      const email = normalizeEmail(signup.email)
      if (!signups.some((existing) => existing.email === email)) signups.push({ ...signup, email })
    },
  }
}

describe('appRouter.waitlist.join', () => {
  it('lets a signed-out visitor join, with what they want to learn', async () => {
    const waitlist = memoryWaitlist()
    const caller = createCaller(createContext({ auth: { clerkUserId: null }, waitlist }))

    await expect(caller.waitlist.join({ email: 'player@example.com', goal: 'Teach me jazz' })).resolves.toEqual({ status: 'ok' })
    expect(waitlist.signups).toEqual([{ email: 'player@example.com', goal: 'Teach me jazz' }])
  })

  it('answers a second join exactly like the first, and keeps one row', async () => {
    const waitlist = memoryWaitlist()
    const caller = createCaller(createContext({ waitlist }))

    await caller.waitlist.join({ email: 'player@example.com' })
    await expect(caller.waitlist.join({ email: 'Player@Example.com' })).resolves.toEqual({ status: 'ok' })
    expect(waitlist.signups).toHaveLength(1)
  })

  it('refuses something that is not an email address', async () => {
    const caller = createCaller(createContext({ waitlist: memoryWaitlist() }))

    await expect(caller.waitlist.join({ email: 'not-an-address' })).rejects.toThrow()
  })

  it('reports unconfigured without a database, and error when the write fails', async () => {
    await expect(createCaller(createContext({ waitlist: null })).waitlist.join({ email: 'player@example.com' })).resolves.toEqual({ status: 'unconfigured' })

    const failing: WaitlistRepository = {
      async join() {
        throw new Error('connection refused')
      },
    }
    await expect(createCaller(createContext({ waitlist: failing })).waitlist.join({ email: 'player@example.com' })).resolves.toEqual({
      status: 'error',
      message: 'Could not join the waitlist',
    })
  })
})
