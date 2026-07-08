import type { LessonArea } from '../content'
import { toPlanDate } from '../planner'
import type { ExerciseResult, PracticeSession } from '../storage/sessions'

export type TimeRange = 'all' | '7d' | '30d'

export interface HistoryFilters {
  area: LessonArea | 'all'
  range: TimeRange
}

/** Sessions that started on one local calendar day, newest first. */
export interface DayGroup {
  /** Local calendar date, yyyy-mm-dd (same convention as plan dates). */
  date: string
  sessions: PracticeSession[]
}

export interface GradeTally {
  gotIt: number
  shaky: number
  missed: number
}

const RANGE_DAYS: Record<Exclude<TimeRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
}

/**
 * Apply the history filters. Time ranges are calendar-day based: "last 7
 * days" keeps sessions whose local start date falls on today or the six days
 * before it. Sessions whose lesson is unknown (content since removed) have no
 * area, so any specific area filter excludes them.
 */
export function filterSessions(
  sessions: readonly PracticeSession[],
  filters: HistoryFilters,
  areaByLessonId: ReadonlyMap<string, LessonArea>,
  now: Date,
): PracticeSession[] {
  let kept = [...sessions]
  if (filters.area !== 'all') {
    kept = kept.filter(
      (session) => areaByLessonId.get(session.lessonId) === filters.area,
    )
  }
  if (filters.range !== 'all') {
    // Calendar-day subtraction (not fixed 24h blocks) so the cutoff survives
    // DST transitions inside the window.
    const cutoffDate = new Date(now)
    cutoffDate.setDate(cutoffDate.getDate() - (RANGE_DAYS[filters.range] - 1))
    const cutoff = toPlanDate(cutoffDate)
    // yyyy-mm-dd compares correctly as a string.
    kept = kept.filter(
      (session) => toPlanDate(new Date(session.startedAt)) >= cutoff,
    )
  }
  return kept
}

/** Group sessions by local start date — newest day first, newest session first within a day. */
export function groupSessionsByDay(
  sessions: readonly PracticeSession[],
): DayGroup[] {
  const sorted = [...sessions].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  )
  const groups: DayGroup[] = []
  for (const session of sorted) {
    const date = toPlanDate(new Date(session.startedAt))
    const last = groups.at(-1)
    if (last?.date === date) {
      last.sessions.push(session)
    } else {
      groups.push({ date, sessions: [session] })
    }
  }
  return groups
}

export function tallyGrades(results: readonly ExerciseResult[]): GradeTally {
  const tally: GradeTally = { gotIt: 0, shaky: 0, missed: 0 }
  for (const result of results) {
    if (result.grade === 'got-it') tally.gotIt += 1
    else if (result.grade === 'shaky') tally.shaky += 1
    else tally.missed += 1
  }
  return tally
}

/** `durationSeconds` is active exercise time (see PracticeSession); round for display. */
export function formatDuration(durationSeconds: number): string {
  if (durationSeconds < 60) return `${Math.max(Math.round(durationSeconds), 0)} s`
  return `${Math.round(durationSeconds / 60)} min`
}

/** Local wall-clock start time, zero-padded 24h (e.g. 09:05). */
export function formatTime(startedAt: string): string {
  const date = new Date(startedAt)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
