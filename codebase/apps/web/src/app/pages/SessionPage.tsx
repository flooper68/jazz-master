import { useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { parseSessionSearch } from '../../appData/quickRun'
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_MEANINGS,
  FEEL_LABELS,
  FEEL_MEANINGS,
  type ExerciseRun,
} from '../../appData/run'
import { DIFFICULTY_BADGE, FEEL_BADGE } from '../../components/answerBadges'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseRunner } from '../../components/ExerciseRunner'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { SessionNoteInput } from '../../components/SessionNoteInput'
import { Modal } from '../../components/ui/Modal'
import { CheckIcon, ResetIcon } from '../../components/icons'
import { formatSeconds } from '../../player/formatting'
import type { Exercise } from '../../content'
import { isLibraryExerciseId, useExerciseCatalog } from '../useExerciseCatalog'
import { useGoBack } from '../useGoBack'
import { STAGE_FRAME, UnsavedRunAlert, useNoteSaver, useRunSaver } from '../useRunSaver'
import NotFoundPage from './NotFoundPage'

// The same iconed buttons the exercise summary closes with.
const BUTTON_BASE =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&>svg]:h-3.5 [&>svg]:w-3.5'
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-cta text-cta-fg hover:bg-cta-hover`
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-line bg-panel text-fg hover:border-line-strong`
/** An answer already given, read back on the closing dialog — not a control. */
const ANSWER_CHIP = 'rounded-full px-2 py-0.5 text-[11px] font-medium'

/**
 * A practice session: the exercises named in the URL, each at the tempo the
 * URL asked for, played straight through, then summed up — and answered — on
 * one closing screen.
 */
export default function SessionPage() {
  // Loose search so the page also renders inside Storybook's ad hoc router.
  const { x, m } = useSearch({ strict: false }) as { x?: string; m?: number }
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
  return (
    <SessionStage
      key={steps.map((step) => `${step.exercise.id}@${step.tempoBpm}`).join()}
      steps={steps}
      plannedSeconds={typeof m === 'number' ? m * 60 : null}
    />
  )
}

/** One exercise of the session, at the tempo the plan asked for. */
interface SessionStep {
  exercise: Exercise
  tempoBpm: number
}

function SessionStage({ steps, plannedSeconds }: { steps: SessionStep[]; plannedSeconds: number | null }) {
  const goBack = useGoBack()
  // One kind of sitting, so one name (ADR-021).
  const label = 'Next session'
  const { save, unsaved } = useRunSaver()
  const { save: saveNote, failed: noteFailed } = useNoteSaver()
  const [note, setNote] = useState('')
  // The session's identity is minted once, when it mounts — not in render.
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  // And so is its clock: the run is as long as the user has been here.
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  // The latest run of each step, for the closing summary; a step ended without playing has none.
  const [runs, setRuns] = useState<ReadonlyMap<number, ExerciseRun>>(new Map())
  function record(step: number, run: ExerciseRun): void {
    save(run)
    setRuns((current) => new Map(current).set(step, run))
  }
  function restart(): void {
    setSessionId(crypto.randomUUID())
    setStartedAt(Date.now())
    setRuns(new Map())
    setNote('')
    setIndex(0)
  }
  const done = index >= steps.length
  // The run is over on the closing dialog, so what it shows is a total, not a
  // clock: a second ticker over a finished sitting would still be counting
  // when the dialog is left open over lunch.
  const ranFor = done ? Math.max(Math.floor((Date.now() - startedAt) / 1000), 0) : 0

  /**
   * What closes the sitting: a sentence about it, and the ways on. It lives on
   * the closing dialog — or, for a session of one, on that exercise's own
   * summary, because two dialogs saying the same thing is one too many.
   */
  const outro = (
    <>
        {/* One note for the whole sitting, once there is a sitting to note. */}
        {runs.size > 0 && (
          <div className="rise-in [animation-delay:250ms] mt-3 rounded-2xl border border-line bg-panel-2/60 p-3.5">
            <SessionNoteInput
              value={note}
              onChange={setNote}
              onCommit={() => saveNote(sessionId, note)}
              failed={noteFailed}
            />
          </div>
        )}

        <div className="rise-in [animation-delay:310ms] mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" onClick={goBack} data-tip="Back to where you came from" className={BUTTON_PRIMARY}>
            <CheckIcon />
            Done
          </button>
          {/* The same plan from the top. Playing one exercise is a session of
              one, so this is also how a single exercise is played twice. */}
          <button
            type="button"
            onClick={restart}
            data-tip="Play the same again, from the top"
            className={BUTTON_SECONDARY}
          >
            <ResetIcon />
            Play it again
          </button>
        </div>
    </>
  )

  // The sitting closes on a dialog over the stage it was played on, the same way
  // each exercise did — never a screen of its own.
  const alone = steps.length === 1
  const stepIndex = Math.min(index, steps.length - 1)
  const step = steps[stepIndex]

  return (
    <div className={STAGE_FRAME}>
      <UnsavedRunAlert unsaved={unsaved} onRetry={save} />
      {/* Keyed on the step so each exercise gets a fresh runner; once the session
          is done the last stage simply stays put behind the closing dialog. */}
      <ExerciseRunner
        key={`${sessionId}:${stepIndex}`}
        exercise={step.exercise}
        startTempoBpm={step.tempoBpm}
        session={{
          id: sessionId,
          startedAt,
          plannedSeconds,
          step: stepIndex + 1,
          total: steps.length,
          onContinue: () => setIndex((current) => current + 1),
          // One exercise is one dialog: its summary is also the sitting's end.
          outro: alone ? outro : undefined,
        }}
        onRunChange={(run) => record(stepIndex, run)}
        onExit={goBack}
      />
      {done && !alone && (
        <Modal title={`${label} complete`} header={false} fit="content" className="max-w-xl" onClose={goBack}>
          <div className="flex flex-col items-center text-center">
            <span aria-hidden="true" className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center">
              <span className="ring-out absolute inset-0 rounded-full bg-success-soft" />
              <span className="land-in relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-text [&>svg]:h-6 [&>svg]:w-6">
                <CheckIcon />
              </span>
            </span>
            <h2 className="rise-in [animation-delay:90ms] mt-3.5 font-display text-xl font-bold tracking-tight">
              {label} complete
            </h2>
            <p className="rise-in [animation-delay:140ms] mt-1 text-sm text-muted">
              {runs.size} of {steps.length} played · <span className="tabular-nums">{formatSeconds(ranFor)}</span>
            </p>
          </div>

          <ol className="rise-in [animation-delay:190ms] mt-6 space-y-2.5">
            {steps.map(({ exercise }, step) => {
              const run = runs.get(step)
              return (
                <li key={exercise.id} className="rounded-2xl border border-line bg-panel-2/60 p-2">
                  <div className="flex items-center gap-4">
                    <ExerciseThumb exercise={exercise} className="h-14 w-28 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold tracking-tight text-fg">{exercise.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
                          {AREA_LABELS[exercise.area]}
                        </span>
                        {run ? 'Done' : 'Skipped'}
                        {/* Answered on the way past, so here it is only read back. */}
                        {run?.difficulty && (
                          <span
                            className={`${ANSWER_CHIP} ${DIFFICULTY_BADGE[run.difficulty]}`}
                            data-tip={DIFFICULTY_MEANINGS[run.difficulty]}
                          >
                            <span className="sr-only">How it went: </span>
                            {DIFFICULTY_LABELS[run.difficulty]}
                          </span>
                        )}
                        {run?.feel && (
                          <span className={`${ANSWER_CHIP} ${FEEL_BADGE[run.feel]}`} data-tip={FEEL_MEANINGS[run.feel]}>
                            <span className="sr-only">How it felt: </span>
                            {FEEL_LABELS[run.feel]}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {outro}
        </Modal>
      )}
    </div>
  )
}
