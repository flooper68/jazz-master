import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { exerciseCosts, lastRunEnded } from '../appData/cost'
import { foldRuns } from '../appData/memory'
import { planNextSession, planSeed } from '../appData/nextSession'
import { pathsProgress } from '../appData/path'
import { recoveryState } from '../appData/recovery'
import { mutedIds, priorityMap, resolveTargets } from '../appData/targets'
import { sessionBudgetSeconds, type SessionPlan } from '../appData/quickRun'
import { useExerciseCatalog } from './useExerciseCatalog'
import { useQuickRunSettings } from './useQuickRunSettings'
import { useToday } from './useToday'
import { useGoals } from './useGoals'
import { useTRPC } from './trpc'

/**
 * What to practise now: the session the scheduler works out from the user's
 * runs. The plan is derived, never stored, and it holds still while the page
 * is open: looking twice cannot change the answer
 * (docs/product/next-session-design.md §3). Only a run landing, or the calendar
 * day turning, moves it — and the day is one value for the whole app
 * (`useToday`), so no two cards can plan against different days.
 */
export interface NextSessionResult {
  plan: SessionPlan
  /** The runs have not arrived yet, so the plan is the one a new user would get. */
  pending: boolean
  /** The runs could not be read; the plan stands, but it knows nothing of the history. */
  failed: boolean
}

export function useNextSession(): NextSessionResult {
  const trpc = useTRPC()
  const { data, isPending } = useQuery(trpc.runs.list.queryOptions())
  const runs = data?.status === 'ok' ? data.runs : null
  const { exercises } = useExerciseCatalog()
  const { goals, priorities } = useGoals()
  // One day for the whole app, so two cards cannot straddle midnight.
  const today = useToday()
  const settings = useQuickRunSettings()

  return useMemo(() => {
    const history = runs ?? []
    const costs = exerciseCosts(history, exercises)
    // What each exercise is judged against comes before the fold: a path's
    // target is what `solid` means for it, and the fold owns that word.
    const targets = resolveTargets(exercises, goals, priorities)
    const state = foldRuns(history, exercises, undefined, targets)
    const paths = pathsProgress(goals, state, undefined, mutedIds(priorities))
    const plan = planNextSession({
      state,
      catalog: exercises,
      seed: planSeed(history),
      budgetSeconds: sessionBudgetSeconds(settings),
      costs,
      today,
      lastRunEnded: lastRunEnded(history),
      recovering: recoveryState(history, today).recovering,
      targets,
      paths,
      priorities: priorityMap(priorities),
    })
    return {
      plan,
      pending: isPending,
      failed: !isPending && runs === null,
    }
  }, [settings, exercises, runs, isPending, today, goals, priorities])
}
