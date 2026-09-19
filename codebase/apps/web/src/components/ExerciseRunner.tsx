import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ExerciseRun, RunOutcome } from '../appData/run'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { AREA_BADGE, AREA_LABELS } from './areaLabels'
import { ExercisePlayer } from './ExercisePlayer'
import { ExerciseThumb } from './ExerciseThumb'
import { FeelInput } from './FeelInput'
import { CheckIcon, MinusIcon, NextIcon, SignOutIcon } from './icons'
import { RatingInput } from './RatingInput'
import { RunClock } from './RunClock'
import { VoiceAnswer, type VoiceAnswerProps } from './VoiceAnswer'
import { setPlayerPrefs } from './playerPrefs'
import { usePlayerPrefs } from './usePlayerPrefs'
import { Modal } from './ui/Modal'
import { useViewFocus } from './useViewFocus'

/**
 * One exercise of a practice session, start to finish: the stage
 * (ExercisePlayer), then a summary over it where the run is answered. A run
 * exists once it reaches the summary having been played; every change to it
 * (its arrival, its answer) is handed to the page to save.
 *
 * There is no such thing as an exercise played outside a session — starting
 * one from the library makes a session of it alone — so this component always
 * has a session to report to.
 */

// Every way on from the summary wears its icon in front of the words.
const BUTTON_BASE =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&>svg]:h-3.5 [&>svg]:w-3.5'
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-cta text-cta-fg hover:bg-cta-hover`
const BUTTON_QUIET = `${BUTTON_BASE} text-muted hover:text-fg`
const HEADING =
  'font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
/** How long the summary takes to step aside — the `step-out` animation's own duration. */
const STEP_OUT_MS = 180
/**
 * How long both answers stay on screen before the session moves itself on. Long
 * enough to read the second press as landing, short enough not to be a wait —
 * and cancelled the moment an answer is taken back.
 */
const ANSWERED_PAUSE_MS = 900

/**
 * What a sitting is called on the stage, and the way out of it in words.
 * Every sitting is the session the app worked out — there is no second kind
 * to name since routines were dropped (ADR-021).
 */
const SESSION_LABEL = 'Next session'
const SESSION_EXIT = 'End session'

/**
 * Where this exercise sits in its session, and how to move on from it. The
 * summary is where the exercise is answered while it is still fresh; the
 * session sums the whole sitting up at its end, where every answer can still
 * be changed.
 */
export interface RunnerSession {
  id: string
  /** When the whole run began, in epoch milliseconds — what the run clock counts from. */
  startedAt: number
  /** What the run was planned to take; null when nothing planned it. */
  plannedSeconds: number | null
  /** One-based. */
  step: number
  total: number
  onContinue: () => void
  /**
   * What closes the whole sitting, when this exercise's summary is also its
   * end — a session of one, where a second dialog saying the same thing would
   * only be in the way. Set, this replaces the way on.
   */
  outro?: ReactNode
}

interface ExerciseRunnerProps {
  exercise: Exercise
  /** The run as it now stands — called when it reaches the summary, and again when rated. */
  onRunChange: (run: ExerciseRun) => void
  onExit: () => void
  /** Which step of which session this is; every exercise is played inside one. */
  session: RunnerSession
  /** What the session's plan asked this exercise to be played at; the written tempo otherwise. */
  startTempoBpm?: number
  /** Test seam: the browser's Web Audio engine, swapped for a fake in jsdom. */
  createAudio?: () => PlayerAudio
  /** Test seam: the wall clock in ms, used when audio is unavailable. */
  now?: () => number
  /** Test seam: the on-device speech recogniser behind the summary's mic. */
  createVoiceEngine?: VoiceAnswerProps['createEngine']
}

export function ExerciseRunner({ exercise, onRunChange, onExit, session, startTempoBpm, createAudio, now, createVoiceEngine }: ExerciseRunnerProps) {
  const [finished, setFinished] = useState(false)
  // Null on the summary when Finish came before any Play: nothing to record or rate.
  const [run, setRun] = useState<ExerciseRun | null>(null)
  // The summary on its way out, while the next exercise of the session arrives.
  const [leaving, setLeaving] = useState(false)
  const stepOut = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Both answers in: the beat before the session moves itself on.
  const answeredPause = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (stepOut.current) clearTimeout(stepOut.current)
      if (answeredPause.current) clearTimeout(answeredPause.current)
    },
    [],
  )
  // Sound and view choices are remembered across exercises and reloads, and
  // they are the app's — the account menu sets the same ones.
  const prefs = usePlayerPrefs()
  // ISSUE-002: the session swaps one stage for the next without navigating, so
  // focus goes to the incoming heading on mount — the runner is the page. The
  // summary is a dialog over it and takes the keyboard itself.
  const headingRef = useViewFocus<HTMLHeadingElement>('stage', { focusOnMount: true })

  function finish(outcome: RunOutcome | null): void {
    const finishedRun = outcome && {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      ...outcome,
      difficulty: null,
      feel: null,
      sessionId: session.id,
    }
    if (finishedRun) onRunChange(finishedRun)
    // Every exercise ends on its own summary, played or not: an exercise that
    // was skipped says so and offers nothing to answer.
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
    if (leaving) return
    if (answeredPause.current) clearTimeout(answeredPause.current)
    answeredPause.current = null
    const { onContinue } = session
    setLeaving(true)
    stepOut.current = setTimeout(() => {
      stepOut.current = null
      setLeaving(false)
      setFinished(false)
      onContinue()
    }, STEP_OUT_MS)
  }

  /**
   * Either answer, saved the moment it is given; the run already exists. Both
   * answers given is the whole ask, so the session moves itself on — after a
   * beat, and only while both still stand.
   */
  function answer(part: Partial<Pick<ExerciseRun, 'difficulty' | 'feel'>>): void {
    if (!run) return
    const answered = { ...run, ...part }
    setRun(answered)
    onRunChange(answered)
    if (answeredPause.current) clearTimeout(answeredPause.current)
    answeredPause.current = null
    // A session of one ends here rather than moving on, so it waits for a press.
    if (session.outro || !answered.difficulty || !answered.feel) return
    answeredPause.current = setTimeout(continueToNext, ANSWERED_PAUSE_MS)
  }

  // The last exercise hands over to the session's closing screen rather than
  // to another stage, and says so.
  const lastStep = session.step >= session.total

  return (
    <>
      {/* It clips because the stage slides in from 10px right of where it lands. */}
      <div className="step-in flex min-h-0 flex-1 flex-col overflow-hidden">
        <ExercisePlayer
          exercise={exercise}
          prefs={prefs}
          onPrefsChange={setPlayerPrefs}
          onFinish={finish}
          startTempoBpm={startTempoBpm}
          headingRef={headingRef}
          // The stage says where in the session it stands, and how to leave it.
          headerAction={
            <span className="flex items-baseline gap-3 text-xs text-muted">
              <span className="tabular-nums">
                {SESSION_LABEL} · {session.step} of {session.total}
              </span>
              {/* The whole run's clock, ticking in its own component. */}
              <RunClock startedAt={session.startedAt} plannedSeconds={session.plannedSeconds} />
              <button
                type="button"
                onClick={onExit}
                data-tip="Leave the session here"
                className="cursor-pointer hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {SESSION_EXIT}
              </button>
            </span>
          }
          createAudio={createAudio}
          now={now}
        />
      </div>

      {/* The exercise is over, but the stage stays where it was: the summary is
          a dialog over it, not another screen to be sent to. */}
      {finished && (
        <Modal
          title="Exercise complete"
          header={false}
          fit="content"
          onClose={continueToNext}
          className={`max-w-lg ${leaving ? 'step-out' : ''}`}
        >
          <div className="flex flex-col items-center text-center">
            <span aria-hidden="true" className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center">
              {/* One ring out from under the tick as it lands, then gone. */}
              {run && <span className="ring-out absolute inset-0 rounded-full bg-success-soft" />}
              <span
                className={`land-in relative inline-flex h-14 w-14 items-center justify-center rounded-full [&>svg]:h-6 [&>svg]:w-6 ${
                  run ? 'bg-success-soft text-success-text' : 'bg-panel-2 text-muted'
                }`}
              >
                {run ? <CheckIcon /> : <MinusIcon />}
              </span>
            </span>
            <h2 className={`rise-in [animation-delay:90ms] mt-3.5 ${HEADING}`}>
              {run ? 'Exercise complete' : 'Exercise skipped'}
            </h2>
            <p className="rise-in [animation-delay:140ms] mt-1 text-sm text-muted tabular-nums">
              {SESSION_LABEL} · {session.step} of {session.total}
            </p>
          </div>

          <ul className="rise-in [animation-delay:190ms] mt-6 rounded-2xl border border-line bg-panel-2/60 p-2">
            <li className="flex items-center gap-4">
              <ExerciseThumb exercise={exercise} className="h-16 w-32 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold tracking-tight text-fg">{exercise.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
                    {AREA_LABELS[exercise.area]}
                  </span>
                  {run ? 'Done today' : 'Not played'}
                </p>
              </div>
            </li>
          </ul>

          {run && (
            <div className="rise-in [animation-delay:250ms] mt-3 space-y-4 rounded-2xl border border-line bg-panel-2/60 p-3.5">
              <RatingInput value={run.difficulty} onChange={(difficulty) => answer({ difficulty })} />
              {/* How it went moves the schedule; how it felt never does. */}
              <div className="border-t border-line pt-3.5">
                <FeelInput value={run.feel} onChange={(feel) => answer({ feel })} />
              </div>
              {/* Both questions at once, hands still on the guitar. */}
              <div className="border-t border-line pt-3.5">
                <VoiceAnswer onAnswer={answer} createEngine={createVoiceEngine} />
              </div>
            </div>
          )}

          {session.outro ? (
            <div className="rise-in [animation-delay:310ms]">{session.outro}</div>
          ) : (
            <div className="rise-in [animation-delay:310ms] mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={continueToNext}
                disabled={leaving}
                data-tip={lastStep ? 'See how the whole sitting went' : 'On to the next exercise of the session'}
                className={BUTTON_PRIMARY}
              >
                {lastStep ? <CheckIcon /> : <NextIcon />}
                {lastStep ? 'Finish session' : 'Next exercise'}
              </button>
              {/* A session is never a trap: the way out is on the summary too. */}
              <button
                type="button"
                onClick={onExit}
                disabled={leaving}
                data-tip="Leave the session here"
                className={BUTTON_QUIET}
              >
                <SignOutIcon />
                {SESSION_EXIT}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
