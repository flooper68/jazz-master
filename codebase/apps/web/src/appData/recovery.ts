import { dayKey, daysBetween } from './memory'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'
import type { ExerciseRun } from './run'

/**
 * When to back off. Two bad days in a row and the next session is a shorter,
 * kinder one — fewer walls, something loved in it, nothing new to learn — and
 * it arrives without being asked for (docs/product/next-session-design.md §8).
 *
 * A bad day is one where nothing was loved and most of what was started was
 * not finished. Either alone is ordinary: a hard day that ends on something
 * you enjoyed is a good day, and a day of three clean runs with no feeling
 * expressed is not a crisis.
 *
 * **Days without practice are not bad days.** They are skipped entirely, so two
 * bad days either side of a rest day still count as two in a row. Resting is
 * not failing.
 *
 * **But a bad week goes stale.** Two rotten days in March are not a state to
 * recover from in May: if the last of them is older than the window, the app
 * has nothing to back off from and says so. Coming back after time away gets
 * the ordinary session, not a consolation prize.
 *
 * **And today is not judged.** A day in progress is counted only once it is
 * over, so the first abandoned run of an afternoon cannot turn the home card
 * into a recovery session while the user is still sitting there practising.
 */

export interface RecoveryState {
  /** The next session should be a recovery one. */
  recovering: boolean
  /** Consecutive days of practice, most recent first, that went badly. */
  badDays: number
}

interface PractisedDay {
  day: string
  runs: ExerciseRun[]
}

/** Every day with runs in it, most recent first. */
function practisedDays(runs: readonly ExerciseRun[]): PractisedDay[] {
  const byDay = new Map<string, ExerciseRun[]>()
  for (const run of runs) {
    const day = dayKey(new Date(run.startedAt))
    const existing = byDay.get(day)
    if (existing) existing.push(run)
    else byDay.set(day, [run])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([day, dayRuns]) => ({ day, runs: dayRuns }))
}

/** Nothing loved, and most of what was started was left unfinished. */
function wentBadly(dayRuns: readonly ExerciseRun[], constants: PlanConstants): boolean {
  if (dayRuns.some((run) => run.feel === 'loved')) return false
  const completed = dayRuns.filter((run) => run.completed).length
  return completed / dayRuns.length < constants.badDayCompletionRate
}

/**
 * How the last few finished days of practice went. Today and anything after it
 * are left out, so a plan drawn for a past day reads that day's history and not
 * its future, and a day still being practised is not judged before it ends.
 */
export function recoveryState(
  runs: readonly ExerciseRun[],
  today: Date = new Date(),
  constants: PlanConstants = PLAN_CONSTANTS,
): RecoveryState {
  const until = dayKey(today)
  const days = practisedDays(runs).filter((entry) => entry.day < until)

  let badDays = 0
  for (const entry of days) {
    if (!wentBadly(entry.runs, constants)) break
    badDays += 1
  }

  // The run of bad days has to reach nearly to now to mean anything.
  const latest = days[0]?.day
  const stale = latest === undefined || daysBetween(latest, until) > constants.badDayStaleAfterDays
  return { recovering: badDays >= constants.badDaysBeforeRecovery && !stale, badDays }
}
