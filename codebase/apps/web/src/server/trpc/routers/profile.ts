import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../init'

const skillLevel = z.union([z.literal(1), z.literal(2), z.literal(3)])
const practiceArea = z.enum([
  'scales',
  'arpeggios',
  'chords',
  'standards',
  'ears',
])
const minutesPerDay = z.union([
  z.literal(10),
  z.literal(20),
  z.literal(30),
  z.literal(45),
])

export const practiceProfileSchema = z.object({
  levels: z.object({
    scales: skillLevel,
    arpeggios: skillLevel,
    chords: skillLevel,
    standards: skillLevel,
    ears: skillLevel,
  }),
  goalAreas: z.array(practiceArea).min(1),
  minutesPerDay,
  createdAt: z.iso.datetime(),
})

export const profileGetOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    profile: practiceProfileSchema.nullable(),
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Profile database read failed'),
  }),
])

export const profileSaveOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    profile: practiceProfileSchema,
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Profile database write failed'),
  }),
])

export const profile = router({
  get: protectedProcedure
    .input(z.void())
    .output(profileGetOutput)
    .query(async ({ ctx }) => {
      if (!ctx.profiles) {
        return { status: 'unconfigured' as const }
      }

      try {
        return {
          status: 'ok' as const,
          profile: await ctx.profiles.getProfile(ctx.auth.clerkUserId),
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'Profile database read failed' as const,
        }
      }
    }),

  save: protectedProcedure
    .input(practiceProfileSchema)
    .output(profileSaveOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.profiles) {
        return { status: 'unconfigured' as const }
      }

      try {
        return {
          status: 'ok' as const,
          profile: await ctx.profiles.saveProfile(ctx.auth.clerkUserId, input),
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'Profile database write failed' as const,
        }
      }
    }),
})
