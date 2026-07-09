import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../init'

export const appUserOutput = z.object({
  clerkUserId: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const ensureUserOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    user: appUserOutput,
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('User database ensure failed'),
  }),
])

export const users = router({
  ensure: protectedProcedure
    .input(z.void())
    .output(ensureUserOutput)
    .query(async ({ ctx }) => {
      if (!ctx.users) {
        return { status: 'unconfigured' as const }
      }

      try {
        const user = await ctx.users.ensureUser(ctx.auth.clerkUserId)

        return {
          status: 'ok' as const,
          user,
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'User database ensure failed' as const,
        }
      }
    }),
})
