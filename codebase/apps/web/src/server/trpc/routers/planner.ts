import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { LESSONS } from '../../../content'
import { generatePlan } from '../../../planner/dailyPlan'
import { practiceProfileSchema } from './profile'
import { practiceSessionSchema } from './sessions'
import { protectedProcedure, router } from '../init'

const lessonArea = z.enum(['scales', 'arpeggios', 'chords', 'standards'])

const planItemSchema = z.object({
  lessonId: z.string().min(1),
  lessonTitle: z.string().min(1),
  area: lessonArea,
  estimatedMinutes: z.number().finite().min(0),
  reason: z.string().min(1),
})

const dailyPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalMinutes: z.number().finite().min(0),
  items: z.array(planItemSchema),
})

const plannerTodayInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const plannerTodayOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    profile: practiceProfileSchema,
    sessions: z.array(practiceSessionSchema),
    plan: dailyPlanSchema,
  }),
  z.object({
    status: z.literal('missing-profile'),
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Planner database read failed'),
  }),
])

export const planner = router({
  today: protectedProcedure
    .input(plannerTodayInput)
    .output(plannerTodayOutput)
    .query(async ({ ctx, input }) => {
      if (!ctx.profiles || !ctx.sessions) {
        return { status: 'unconfigured' as const }
      }

      try {
        const [profile, sessions] = await Promise.all([
          ctx.profiles.getProfile(ctx.auth.clerkUserId),
          ctx.sessions.listSessions(ctx.auth.clerkUserId),
        ])

        if (!profile) {
          return { status: 'missing-profile' as const }
        }

        return {
          status: 'ok' as const,
          profile,
          sessions,
          plan: generatePlan(profile, sessions, LESSONS, dateFromPlanDate(input.date)),
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        return {
          status: 'error' as const,
          message: 'Planner database read failed' as const,
        }
      }
    }),
})

function dateFromPlanDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}
