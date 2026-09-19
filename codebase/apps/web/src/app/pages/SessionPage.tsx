import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { parseSessionSearch, sessionSearch } from '../../appData/quickRun'
import type { Difficulty, ExerciseRun, Feel } from '../../appData/run'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseRunner } from '../../components/ExerciseRunner'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { FeelInput } from '../../components/FeelInput'
import { RatingInput } from '../../components/RatingInput'
import { SessionNoteInput } from '../../components/SessionNoteInput'
import { CheckIcon, ResetIcon, ShuffleIcon } from '../../components/icons'
import { useViewFocus } from '../../components/useViewFocus'
import type { Exercise } from '../../content'
import { isLibraryExerciseId, useExerciseCatalog } from '../useExerciseCatalog'
import { useNextSession } from '../useNextSession'
import { useRoutines } from '../useRoutines'
import { useGoBack } from '../useGoBack'
import { STAGE_FRAME, UnsavedRunAlert, useNoteSaver, useRunSaver } from '../useRunSaver'
import NotFoundPage from './NotFoundPage'

// The same iconed buttons the exercise summary closes with.
const BUTTON_BASE =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&>svg]:h-3.5 [&>svg]:w-3.5'
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-cta text-cta-fg hover:bg-cta-hover`
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-line bg-panel text-fg hover:border-line-strong`

/**
 * A practice session — the scheduler's next session, or a practice routine:
 * the exercises named in the URL, each at the tempo the URL asked for, played
 * straight through, then summed up — and answered — on one closing screen.
 */
export default function SessionPage() {
  // Loose search so the page also renders inside Storybook's ad hoc router.
  const { x, r } = useSearch({ strict: false }) as { x?: string; r?: string }
  const planned = parseSessionSearch(x)
  const { byId, libraryPending } = useExerciseCatalog()
  // A plan that includes the user's own exercises waits for the library, rather than starting short and restarting.
  if (libraryPending && planned.some((item) => isLibraryExerciseId(item.exerciseId)))
    return <p className="p-6 text-sm text-muted" role="status">Loading your exercises…</p>
  const steps = planned.flatMap((item) => {
    const exercise = byId.get(item.exerciseId)
    // A tempo the URL did not name, or one for an exercise since deleted, falls back to what is written.
    return exercise ? [{ exercise, tempoBpm: item.tempoBpm ?? exercise.tempoBpm }] : []
  })

  if (steps.length === 0) return <NotFoundPage />

  // Keyed on the plan so another session starts afresh.
  return <SessionStage key={steps.map((step) => `${step.exercise.id}@${step.tempoBpm}`).join()} steps={steps} routineId={r ?? null} />
}

/** One exercise of the session, at the tempo the plan asked for. */
interface SessionStep {
  exercise: Exercise
  tempoBpm: number
}

function SessionStage({ steps, routineId }: { steps: SessionStep[]; routineId: string | null }) {
  const navigate = useNavigate()
  const goBack = useGoBack()
  const { routines } = useRoutines()
  const { plan } = useNextSession()
  // The routine's name arrives with the routines; until then (or if it is gone) the session is simply a routine.
  const routineName = routineId === null ? null : (routines.find((routine) => routine.id === routineId)?.name ?? 'Routine')
  const label = routineName ?? 'Next session'
  const { save, unsaved } = useRunSaver()
  const { save: saveNote, failed: noteFailed } = useNoteSaver()
  const [note, setNote] = useState('')
  // The session's identity is minted once, when it mounts — not in render.
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const [index, setIndex] = useState(0)
  // The latest run of each step, for the closing summary; a step ended without playing has none.
  const [runs, setRuns] = useState<ReadonlyMap<number, ExerciseRun>>(new Map())
  function record(step: number, run: ExerciseRun): void {
    save(run)
    setRuns((current) => new Map(current).set(step, run))
  }
  function restart(): void {
    setSessionId(crypto.randomUUID())
    setRuns(new Map())
    setNote('')
    setIndex(0)
  }
  const done = index >= steps.length
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
                  {label} complete
                </h1>
                <p className="text-sm text-muted">
                  {runs.size} of {steps.length} played ·{' '}
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <ol className="mt-5 space-y-2.5">
              {steps.map(({ exercise }, step) => {
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
                      <div className="mt-3 space-y-4 border-t border-line px-1.5 pt-3 pb-1">
                        <RatingInput
                          value={run.difficulty}
                          subject={exercise.title}
                          onChange={(difficulty: Difficulty | null) => record(step, { ...run, difficulty })}
                        />
                        {/* How it went moves the schedule; how it felt never does. */}
                        <FeelInput
                          value={run.feel}
                          subject={exercise.title}
                          onChange={(feel: Feel | null) => record(step, { ...run, feel })}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>

            {/* One note for the whole sitting, once there is a sitting to note. */}
            {runs.size > 0 && (
              <div className="mt-5 rounded-2xl border border-line bg-panel p-3.5">
                <SessionNoteInput
                  value={note}
                  onChange={setNote}
                  onCommit={() => saveNote(sessionId, note)}
                  failed={noteFailed}
                />
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" onClick={goBack} data-tip="Back to where you came from" className={BUTTON_PRIMARY}>
                <CheckIcon />
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  // After a routine: the same routine again, from the top. Otherwise: whatever the scheduler says now.
                  if (routineId !== null) return restart()
                  void navigate({ to: '/session', search: sessionSearch(plan) })
                }}
                data-tip={routineId !== null ? 'Play this routine again, from the top' : 'Plan another session from where you are now'}
                className={BUTTON_SECONDARY}
              >
                {routineId !== null ? <ResetIcon /> : <ShuffleIcon />}
                {routineId !== null ? 'Play it again' : 'What now?'}
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
        exercise={steps[index].exercise}
        startTempoBpm={steps[index].tempoBpm}
        session={{
          id: sessionId,
          label,
          endLabel: routineId !== null ? 'End routine' : 'End session',
          step: index + 1,
          total: steps.length,
          onContinue: () => setIndex((current) => current + 1),
        }}
        onRunChange={(run) => record(index, run)}
        onExit={goBack}
      />
    </div>
  )
}
