import { noteName } from '@jazz-master/theory'
import { useEffect, useState } from 'react'
import { resolveExercise, type Exercise, type Lesson } from '../content'
import type { ExerciseGrade } from '../storage/sessions'
import { Fretboard, type FretboardHighlight } from './Fretboard'
import { usePracticeRunner } from './usePracticeRunner'
import { useViewFocus } from './useViewFocus'

const GRADE_LABELS: Record<ExerciseGrade, string> = {
  'got-it': 'Got it',
  shaky: 'Shaky',
  missed: 'Missed',
}

const GRADE_ORDER: readonly ExerciseGrade[] = ['got-it', 'shaky', 'missed']

interface PracticeRunnerProps {
  lesson: Lesson
  /** Session identity is owned by the Start handler, not this component. */
  sessionId: string
  startedAt: number
  onExit: () => void
}

export function PracticeRunner({
  lesson,
  sessionId,
  startedAt,
  onExit,
}: PracticeRunnerProps) {
  const { state, grade } = usePracticeRunner({ lesson, sessionId, startedAt })
  // ISSUE-002: the runner appearing (Start) and the summary replacing it (last
  // grade) are same-route view swaps; move focus to the incoming heading.
  const headingRef = useViewFocus<HTMLHeadingElement>(
    state.finished ? 'summary' : 'exercises',
    { focusOnMount: true },
  )

  if (state.finished) {
    const gradeByExercise = new Map(
      state.results.map((result) => [result.exerciseId, result.grade]),
    )
    return (
      <section className="max-w-2xl">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          Lesson complete — {lesson.title}
        </h2>
        <ul className="mt-4 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
          {lesson.exercises.map((exercise) => {
            const exerciseGrade = gradeByExercise.get(exercise.id)
            return (
              <li
                key={exercise.id}
                className="flex items-baseline justify-between gap-4 p-4"
              >
                <span className="text-zinc-100">{exercise.title}</span>
                <span className="shrink-0 text-sm text-zinc-400">
                  {exerciseGrade ? GRADE_LABELS[exerciseGrade] : '—'}
                </span>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={onExit}
          className="mt-6 rounded-md bg-amber-500 px-4 py-2 font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
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
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          {lesson.title}
        </h2>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 text-sm text-zinc-400 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          End lesson
        </button>
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        Exercise {state.exerciseIndex + 1} of {lesson.exercises.length}
      </p>
      {/* Keyed so per-exercise state (the countdown) resets on advance. */}
      <ExercisePanel key={exercise.id} exercise={exercise} />
      <div className="mt-6 flex gap-3">
        {GRADE_ORDER.map((gradeValue) => (
          <button
            key={gradeValue}
            type="button"
            onClick={() => grade(gradeValue)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            {GRADE_LABELS[gradeValue]}
          </button>
        ))}
      </div>
    </section>
  )
}

function ExercisePanel({ exercise }: { exercise: Exercise }) {
  const resolved = resolveExercise(exercise)
  const highlights: FretboardHighlight[] = resolved.positions.map(
    (position) => ({
      string: position.string,
      fret: position.fret,
      label: noteName(position.note),
      role: position.degree === 1 ? 'root' : 'other',
    }),
  )
  return (
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium text-zinc-100">{exercise.title}</h3>
        <span className="shrink-0 text-sm text-zinc-400">
          {exercise.tempoBpm} BPM
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        {exercise.duration.kind === 'minutes' ? (
          <Countdown initialSeconds={exercise.duration.minutes * 60} />
        ) : (
          `${exercise.duration.count} repetitions`
        )}
      </p>
      {exercise.display.includes('fretboard') && (
        <div className="mt-3">
          <Fretboard
            highlights={highlights}
            fretRange={exercise.window}
            aria-label={`${exercise.title} on the fretboard, frets ${exercise.window.min} to ${exercise.window.max}`}
          />
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

function Countdown({ initialSeconds }: { initialSeconds: number }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const expired = secondsLeft === 0
  useEffect(() => {
    if (expired) return
    const id = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0))
    }, 1000)
    return () => clearInterval(id)
  }, [expired])
  return (
    <>
      <span>{expired ? '' : formatSeconds(secondsLeft)}</span>
      {/* Persistent live region so expiry is announced, without chatty ticks. */}
      <span aria-live="polite">{expired ? 'Time — grade yourself' : ''}</span>
    </>
  )
}
