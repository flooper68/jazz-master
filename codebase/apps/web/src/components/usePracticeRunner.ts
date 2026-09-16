import { useEffect, useReducer, useRef } from 'react'
import type { Lesson } from '../content'
import type { PracticeSession } from '../appData/session'

/**
 * Session-flow state for the practice runner. The reducer is the whole state
 * machine — play the current exercise, finish it, advance, end — so the
 * component stays thin and the flow is unit-testable without rendering.
 */

export interface RunnerState {
  lesson: Lesson
  sessionId: string
  /** Epoch ms of the Start click (owned by the page's event handler). */
  startedAt: number
  /**
   * Epoch ms of the current exercise's active playthrough, once the player
   * begins it. Null while the user is setting up.
   */
  activeExerciseStartedAt: number | null
  /** Accumulated active playthrough time, excluding setup time. */
  durationSeconds: number
  exerciseIndex: number
  /** Exercises played to the end so far. */
  exercisesCompleted: number
  /** True once the last exercise is finished — show the summary. */
  finished: boolean
}

export type RunnerAction =
  | { type: 'begin-exercise'; at: number }
  | { type: 'finish-exercise'; at: number }

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
    exercisesCompleted: 0,
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
    case 'finish-exercise': {
      if (state.finished) return state
      const completedState = completeActiveExercise(state, action.at)
      const isLast =
        completedState.exerciseIndex + 1 >= completedState.lesson.exercises.length
      return {
        ...completedState,
        exercisesCompleted: completedState.exercisesCompleted + 1,
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
  return {
    id: state.sessionId,
    lessonId: state.lesson.id,
    startedAt: new Date(state.startedAt).toISOString(),
    durationSeconds:
      state.activeExerciseStartedAt === null
        ? state.durationSeconds
        : completeActiveExercise(state, now).durationSeconds,
    completed: state.finished,
    exercisesCompleted: state.exercisesCompleted,
  }
}

export function usePracticeRunner(init: RunnerInit) {
  const { onSessionChange } = init
  const [state, dispatch] = useReducer(runnerReducer, init, createRunnerState)

  // Synchronize committed state to the server: every finished exercise
  // upserts the record, so abandoning the lesson or closing the tab never
  // loses progress. An Effect (not the handler) so the persisted record can
  // never diverge from what React actually committed.
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (state.exercisesCompleted === 0) return
    onSessionChange(toSessionRecord(stateRef.current, Date.now()))
  }, [onSessionChange, state.exercisesCompleted])

  function beginExercise(at = Date.now()): void {
    dispatch({ type: 'begin-exercise', at })
  }

  function finishExercise(at = Date.now()): void {
    dispatch({ type: 'finish-exercise', at })
  }

  return { state, beginExercise, finishExercise }
}
