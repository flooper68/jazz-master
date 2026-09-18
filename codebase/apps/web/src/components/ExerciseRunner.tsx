import { useEffect, useState } from 'react'
import type { Difficulty, ExerciseRun, RunOutcome } from '../appData/run'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { AREA_BADGE, AREA_LABELS } from './areaLabels'
import { ExercisePlayer } from './ExercisePlayer'
import { ExerciseThumb } from './ExerciseThumb'
import { CheckIcon } from './icons'
import { RatingInput } from './RatingInput'
import { loadPlayerPrefs, savePlayerPrefs, type PlayerPrefs } from './playerPrefs'
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

/**
 * Where this exercise sits in a practice session, and how to move on from it.
 * In a session there is no summary per exercise: finishing moves straight on,
 * and the session sums everything up (and takes the answers) at its end.
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
  // Sound and view choices are remembered across exercises and reloads.
  const [prefs, setPrefs] = useState<PlayerPrefs>(loadPlayerPrefs)
  useEffect(() => savePlayerPrefs(prefs), [prefs])
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
      sessionId: session?.id ?? null,
    }
    if (finishedRun) onRunChange(finishedRun)
    if (session) return session.onContinue()
    setRun(finishedRun)
    setFinished(true)
  }

  function rate(difficulty: Difficulty | null): void {
    if (!run) return
    const rated = { ...run, difficulty }
    setRun(rated)
    onRunChange(rated)
  }

  if (finished) {
    return (
      <section className="flex flex-1 items-start justify-center overflow-y-auto px-2 py-8 md:items-center md:px-8">
        <div className="w-full max-w-lg">
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
              <p className="text-sm text-muted">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
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
            <div className="mt-3 rounded-2xl border border-line bg-panel p-3.5">
              <RatingInput value={run.difficulty} onChange={rate} />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button type="button" onClick={onExit} className={BUTTON_PRIMARY}>
              Back to exercises
            </button>
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
          </div>
        </div>
      </section>
    )
  }

  return (
    <ExercisePlayer
      key={round}
      exercise={exercise}
      prefs={prefs}
      onPrefsChange={setPrefs}
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
  )
}
