import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { loadQuickRunSettings, pickQuickRun } from '../../appData/quickRun'
import type { ExerciseRun } from '../../appData/run'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseRunner } from '../../components/ExerciseRunner'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { RatingInput } from '../../components/RatingInput'
import { CheckIcon } from '../../components/icons'
import { useViewFocus } from '../../components/useViewFocus'
import { EXERCISES, type Exercise } from '../../content'
import { STAGE_FRAME, UnsavedRunAlert, useRunSaver } from '../useRunSaver'
import NotFoundPage from './NotFoundPage'

const exerciseById = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]))

const BUTTON_PRIMARY =
  'rounded-lg bg-cta px-3.5 py-1.5 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const BUTTON_SECONDARY =
  'rounded-lg border border-line bg-panel px-3.5 py-1.5 text-sm font-medium text-fg hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

/**
 * A practice session (a quick run): the exercises named in the URL, played
 * straight through, then summed up — and rated — on one closing screen.
 */
export default function SessionPage() {
  // Loose search so the page also renders inside Storybook's ad hoc router.
  const { x } = useSearch({ strict: false }) as { x?: string }
  const ids = [...new Set((x ?? '').split(',').filter(Boolean))]
  const exercises = ids.flatMap((id) => exerciseById.get(id) ?? [])

  if (exercises.length === 0) return <NotFoundPage />

  // Keyed on the draw so another quick run starts afresh.
  return <SessionStage key={exercises.map((exercise) => exercise.id).join()} exercises={exercises} />
}

function SessionStage({ exercises }: { exercises: Exercise[] }) {
  const navigate = useNavigate()
  const { save, unsaved } = useRunSaver()
  // The session's identity is minted once, when it mounts — not in render.
  const [sessionId] = useState(() => crypto.randomUUID())
  const [index, setIndex] = useState(0)
  // The latest run of each step, for the closing summary; a step ended without playing has none.
  const [runs, setRuns] = useState<ReadonlyMap<number, ExerciseRun>>(new Map())
  function record(step: number, run: ExerciseRun): void {
    save(run)
    setRuns((current) => new Map(current).set(step, run))
  }
  const done = index >= exercises.length
  const headingRef = useViewFocus<HTMLHeadingElement>(done ? 'done' : 'playing')

  if (done) {
    return (
      <div className={STAGE_FRAME}>
        <UnsavedRunAlert unsaved={unsaved} onRetry={save} />
        <section className="flex flex-1 items-start justify-center overflow-y-auto px-2 py-8 md:items-center md:px-8">
          <div className="w-full max-w-xl">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-text [&>svg]:h-4 [&>svg]:w-4"
              >
                <CheckIcon />
              </span>
              <div>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  Quick run complete
                </h1>
                <p className="text-sm text-muted">
                  {runs.size} of {exercises.length} played ·{' '}
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <ol className="mt-5 space-y-2.5">
              {exercises.map((exercise, step) => {
                const run = runs.get(step)
                return (
                  <li key={exercise.id} className="rounded-2xl border border-line bg-panel p-2">
                    <div className="flex items-center gap-4">
                      <ExerciseThumb exercise={exercise} className="h-14 w-28 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-semibold tracking-tight text-fg">{exercise.title}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
                            {AREA_LABELS[exercise.area]}
                          </span>
                          {run ? 'Done' : 'Skipped'}
                        </p>
                      </div>
                    </div>
                    {run && (
                      <div className="mt-3 border-t border-line px-1.5 pt-3 pb-1">
                        <RatingInput
                          value={run.rating}
                          subject={exercise.title}
                          onChange={(rating) => record(step, { ...run, rating })}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" onClick={() => void navigate({ to: '/exercises' })} className={BUTTON_PRIMARY}>
                Back to exercises
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = pickQuickRun(EXERCISES, loadQuickRunSettings(EXERCISES))
                  void navigate({ to: '/session', search: { x: next.map((exercise) => exercise.id).join(',') } })
                }}
                className={BUTTON_SECONDARY}
              >
                Another quick run
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={STAGE_FRAME}>
      <UnsavedRunAlert unsaved={unsaved} onRetry={save} />
      {/* Keyed on the step so each exercise gets a fresh runner. */}
      <ExerciseRunner
        key={index}
        exercise={exercises[index]}
        session={{
          id: sessionId,
          step: index + 1,
          total: exercises.length,
          onContinue: () => setIndex((current) => current + 1),
        }}
        onRunChange={(run) => record(index, run)}
        onExit={() => void navigate({ to: '/exercises' })}
      />
    </div>
  )
}
