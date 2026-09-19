import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { playerPrefsSchema } from '../../../appData/playerPrefs'
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

// The player's sound and view, kept with the user rather than the browser:
// the same practice settings on the laptop and on the phone.
export const playerPrefsReadOutput = z.discriminatedUnion('status', [
  // Null when this user has never saved any: the browser's own are then theirs.
  z.object({ status: z.literal('ok'), prefs: playerPrefsSchema.nullable() }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Player settings read failed') }),
])

export const playerPrefsSaveOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), prefs: playerPrefsSchema }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Player settings write failed') }),
])

export const users = router({
  playerPrefs: protectedProcedure
    .input(z.void())
    .output(playerPrefsReadOutput)
    .query(async ({ ctx }) => {
      if (!ctx.users) return { status: 'unconfigured' as const }
      try {
        return { status: 'ok' as const, prefs: await ctx.users.readPlayerPrefs(ctx.auth.clerkUserId) }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        // Logged: a settings read that fails silently looks like a user who
        // never saved anything, which is indistinguishable from working.
        console.error('player prefs read failed', error)
        return { status: 'error' as const, message: 'Player settings read failed' as const }
      }
    }),

  savePlayerPrefs: protectedProcedure
    .input(playerPrefsSchema)
    .output(playerPrefsSaveOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.users) return { status: 'unconfigured' as const }
      try {
        return { status: 'ok' as const, prefs: await ctx.users.writePlayerPrefs(ctx.auth.clerkUserId, input) }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        console.error('player prefs write failed', error)
        return { status: 'error' as const, message: 'Player settings write failed' as const }
      }
    }),

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
