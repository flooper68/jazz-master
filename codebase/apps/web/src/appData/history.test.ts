import { describe, expect, it } from 'vitest'
import { dayLabel, groupRunsByDay } from './history'
import type { PracticeRun } from './practiceRun'

const now = new Date(2026, 8, 17, 15, 0)

/** A sitting as the history lists it; what is inside it is practiceRun.test's business. */
function sitting(id: string, startedAt: Date): PracticeRun {
  return { id, startedAt: startedAt.toISOString(), seconds: 60, runs: [], completed: 1 }
}

describe('history', () => {
  it('names today and yesterday, and dates the rest', () => {
    expect(dayLabel(new Date(2026, 8, 17, 0, 5), now)).toBe('Today')
    expect(dayLabel(new Date(2026, 8, 16, 23, 55), now)).toBe('Yesterday')
    expect(dayLabel(new Date(2026, 8, 10, 12, 0), now)).toMatch(/10/)
    expect(dayLabel(new Date(2026, 8, 10, 12, 0), now)).not.toMatch(/2026/)
    expect(dayLabel(new Date(2025, 11, 31, 12, 0), now)).toMatch(/2025/)
  })

  it('groups practice runs by local day, days and runs newest first', () => {
    const days = groupRunsByDay(
      [
        sitting('yesterday', new Date(2026, 8, 16, 20, 0)),
        sitting('morning', new Date(2026, 8, 17, 8, 0)),
        sitting('noon', new Date(2026, 8, 17, 12, 0)),
      ],
      now,
    )
    expect(days.map((day) => [day.label, day.runs.map((r) => r.id)])).toEqual([
      ['Today', ['noon', 'morning']],
      ['Yesterday', ['yesterday']],
    ])
  })
})
