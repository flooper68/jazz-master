import { useEffect, useMemo, useState } from 'react'
import { LESSONS } from '../content'
import {
  defaultProfile,
  getDailyPlan,
  profileStore,
  saveDailyPlan,
  sessionsStore,
  type PracticeProfile,
  type PracticeSession,
} from '../storage'
import { generatePlan, toPlanDate, type DailyPlan } from './dailyPlan'

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
  const [today] = useState(() => new Date())
  const [profile] = useState(
    () => profileStore.get() ?? defaultProfile(today.toISOString()),
  )
  const [sessions, setSessions] = useState(() => sessionsStore.get())
  const [storedPlan, setStoredPlan] = useState<DailyPlan | null>(() =>
    getDailyPlan(toPlanDate(today)),
  )
  const plan = useMemo(
    () => storedPlan ?? generatePlan(profile, sessions, LESSONS, today),
    [profile, sessions, storedPlan, today],
  )

  useEffect(() => {
    if (storedPlan !== null) return
    saveDailyPlan(plan)
    setStoredPlan(plan)
  }, [plan, storedPlan])

  const refreshSessions = () => setSessions(sessionsStore.get())

  return { today, profile, sessions, plan, refreshSessions }
}
