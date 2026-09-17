import { useEffect, useState } from 'react'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { ExercisePlayer } from './ExercisePlayer'
import { loadPlayerPrefs, savePlayerPrefs, type PlayerPrefs } from './playerPrefs'
import { useViewFocus } from './useViewFocus'

/**
 * One exercise, start to finish: the practice stage (ExercisePlayer), then a
 * short summary. Player preferences (click, voice, view) outlive any one
 * exercise and live here.
 */

const BUTTON_PRIMARY =
  'rounded-lg bg-cta px-4 py-2 font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const BUTTON_SECONDARY =
  'rounded-lg border border-line bg-panel px-4 py-2 font-medium text-fg hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const HEADING =
  'font-display text-2xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

interface ExerciseRunnerProps {
  exercise: Exercise
  onExit: () => void
  /** Test seam: the browser's Web Audio engine, swapped for a fake in jsdom. */
  createAudio?: () => PlayerAudio
  /** Test seam: the wall clock in ms, used when audio is unavailable. */
  now?: () => number
}

export function ExerciseRunner({ exercise, onExit, createAudio, now }: ExerciseRunnerProps) {
  const [finished, setFinished] = useState(false)
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

  if (finished) {
    return (
      <section className="px-2 py-4 md:px-8 md:py-8">
        <div className="max-w-2xl">
          <h1 ref={headingRef} tabIndex={-1} className={HEADING}>
            Exercise complete
          </h1>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-panel">
            <li className="flex items-baseline justify-between gap-4 p-4">
              <span className="text-fg">{exercise.title}</span>
              <span className="shrink-0 text-sm text-muted">Done today</span>
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
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
      onFinish={() => setFinished(true)}
      headingRef={headingRef}
      headerAction={
        <button
          type="button"
          onClick={onExit}
          className="text-xs text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Back to exercises
        </button>
      }
      createAudio={createAudio}
      now={now}
    />
  )
}
