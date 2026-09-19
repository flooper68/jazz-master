import { useEffect, useRef, useState } from 'react'
import type { ExerciseRun, RunOutcome } from '../appData/run'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { AREA_BADGE, AREA_LABELS } from './areaLabels'
import { ExercisePlayer } from './ExercisePlayer'
import { ExerciseThumb } from './ExerciseThumb'
import { FeelInput } from './FeelInput'
import { CheckIcon, NextIcon, ResetIcon, SignOutIcon } from './icons'
import { RatingInput } from './RatingInput'
import { VoiceAnswer, type VoiceAnswerProps } from './VoiceAnswer'
import { setPlayerPrefs } from './playerPrefs'
import { usePlayerPrefs } from './usePlayerPrefs'
import { Modal } from './ui/Modal'
import { useViewFocus } from './useViewFocus'

/**
 * One exercise, start to finish: the practice stage (ExercisePlayer), then a
 * short summary where the run can be rated. A run exists once it reaches the
 * summary having been played; every change to it (its arrival, its answer)
 * is handed to the page to save. Player preferences (click, voice, view)
 * outlive any one exercise and live here.
 */

// Every way on from the summary wears its icon in front of the words.
const BUTTON_BASE =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&>svg]:h-3.5 [&>svg]:w-3.5'
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-cta text-cta-fg hover:bg-cta-hover`
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-line bg-panel text-fg hover:border-line-strong`
const BUTTON_QUIET = `${BUTTON_BASE} text-muted hover:text-fg`
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
  /** Test seam: the on-device speech recogniser behind the summary's mic. */
  createVoiceEngine?: VoiceAnswerProps['createEngine']
}

export function ExerciseRunner({ exercise, onRunChange, onExit, session, startTempoBpm, createAudio, now, createVoiceEngine }: ExerciseRunnerProps) {
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
  // ISSUE-002: Play again swaps the stage for a fresh one without navigating,
  // so focus moves to the incoming heading — and on mount, since the page is
  // the runner. The summary is a dialog now and takes the keyboard itself.
  const headingRef = useViewFocus<HTMLHeadingElement>(`stage-${round}`, { focusOnMount: true })

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

  // Escape, or a press outside: the dialog's default way on, not a way to
  // dismiss it — behind it the exercise is over and there is nothing to do.
  const moveOn = session ? continueToNext : onExit

  return (
    <>
      {/* Keyed on the round so Play again arrives the same way a new exercise does.
          It clips because the stage slides in from 10px right of where it lands. */}
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
                  data-tip="Leave the session here"
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

      {/* The exercise is over, but the stage stays where it was: the summary is
          a dialog over it, not another screen to be sent to. */}
      {finished && (
        <Modal
          title="Exercise complete"
          header={false}
          fit="content"
          onClose={moveOn}
          className={`max-w-lg ${leaving ? 'step-out' : ''}`}
        >
          <div className="flex flex-col items-center text-center">
            <span aria-hidden="true" className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center">
              {/* One ring out from under the tick as it lands, then gone. */}
              <span className="ring-out absolute inset-0 rounded-full bg-success-soft" />
              <span className="land-in relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-text [&>svg]:h-6 [&>svg]:w-6">
                <CheckIcon />
              </span>
            </span>
            <h2 className={`rise-in [animation-delay:90ms] mt-3.5 ${HEADING}`}>Exercise complete</h2>
            <p className="rise-in [animation-delay:140ms] mt-1 text-sm text-muted tabular-nums">
              {/* In a session, where it stands matters more here than the date does. */}
              {session
                ? `${session.label} · ${session.step} of ${session.total}`
                : new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
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
                  Done today
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

          <div className="rise-in [animation-delay:310ms] mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {session ? (
              <button
                type="button"
                onClick={continueToNext}
                disabled={leaving}
                data-tip="On to the next exercise of the session"
                className={BUTTON_PRIMARY}
              >
                <NextIcon />
                Next exercise
              </button>
            ) : (
              <button type="button" onClick={onExit} data-tip="Back to where you came from" className={BUTTON_PRIMARY}>
                <CheckIcon />
                Done
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
                data-tip="Play this exercise again, from the top"
                className={BUTTON_SECONDARY}
              >
                <ResetIcon />
                Play again
              </button>
            )}
            {/* A session is never a trap: the way out is on the summary too. */}
            {session && (
              <button
                type="button"
                onClick={onExit}
                disabled={leaving}
                data-tip="Leave the session here"
                className={BUTTON_QUIET}
              >
                <SignOutIcon />
                {session.endLabel}
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
