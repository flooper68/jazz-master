import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  MAX_PLAY_ALONG_TEMPO_BPM,
  MIN_PLAY_ALONG_TEMPO_BPM,
  NOTATION_DISPLAY_MODES,
  SCORE_TOLERANCE_PRESETS,
  clampPlayAlongTempo,
} from '../../../appData/preferences'
import { protectedProcedure, router } from '../init'

const notationDisplayMode = z.enum(NOTATION_DISPLAY_MODES)
const scoringTolerance = z.enum(SCORE_TOLERANCE_PRESETS)
const playAlongTempos = z.record(
  z.string().min(1),
  z.number().int().min(MIN_PLAY_ALONG_TEMPO_BPM).max(MAX_PLAY_ALONG_TEMPO_BPM),
)

const preferencesSchema = z.object({
  notationDisplayMode,
  scoringTolerance,
  playAlongTempos,
})

const readOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), preferences: preferencesSchema }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Preference database read failed'),
  }),
])

const writeOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok') }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({
    status: z.literal('error'),
    message: z.literal('Preference database write failed'),
  }),
])

export const preferences = router({
  get: protectedProcedure
    .input(z.void())
    .output(readOutput)
    .query(async ({ ctx }) => {
      if (!ctx.preferences) return { status: 'unconfigured' as const }

      try {
        return {
          status: 'ok' as const,
          preferences: await ctx.preferences.getPreferences(
            ctx.auth.clerkUserId,
          ),
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        return {
          status: 'error' as const,
          message: 'Preference database read failed' as const,
        }
      }
    }),

  setNotationDisplayMode: protectedProcedure
    .input(z.object({ mode: notationDisplayMode }))
    .output(writeOutput)
    .mutation(async ({ ctx, input }) =>
      writePreference(ctx.preferences, async () => {
        await ctx.preferences!.setNotationDisplayMode(
          ctx.auth.clerkUserId,
          input.mode,
        )
      }),
    ),

  setScoringTolerance: protectedProcedure
    .input(z.object({ tolerance: scoringTolerance }))
    .output(writeOutput)
    .mutation(async ({ ctx, input }) =>
      writePreference(ctx.preferences, async () => {
        await ctx.preferences!.setScoringTolerance(
          ctx.auth.clerkUserId,
          input.tolerance,
        )
      }),
    ),

  setPlayAlongTempo: protectedProcedure
    .input(
      z.object({
        exerciseId: z.string().trim().min(1).max(200),
        tempoBpm: z.number().finite(),
      }),
    )
    .output(writeOutput)
    .mutation(async ({ ctx, input }) =>
      writePreference(ctx.preferences, async () => {
        await ctx.preferences!.setPlayAlongTempo(
          ctx.auth.clerkUserId,
          input.exerciseId,
          clampPlayAlongTempo(input.tempoBpm),
        )
      }),
    ),
})

async function writePreference(
  repository: object | null | undefined,
  write: () => Promise<void>,
): Promise<z.infer<typeof writeOutput>> {
  if (!repository) return { status: 'unconfigured' }

  try {
    await write()
    return { status: 'ok' }
  } catch (error) {
    if (error instanceof TRPCError) throw error
    return { status: 'error', message: 'Preference database write failed' }
  }
}
