import { useEffect, useMemo, useRef, useState } from 'react'
import type { ExerciseGrade, PracticeSession } from '../appData/session'
import { createClickTrack, type ClickTrack } from '../audio/click'
import {
  beatsElapsed,
  playheadAt,
  type Exercise,
  type Lesson,
} from '../content'
import { Tab } from './Tab'
import { toSessionRecord, usePracticeRunner } from './usePracticeRunner'
import { useViewFocus } from './useViewFocus'

/**
 * The lesson player: one exercise at a time — its tab, a click at the
 * exercise tempo with a cursor moving through the tab on the same clock, a
 * timer or pass counter, and a self-grade — then the lesson summary. Session
 * flow lives in usePracticeRunner; this component only renders it.
 */

const GRADE_LABELS: Record<ExerciseGrade, string> = {
  'got-it': 'Got it',
  shaky: 'Shaky',
  missed: 'Missed',
}
const GRADE_ORDER: readonly ExerciseGrade[] = ['got-it', 'shaky', 'missed']

const BUTTON_PRIMARY =
  'rounded-lg bg-cta px-4 py-2 font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-muted'
const BUTTON_SECONDARY =
  'rounded-lg border border-line-strong bg-panel px-4 py-2 font-medium text-fg hover:border-fg hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const HEADING =
  'font-display text-2xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

interface PracticeRunnerProps {
  lesson: Lesson
  /** Session identity is owned by the page, not this component. */
  sessionId: string
  startedAt: number
  onSessionChange: (session: PracticeSession) => void | Promise<void>
  onExit: () => void
  /** Test seam: the browser's Web Audio click, swapped for a fake in jsdom. */
  createClick?: () => ClickTrack
  /** Test seam: the playhead clock, ms. Defaults to performance.now. */
  now?: () => number
}

interface ClickControl {
  start(tempoBpm: number): void
  stop(): void
}

export function PracticeRunner({
  lesson,
  sessionId,
  startedAt,
  onSessionChange,
  onExit,
  createClick = createClickTrack,
  now = () => performance.now(),
}: PracticeRunnerProps) {
  const { state, beginExercise, completeExercise, grade } = usePracticeRunner({
    lesson,
    sessionId,
    startedAt,
    onSessionChange,
  })
  const [exiting, setExiting] = useState(false)
  // The player's click preference outlives any one exercise.
  const [clickOn, setClickOn] = useState(true)
  // ISSUE-002: the summary replacing the exercises is a same-route view swap;
  // move focus to the incoming heading, and on mount (the page is the runner).
  // Advancing between exercises is handled by ExercisePanel, which focuses
  // its own heading when it mounts.
  const headingRef = useViewFocus<HTMLHeadingElement>(
    state.finished ? 'summary' : 'exercises',
    { focusOnMount: true },
  )

  // One click track for the whole lesson, created on first use (an
  // AudioContext should only be constructed from a user gesture) and released
  // when the player unmounts. The handle is stable so panels can depend on it.
  const clickRef = useRef<ClickTrack | null>(null)
  const createClickRef = useRef(createClick)
  const click = useMemo<ClickControl>(
    () => ({
      start(tempoBpm) {
        ;(clickRef.current ??= createClickRef.current()).start(tempoBpm)
      },
      stop() {
        clickRef.current?.stop()
      },
    }),
    [],
  )
  useEffect(
    () => () => {
      clickRef.current?.dispose()
      clickRef.current = null
    },
    [],
  )

  async function exitRunner(): Promise<void> {
    if (exiting) return
    setExiting(true)
    if (state.results.length > 0) {
      await onSessionChange(toSessionRecord(state, Date.now()))
    }
    onExit()
  }

  if (state.finished) {
    const gradeByExercise = new Map(
      state.results.map((result) => [result.exerciseId, result.grade]),
    )
    return (
      <section className="max-w-2xl">
        <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
          Lesson complete — {lesson.title}
        </h1>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-panel">
          {lesson.exercises.map((exercise) => {
            const exerciseGrade = gradeByExercise.get(exercise.id)
            return (
              <li
                key={exercise.id}
                className="flex items-baseline justify-between gap-4 p-4"
              >
                <span className="text-fg">{exercise.title}</span>
                <span className="shrink-0 text-sm text-muted">
                  {exerciseGrade ? GRADE_LABELS[exerciseGrade] : '—'}
                </span>
              </li>
            )
          })}
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
    <section className="max-w-2xl">
      <div className="flex items-baseline justify-between gap-4">
        <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
          {lesson.title}
        </h1>
        <button
          type="button"
          onClick={() => void exitRunner()}
          disabled={exiting}
          className="shrink-0 text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed"
        >
          End lesson
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Exercise {state.exerciseIndex + 1} of {lesson.exercises.length}
      </p>
      {/* Keyed so per-exercise state (timer, cursor) resets on advance. */}
      <ExercisePanel
        key={exercise.id}
        exercise={exercise}
        isFirst={state.exerciseIndex === 0}
        click={click}
        now={now}
        clickOn={clickOn}
        onClickOnChange={setClickOn}
        onBegin={beginExercise}
        onComplete={completeExercise}
        onGrade={grade}
      />
    </section>
  )
}

type PanelStatus = 'ready' | 'playing' | 'grading'

function ExercisePanel({
  exercise,
  isFirst,
  click,
  now,
  clickOn,
  onClickOnChange,
  onBegin,
  onComplete,
  onGrade,
}: {
  exercise: Exercise
  isFirst: boolean
  click: ClickControl
  now: () => number
  clickOn: boolean
  onClickOnChange: (on: boolean) => void
  onBegin: () => void
  onComplete: () => void
  onGrade: (grade: ExerciseGrade) => void
}) {
  const [status, setStatus] = useState<PanelStatus>('ready')
  const [clickError, setClickError] = useState<string | null>(null)
  // The cursor: which note is sounding and how many passes are complete.
  const [playhead, setPlayhead] = useState<{ noteIndex: number; pass: number } | null>(null)
  const playStartedAtRef = useRef<number | null>(null)
  // Grading entered by the player's own action (Next, last rep) moves focus
  // to the grades; a timer expiry only announces, so focus is not stolen.
  const [focusGrades, setFocusGrades] = useState(false)
  const firstGradeRef = useRef<HTMLButtonElement>(null)
  // ISSUE-002: advancing remounts this panel; its heading is the new view.
  // The first panel defers to the lesson heading the runner focuses on mount.
  const exerciseHeadingRef = useViewFocus<HTMLHeadingElement>(exercise.id, {
    focusOnMount: !isFirst,
  })


  // Silence the click whenever this exercise leaves the screen.
  useEffect(() => () => click.stop(), [click])

  // The cursor follows the wall clock from the moment Play was pressed — the
  // same instant the click started — and only re-renders when the note
  // changes. Reaching the pass count for a repetitions exercise ends it.
  const passTarget =
    exercise.duration.kind === 'repetitions' ? exercise.duration.count : null
  useEffect(() => {
    if (status !== 'playing') return
    let frame = 0
    const tick = () => {
      const startedAt = playStartedAtRef.current
      if (startedAt !== null) {
        const beats = beatsElapsed((now() - startedAt) / 1000, exercise.tempoBpm)
        const next = playheadAt(exercise.notes, beats)
        setPlayhead((current) =>
          current?.noteIndex === next?.noteIndex && current?.pass === next?.pass
            ? current
            : next,
        )
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [status, exercise, now])
  const passesDone = playhead?.pass ?? 0
  const passesComplete = passTarget !== null && passesDone >= passTarget
  useEffect(() => {
    if (passesComplete) completeRef.current(false)
  }, [passesComplete])

  useEffect(() => {
    if (status === 'grading' && focusGrades) firstGradeRef.current?.focus()
  }, [status, focusGrades])

  function startClick(): void {
    try {
      click.start(exercise.tempoBpm)
      setClickError(null)
    } catch {
      setClickError('The click is unavailable in this browser.')
    }
  }

  function begin(): void {
    onBegin()
    playStartedAtRef.current = now()
    setPlayhead(playheadAt(exercise.notes, 0))
    setStatus('playing')
    if (clickOn) startClick()
  }

  function complete(byPlayer: boolean): void {
    if (status !== 'playing') return
    click.stop()
    onComplete()
    setFocusGrades(byPlayer)
    setStatus('grading')
  }
  const completeRef = useRef(complete)
  completeRef.current = complete

  function toggleClick(): void {
    const next = !clickOn
    onClickOnChange(next)
    if (status !== 'playing') return
    if (next) startClick()
    else click.stop()
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          ref={exerciseHeadingRef}
          tabIndex={-1}
          className="font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {exercise.title}
        </h2>
        <span className="shrink-0 text-sm text-muted">{exercise.tempoBpm} BPM</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {exercise.duration.kind === 'minutes' ? (
          <Countdown
            initialSeconds={exercise.duration.minutes * 60}
            active={status === 'playing'}
            onExpire={() => complete(false)}
          />
        ) : (
          <span aria-live="polite">
            {passesDone} of {exercise.duration.count} passes
          </span>
        )}
      </p>
      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-panel-2 p-3">
        <Tab
          notes={exercise.notes}
          currentIndex={status === 'playing' ? (playhead?.noteIndex ?? null) : null}
          aria-label={`${exercise.title} tab, ${exercise.notes.length} notes${
            status === 'playing' && playhead ? `, on note ${playhead.noteIndex + 1}` : ''
          }`}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {status === 'ready' && (
          <button
            type="button"
            onClick={begin}
            aria-label={`Play ${exercise.title}`}
            className={BUTTON_PRIMARY}
          >
            Play
          </button>
        )}
        {status === 'playing' && (
          <button
            type="button"
            onClick={() => complete(true)}
            aria-label={`Next: finish ${exercise.title}`}
            className={BUTTON_PRIMARY}
          >
            Next
          </button>
        )}
        {status !== 'grading' && (
          <label className="flex items-center gap-2 text-sm text-fg-2">
            <input
              type="checkbox"
              checked={clickOn}
              onChange={toggleClick}
              className="h-4 w-4 accent-cta"
            />
            Click
          </label>
        )}
      </div>
      {clickError && (
        <p role="alert" className="mt-2 text-sm text-danger-text">
          {clickError}
        </p>
      )}
      {status === 'grading' && (
        <div
          role="group"
          aria-label={`Grade ${exercise.title}`}
          className="mt-4"
        >
          <p className="text-sm text-muted">How did it go?</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {GRADE_ORDER.map((gradeValue, index) => (
              <button
                key={gradeValue}
                ref={index === 0 ? firstGradeRef : undefined}
                type="button"
                onClick={() => onGrade(gradeValue)}
                className={BUTTON_SECONDARY}
              >
                {GRADE_LABELS[gradeValue]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Counts wall-clock time from the moment it becomes active — a deadline, not
 * interval ticks, so a throttled background tab cannot stretch the exercise.
 */
function Countdown({
  initialSeconds,
  active,
  onExpire,
}: {
  initialSeconds: number
  active: boolean
  onExpire: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const expired = secondsLeft === 0
  // Fixed the first time the countdown becomes active; ticks never re-anchor it.
  const deadlineRef = useRef<number | null>(null)
  const expireFiredRef = useRef(false)
  useEffect(() => {
    if (!active || expired) return
    const deadline = (deadlineRef.current ??= Date.now() + initialSeconds * 1000)
    const tick = () =>
      setSecondsLeft(Math.max(Math.ceil((deadline - Date.now()) / 1000), 0))
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [active, expired, initialSeconds])
  useEffect(() => {
    if (!expired || expireFiredRef.current) return
    expireFiredRef.current = true
    onExpire()
  }, [expired, onExpire])
  return (
    <>
      <span className="sr-only">Time remaining </span>
      <span>{expired ? '' : formatSeconds(secondsLeft)}</span>
      {/* Persistent live region so expiry is announced, without chatty ticks. */}
      <span aria-live="polite">{expired ? 'Time — grade yourself' : ''}</span>
    </>
  )
}
