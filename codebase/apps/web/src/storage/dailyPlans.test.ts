import { beforeEach, describe, expect, it } from 'vitest'
import type { DailyPlan } from '../planner'
import { dailyPlansStore, getDailyPlan, saveDailyPlan } from './dailyPlans'

const plan: DailyPlan = {
  date: '2026-07-06',
  totalMinutes: 12,
  items: [
    {
      lessonId: 'scales-major-open',
      lessonTitle: 'Major scale I — open position',
      area: 'scales',
      estimatedMinutes: 12,
      reason: 'Starts your scales goal at level 1.',
    },
  ],
}

beforeEach(() => {
  localStorage.clear()
})

describe('dailyPlansStore', () => {
  it('defaults to no saved plans', () => {
    expect(dailyPlansStore.get()).toEqual({})
  })

  it('saves and reads a plan by date', () => {
    saveDailyPlan(plan)
    expect(getDailyPlan('2026-07-06')).toEqual(plan)
  })

  it('returns null for malformed stored data instead of throwing', () => {
    dailyPlansStore.set({ '2026-07-06': [] as unknown as DailyPlan })
    expect(getDailyPlan('2026-07-06')).toBeNull()
  })
})
