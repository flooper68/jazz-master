import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { goalInputSchema, goalSchema, PRIORITIES, prioritySchema } from '../../../appData/goal'
import { listGoals as readGoals, saveGoal, savePriority } from '../../library/goals'
import { protectedProcedure, router } from '../init'

/**
 * Goals, their paths, and what the user has said about single exercises.
 * Owner-scoped like routines: every read and write carries the signed-in user,
 * and an id from somewhere else names nothing.
 */

/** A goal as the page and the tools both read it: the goal, plus how far along it is. */
const goalProgressSchema = goalSchema.extend({
  /** How solid each stage is, 0-1, stage by stage. */
  solidity: z.array(z.number()).nullable(),
  /** Which stages are open for new items. */
  openStages: z.array(z.number()).nullable(),
})

export const goalListOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), goals: z.array(goalProgressSchema), priorities: z.array(prioritySchema) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Goal read failed') }),
])

export const goalSaveOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), goal: goalSchema }),
  // The same answers the agent tools get: the app is held to the same rules.
  z.object({ status: z.literal('invalid'), problems: z.array(z.string()) }),
  z.object({ status: z.literal('not_found') }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Goal write failed') }),
  z.object({ status: z.literal('full'), message: z.string() }),
])

export const goalDeleteOutput = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), deleted: z.boolean() }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Goal write failed') }),
])

export const prioritySaveOutput = z.discriminatedUnion('status', [
  // Null when the answer was cleared: no priority and no override is no row.
  z.object({ status: z.literal('ok'), priority: prioritySchema.nullable() }),
  z.object({ status: z.literal('invalid'), problems: z.array(z.string()) }),
  z.object({ status: z.literal('unconfigured') }),
  z.object({ status: z.literal('error'), message: z.literal('Goal write failed') }),
  z.object({ status: z.literal('full'), message: z.string() }),
])

export const goals = router({
  list: protectedProcedure
    .input(z.void())
    .output(goalListOutput)
    .query(async ({ ctx }) => {
      if (!ctx.goals) return { status: 'unconfigured' as const }
      try {
        const answer = await readGoals(ctx, ctx.auth.clerkUserId)
        return answer.status === 'ok' ? { ...answer, priorities: [...answer.priorities] } : answer
      } catch (error) {
        if (error instanceof TRPCError) throw error
        return { status: 'error' as const, message: 'Goal read failed' as const }
      }
    }),

  // Both doors go through the library, so a path stored from the app is held
  // to exactly what one stored over MCP is: every exercise it names has to
  // exist for this user, and an exercise belongs to one stage. Checking only
  // the shape here would let the app write a path the scheduler cannot run.
  create: protectedProcedure
    .input(goalInputSchema)
    .output(goalSaveOutput)
    .mutation(({ ctx, input }) => saveGoal(ctx, ctx.auth.clerkUserId, undefined, input)),

  update: protectedProcedure
    .input(z.object({ goalId: z.uuid(), goal: goalInputSchema }))
    .output(goalSaveOutput)
    .mutation(({ ctx, input }) => saveGoal(ctx, ctx.auth.clerkUserId, input.goalId, input.goal)),

  delete: protectedProcedure
    .input(z.object({ goalId: z.uuid() }))
    .output(goalDeleteOutput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.goals) return { status: 'unconfigured' as const }
      try {
        return { status: 'ok' as const, deleted: await ctx.goals.deleteGoal(ctx.auth.clerkUserId, input.goalId) }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        return { status: 'error' as const, message: 'Goal write failed' as const }
      }
    }),

  setPriority: protectedProcedure
    .input(
      z.object({
        exerciseId: z.string().trim().min(1).max(100),
        priority: z.enum(PRIORITIES).nullable(),
        targetOverrideBpm: z.number().int().positive().nullable().default(null),
      }),
    )
    .output(prioritySaveOutput)
    .mutation(({ ctx, input }) =>
      savePriority(ctx, ctx.auth.clerkUserId, input.exerciseId, input.priority, input.targetOverrideBpm),
    ),
})
