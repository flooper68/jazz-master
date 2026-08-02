import { z } from 'zod'
import {
  logClerkKeyCheck,
  logDatabaseSmoke,
} from '../../observability/logger'
import { publicProcedure } from '../init'

// Zod on both boundaries establishes the validation pattern for future
// procedures (RES-002 rec 4). The output schema is the wire contract the
// SPA's typecheck hangs off — see the type-contract criterion in TASK-023.
export const healthOutput = z.object({
  status: z.literal('ok'),
  time: z.iso.datetime(),
})

export const dbSmokeOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    checkedAt: z.iso.datetime(),
  }),
  z.object({
    status: z.literal('unconfigured'),
    checkedAt: z.iso.datetime(),
  }),
  z.object({
    status: z.literal('error'),
    checkedAt: z.iso.datetime(),
    message: z.literal('Database smoke check failed'),
  }),
])

// ISSUE-011: a publishable/secret key pair pointing at two different Clerk
// instances takes the whole site down with a bare 500 on the first browser
// request, and is invisible to every other probe. Statuses only — no key
// material, instance IDs, or raw Clerk errors cross the wire.
export const clerkKeysOutput = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ok'),
    checkedAt: z.iso.datetime(),
  }),
  z.object({
    status: z.literal('unconfigured'),
    checkedAt: z.iso.datetime(),
  }),
  z.object({
    status: z.literal('mismatch'),
    checkedAt: z.iso.datetime(),
    message: z.literal(
      'Clerk publishable and secret keys resolve to different instances',
    ),
  }),
  z.object({
    status: z.literal('error'),
    checkedAt: z.iso.datetime(),
    message: z.literal('Clerk key pair check failed'),
  }),
])

export const health = publicProcedure
  .input(z.void())
  .output(healthOutput)
  .query(() => ({
    status: 'ok' as const,
    time: new Date().toISOString(),
  }))

export const dbSmoke = publicProcedure
  .input(z.void())
  .output(dbSmokeOutput)
  .query(async ({ ctx }) => {
    const checkedAt = new Date().toISOString()

    if (!ctx.dbSmoke) {
      logDatabaseSmoke(ctx.logger, ctx.requestMetadata, {
        outcome: 'unconfigured',
        status: 200,
        errorKind: 'unconfigured_runtime',
      })

      return {
        status: 'unconfigured' as const,
        checkedAt,
      }
    }

    try {
      await ctx.dbSmoke.check()

      logDatabaseSmoke(ctx.logger, ctx.requestMetadata, {
        outcome: 'ok',
        status: 200,
      })

      return {
        status: 'ok' as const,
        checkedAt,
      }
    } catch (error) {
      logDatabaseSmoke(ctx.logger, ctx.requestMetadata, {
        outcome: 'error',
        status: 503,
        errorKind: 'query_or_connectivity_failure',
        error,
      })

      return {
        status: 'error' as const,
        checkedAt,
        message: 'Database smoke check failed' as const,
      }
    }
  })

export const clerkKeys = publicProcedure
  .input(z.void())
  .output(clerkKeysOutput)
  .query(async ({ ctx }) => {
    const checkedAt = new Date().toISOString()

    if (!ctx.clerkKeys) {
      logClerkKeyCheck(ctx.logger, ctx.requestMetadata, {
        outcome: 'unconfigured',
        status: 200,
        errorKind: 'unconfigured_runtime',
      })

      return {
        status: 'unconfigured' as const,
        checkedAt,
      }
    }

    try {
      const result = await ctx.clerkKeys.check()

      if (result === 'mismatch') {
        logClerkKeyCheck(ctx.logger, ctx.requestMetadata, {
          outcome: 'error',
          status: 503,
          errorKind: 'instance_mismatch',
        })

        return {
          status: 'mismatch' as const,
          checkedAt,
          message:
            'Clerk publishable and secret keys resolve to different instances' as const,
        }
      }

      logClerkKeyCheck(ctx.logger, ctx.requestMetadata, {
        outcome: 'ok',
        status: 200,
      })

      return {
        status: 'ok' as const,
        checkedAt,
      }
    } catch (error) {
      logClerkKeyCheck(ctx.logger, ctx.requestMetadata, {
        outcome: 'error',
        status: 503,
        errorKind: 'check_failed',
        error,
      })

      return {
        status: 'error' as const,
        checkedAt,
        message: 'Clerk key pair check failed' as const,
      }
    }
  })
