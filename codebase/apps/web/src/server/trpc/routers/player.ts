import { z } from 'zod'
import { LOG_KINDS, LONGEST_BIO, LONGEST_LOG_ENTRY, playerBioSchema, playerLogEntrySchema } from '../../../appData/player'
import { appendLog, listLog, readBio, writeBio } from '../../library/player'
import { protectedProcedure, router } from '../init'

/**
 * The teacher's memory of the signed-in player: the bio it rewrites and the log
 * it appends to (docs/product/next-session-design.md §10). Owner-scoped like
 * goals — every read and write carries the signed-in user.
 *
 * Both doors go through `library/player`, so what the app's own lesson stores is
 * held to exactly what one stored over MCP is.
 */

export const bioReadOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), bio: playerBioSchema.nullable() }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Player memory read failed') }),
])

export const bioWriteOutput = z.discriminatedUnion('status', [
  // Null when it was cleared: an empty bio is no row, as an empty note is.
  z.object({ status: z.literal('ok'), bio: playerBioSchema.nullable() }),
  z.object({ status: z.literal('invalid'), problems: z.array(z.string()) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Player memory write failed') }),
])

export const logReadOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), entries: z.array(playerLogEntrySchema) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Player memory read failed') }),
])

export const logWriteOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), entry: playerLogEntrySchema }),
  z.object({ status: z.literal('invalid'), problems: z.array(z.string()) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Player memory write failed') }),
  z.object({ status: z.literal('full'), message: z.string() }),
])

export const player = router({
  readBio: protectedProcedure
    .input(z.void())
    .output(bioReadOutput)
    .query(({ ctx }) => readBio(ctx, ctx.auth.clerkUserId)),

  writeBio: protectedProcedure
    .input(z.object({ bio: z.string().max(LONGEST_BIO) }))
    .output(bioWriteOutput)
    .mutation(({ ctx, input }) => writeBio(ctx, ctx.auth.clerkUserId, input.bio)),

  listLog: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().optional() }).optional())
    .output(logReadOutput)
    .query(({ ctx, input }) => listLog(ctx, ctx.auth.clerkUserId, input?.limit)),

  appendLog: protectedProcedure
    .input(z.object({ kind: z.enum(LOG_KINDS), summary: z.string().trim().min(1).max(LONGEST_LOG_ENTRY) }))
    .output(logWriteOutput)
    .mutation(({ ctx, input }) => appendLog(ctx, ctx.auth.clerkUserId, input)),
})
