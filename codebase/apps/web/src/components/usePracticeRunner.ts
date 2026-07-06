import { useEffect, useReducer } from 'react'
import type { Lesson } from '../content'
import {
  upsertSession,
  type ExerciseGrade,
  type PracticeSession,
} from '../storage/sessions'

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
  exerciseIndex: number
  results: { exerciseId: string; grade: ExerciseGrade }[]
  /** True once the last exercise is graded — show the summary. */
  finished: boolean
}

export type RunnerAction = { type: 'grade'; grade: ExerciseGrade }

export interface RunnerInit {
  lesson: Lesson
  sessionId: string
  startedAt: number
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
    exerciseIndex: 0,
    results: [],
    finished: false,
  }
}

export function runnerReducer(
  state: RunnerState,
  action: RunnerAction,
): RunnerState {
  switch (action.type) {
    case 'grade': {
      if (state.finished) return state
      const exercise = state.lesson.exercises[state.exerciseIndex]
      const results = [
        ...state.results,
        { exerciseId: exercise.id, grade: action.grade },
      ]
      const isLast = state.exerciseIndex + 1 >= state.lesson.exercises.length
      return {
        ...state,
        results,
        exerciseIndex: isLast ? state.exerciseIndex : state.exerciseIndex + 1,
        finished: isLast,
      }
    }
  }
}

function toSessionRecord(state: RunnerState, now: number): PracticeSession {
  return {
    id: state.sessionId,
    lessonId: state.lesson.id,
    startedAt: new Date(state.startedAt).toISOString(),
    durationSeconds: Math.max(Math.round((now - state.startedAt) / 1000), 0),
    completed: state.finished,
    results: state.results,
  }
}

export function usePracticeRunner(init: RunnerInit) {
  const [state, dispatch] = useReducer(runnerReducer, init, createRunnerState)

  // Synchronize committed state to storage: every grade upserts the record,
  // so abandoning the lesson or closing the tab never loses graded history.
  // An Effect (not the handler) so the persisted record can never diverge
  // from what React actually committed under rapid repeat dispatches.
  useEffect(() => {
    if (state.results.length === 0) return
    upsertSession(toSessionRecord(state, Date.now()))
  }, [state])

  function grade(gradeValue: ExerciseGrade): void {
    dispatch({ type: 'grade', grade: gradeValue })
  }

  return { state, grade }
}
