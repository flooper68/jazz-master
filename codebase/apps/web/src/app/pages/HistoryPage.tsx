import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { formatDuration } from '../../appData/dashboard'
import { groupRunsByDay } from '../../appData/history'
import { DIFFICULTY_LABELS, type ExerciseRun } from '../../appData/run'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { RepeatIcon } from '../../components/icons'
import { formatSeconds } from '../../player/formatting'
import { useTRPC } from '../trpc'
import type { Exercise } from '../../content'
import { SourceTag } from '../../components/SourceTag'
import { useExerciseCatalog } from '../useExerciseCatalog'
import { PAGE_WIDE } from '../../components/pageFrame'

const LINK =
  'rounded-lg bg-cta px-2.5 py-1 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

/** Every saved run, newest first, a day at a time. */
export default function HistoryPage() {
  const trpc = useTRPC()
  const { data, isPending, isError } = useQuery(trpc.runs.list.queryOptions())

  return (
    <div className={PAGE_WIDE}>
      <h1 className="font-display text-2xl font-bold tracking-tight">History</h1>
      <p className="mt-1 text-sm text-fg-2">What you played, when, and how it felt.</p>
      <HistoryBody
        runs={data?.status === 'ok' ? data.runs : null}
        loading={isPending}
        failed={isError || (data !== undefined && data.status !== 'ok')}
      />
    </div>
  )
}

function HistoryBody({ runs, loading, failed }: { runs: ExerciseRun[] | null; loading: boolean; failed: boolean }) {
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
        <p className="mt-1 text-sm text-muted">Finish an exercise and it shows up here.</p>
        <Link to="/exercises" className={`mt-4 inline-block ${LINK}`}>
          Pick an exercise
        </Link>
      </div>
    )
  }

  const days = groupRunsByDay(runs)
  const totalSeconds = runs.reduce((sum, run) => sum + run.durationSeconds, 0)
  return (
    <>
      <dl className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Runs" value={String(runs.length)} />
        <Stat label="Time played" value={formatDuration(totalSeconds)} />
        <Stat label="Days" value={String(days.length)} />
      </dl>
      {days.map((day) => (
        <section key={day.day} className="mt-6" aria-labelledby={`day-${day.day}`}>
          <h2 id={`day-${day.day}`} className="text-sm font-medium text-muted">
            {day.label}
          </h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-panel">
            {day.runs.map((run) => (
              <RunRow key={run.id} run={run} exercise={byId.get(run.exerciseId)} />
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

function RunRow({ run, exercise }: { run: ExerciseRun; exercise: Exercise | undefined }) {
  const time = new Date(run.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return (
    <li className="flex items-center gap-3.5 px-3 py-2.5">
      {exercise && <ExerciseThumb exercise={exercise} className="hidden h-12 w-24 shrink-0 sm:block" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-medium text-fg">{exercise?.title ?? 'An exercise that is no longer here'}</h3>
          {exercise && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
              {AREA_LABELS[exercise.area]}
            </span>
          )}
          {exercise && <SourceTag exerciseId={exercise.id} only="yours" />}
        </div>
        <p className="mt-0.5 text-[13px] text-muted tabular-nums">
          {time} · {formatSeconds(run.durationSeconds)} played · {run.tempoBpm} BPM ·{' '}
          {run.passes} {run.passes === 1 ? 'pass' : 'passes'}
          {!run.completed && ' · ended early'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {run.difficulty === null ? (
          <span className="text-xs text-muted">Not answered</span>
        ) : (
          <span className="inline-flex items-baseline rounded-lg bg-panel-2 px-2 py-1">
            <span className="font-display text-sm leading-none font-bold text-fg">{DIFFICULTY_LABELS[run.difficulty]}</span>
          </span>
        )}
      </div>
      {exercise && (
        <Link
          to="/session"
          search={{ x: exercise.id }}
          aria-label={`Play ${exercise.title} again`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-sm font-medium text-fg hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <RepeatIcon />
          <span className="hidden sm:inline">Play again</span>
        </Link>
      )}
    </li>
  )
}

