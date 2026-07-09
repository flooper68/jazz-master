import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useProfile } from '../app/ProfileProvider'
import { useTRPC } from '../app/trpc'
import type { PracticeProfile } from '../appData/profile'
import type { PracticeSession } from '../appData/session'
import { toPlanDate, type DailyPlan } from './dailyPlan'

const EMPTY_SESSIONS: readonly PracticeSession[] = []
export type TodayPlanStatus =
  | 'pending'
  | 'ready'
  | 'missing-profile'
  | 'unconfigured'
  | 'error'
type PlannerTodayResult =
  | { status: 'ok' }
  | { status: 'missing-profile' }
  | { status: 'unconfigured' }
  | { status: 'error'; message: string }
  | undefined

export interface TodayPlan {
  status: TodayPlanStatus
  message: string | null
  today: Date
  profile: PracticeProfile
  sessions: readonly PracticeSession[]
  plan: DailyPlan
  /** Re-read server-computed plan/progress, e.g. after a practice run exits. */
  refreshSessions: () => void
}

export function useTodayPlan(): TodayPlan {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date())
  const planDate = toPlanDate(today)
  const { profile } = useProfile()
  const plannerInput = { date: planDate }
  const plannerQuery = useQuery(trpc.planner.today.queryOptions(plannerInput))
  const result = plannerQuery.data
  const resolvedProfile =
    result?.status === 'ok' ? result.profile : (profile as PracticeProfile)
  const sessions = result?.status === 'ok' ? result.sessions : EMPTY_SESSIONS
  const status = resolveStatus(plannerQuery.isPending, plannerQuery.isError, result)
  const message = resolveMessage(status, result)
  const plan =
    result?.status === 'ok'
      ? result.plan
      : {
          date: planDate,
          totalMinutes: 0,
          items: [],
        }

  const refreshSessions = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.planner.today.queryKey(plannerInput),
    })
  }

  return {
    status,
    message,
    today,
    profile: resolvedProfile,
    sessions,
    plan,
    refreshSessions,
  }
}

function resolveStatus(
  isPending: boolean,
  isError: boolean,
  result: PlannerTodayResult,
): TodayPlanStatus {
  if (isPending) return 'pending'
  if (isError) return 'error'
  if (result?.status === 'ok') return 'ready'
  if (result?.status === 'missing-profile') return 'missing-profile'
  if (result?.status === 'unconfigured') return 'unconfigured'
  return 'error'
}

function resolveMessage(
  status: TodayPlanStatus,
  result: PlannerTodayResult,
): string | null {
  if (status === 'ready' || status === 'pending') return null
  if (status === 'missing-profile') return 'Profile could not be loaded.'
  if (status === 'unconfigured') return 'Planner database is not configured.'
  return result?.status === 'error'
    ? result.message
    : 'Planner could not be loaded.'
}
