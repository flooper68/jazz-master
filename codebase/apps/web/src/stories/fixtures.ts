import type { ExerciseRun } from '../appData/run'

const DAY = 86_400_000
/** Relative to now, so "Today" and "Yesterday" always have something under them. */
const ago = (days: number, hour: number) => {
  const date = new Date(Date.now() - days * DAY)
  date.setHours(hour, 15, 0, 0)
  return date.toISOString()
}

/** A week of practice, newest first — what runs.list returns. */
export const runs: ExerciseRun[] = [
  { id: 'a1', exerciseId: 'lines-ii-v-i-f-line', startedAt: ago(0, 9), durationSeconds: 96, tempoBpm: 90, passes: 4, completed: true, rating: 8 },
  { id: 'a2', exerciseId: 'scales-major-open-f', startedAt: ago(0, 8), durationSeconds: 120, tempoBpm: 68, passes: 6, completed: true, rating: 5 },
  { id: 'b1', exerciseId: 'lines-ii-v-i-f-arpeggios', startedAt: ago(1, 19), durationSeconds: 84, tempoBpm: 80, passes: 4, completed: true, rating: null },
  { id: 'b2', exerciseId: 'scales-major-open-g', startedAt: ago(1, 18), durationSeconds: 45, tempoBpm: 60, passes: 2, completed: false, rating: 3 },
  { id: 'c1', exerciseId: 'scales-major-open-c', startedAt: ago(5, 7), durationSeconds: 120, tempoBpm: 60, passes: 6, completed: true, rating: 2 },
]
