import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { isRating } from '../../../appData/run'
import { RunOwnerMismatchError } from '../../db/runs'
import { protectedProcedure, router } from '../init'

export const exerciseRunSchema = z.object({
  id: z.uuid(),
  exerciseId: z.string().min(1),
  startedAt: z.iso.datetime(),
  durationSeconds: z.number().int().min(0),
  tempoBpm: z.number().int().min(1),
  passes: z.number().int().min(0),
  completed: z.boolean(),
  rating: z.number().refine(isRating, 'rating must be 1–10 and not 7').nullable(),
})

export const runListOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    runs: z.array(exerciseRunSchema),
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Run database read failed'),
  }),
])

export const runSaveOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    run: exerciseRunSchema,
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Run database write failed'),
  }),
])

export const runs = router({
  list: protectedProcedure
    .input(z.void())
    .output(runListOutput)
    .query(async ({ ctx }) => {
      if (!ctx.runs) {
        return { status: 'unconfigured' as const }
      }

      try {
        return {
          status: 'ok' as const,
          runs: await ctx.runs.listRuns(ctx.auth.clerkUserId),
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'Run database read failed' as const,
        }
      }
    }),

  save: protectedProcedure
    .input(exerciseRunSchema)
    .output(runSaveOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.runs) {
        return { status: 'unconfigured' as const }
      }

      try {
        return {
          status: 'ok' as const,
          run: await ctx.runs.saveRun(ctx.auth.clerkUserId, input),
        }
      } catch (error) {
        if (error instanceof RunOwnerMismatchError) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Run belongs to another user',
          })
        }

        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'Run database write failed' as const,
        }
      }
    }),
})
