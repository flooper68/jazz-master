import { defineStore } from './store'

/**
 * Practice session records (TASK-013) — the contract the EPIC-011 planner and
 * EPIC-012 history consume. One record per started lesson run; the runner
 * upserts the record after every grade, so an abandoned session survives as
 * `completed: false` with the grades earned so far.
 */

export type ExerciseGrade = 'got-it' | 'shaky' | 'missed'

export interface ExerciseResult {
  /** `Exercise.id` — unique across the curriculum. */
  exerciseId: string
  grade: ExerciseGrade
}

export interface PracticeSession {
  id: string
  lessonId: string
  /** ISO 8601 timestamp of when the lesson was started. */
  startedAt: string
  /** Elapsed time from start to the latest grade. */
  durationSeconds: number
  /** False until the last exercise is graded (abandoned runs stay false). */
  completed: boolean
  /** One entry per graded exercise, in lesson order. */
  results: ExerciseResult[]
  /** Reserved for EPIC-010 machine scoring; the runner never writes it. */
  score?: number
}

export const sessionsStore = defineStore<PracticeSession[]>({
  name: 'sessions',
  version: 1,
  defaultValue: () => [],
})

/** Insert the session or replace the existing record with the same id. */
export function upsertSession(session: PracticeSession): void {
  sessionsStore.update((stored) => {
    // The envelope check in defineStore doesn't validate T itself, so guard
    // against tampered non-array data rather than throwing in a click handler.
    const sessions = Array.isArray(stored) ? stored : []
    const index = sessions.findIndex((existing) => existing.id === session.id)
    return index === -1
      ? [...sessions, session]
      : sessions.with(index, session)
  })
}
