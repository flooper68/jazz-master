import { z } from 'zod'
import { protectedProcedure, router } from '../init'

export const authMeOutput = z.object({
  clerkUserId: z.string().min(1),
})

export const auth = router({
  me: protectedProcedure
    .input(z.void())
    .output(authMeOutput)
    .query(({ ctx }) => ({
      clerkUserId: ctx.auth.clerkUserId,
    })),
})
