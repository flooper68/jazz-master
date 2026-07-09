/**
 * Practice profile (TASK-016): the contract the planner and profile form
 * consume. Stored server-side after TASK-066; the timestamp is the product
 * onboarding completion time, not the database row creation time.
 */

/**
 * Areas a guitarist can rate and target. The first four mirror `LessonArea`
 * in the content model; `ears` is reserved ahead of EPIC-006 content.
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
export type PracticeMinutesPerDay = (typeof MINUTES_PER_DAY_OPTIONS)[number]

export interface PracticeProfile {
  /** Self-assessed level per area, 1 = beginner. */
  levels: Record<PracticeArea, SkillLevel>
  /** What to get better at, highest priority first. Never empty. */
  goalAreas: PracticeArea[]
  /** Daily practice budget in minutes. */
  minutesPerDay: PracticeMinutesPerDay
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

export function isPracticeArea(value: unknown): value is PracticeArea {
  return typeof value === 'string' && PRACTICE_AREAS.includes(value as PracticeArea)
}

export function isSkillLevel(value: unknown): value is SkillLevel {
  return value === 1 || value === 2 || value === 3
}

export function isPracticeMinutesPerDay(
  value: unknown,
): value is PracticeMinutesPerDay {
  return (
    typeof value === 'number' &&
    MINUTES_PER_DAY_OPTIONS.includes(value as PracticeMinutesPerDay)
  )
}
