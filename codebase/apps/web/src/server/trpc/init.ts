import { TRPCError, initTRPC } from '@trpc/server'
import type { Context } from './context'

// Strip stack traces from error responses outside dev (INS-021). tRPC's own
// dev/prod switch keys off NODE_ENV, which workerd does not set, so a deployed
// Worker keeps dev-shaped errors — full stacks with local file paths. Gate on
// Vite's build-time DEV flag instead of the env heuristic.
export function sanitizeErrorShape<Shape extends { data: object }>(
  shape: Shape,
  isDev: boolean,
): Shape {
  if (isDev) return shape
  const { stack: _stack, ...data } = shape.data as { stack?: string }
  return { ...shape, data } as Shape
}

const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape }) => sanitizeErrorShape(shape, import.meta.env.DEV),
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth.clerkUserId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        clerkUserId: ctx.auth.clerkUserId,
      },
    },
  })
})
export const createCallerFactory = t.createCallerFactory
