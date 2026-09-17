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

export const deleteUserDataOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok') }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Account data could not be deleted'),
  }),
])

export const users = router({
  // The first half of deleting an account: everything the app saved under the
  // signed-in user. The browser deletes the Clerk user only after this says ok.
  deleteData: protectedProcedure
    .input(z.void())
    .output(deleteUserDataOutput)
    .mutation(async ({ ctx }) => {
      if (!ctx.users) {
        return { status: 'unconfigured' as const }
      }

      try {
        await ctx.users.deleteUser(ctx.auth.clerkUserId)
        return { status: 'ok' as const }
      } catch {
        return {
          status: 'error' as const,
          message: 'Account data could not be deleted' as const,
        }
      }
    }),

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
