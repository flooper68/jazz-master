export interface PracticeSession {
  id: string
  lessonId: string
  /** ISO 8601 timestamp of when the lesson was started. */
  startedAt: string
  /** Accumulated active exercise time; setup time is excluded. */
  durationSeconds: number
  /** False until the last exercise is finished (abandoned runs stay false). */
  completed: boolean
  /** How many exercises were played to the end, in lesson order. */
  exercisesCompleted: number
}
