export type ExerciseGrade = 'got-it' | 'shaky' | 'missed'

export const EXERCISE_GRADES: readonly ExerciseGrade[] = [
  'got-it',
  'shaky',
  'missed',
]

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
  /** Accumulated active exercise time; setup and grading time are excluded. */
  durationSeconds: number
  /** False until the last exercise is graded (abandoned runs stay false). */
  completed: boolean
  /** One entry per graded exercise, in lesson order. */
  results: ExerciseResult[]
}
