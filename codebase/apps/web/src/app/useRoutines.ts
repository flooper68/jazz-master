import { useQuery } from '@tanstack/react-query'
import type { Routine } from '../appData/routine'
import { useTRPC } from './trpc'

const NONE: readonly Routine[] = []

/** The user's practice routines, oldest first. Nothing waits on them: until they arrive there are none. */
export function useRoutines(): { routines: readonly Routine[]; pending: boolean; failed: boolean } {
  const trpc = useTRPC()
  const { data, isPending, isError } = useQuery(trpc.routines.list.queryOptions())
  return {
    routines: data?.status === 'ok' ? data.routines : NONE,
    pending: isPending,
    failed: isError || (data !== undefined && data.status !== 'ok'),
  }
}
