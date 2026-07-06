import { defineStore } from './store'

/**
 * Practice profile (TASK-016) — the contract the EPIC-011 planner consumes.
 * Written once by the onboarding wizard (or its skip defaults) and edited on
 * the profile page. `null` in the store means onboarding has never run.
 */

/**
 * Areas a guitarist can rate and target. The first four mirror `LessonArea`
 * in the content model (storage stays independent of content, so the planner
 * joins them); `ears` is reserved ahead of EPIC-006 content.
 */
export type PracticeArea = 'scales' | 'arpeggios' | 'chords' | 'standards' | 'ears'

export const PRACTICE_AREAS: readonly PracticeArea[] = [
  'scales',
  'arpeggios',
  'chords',
  'standards',
  'ears',
]

/** Self-assessed tier, same scale as `Lesson.level`: 1 = beginner. */
export type SkillLevel = 1 | 2 | 3

/** Daily practice budget options offered by onboarding and the profile page. */
export const MINUTES_PER_DAY_OPTIONS = [10, 20, 30, 45] as const

export interface PracticeProfile {
  /** Self-assessed level per area, 1 = beginner. */
  levels: Record<PracticeArea, SkillLevel>
  /** What to get better at, highest priority first. Never empty. */
  goalAreas: PracticeArea[]
  /** Daily practice budget in minutes. */
  minutesPerDay: number
  /** ISO 8601 timestamp of when onboarding completed (or was skipped). */
  createdAt: string
}

/**
 * The documented skip defaults: beginner everywhere, goals matching the
 * shipped lesson pack (so the planner has something to schedule), 20 min/day.
 */
export function defaultProfile(createdAt: string): PracticeProfile {
  return {
    levels: { scales: 1, arpeggios: 1, chords: 1, standards: 1, ears: 1 },
    goalAreas: ['scales', 'arpeggios'],
    minutesPerDay: 20,
    createdAt,
  }
}

export const profileStore = defineStore<PracticeProfile | null>({
  name: 'profile',
  version: 1,
  defaultValue: () => null,
})
