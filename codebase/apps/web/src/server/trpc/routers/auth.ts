import { z } from 'zod'
import { protectedProcedure, router } from '../init'

export const authMeOutput = z.object({
  userId: z.string().min(1),
})

export const auth = router({
  me: protectedProcedure
    .input(z.void())
    .output(authMeOutput)
    .query(({ ctx }) => ({
      userId: ctx.auth.userId,
    })),
})
