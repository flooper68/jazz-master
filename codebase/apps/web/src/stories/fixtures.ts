import type { Routine } from '../appData/routine'
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
  { id: 'a1', exerciseId: 'lines-ii-v-i-f-line', startedAt: ago(0, 9), durationSeconds: 96, tempoBpm: 90, passes: 4, completed: true, rating: 8, sessionId: 'quick-1' },
  { id: 'a2', exerciseId: 'scales-major-open-f', startedAt: ago(0, 8), durationSeconds: 120, tempoBpm: 68, passes: 6, completed: true, rating: 5, sessionId: 'quick-1' },
  { id: 'b1', exerciseId: 'lines-ii-v-i-f-arpeggios', startedAt: ago(1, 19), durationSeconds: 84, tempoBpm: 80, passes: 4, completed: true, rating: null, sessionId: null },
  { id: 'b2', exerciseId: 'scales-major-open-g', startedAt: ago(1, 18), durationSeconds: 45, tempoBpm: 60, passes: 2, completed: false, rating: 3, sessionId: null },
  { id: 'c1', exerciseId: 'scales-major-open-c', startedAt: ago(5, 7), durationSeconds: 120, tempoBpm: 60, passes: 6, completed: true, rating: 2, sessionId: null },
]

/** What routines.list returns: two prepared sessions, oldest first. */
export const routines: Routine[] = [
  {
    id: 'story-warm-up',
    name: 'Morning warm-up',
    about: 'Open-position scales around the cycle, slow and even.',
    items: [{ exerciseId: 'scales-major-open-c' }, { exerciseId: 'scales-major-open-f' }, { exerciseId: 'scales-major-open-g' }],
  },
  {
    id: 'story-ii-v-i',
    name: 'ii–V–I in F',
    items: [{ exerciseId: 'lines-ii-v-i-f-arpeggios' }, { exerciseId: 'lines-ii-v-i-f-line' }],
  },
]
