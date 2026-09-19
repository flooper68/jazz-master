import { useQuery } from '@tanstack/react-query'
import type { Goal } from '../appData/goal'
import { useTRPC } from './trpc'

const NO_GOALS: readonly Goal[] = []

/**
 * The user's goals and what they have said about single exercises. Nothing
 * waits on them: until they arrive the pack is one implicit path, which is
 * exactly what a user with no goals gets anyway.
 */
export function useGoals(): {
  goals: readonly Goal[]
  pending: boolean
  failed: boolean
} {
  const trpc = useTRPC()
  const { data, isPending, isError } = useQuery(trpc.goals.list.queryOptions())
  return {
    goals: data?.status === 'ok' ? data.goals : NO_GOALS,
    pending: isPending,
    failed: isError || (data !== undefined && data.status !== 'ok'),
  }
}
