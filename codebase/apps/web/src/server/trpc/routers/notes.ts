import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { LONGEST_NOTE } from '../../../appData/note'
import { protectedProcedure, router } from '../init'

/**
 * The note a user wrote at the end of a sitting. Owner-scoped like runs: the
 * signed-in user is the only one who can read or write their own, and the
 * session id in the input never widens that — a note is keyed by the owner and
 * the sitting together, so a borrowed session id reaches nobody else's row.
 */

export const sessionNoteSchema = z.object({
  sessionId: z.uuid(),
  text: z.string(),
  createdAt: z.iso.datetime(),
})

export const noteListOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), notes: z.array(sessionNoteSchema) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Note database read failed') }),
])

export const noteSaveOutput = z.discriminatedUnion('status', [
  // Null when the text was empty: clearing the box removes the note.
  z.object({ status: z.literal('ok'), note: sessionNoteSchema.nullable() }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Note database write failed') }),
])

export const notes = router({
  list: protectedProcedure
    .input(z.void())
    .output(noteListOutput)
    .query(async ({ ctx }) => {
      if (!ctx.notes) return { status: 'unconfigured' as const }
      try {
        return { status: 'ok' as const, notes: await ctx.notes.listNotes(ctx.auth.clerkUserId) }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        return { status: 'error' as const, message: 'Note database read failed' as const }
      }
    }),

  save: protectedProcedure
    .input(z.object({ sessionId: z.uuid(), text: z.string().max(LONGEST_NOTE) }))
    .output(noteSaveOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.notes) return { status: 'unconfigured' as const }
      try {
        return {
          status: 'ok' as const,
          note: await ctx.notes.saveNote(ctx.auth.clerkUserId, input.sessionId, input.text),
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        return { status: 'error' as const, message: 'Note database write failed' as const }
      }
    }),
})
