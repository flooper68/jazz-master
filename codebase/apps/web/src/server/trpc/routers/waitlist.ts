import { z } from 'zod'
import { publicProcedure, router } from '../init'

export const joinWaitlistInput = z.object({
  email: z.email().max(254),
  goal: z.string().trim().max(500).optional(),
})

// Joining twice answers `ok` exactly like joining once: the endpoint is
// public, and must not tell a stranger whether an address is already listed.
export const joinWaitlistOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok') }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Could not join the waitlist'),
  }),
])

export const waitlist = router({
  join: publicProcedure
    .input(joinWaitlistInput)
    .output(joinWaitlistOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.waitlist) {
        return { status: 'unconfigured' as const }
      }

      try {
        await ctx.waitlist.join(input)
        return { status: 'ok' as const }
      } catch {
        return {
          status: 'error' as const,
          message: 'Could not join the waitlist' as const,
        }
      }
    }),
})
