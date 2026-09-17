import { z } from 'zod'
import { exerciseInputSchema } from '../../../content/exerciseInput'
import { createLibraryExercise, deleteLibraryExercise, listLibrary } from '../../library/library'
import { protectedProcedure, router } from '../init'

const libraryExerciseSchema = exerciseInputSchema.extend({ id: z.string().min(1) })

export const exerciseListOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), exercises: z.array(libraryExerciseSchema) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Exercise library read failed') }),
])

export const exerciseCreateOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), exercise: libraryExerciseSchema }),
  z.object({ status: z.literal('invalid'), problems: z.array(z.string()) }),
  z.object({ status: z.literal('full'), message: z.string() }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Exercise library write failed') }),
])

export const exerciseDeleteOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), deleted: z.boolean() }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Exercise library write failed') }),
])

// The user's own exercises. The rules live in the library, which MCP shares;
// this router only carries them over the app's wire.
export const exercises = router({
  list: protectedProcedure
    .input(z.void())
    .output(exerciseListOutput)
    .query(({ ctx }) => listLibrary(ctx.userExercises, ctx.auth.clerkUserId)),

  // Unknown in, problems out: a badly shaped exercise is an answer, not a transport error.
  create: protectedProcedure
    .input(z.unknown())
    .output(exerciseCreateOutput)
    .mutation(({ ctx, input }) => createLibraryExercise(ctx.userExercises, ctx.auth.clerkUserId, input)),

  delete: protectedProcedure
    .input(z.object({ exerciseId: z.string().min(1).max(100) }))
    .output(exerciseDeleteOutput)
    .mutation(({ ctx, input }) => deleteLibraryExercise(ctx.userExercises, ctx.auth.clerkUserId, input.exerciseId)),
})
