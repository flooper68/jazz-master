import { useState } from 'react'
import type { PracticeSession } from '../appData/session'
import type { PlayerAudio } from '../audio/engine'
import type { Lesson } from '../content'
import { ExercisePlayer } from './ExercisePlayer'
import { DEFAULT_PLAYER_PREFS, type PlayerPrefs } from './playerPrefs'
import { toSessionRecord, usePracticeRunner } from './usePracticeRunner'
import { useViewFocus } from './useViewFocus'

/**
 * The lesson player: one exercise at a time on the practice stage
 * (ExercisePlayer), then the lesson summary. Session flow lives in
 * usePracticeRunner; player preferences (click, voice, view) outlive any
 * one exercise and live here.
 */

const BUTTON_PRIMARY =
  'rounded-lg bg-cta px-4 py-2 font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-muted'
const HEADING =
  'font-display text-2xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

interface PracticeRunnerProps {
  lesson: Lesson
  /** Session identity is owned by the page, not this component. */
  sessionId: string
  startedAt: number
  onSessionChange: (session: PracticeSession) => void | Promise<void>
  onExit: () => void
  /** Test seam: the browser's Web Audio engine, swapped for a fake in jsdom. */
  createAudio?: () => PlayerAudio
  /** Test seam: the wall clock in ms, used when audio is unavailable. */
  now?: () => number
}

export function PracticeRunner({
  lesson,
  sessionId,
  startedAt,
  onSessionChange,
  onExit,
  createAudio,
  now,
}: PracticeRunnerProps) {
  const { state, beginExercise, finishExercise } = usePracticeRunner({
    lesson,
    sessionId,
    startedAt,
    onSessionChange,
  })
  const [exiting, setExiting] = useState(false)
  const [prefs, setPrefs] = useState<PlayerPrefs>(DEFAULT_PLAYER_PREFS)
  // ISSUE-002: the summary replacing the exercises is a same-route view swap;
  // move focus to the incoming heading, and on mount (the page is the runner).
  // Advancing between exercises is handled by ExercisePlayer, which focuses
  // its own heading when it mounts.
  const headingRef = useViewFocus<HTMLHeadingElement>(
    state.finished ? 'summary' : 'exercises',
    { focusOnMount: true },
  )

  async function exitRunner(): Promise<void> {
    if (exiting) return
    setExiting(true)
    if (state.exercisesCompleted > 0) {
      await onSessionChange(toSessionRecord(state, Date.now()))
    }
    onExit()
  }

  if (state.finished) {
    return (
      <section className="max-w-2xl">
        <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
          Lesson complete — {lesson.title}
        </h1>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-panel">
          {lesson.exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="flex items-baseline justify-between gap-4 p-4"
            >
              <span className="text-fg">{exercise.title}</span>
              <span className="shrink-0 text-sm text-muted">Done</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => void exitRunner()}
          disabled={exiting}
          className={`mt-6 ${BUTTON_PRIMARY}`}
        >
          Done
        </button>
      </section>
    )
  }

  const exercise = lesson.exercises[state.exerciseIndex]
  return (
    <section className="max-w-5xl">
      <div className="flex items-baseline justify-between gap-4">
        <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
          {lesson.title}
        </h1>
        <button
          type="button"
          onClick={() => void exitRunner()}
          disabled={exiting}
          className="shrink-0 text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          End lesson
        </button>
      </div>
      <ol className="mt-2 flex flex-wrap items-center gap-2 text-sm" aria-label="Exercises">
        {lesson.exercises.map((item, index) => {
          const status =
            index < state.exerciseIndex ? 'done' : index === state.exerciseIndex ? 'current' : 'upcoming'
          return (
            <li
              key={item.id}
              aria-current={status === 'current' ? 'step' : undefined}
              className={`rounded-full border px-3 py-1 ${
                status === 'current'
                  ? 'border-fg bg-fg text-panel'
                  : status === 'done'
                    ? 'border-line text-muted line-through'
                    : 'border-line text-fg-2'
              }`}
            >
              {index + 1}. {item.title}
            </li>
          )
        })}
      </ol>
      <p className="sr-only">
        Exercise {state.exerciseIndex + 1} of {lesson.exercises.length}
      </p>
      {/* Keyed so per-exercise state (transport, timer, cursor) resets on advance. */}
      <ExercisePlayer
        key={exercise.id}
        exercise={exercise}
        isFirst={state.exerciseIndex === 0}
        prefs={prefs}
        onPrefsChange={setPrefs}
        onBegin={beginExercise}
        onFinish={finishExercise}
        createAudio={createAudio}
        now={now}
      />
    </section>
  )
}
