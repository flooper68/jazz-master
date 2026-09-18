import { useQuery } from '@tanstack/react-query'
import type { ExercisePriority, Goal } from '../appData/goal'
import { useTRPC } from './trpc'

const NO_GOALS: readonly Goal[] = []
const NO_PRIORITIES: readonly ExercisePriority[] = []

/**
 * The user's goals and what they have said about single exercises. Nothing
 * waits on them: until they arrive the pack is one implicit path, which is
 * exactly what a user with no goals gets anyway.
 */
export function useGoals(): {
  goals: readonly Goal[]
  priorities: readonly ExercisePriority[]
  pending: boolean
  failed: boolean
} {
  const trpc = useTRPC()
  const { data, isPending, isError } = useQuery(trpc.goals.list.queryOptions())
  return {
    goals: data?.status === 'ok' ? data.goals : NO_GOALS,
    priorities: data?.status === 'ok' ? data.priorities : NO_PRIORITIES,
    pending: isPending,
    failed: isError || (data !== undefined && data.status !== 'ok'),
  }
}
