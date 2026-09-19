import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { formatDuration } from '../../appData/dashboard'
import { groupRunsByDay } from '../../appData/history'
import type { SessionNote } from '../../appData/note'
import { practiceRuns, runDifficulty, runFeel, type PracticeRun } from '../../appData/practiceRun'
import { DIFFICULTY_LABELS, FEEL_LABELS, type ExerciseRun } from '../../appData/run'
import { DIFFICULTY_BADGE, FEEL_BADGE } from '../../components/answerBadges'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { ChevronDownIcon, ChevronRightIcon, RepeatIcon } from '../../components/icons'
import { formatSeconds } from '../../player/formatting'
import { useTRPC } from '../trpc'
import type { Exercise } from '../../content'
import { SourceTag } from '../../components/SourceTag'
import { useExerciseCatalog } from '../useExerciseCatalog'
import { PAGE_WIDE } from '../../components/pageFrame'

const LINK =
  'rounded-lg bg-cta px-2.5 py-1 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const CHIP = 'rounded-full px-2 py-0.5 text-[11px] font-medium'

/**
 * Every practice run, newest first, a day at a time. The list is sittings —
 * what the user actually did on a given evening — and each one opens onto the
 * exercises it was made of. The exercise runs are the detail, not the index.
 */
export default function HistoryPage() {
  const trpc = useTRPC()
  const { data, isPending, isError } = useQuery(trpc.runs.list.queryOptions())
  // A note belongs to a whole sitting, so it reads as part of the run's row.
  const { data: noteData } = useQuery(trpc.notes.list.queryOptions())

  return (
    <div className={PAGE_WIDE}>
      <h1 className="font-display text-2xl font-bold tracking-tight">History</h1>
      <p className="mt-1 text-sm text-fg-2">Every practice run: when you played, what was in it, and how it went.</p>
      <HistoryBody
        runs={data?.status === 'ok' ? data.runs : null}
        notes={noteData?.status === 'ok' ? noteData.notes : []}
        loading={isPending}
        failed={isError || (data !== undefined && data.status !== 'ok')}
      />
    </div>
  )
}

function HistoryBody({
  runs,
  notes,
  loading,
  failed,
}: {
  runs: ExerciseRun[] | null
  notes: SessionNote[]
  loading: boolean
  failed: boolean
}) {
  // One catalog for the whole list, not one per row.
  const { byId } = useExerciseCatalog()
  if (loading) {
    return <p className="mt-8 text-sm text-muted">Loading your runs…</p>
  }
  if (failed || !runs) {
    return (
      <p role="alert" className="mt-8 text-sm text-danger-text">
        Your history could not be loaded. Try again in a moment.
      </p>
    )
  }
  if (runs.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line-strong p-8 text-center">
        <p className="font-medium text-fg">Nothing played yet</p>
        <p className="mt-1 text-sm text-muted">Finish a practice run and it shows up here.</p>
        <Link to="/exercises" className={`mt-4 inline-block ${LINK}`}>
          Pick an exercise
        </Link>
      </div>
    )
  }

  const sittings = practiceRuns(runs)
  const days = groupRunsByDay(sittings)
  const totalSeconds = sittings.reduce((sum, sitting) => sum + sitting.seconds, 0)
  const noteFor = new Map(notes.map((note) => [note.sessionId, note.text]))
  return (
    <>
      <dl className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Practice runs" value={String(sittings.length)} />
        <Stat label="Time played" value={formatDuration(totalSeconds)} />
        <Stat label="Days" value={String(days.length)} />
      </dl>
      {days.map((day) => (
        <section key={day.day} className="mt-6" aria-labelledby={`day-${day.day}`}>
          <h2 id={`day-${day.day}`} className="text-sm font-medium text-muted">
            {day.label}
          </h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-panel">
            {day.runs.map((sitting) => (
              <PracticeRunRow key={sitting.id} run={sitting} byId={byId} note={noteFor.get(sitting.id) ?? null} />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-3.5 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-bold tracking-tight tabular-nums">{value}</dd>
    </div>
  )
}

/** One sitting: what it was, in a line — and, on a press, the exercises it held. */
function PracticeRunRow({
  run,
  byId,
  note,
}: {
  run: PracticeRun
  byId: ReadonlyMap<string, Exercise>
  note: string | null
}) {
  const [open, setOpen] = useState(false)
  const time = new Date(run.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const count = run.runs.length
  const difficulty = runDifficulty(run)
  const feel = runFeel(run)
  const unfinished = count - run.completed
  const title = `${count} ${count === 1 ? 'exercise' : 'exercises'}`

  return (
    <li className="px-3 py-2.5">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <span aria-hidden="true" className="shrink-0 text-muted [&>svg]:h-3.5 [&>svg]:w-3.5">
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-fg">
                {time} · {title}
              </span>
              {difficulty && (
                <span className={`${CHIP} ${DIFFICULTY_BADGE[difficulty]}`}>
                  <span className="sr-only">How it went: </span>
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
              )}
              {feel && (
                <span className={`${CHIP} ${FEEL_BADGE[feel]}`}>
                  <span className="sr-only">How it felt: </span>
                  {FEEL_LABELS[feel]}
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-[13px] text-muted tabular-nums">
              {formatSeconds(run.seconds)} played
              {unfinished > 0 && ` · ${unfinished} ended early`}
            </span>
          </span>
        </button>
        <Link
          to="/session"
          search={{ x: run.runs.map((exercise) => exercise.exerciseId).join(',') }}
          aria-label={`Play this run again: ${title}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-sm font-medium text-fg hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <RepeatIcon />
          <span className="hidden sm:inline">Play again</span>
        </Link>
      </div>
      {note && <p className="mt-1.5 ml-7 text-[13px] text-fg-2 italic">“{note}”</p>}
      {open && (
        <ul className="mt-2.5 ml-7 space-y-2">
          {run.runs.map((exercise) => (
            <ExerciseRunRow key={exercise.id} run={exercise} exercise={byId.get(exercise.exerciseId)} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** One exercise inside a practice run: the detail the list used to be. */
function ExerciseRunRow({ run, exercise }: { run: ExerciseRun; exercise: Exercise | undefined }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-panel-2/60 p-2">
      {exercise && <ExerciseThumb exercise={exercise} className="hidden h-10 w-20 shrink-0 sm:block" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-medium text-fg">{exercise?.title ?? 'An exercise that is no longer here'}</h3>
          {exercise && (
            <span className={`${CHIP} ${AREA_BADGE[exercise.area]}`}>{AREA_LABELS[exercise.area]}</span>
          )}
          {exercise && <SourceTag exerciseId={exercise.id} only="yours" />}
        </div>
        <p className="mt-0.5 text-[13px] text-muted tabular-nums">
          {formatSeconds(run.durationSeconds)} played · {run.tempoBpm} BPM · {run.passes}{' '}
          {run.passes === 1 ? 'pass' : 'passes'}
          {!run.completed && ' · ended early'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {run.difficulty === null ? (
          <span className="text-xs text-muted">Not answered</span>
        ) : (
          <span className="inline-flex items-baseline rounded-lg bg-panel px-2 py-1">
            <span className="font-display text-sm leading-none font-bold text-fg">{DIFFICULTY_LABELS[run.difficulty]}</span>
          </span>
        )}
      </div>
      {exercise && (
        <Link
          to="/session"
          search={{ x: exercise.id }}
          aria-label={`Play ${exercise.title} again`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-sm font-medium text-fg hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <RepeatIcon />
          <span className="sr-only">Play again</span>
        </Link>
      )}
    </li>
  )
}
