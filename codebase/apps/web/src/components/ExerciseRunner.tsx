import { useEffect, useRef, useState } from 'react'
import type { ExerciseRun, RunOutcome } from '../appData/run'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { AREA_BADGE, AREA_LABELS } from './areaLabels'
import { ExercisePlayer } from './ExercisePlayer'
import { ExerciseThumb } from './ExerciseThumb'
import { FeelInput } from './FeelInput'
import { CheckIcon } from './icons'
import { RatingInput } from './RatingInput'
import { setPlayerPrefs } from './playerPrefs'
import { usePlayerPrefs } from './usePlayerPrefs'
import { useViewFocus } from './useViewFocus'

/**
 * One exercise, start to finish: the practice stage (ExercisePlayer), then a
 * short summary where the run can be rated. A run exists once it reaches the
 * summary having been played; every change to it (its arrival, its answer)
 * is handed to the page to save. Player preferences (click, voice, view)
 * outlive any one exercise and live here.
 */

const BUTTON_PRIMARY =
  'rounded-lg bg-cta px-3.5 py-1.5 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const BUTTON_SECONDARY =
  'rounded-lg border border-line bg-panel px-3.5 py-1.5 text-sm font-medium text-fg hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const HEADING =
  'font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
/** How long the summary takes to step aside — the `step-out` animation's own duration. */
const STEP_OUT_MS = 180

/**
 * Where this exercise sits in a practice session, and how to move on from it.
 * In a session the summary is where the exercise is answered while it is still
 * fresh; Next exercise moves on. The session sums the whole sitting up at its
 * end, where every answer can still be changed.
 */
export interface RunnerSession {
  id: string
  /** What the session is called on the stage: "Quick run", or the routine's name. */
  label: string
  /** The way out, in words: "End quick run", "End routine". */
  endLabel: string
  /** One-based. */
  step: number
  total: number
  onContinue: () => void
}

interface ExerciseRunnerProps {
  exercise: Exercise
  /** The run as it now stands — called when it reaches the summary, and again when rated. */
  onRunChange: (run: ExerciseRun) => void
  onExit: () => void
  /** Set when the exercise is one step of a practice session (a quick run). */
  session?: RunnerSession
  /** What the session's plan asked this exercise to be played at; the written tempo otherwise. */
  startTempoBpm?: number
  /** Test seam: the browser's Web Audio engine, swapped for a fake in jsdom. */
  createAudio?: () => PlayerAudio
  /** Test seam: the wall clock in ms, used when audio is unavailable. */
  now?: () => number
}

export function ExerciseRunner({ exercise, onRunChange, onExit, session, startTempoBpm, createAudio, now }: ExerciseRunnerProps) {
  const [finished, setFinished] = useState(false)
  // Null on the summary when Finish came before any Play: nothing to record or rate.
  const [run, setRun] = useState<ExerciseRun | null>(null)
  // Play again is a fresh player: the key resets transport, timer and cursor.
  const [round, setRound] = useState(0)
  // The summary on its way out, while the next exercise of the session arrives.
  const [leaving, setLeaving] = useState(false)
  const stepOut = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => void (stepOut.current && clearTimeout(stepOut.current)), [])
  // Sound and view choices are remembered across exercises and reloads, and
  // they are the app's — the account menu sets the same ones.
  const prefs = usePlayerPrefs()
  // ISSUE-002: the summary replacing the stage (and back) is a same-route view
  // swap; move focus to the incoming heading, and on mount (the page is the runner).
  const headingRef = useViewFocus<HTMLHeadingElement>(
    finished ? 'summary' : `stage-${round}`,
    { focusOnMount: true },
  )

  function finish(outcome: RunOutcome | null): void {
    const finishedRun = outcome && {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      ...outcome,
      difficulty: null,
      feel: null,
      sessionId: session?.id ?? null,
    }
    if (finishedRun) onRunChange(finishedRun)
    // A session stops on the summary only when there is something to answer and
    // somewhere to go next. Nothing played, nothing to ask; last step, and the
    // session's own closing screen is about to say all of this anyway.
    if (session && (!finishedRun || session.step >= session.total)) return session.onContinue()
    setRun(finishedRun)
    setFinished(true)
  }

  /**
   * On to the next exercise: the summary steps aside, then the session moves on.
   * Moving on normally replaces this runner, but nothing in `onContinue`'s
   * contract promises that — so the summary comes back rather than being left
   * faded out and unreachable.
   *
   * The step is the one animation in the app that plays under
   * `prefers-reduced-motion` too (owner's call): it is a 10px slide, and the
   * hand-over reads as a jump cut without it.
   */
  function continueToNext(): void {
    const onContinue = session?.onContinue
    if (!onContinue || leaving) return
    setLeaving(true)
    stepOut.current = setTimeout(() => {
      stepOut.current = null
      setLeaving(false)
      onContinue()
    }, STEP_OUT_MS)
  }

  /** Either answer, saved the moment it is given; the run already exists. */
  function answer(part: Partial<Pick<ExerciseRun, 'difficulty' | 'feel'>>): void {
    if (!run) return
    const answered = { ...run, ...part }
    setRun(answered)
    onRunChange(answered)
  }

  if (finished) {
    return (
      <section className="flex flex-1 items-start justify-center overflow-x-hidden overflow-y-auto px-2 py-8 md:items-center md:px-8">
        {/* `inert` while leaving: pointer-events alone would still leave the buttons on Tab. */}
        <div inert={leaving} className={`w-full max-w-lg ${leaving ? 'step-out' : 'step-in'}`}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-text [&>svg]:h-4 [&>svg]:w-4"
            >
              <CheckIcon />
            </span>
            <div>
              <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
                Exercise complete
              </h1>
              <p className="text-sm text-muted tabular-nums">
                {/* In a session, where it stands matters more here than the date does. */}
                {session
                  ? `${session.label} · ${session.step} of ${session.total}`
                  : new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <ul className="mt-5 rounded-2xl border border-line bg-panel p-2">
            <li className="flex items-center gap-4">
              <ExerciseThumb exercise={exercise} className="h-16 w-32 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold tracking-tight text-fg">{exercise.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
                    {AREA_LABELS[exercise.area]}
                  </span>
                  Done today
                </p>
              </div>
            </li>
          </ul>

          {run && (
            <div className="mt-3 space-y-4 rounded-2xl border border-line bg-panel p-3.5">
              <RatingInput value={run.difficulty} onChange={(difficulty) => answer({ difficulty })} />
              {/* How it went moves the schedule; how it felt never does. */}
              <div className="border-t border-line pt-3.5">
                <FeelInput value={run.feel} onChange={(feel) => answer({ feel })} />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {session ? (
              <button type="button" onClick={continueToNext} className={BUTTON_PRIMARY}>
                Next exercise
              </button>
            ) : (
              <button type="button" onClick={onExit} className={BUTTON_PRIMARY}>
                Back to exercises
              </button>
            )}
            {/* Play again only off a session: mid-session it would mint a second run
                for the same step and drop the answer just given. */}
            {!session && (
              <button
                type="button"
                onClick={() => {
                  setRound((current) => current + 1)
                  setFinished(false)
                }}
                className={BUTTON_SECONDARY}
              >
                Play again
              </button>
            )}
            {/* A session is never a trap: the way out is on the summary too. */}
            {session && (
              <button
                type="button"
                onClick={onExit}
                className="cursor-pointer text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {session.endLabel}
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    // Keyed on the round so Play again arrives the same way a new exercise does.
    // It clips because the stage slides in from 10px right of where it lands.
    <div key={round} className="step-in flex min-h-0 flex-1 flex-col overflow-hidden">
      <ExercisePlayer
        exercise={exercise}
        prefs={prefs}
        onPrefsChange={setPlayerPrefs}
        onFinish={finish}
        startTempoBpm={startTempoBpm}
        headingRef={headingRef}
        // On its own an exercise needs no way out in the header — the navigation
        // is right there; a session says where it stands and how to end it.
        headerAction={
          session && (
            <span className="flex items-baseline gap-3 text-xs text-muted">
              <span className="tabular-nums">
                {session.label} · {session.step} of {session.total}
              </span>
              <button
                type="button"
                onClick={onExit}
                className="cursor-pointer hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {session.endLabel}
              </button>
            </span>
          )
        }
        createAudio={createAudio}
        now={now}
      />
    </div>
  )
}
