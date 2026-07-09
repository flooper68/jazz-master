export type ExerciseGrade = 'got-it' | 'shaky' | 'missed'
export type ScoreVerdict = 'correct' | 'early' | 'late' | 'wrong-pitch' | 'missed'
export type ScoreTolerancePreset = 'lenient' | 'standard' | 'strict'

export const EXERCISE_GRADES: readonly ExerciseGrade[] = [
  'got-it',
  'shaky',
  'missed',
]

export const SCORE_VERDICTS: readonly ScoreVerdict[] = [
  'correct',
  'early',
  'late',
  'wrong-pitch',
  'missed',
]

export interface ExerciseScoreNote {
  expectedId: string
  expectedNote: string
  verdict: ScoreVerdict
  timingOffsetSeconds: number | null
  pitchCents: number | null
}

export interface ExerciseScore {
  score: number
  tolerance: ScoreTolerancePreset
  components: {
    pitch: number
    timing: number
    completeness: number
  }
  perNote: ExerciseScoreNote[]
  extras: number
  analyzedAt: string
}

export interface ExerciseResult {
  /** `Exercise.id` — unique across the curriculum. */
  exerciseId: string
  grade: ExerciseGrade
  score?: ExerciseScore
}

export interface PracticeSession {
  id: string
  lessonId: string
  /** ISO 8601 timestamp of when the lesson was started. */
  startedAt: string
  /** Accumulated active exercise time; setup and grading prompt time are excluded. */
  durationSeconds: number
  /** False until the last exercise is graded (abandoned runs stay false). */
  completed: boolean
  /** One entry per graded exercise, in lesson order. */
  results: ExerciseResult[]
  /** Mean machine score for scored exercise results in this session. */
  score?: number
}
