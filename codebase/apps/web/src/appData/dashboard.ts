import type { ExerciseRun } from './run'

/** One local calendar day of the activity strip. */
export interface ActivityDay {
  /** `YYYY-MM-DD`, local. */
  day: string
  date: Date
  seconds: number
  runs: number
}

export interface Dashboard {
  totalRuns: number
  totalSeconds: number
  /** Playing time over the last seven days, today included. */
  weekSeconds: number
  weekRuns: number
  /** Consecutive days with a run, ending today — or yesterday, so a streak is not lost before today's practice. */
  streakDays: number
  /** Mean rating of the last seven days' rated runs; null when none were rated. */
  weekRating: number | null
  /** The last seven days, oldest first, today last. */
  week: ActivityDay[]
  /** Newest first. */
  recent: ExerciseRun[]
  /** Exercises whose latest rated run felt hard (8 and up), hardest first. */
  hardest: Array<{ exerciseId: string; rating: number }>
  /** Ids from the pack with no run at all, in pack order. */
  unplayed: string[]
}

const HARD_FROM = 8

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}

function daysBefore(now: Date, days: number): Date {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  date.setDate(date.getDate() - days)
  return date
}

/** Everything the home screen shows, from the saved runs and the ids of the pack. */
export function summarizeRuns(
  runs: readonly ExerciseRun[],
  exerciseIds: readonly string[],
  now = new Date(),
): Dashboard {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.startedAt).valueOf() - new Date(a.startedAt).valueOf(),
  )

  const week: ActivityDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = daysBefore(now, 6 - index)
    return { day: dayKey(date), date, seconds: 0, runs: 0 }
  })
  const weekByDay = new Map(week.map((day) => [day.day, day]))
  const playedDays = new Set<string>()
  const weekRatings: number[] = []
  for (const run of sorted) {
    const key = dayKey(new Date(run.startedAt))
    playedDays.add(key)
    const day = weekByDay.get(key)
    if (!day) continue
    day.seconds += run.durationSeconds
    day.runs += 1
    if (run.rating !== null) weekRatings.push(run.rating)
  }

  // Count back from today; a quiet today does not break yesterday's streak.
  let streakDays = 0
  let cursor = playedDays.has(dayKey(now)) ? 0 : 1
  while (playedDays.has(dayKey(daysBefore(now, cursor)))) {
    streakDays += 1
    cursor += 1
  }

  // Sorted newest first, so the first rated run seen per exercise is its latest.
  const latestRating = new Map<string, number>()
  for (const run of sorted) {
    if (run.rating !== null && !latestRating.has(run.exerciseId)) latestRating.set(run.exerciseId, run.rating)
  }
  const inPack = new Set(exerciseIds)
  const hardest = [...latestRating]
    .filter(([exerciseId, rating]) => rating >= HARD_FROM && inPack.has(exerciseId))
    .map(([exerciseId, rating]) => ({ exerciseId, rating }))
    .sort((a, b) => b.rating - a.rating)

  const played = new Set(sorted.map((run) => run.exerciseId))
  return {
    totalRuns: sorted.length,
    totalSeconds: sorted.reduce((sum, run) => sum + run.durationSeconds, 0),
    weekSeconds: week.reduce((sum, day) => sum + day.seconds, 0),
    weekRuns: week.reduce((sum, day) => sum + day.runs, 0),
    streakDays,
    weekRating:
      weekRatings.length === 0
        ? null
        : Math.round((weekRatings.reduce((sum, rating) => sum + rating, 0) / weekRatings.length) * 10) / 10,
    week,
    recent: sorted.slice(0, 4),
    hardest,
    unplayed: exerciseIds.filter((id) => !played.has(id)),
  }
}

/** "12 min", "1 h 5 min" — totals do not need seconds. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 1) return totalSeconds > 0 ? '<1 min' : '0 min'
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}
