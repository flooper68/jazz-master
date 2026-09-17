import { z } from 'zod'
import { routineSchema } from '../../../appData/routine'
import { deleteRoutine, listRoutines, saveRoutine } from '../../library/routines'
import { protectedProcedure, router } from '../init'

export const routineListOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), routines: z.array(routineSchema) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Routine read failed') }),
])

export const routineWriteOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), routine: routineSchema }),
  z.object({ status: z.literal('invalid'), problems: z.array(z.string()) }),
  z.object({ status: z.literal('full'), message: z.string() }),
  z.object({ status: z.literal('not_found') }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Routine write failed') }),
])

export const routineDeleteOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), deleted: z.boolean() }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Routine write failed') }),
])

const routineId = z.string().min(1).max(100)

// The user's practice routines. The rules live in server/library/routines,
// which MCP shares; this router only carries them over the app's wire.
export const routines = router({
  list: protectedProcedure
    .input(z.void())
    .output(routineListOutput)
    .query(({ ctx }) => listRoutines(ctx, ctx.auth.clerkUserId)),

  // Unknown in, problems out: a badly shaped routine is an answer, not a transport error.
  create: protectedProcedure
    .input(z.object({ routine: z.unknown() }))
    .output(routineWriteOutput)
    .mutation(({ ctx, input }) => saveRoutine(ctx, ctx.auth.clerkUserId, input.routine)),

  update: protectedProcedure
    .input(z.object({ routineId, routine: z.unknown() }))
    .output(routineWriteOutput)
    .mutation(({ ctx, input }) => saveRoutine(ctx, ctx.auth.clerkUserId, input.routine, input.routineId)),

  delete: protectedProcedure
    .input(z.object({ routineId }))
    .output(routineDeleteOutput)
    .mutation(({ ctx, input }) => deleteRoutine(ctx, ctx.auth.clerkUserId, input.routineId)),
})
