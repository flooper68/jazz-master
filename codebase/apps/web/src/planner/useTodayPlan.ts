import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '../app/ProfileProvider'
import { useTRPC } from '../app/trpc'
import type { PracticeProfile } from '../appData/profile'
import type { PracticeSession } from '../appData/session'
import { LESSONS } from '../content'
import { getDailyPlan, saveDailyPlan } from '../storage'
import { generatePlan, toPlanDate, type DailyPlan } from './dailyPlan'

const EMPTY_SESSIONS: readonly PracticeSession[] = []

export interface TodayPlan {
  today: Date
  profile: PracticeProfile
  sessions: readonly PracticeSession[]
  plan: DailyPlan
  /** Re-read the sessions store, e.g. after a practice run exits. */
  refreshSessions: () => void
}

/**
 * Today's plan as every page must see it: the stored plan for the local date,
 * or a freshly generated one persisted on first render. Each page holds its
 * own hook instance — they agree because both read the same persisted plan,
 * so the day's plan never reshuffles as history changes.
 */
export function useTodayPlan(): TodayPlan {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date())
  const { profile } = useProfile()
  const resolvedProfile = profile as PracticeProfile
  const sessionsQuery = useQuery(trpc.sessions.list.queryOptions())
  const sessions =
    sessionsQuery.data?.status === 'ok'
      ? sessionsQuery.data.sessions
      : EMPTY_SESSIONS
  const sessionsReady = sessionsQuery.data?.status === 'ok'
  const [storedPlan, setStoredPlan] = useState<DailyPlan | null>(() =>
    getDailyPlan(toPlanDate(today)),
  )
  const plan = useMemo(
    () => storedPlan ?? generatePlan(resolvedProfile, sessions, LESSONS, today),
    [resolvedProfile, sessions, storedPlan, today],
  )

  useEffect(() => {
    if (!sessionsReady) return
    if (storedPlan !== null) return
    saveDailyPlan(plan)
    setStoredPlan(plan)
  }, [plan, sessionsReady, storedPlan])

  const refreshSessions = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.sessions.list.queryKey(),
    })
  }

  return { today, profile: resolvedProfile, sessions, plan, refreshSessions }
}
