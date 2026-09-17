import { useEffect, useState } from 'react'
import type { PracticeSession } from '../appData/session'
import type { PlayerAudio } from '../audio/engine'
import type { Lesson } from '../content'
import { ExercisePlayer } from './ExercisePlayer'
import { CheckIcon } from './icons'
import { loadPlayerPrefs, savePlayerPrefs, type PlayerPrefs } from './playerPrefs'
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
const STAGE_HEADING =
  'font-display text-base font-semibold tracking-tight focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-dashed focus-visible:outline-line-strong'

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
  // Sound and view choices are remembered across lessons and reloads.
  const [prefs, setPrefs] = useState<PlayerPrefs>(loadPlayerPrefs)
  useEffect(() => savePlayerPrefs(prefs), [prefs])
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
    <section className="flex flex-1 flex-col">
      {/* The stage is full-bleed, but its text keeps the app header's column. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 md:px-8">
        <h1 ref={headingRef} tabIndex={-1} className={STAGE_HEADING}>
          {lesson.title}
        </h1>
        {/* One step per exercise; the current exercise's title is on the stage below. */}
        <ol className="flex items-center gap-1 text-xs" aria-label="Exercises">
          {lesson.exercises.map((item, index) => {
            const status =
              index < state.exerciseIndex ? 'done' : index === state.exerciseIndex ? 'current' : 'upcoming'
            return (
              <li
                key={item.id}
                aria-current={status === 'current' ? 'step' : undefined}
                aria-label={`${index + 1}. ${item.title}${status === 'done' ? ' (done)' : ''}`}
                title={item.title}
                className={`inline-flex h-6 min-w-6 cursor-default items-center justify-center rounded-full border px-1.5 font-medium tabular-nums ${
                  status === 'current'
                    ? 'border-fg bg-fg text-panel'
                    : status === 'done'
                      ? 'border-line bg-panel-2 text-muted'
                      : 'border-line text-fg-2'
                }`}
              >
                {status === 'done' ? <CheckIcon /> : index + 1}
              </li>
            )
          })}
        </ol>
        <button
          type="button"
          onClick={() => void exitRunner()}
          disabled={exiting}
          className="ml-auto shrink-0 text-xs text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          End lesson
        </button>
      </div>
      <p className="sr-only">
        Exercise {state.exerciseIndex + 1} of {lesson.exercises.length}
      </p>
      {/* Keyed so per-exercise state (transport, timer, cursor) resets on advance. */}
      <ExercisePlayer
        key={exercise.id}
        exercise={exercise}
        isFirst={state.exerciseIndex === 0}
        intro={lesson.intro}
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
