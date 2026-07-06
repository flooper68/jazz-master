import type { DailyPlan } from '../planner'
import { defineStore } from './store'

export type StoredDailyPlans = Record<string, DailyPlan>

export const dailyPlansStore = defineStore<StoredDailyPlans>({
  name: 'daily-plans',
  version: 1,
  defaultValue: () => ({}),
})

export function getDailyPlan(date: string): DailyPlan | null {
  const plans = dailyPlansStore.get()
  if (!isPlanRecord(plans)) return null
  const plan = plans[date]
  return isDailyPlan(plan) ? plan : null
}

export function saveDailyPlan(plan: DailyPlan): void {
  dailyPlansStore.update((stored) => {
    const plans = isPlanRecord(stored) ? stored : {}
    return { ...plans, [plan.date]: plan }
  })
}

function isPlanRecord(value: unknown): value is StoredDailyPlans {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDailyPlan(value: unknown): value is DailyPlan {
  if (typeof value !== 'object' || value === null) return false
  if (!('date' in value) || !('totalMinutes' in value) || !('items' in value)) {
    return false
  }
  return (
    typeof value.date === 'string' &&
    typeof value.totalMinutes === 'number' &&
    Array.isArray(value.items)
  )
}
