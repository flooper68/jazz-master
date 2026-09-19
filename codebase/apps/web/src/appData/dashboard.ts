import { commonest, practiceRuns } from './practiceRun'
import { DIFFICULTIES, type Difficulty, type ExerciseRun } from './run'

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
  /** What today has come to so far: sessions started and time played. */
  todaySessions: number
  todaySeconds: number
  /** How the last seven days' answered runs mostly went; null when none were answered. */
  weekDifficulty: Difficulty | null
  /** The last seven days, oldest first, today last. */
  week: ActivityDay[]
  /** Newest first. */
  recent: ExerciseRun[]
  /** Exercises whose latest answered run went badly, worst first. */
  hardest: Array<{ exerciseId: string; difficulty: Difficulty }>
  /** Ids from the pack with no run at all, in pack order. */
  unplayed: string[]
}

/** The answers that mean an exercise is still work, hardest first. */
const UNFINISHED: readonly Difficulty[] = ['again', 'hard']

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
  const weekDifficulties: Difficulty[] = []
  const today = dayKey(now)
  for (const run of sorted) {
    const key = dayKey(new Date(run.startedAt))
    playedDays.add(key)
    const day = weekByDay.get(key)
    if (!day) continue
    // The strip is minutes played per day, so it counts each run on its own
    // day — a sitting that crosses midnight is drawn on both sides of it.
    day.seconds += run.durationSeconds
    day.runs += 1
    if (run.difficulty !== null) weekDifficulties.push(run.difficulty)
  }

  // Today's practice runs are sittings, grouped exactly as the history groups
  // them (appData/practiceRun) rather than by a second copy of the rule here:
  // one sitting, counted on the day it began. Ten short sittings is what a
  // normal day looks like (§9).
  const todayRuns = practiceRuns(sorted).filter((sitting) => dayKey(new Date(sitting.startedAt)) === today)
  const todaySeconds = todayRuns.reduce((sum, sitting) => sum + sitting.seconds, 0)

  // Count back from today; a quiet today does not break yesterday's streak.
  let streakDays = 0
  let cursor = playedDays.has(dayKey(now)) ? 0 : 1
  while (playedDays.has(dayKey(daysBefore(now, cursor)))) {
    streakDays += 1
    cursor += 1
  }

  // Sorted newest first, so the first answered run seen per exercise is its latest.
  const latest = new Map<string, Difficulty>()
  for (const run of sorted) {
    if (run.difficulty !== null && !latest.has(run.exerciseId)) latest.set(run.exerciseId, run.difficulty)
  }
  const inPack = new Set(exerciseIds)
  const hardest = [...latest]
    .filter(([exerciseId, difficulty]) => UNFINISHED.includes(difficulty) && inPack.has(exerciseId))
    .map(([exerciseId, difficulty]) => ({ exerciseId, difficulty }))
    .sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty))

  const played = new Set(sorted.map((run) => run.exerciseId))
  return {
    totalRuns: sorted.length,
    totalSeconds: sorted.reduce((sum, run) => sum + run.durationSeconds, 0),
    weekSeconds: week.reduce((sum, day) => sum + day.seconds, 0),
    weekRuns: week.reduce((sum, day) => sum + day.runs, 0),
    streakDays,
    todaySessions: todayRuns.length,
    todaySeconds,
    weekDifficulty: commonest(weekDifficulties, DIFFICULTIES),
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
