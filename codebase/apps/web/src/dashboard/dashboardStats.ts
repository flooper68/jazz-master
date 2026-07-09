import type { Lesson, LessonArea } from '../content'
import { toPlanDate } from '../planner'
import type { ExerciseGrade, PracticeSession } from '../appData/session'

/** Same rule as the planner: these grades mark a lesson as needing attention. */
const NEEDS_ATTENTION_GRADES: ReadonlySet<ExerciseGrade> = new Set([
  'shaky',
  'missed',
])

/** Days shown as "this week": today plus the six before it (history's 7d rule). */
export const WEEK_DAYS = 7

export interface AreaStatus {
  area: LessonArea
  /** Lessons the pack ships for this area. */
  lessonCount: number
  /** Distinct lessons with at least one completed session. */
  completedLessonCount: number
  /** Titles of lessons whose latest session has a shaky/missed grade, in pack order. */
  attentionLessonTitles: string[]
  /** Local calendar date (yyyy-mm-dd) of the area's most recent session, or null. */
  lastPracticedDate: string | null
}

/**
 * Consecutive local calendar days with at least one practice session, counting
 * back from today. A quiet today doesn't break a run — the day isn't over — so
 * the count may start at yesterday instead.
 */
export function currentStreakDays(
  sessions: readonly PracticeSession[],
  today: Date,
): number {
  const practiced = new Set(
    sessions.map((session) => toPlanDate(new Date(session.startedAt))),
  )
  // setDate handles month/year boundaries and DST as calendar-day arithmetic.
  const day = new Date(today)
  if (!practiced.has(toPlanDate(day))) day.setDate(day.getDate() - 1)
  let streak = 0
  while (practiced.has(toPlanDate(day))) {
    streak += 1
    day.setDate(day.getDate() - 1)
  }
  return streak
}

/**
 * Minutes practiced in the last WEEK_DAYS local calendar days, today included.
 * Sums `durationSeconds` (active exercise time — the record's documented
 * semantics, excluding setup and grading prompt time) and rounds the total once.
 */
export function minutesThisWeek(
  sessions: readonly PracticeSession[],
  today: Date,
): number {
  const cutoffDate = new Date(today)
  cutoffDate.setDate(cutoffDate.getDate() - (WEEK_DAYS - 1))
  const cutoff = toPlanDate(cutoffDate)
  const todayDate = toPlanDate(today)
  const seconds = sessions.reduce((total, session) => {
    // yyyy-mm-dd compares correctly as a string; a clock-skewed future
    // session shouldn't inflate the week.
    const date = toPlanDate(new Date(session.startedAt))
    return date >= cutoff && date <= todayDate
      ? total + session.durationSeconds
      : total
  }, 0)
  return Math.round(seconds / 60)
}

/**
 * Per-area glance in the pack's authored area order. A lesson needs attention
 * when its *latest* session still has a shaky/missed grade — a later clean run
 * clears it. Sessions whose lesson left the pack have no area and are ignored.
 */
export function areaStatuses(
  sessions: readonly PracticeSession[],
  lessons: readonly Lesson[],
): AreaStatus[] {
  const latestByLesson = new Map<string, PracticeSession>()
  for (const session of sessions) {
    const existing = latestByLesson.get(session.lessonId)
    if (
      !existing ||
      Date.parse(session.startedAt) > Date.parse(existing.startedAt)
    ) {
      latestByLesson.set(session.lessonId, session)
    }
  }
  const completedLessonIds = new Set(
    sessions
      .filter((session) => session.completed)
      .map((session) => session.lessonId),
  )
  const areas = [...new Set(lessons.map((lesson) => lesson.area))]
  return areas.map((area) => {
    const areaLessons = lessons.filter((lesson) => lesson.area === area)
    let lastPracticedDate: string | null = null
    let lastPracticedMs = Number.NEGATIVE_INFINITY
    for (const lesson of areaLessons) {
      const latest = latestByLesson.get(lesson.id)
      if (!latest) continue
      const startedMs = Date.parse(latest.startedAt)
      if (startedMs > lastPracticedMs) {
        lastPracticedMs = startedMs
        lastPracticedDate = toPlanDate(new Date(latest.startedAt))
      }
    }
    return {
      area,
      lessonCount: areaLessons.length,
      completedLessonCount: areaLessons.filter((lesson) =>
        completedLessonIds.has(lesson.id),
      ).length,
      attentionLessonTitles: areaLessons
        .filter((lesson) => needsAttention(latestByLesson.get(lesson.id)))
        .map((lesson) => lesson.title),
      lastPracticedDate,
    }
  })
}

/** Lessons with a completed session on the given local calendar date. */
export function completedLessonIdsOn(
  sessions: readonly PracticeSession[],
  date: string,
): ReadonlySet<string> {
  return new Set(
    sessions
      .filter(
        (session) =>
          session.completed &&
          toPlanDate(new Date(session.startedAt)) === date,
      )
      .map((session) => session.lessonId),
  )
}

function needsAttention(session: PracticeSession | undefined): boolean {
  return (
    session?.results.some((result) =>
      NEEDS_ATTENTION_GRADES.has(result.grade),
    ) ?? false
  )
}
