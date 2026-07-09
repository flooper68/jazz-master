import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { SessionOwnerMismatchError } from '../../db/sessions'
import { protectedProcedure, router } from '../init'

const exerciseGrade = z.enum(['got-it', 'shaky', 'missed'])
const scoreVerdict = z.enum(['correct', 'early', 'late', 'wrong-pitch', 'missed'])
const scoreTolerance = z.enum(['lenient', 'standard', 'strict'])
const percentScore = z.number().finite().min(0).max(100)

const exerciseScoreNoteSchema = z.object({
  expectedId: z.string().min(1),
  expectedNote: z.string().min(1),
  verdict: scoreVerdict,
  timingOffsetSeconds: z.number().finite().nullable(),
  pitchCents: z.number().int().nullable(),
})

const exerciseScoreSchema = z.object({
  score: percentScore,
  tolerance: scoreTolerance,
  components: z.object({
    pitch: percentScore,
    timing: percentScore,
    completeness: percentScore,
  }),
  perNote: z.array(exerciseScoreNoteSchema),
  extras: z.number().int().min(0),
  analyzedAt: z.iso.datetime(),
})

const exerciseResultSchema = z.object({
  exerciseId: z.string().min(1),
  grade: exerciseGrade,
  score: exerciseScoreSchema.optional(),
})

export const practiceSessionSchema = z.object({
  id: z.uuid(),
  lessonId: z.string().min(1),
  startedAt: z.iso.datetime(),
  durationSeconds: z.number().int().min(0),
  completed: z.boolean(),
  results: z.array(exerciseResultSchema),
  score: percentScore.optional(),
})

export const sessionListOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    sessions: z.array(practiceSessionSchema),
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Session database read failed'),
  }),
])

export const sessionUpsertOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    session: practiceSessionSchema,
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Session database write failed'),
  }),
])

export const sessions = router({
  list: protectedProcedure
    .input(z.void())
    .output(sessionListOutput)
    .query(async ({ ctx }) => {
      if (!ctx.sessions) {
        return { status: 'unconfigured' as const }
      }

      try {
        return {
          status: 'ok' as const,
          sessions: await ctx.sessions.listSessions(ctx.auth.clerkUserId),
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'Session database read failed' as const,
        }
      }
    }),

  upsert: protectedProcedure
    .input(practiceSessionSchema)
    .output(sessionUpsertOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.sessions) {
        return { status: 'unconfigured' as const }
      }

      try {
        return {
          status: 'ok' as const,
          session: await ctx.sessions.upsertSession(
            ctx.auth.clerkUserId,
            input,
          ),
        }
      } catch (error) {
        if (error instanceof SessionOwnerMismatchError) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Session belongs to another user',
          })
        }

        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'Session database write failed' as const,
        }
      }
    }),
})
