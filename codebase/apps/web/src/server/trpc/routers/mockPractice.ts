import { z } from 'zod'
import { publicProcedure, router } from '../init'

export const mockPracticeInput = z.object({
  exerciseSlug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  exerciseTitle: z.string().trim().min(1).max(120),
  minutes: z.int().min(1).max(240),
  focus: z.string().trim().min(1).max(160).optional(),
})

export const mockPracticeRowOutput = z.object({
  id: z.uuid(),
  exerciseSlug: z.string(),
  exerciseTitle: z.string(),
  minutes: z.int(),
  focus: z.string().nullable(),
  createdAt: z.iso.datetime(),
})

export const mockPracticeRecordOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    created: mockPracticeRowOutput,
    recent: z.array(mockPracticeRowOutput),
  }),
  z.object({
    status: z.literal('unconfigured'),
  }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Mock practice database write failed'),
  }),
])

export const mockPractice = router({
  record: publicProcedure
    .input(mockPracticeInput)
    .output(mockPracticeRecordOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.mockPractice) {
        return { status: 'unconfigured' as const }
      }

      try {
        const result = await ctx.mockPractice.record({
          ...input,
          focus: input.focus ?? null,
        })

        return {
          status: 'ok' as const,
          ...result,
        }
      } catch {
        return {
          status: 'error' as const,
          message: 'Mock practice database write failed' as const,
        }
      }
    }),
})
