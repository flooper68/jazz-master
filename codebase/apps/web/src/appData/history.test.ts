import { describe, expect, it } from 'vitest'
import { dayLabel, groupRunsByDay } from './history'
import type { ExerciseRun } from './run'

const now = new Date(2026, 8, 17, 15, 0)

function run(id: string, startedAt: Date): ExerciseRun {
  return {
    id,
    exerciseId: 'ex',
    startedAt: startedAt.toISOString(),
    durationSeconds: 60,
    tempoBpm: 60,
    passes: 1,
    completed: true,
    difficulty: null,
    sessionId: null,
  }
}

describe('history', () => {
  it('names today and yesterday, and dates the rest', () => {
    expect(dayLabel(new Date(2026, 8, 17, 0, 5), now)).toBe('Today')
    expect(dayLabel(new Date(2026, 8, 16, 23, 55), now)).toBe('Yesterday')
    expect(dayLabel(new Date(2026, 8, 10, 12, 0), now)).toMatch(/10/)
    expect(dayLabel(new Date(2026, 8, 10, 12, 0), now)).not.toMatch(/2026/)
    expect(dayLabel(new Date(2025, 11, 31, 12, 0), now)).toMatch(/2025/)
  })

  it('groups runs by local day, days and runs newest first', () => {
    const days = groupRunsByDay(
      [
        run('yesterday', new Date(2026, 8, 16, 20, 0)),
        run('morning', new Date(2026, 8, 17, 8, 0)),
        run('noon', new Date(2026, 8, 17, 12, 0)),
      ],
      now,
    )
    expect(days.map((day) => [day.label, day.runs.map((r) => r.id)])).toEqual([
      ['Today', ['noon', 'morning']],
      ['Yesterday', ['yesterday']],
    ])
  })
})
