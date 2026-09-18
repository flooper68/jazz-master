import { describe, expect, it } from 'vitest'
import { formatDuration, summarizeRuns } from './dashboard'
import type { ExerciseRun } from './run'

const now = new Date(2026, 8, 17, 15, 0)
const PACK = ['a', 'b', 'c', 'd']

function run(exerciseId: string, daysAgo: number, overrides: Partial<ExerciseRun> = {}): ExerciseRun {
  const startedAt = new Date(2026, 8, 17 - daysAgo, 10, 0)
  return {
    id: `${exerciseId}-${daysAgo}-${overrides.difficulty ?? 'x'}`,
    exerciseId,
    startedAt: startedAt.toISOString(),
    durationSeconds: 120,
    tempoBpm: 60,
    passes: 3,
    completed: true,
    difficulty: null,
    feel: null,
    sessionId: null,
    ...overrides,
  }
}

describe('summarizeRuns', () => {
  it('is all zeroes, with the whole pack unplayed, before the first run', () => {
    const summary = summarizeRuns([], PACK, now)
    expect(summary).toMatchObject({ totalRuns: 0, weekSeconds: 0, streakDays: 0, weekDifficulty: null, recent: [], hardest: [] })
    expect(summary.unplayed).toEqual(PACK)
    expect(summary.week).toHaveLength(7)
    expect(summary.week.at(-1)?.day).toBe('2026-09-17')
    expect(summary.week[0].day).toBe('2026-09-11')
  })

  it('totals the last seven days apart from everything before them', () => {
    const summary = summarizeRuns(
      [run('a', 0), run('a', 0, { durationSeconds: 60, difficulty: 'good' }), run('b', 6, { difficulty: 'hard' }), run('c', 7), run('c', 30)],
      PACK,
      now,
    )
    expect(summary.totalRuns).toBe(5)
    expect(summary.totalSeconds).toBe(540)
    expect(summary.weekRuns).toBe(3)
    expect(summary.weekSeconds).toBe(300)
    // One Good and one Hard this week: the tie falls to the harder answer.
    expect(summary.weekDifficulty).toBe('hard')
    expect(summary.week.at(-1)).toMatchObject({ seconds: 180, runs: 2 })
    expect(summary.week[0]).toMatchObject({ seconds: 120, runs: 1 })
    expect(summary.unplayed).toEqual(['d'])
  })

  it('counts today: the sittings and the minutes, with a run played alone one of its own', () => {
    const sitting = '33333333-3333-4333-8333-333333333333'
    const summary = summarizeRuns(
      [
        run('a', 0, { id: 'one', sessionId: sitting }),
        run('b', 0, { id: 'two', sessionId: sitting }),
        // On its own from the exercise page: a sitting all the same.
        run('c', 0, { id: 'three' }),
        // Yesterday's is not today's.
        run('d', 1, { id: 'four' }),
      ],
      PACK,
      now,
    )
    expect(summary.todaySessions).toBe(2)
    expect(summary.todaySeconds).toBe(360)
  })

  it('has nothing to say about a day with no practice in it', () => {
    const summary = summarizeRuns([run('a', 1)], PACK, now)
    expect(summary.todaySessions).toBe(0)
    expect(summary.todaySeconds).toBe(0)
  })

  it('counts a streak back from today, or from yesterday when today is still quiet', () => {
    expect(summarizeRuns([run('a', 0), run('a', 1), run('a', 2), run('a', 4)], PACK, now).streakDays).toBe(3)
    expect(summarizeRuns([run('a', 1), run('a', 2)], PACK, now).streakDays).toBe(2)
    expect(summarizeRuns([run('a', 2), run('a', 3)], PACK, now).streakDays).toBe(0)
  })

  it('names what went badly by each exercise\'s latest answer, worst first', () => {
    const summary = summarizeRuns(
      [
        run('a', 0, { difficulty: 'easy' }), // latest says a is fine now…
        run('a', 5, { difficulty: 'again' }), // …whatever it was last week
        run('b', 1, { difficulty: 'hard' }),
        run('c', 2, { difficulty: 'again' }),
        run('gone', 0, { difficulty: 'again' }), // no longer in the pack
      ],
      PACK,
      now,
    )
    expect(summary.hardest).toEqual([
      { exerciseId: 'c', difficulty: 'again' },
      { exerciseId: 'b', difficulty: 'hard' },
    ])
  })

  it('lists the newest runs first, four at most', () => {
    const summary = summarizeRuns([run('a', 3), run('b', 0), run('c', 1), run('d', 2), run('a', 9)], PACK, now)
    expect(summary.recent.map((r) => r.exerciseId)).toEqual(['b', 'c', 'd', 'a'])
  })
})

describe('formatDuration', () => {
  it('speaks in minutes and hours', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(20)).toBe('<1 min')
    expect(formatDuration(8 * 60)).toBe('8 min')
    expect(formatDuration(65 * 60)).toBe('1 h 5 min')
  })
})
