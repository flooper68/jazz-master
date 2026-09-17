import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { formatDuration, summarizeRuns, type ActivityDay, type Dashboard } from '../../appData/dashboard'
import { dayLabel } from '../../appData/history'
import { loadQuickRunSettings, pickQuickRun } from '../../appData/quickRun'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { ShuffleIcon } from '../../components/icons'
import { EXERCISES, type Exercise } from '../../content'
import { useTRPC } from '../trpc'
import { PAGE_WIDE } from '../../components/pageFrame'

const exerciseById = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]))
const EXERCISE_IDS = EXERCISES.map((exercise) => exercise.id)

const CARD = 'rounded-2xl border border-line bg-panel'
const SECTION_TITLE = 'font-display text-base font-semibold tracking-tight'
const QUIET_LINK =
  'text-sm font-medium text-fg-2 underline-offset-4 hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

/** Home: where practice stands — this week, the streak, what was played, what to pick up next. */
export default function HomePage() {
  const navigate = useNavigate()
  const trpc = useTRPC()
  const { data, isPending } = useQuery(trpc.runs.list.queryOptions())
  // Without the runs the page still stands: the numbers read zero and the pack is on offer.
  const runs = data?.status === 'ok' ? data.runs : []
  const failed = !isPending && data?.status !== 'ok'
  const summary = summarizeRuns(runs, EXERCISE_IDS)

  function startQuickRun(): void {
    const picked = pickQuickRun(EXERCISES, loadQuickRunSettings(EXERCISES))
    void navigate({ to: '/session', search: { x: picked.map((exercise) => exercise.id).join(',') } })
  }

  return (
    <div className={PAGE_WIDE}>
      <h1 className="font-display text-2xl font-bold tracking-tight">Home</h1>
      <p className="mt-1 text-sm text-fg-2">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        {summary.streakDays > 1 && ` · ${summary.streakDays} days in a row`}
      </p>
      {failed && (
        <p role="alert" className="mt-4 text-sm text-danger-text">
          Your runs could not be loaded, so the numbers below are empty. Try again in a moment.
        </p>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <section className="rounded-2xl bg-accent p-4 text-on-accent lg:col-span-1" aria-labelledby="home-quick-run">
          <h2 id="home-quick-run" className="font-display text-lg font-bold tracking-tight">
            {summary.totalRuns === 0 ? 'Start with a quick run' : 'Ready for today?'}
          </h2>
          <p className="mt-1 text-sm opacity-90">
            A few random exercises, easier first, played straight through. Rate them at the end.
          </p>
          <button
            type="button"
            onClick={startQuickRun}
            className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-on-accent px-3 py-1.5 text-sm font-semibold text-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
          >
            <ShuffleIcon />
            Start a quick run
          </button>
        </section>

        <section className={`${CARD} min-w-0 p-4 lg:col-span-2`} aria-labelledby="home-week">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 id="home-week" className={SECTION_TITLE}>
              Last 7 days
            </h2>
            <p className="text-sm text-muted">Minutes played per day</p>
          </div>
          <WeekChart week={summary.week} />
        </section>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="This week" value={formatDuration(summary.weekSeconds)} note={`${summary.weekRuns} ${summary.weekRuns === 1 ? 'run' : 'runs'}`} />
        <Stat label="Streak" value={`${summary.streakDays} ${summary.streakDays === 1 ? 'day' : 'days'}`} note={summary.streakDays === 0 ? 'Play today to start one' : 'Keep it going'} />
        <Stat label="Felt this week" value={summary.weekRating === null ? '—' : `${summary.weekRating}/10`} note={summary.weekRating === null ? 'No ratings yet' : 'Average difficulty'} />
        <Stat label="All time" value={formatDuration(summary.totalSeconds)} note={`${summary.totalRuns} ${summary.totalRuns === 1 ? 'run' : 'runs'}`} />
      </dl>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <RecentRuns summary={summary} />
        <NextUp summary={summary} />
      </div>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className={`${CARD} px-3.5 py-2.5`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5">
        <span className="block font-display text-xl font-bold tracking-tight tabular-nums">{value}</span>
        <span className="block text-xs text-muted">{note}</span>
      </dd>
    </div>
  )
}

/**
 * One series, seven columns: minutes per day on one baseline. Each column is
 * its own hover and focus target carrying the exact value; today's label is
 * the only one in strong ink.
 */
function WeekChart({ week }: { week: ActivityDay[] }) {
  const peak = Math.max(...week.map((day) => day.seconds), 60)
  return (
    <ol className="mt-3 grid h-28 grid-cols-7 items-end gap-2" aria-label="Minutes played per day, oldest first">
      {week.map((day, index) => {
        const today = index === week.length - 1
        const name = day.date.toLocaleDateString(undefined, { weekday: 'short' })
        const value = `${formatDuration(day.seconds)} · ${day.runs} ${day.runs === 1 ? 'run' : 'runs'}`
        return (
          <li key={day.day} className="flex h-full min-w-0 flex-col items-center justify-end gap-1.5">
            <span
              tabIndex={0}
              data-tip={value}
              aria-label={`${day.date.toLocaleDateString(undefined, { weekday: 'long' })}: ${value}`}
              className="flex w-full flex-1 cursor-default items-end justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {/* Thin, rounded at the data end, square on the baseline; an empty day keeps a hairline. */}
              <span
                className={`block w-full max-w-6 rounded-t ${day.seconds > 0 ? 'bg-fg' : 'bg-line-strong'}`}
                style={{ height: day.seconds > 0 ? `${Math.max((day.seconds / peak) * 100, 4)}%` : '2px' }}
              />
            </span>
            <span className={`text-xs tabular-nums ${today ? 'font-semibold text-fg' : 'text-muted'}`}>
              {today ? 'Today' : name}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function RecentRuns({ summary }: { summary: Dashboard }) {
  return (
    // min-w-0: a grid item otherwise grows to its longest unbroken title.
    <section aria-labelledby="home-recent" className="min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="home-recent" className={SECTION_TITLE}>
          Recently played
        </h2>
        {summary.totalRuns > 0 && (
          <Link to="/history" className={QUIET_LINK}>
            All history
          </Link>
        )}
      </div>
      {summary.recent.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          Nothing played yet — your runs show up here.
        </p>
      ) : (
        <ul className={`mt-3 divide-y divide-line ${CARD}`}>
          {summary.recent.map((run) => {
            const exercise = exerciseById.get(run.exerciseId)
            return (
              <li key={run.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-fg">{exercise?.title ?? 'An exercise no longer in the pack'}</p>
                  <p className="mt-0.5 text-sm text-muted tabular-nums">
                    {dayLabel(new Date(run.startedAt), new Date())} · {run.tempoBpm} BPM
                    {run.sessionId && ' · quick run'}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-muted tabular-nums">
                  {run.rating === null ? 'Not rated' : (
                    <span aria-label={`Felt ${run.rating} out of 10`}>
                      <span className="font-display text-lg font-bold text-fg">{run.rating}</span>/10
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** What to pick up next: what last felt hard, then what has never been played. */
function NextUp({ summary }: { summary: Dashboard }) {
  const hard = summary.hardest.flatMap(({ exerciseId, rating }) => {
    const exercise = exerciseById.get(exerciseId)
    return exercise ? [{ exercise, reason: `Felt ${rating}/10 last time` }] : []
  })
  const fresh = summary.unplayed.flatMap((exerciseId) => {
    const exercise = exerciseById.get(exerciseId)
    return exercise ? [{ exercise, reason: 'Not played yet' }] : []
  })
  const picks = [...hard, ...fresh].slice(0, 3)
  return (
    <section aria-labelledby="home-next" className="min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="home-next" className={SECTION_TITLE}>
          Worth picking up
        </h2>
        <Link to="/exercises" className={QUIET_LINK}>
          All exercises
        </Link>
      </div>
      {picks.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          Everything has been played and nothing felt too hard. A quick run keeps it that way.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {picks.map(({ exercise, reason }) => (
            <PickRow key={exercise.id} exercise={exercise} reason={reason} />
          ))}
        </ul>
      )}
    </section>
  )
}

function PickRow({ exercise, reason }: { exercise: Exercise; reason: string }) {
  return (
    <li className={`group relative flex items-center gap-3 p-2 hover:border-line-strong ${CARD}`}>
      <ExerciseThumb exercise={exercise} className="h-12 w-24 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{exercise.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
            {AREA_LABELS[exercise.area]}
          </span>
          {reason}
        </p>
      </div>
      <Link
        to="/exercises/$exerciseId"
        params={{ exerciseId: exercise.id }}
        aria-label={`Start ${exercise.title}`}
        className="mr-1 shrink-0 rounded-lg bg-cta px-2.5 py-1 text-sm font-medium text-cta-fg after:absolute after:inset-0 after:rounded-2xl group-hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        Start
      </Link>
    </li>
  )
}
