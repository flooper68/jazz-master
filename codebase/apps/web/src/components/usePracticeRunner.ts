import { useEffect, useReducer } from 'react'
import type { Lesson } from '../content'
import {
  type ExerciseScore,
  type ExerciseGrade,
  type ExerciseResult,
  type PracticeSession,
} from '../appData/session'

/**
 * Session-flow state for the practice runner (TASK-013). The reducer is the
 * whole state machine — grade the current exercise, advance, finish — so the
 * component stays thin and the flow is unit-testable without rendering.
 */

export interface RunnerState {
  lesson: Lesson
  sessionId: string
  /** Epoch ms of the Start click (owned by the page's event handler). */
  startedAt: number
  /**
   * Epoch ms of the current exercise's active playthrough, once playback or
   * recording begins. Null while the user is setting up or grading.
   */
  activeExerciseStartedAt: number | null
  /** Accumulated active playthrough time, excluding setup and grading prompt time. */
  durationSeconds: number
  exerciseIndex: number
  results: ExerciseResult[]
  /** True once the last exercise is graded — show the summary. */
  finished: boolean
}

export type RunnerAction =
  | { type: 'begin-exercise'; at: number }
  | { type: 'complete-exercise'; at: number }
  | { type: 'grade'; grade: ExerciseGrade; score?: ExerciseScore; at: number }

export interface RunnerInit {
  lesson: Lesson
  sessionId: string
  startedAt: number
  onSessionChange: (session: PracticeSession) => void | Promise<void>
}

export function createRunnerState({
  lesson,
  sessionId,
  startedAt,
}: RunnerInit): RunnerState {
  return {
    lesson,
    sessionId,
    startedAt,
    activeExerciseStartedAt: null,
    durationSeconds: 0,
    exerciseIndex: 0,
    results: [],
    finished: false,
  }
}

function completeActiveExercise(state: RunnerState, at: number): RunnerState {
  if (state.activeExerciseStartedAt === null) return state
  return {
    ...state,
    activeExerciseStartedAt: null,
    durationSeconds:
      state.durationSeconds +
      Math.max(Math.round((at - state.activeExerciseStartedAt) / 1000), 0),
  }
}

export function runnerReducer(
  state: RunnerState,
  action: RunnerAction,
): RunnerState {
  switch (action.type) {
    case 'begin-exercise': {
      if (state.finished || state.activeExerciseStartedAt !== null) return state
      return { ...state, activeExerciseStartedAt: action.at }
    }
    case 'complete-exercise':
      return completeActiveExercise(state, action.at)
    case 'grade': {
      if (state.finished) return state
      const completedState = completeActiveExercise(state, action.at)
      const exercise = state.lesson.exercises[state.exerciseIndex]
      const results = [
        ...completedState.results,
        {
          exerciseId: exercise.id,
          grade: action.grade,
          ...(action.score ? { score: action.score } : {}),
        },
      ]
      const isLast =
        completedState.exerciseIndex + 1 >= completedState.lesson.exercises.length
      return {
        ...completedState,
        results,
        exerciseIndex: isLast
          ? completedState.exerciseIndex
          : completedState.exerciseIndex + 1,
        finished: isLast,
      }
    }
  }
}

export function toSessionRecord(
  state: RunnerState,
  now: number,
): PracticeSession {
  const scoredResults = state.results.filter(
    (result): result is ExerciseResult & { score: ExerciseScore } =>
      result.score !== undefined,
  )
  const score =
    scoredResults.length > 0
      ? Math.round(
          scoredResults.reduce((sum, result) => sum + result.score.score, 0) /
            scoredResults.length,
        )
      : undefined
  return {
    id: state.sessionId,
    lessonId: state.lesson.id,
    startedAt: new Date(state.startedAt).toISOString(),
    durationSeconds:
      state.activeExerciseStartedAt === null
        ? state.durationSeconds
        : completeActiveExercise(state, now).durationSeconds,
    completed: state.finished,
    results: state.results,
    ...(score !== undefined ? { score } : {}),
  }
}

export function usePracticeRunner(init: RunnerInit) {
  const { onSessionChange } = init
  const [state, dispatch] = useReducer(runnerReducer, init, createRunnerState)

  // Synchronize committed state to the server: every grade upserts the record,
  // so abandoning the lesson or closing the tab never loses graded history.
  // An Effect (not the handler) so the persisted record can never diverge
  // from what React actually committed under rapid repeat dispatches.
  useEffect(() => {
    if (state.results.length === 0) return
    onSessionChange(toSessionRecord(state, Date.now()))
  }, [onSessionChange, state])

  function beginExercise(at = Date.now()): void {
    dispatch({ type: 'begin-exercise', at })
  }

  function completeExercise(at = Date.now()): void {
    dispatch({ type: 'complete-exercise', at })
  }

  function grade(
    gradeValue: ExerciseGrade,
    score?: ExerciseScore,
    at = Date.now(),
  ): void {
    dispatch({ type: 'grade', grade: gradeValue, score, at })
  }

  return { state, beginExercise, completeExercise, grade }
}
