import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { queryOfSearch, searchOfQuery } from '../../appData/exerciseSearch'
import { dayLabel } from '../../appData/history'
import type { ExerciseRun } from '../../appData/run'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseFilter } from '../../components/ExerciseFilter'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { ClickIcon, ClockIcon, GridIcon, RowsIcon } from '../../components/icons'
import { displayAccidentals } from '@jazz-master/theory'
import { activeFilterCount, EVERYTHING, EXERCISE_AREAS, exerciseSeconds, filterExercises, homeLabel, type Exercise, type ExerciseQuery } from '../../content'
import { SourceTag } from '../../components/SourceTag'
import { useTRPC } from '../trpc'
import { isLibraryExerciseId, useExerciseCatalog } from '../useExerciseCatalog'
import { PAGE_WIDE } from '../../components/pageFrame'

// Authored order is the order to learn them in, so grouping keeps it within each area.

type ListView = 'cards' | 'list'
const VIEW_KEY = 'jazz-master.exercises-view'

/** Which exercises to show once the user has some of their own: everything, the pack that ships, or theirs. */
type SourceFilter = 'all' | 'pack' | 'yours'
const SOURCE_KEY = 'jazz-master.exercises-source'
const SOURCES = [
  { id: 'all', label: 'All' },
  { id: 'pack', label: 'Built-in' },
  { id: 'yours', label: 'Yours' },
] as const

/** The remembered filter; storage that is missing or broken means everything. */
function loadSource(): SourceFilter {
  try {
    const stored = localStorage.getItem(SOURCE_KEY)
    return stored === 'pack' || stored === 'yours' ? stored : 'all'
  } catch {
    return 'all'
  }
}
const VIEWS = [
  { id: 'cards', label: 'Cards', icon: GridIcon },
  { id: 'list', label: 'List', icon: RowsIcon },
] as const

/** The remembered view; storage that is missing or broken means cards. */
function loadView(): ListView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards'
  } catch {
    return 'cards'
  }
}

const NO_RUNS: ExerciseRun[] = []

const START_LINK =
  'shrink-0 rounded-lg bg-cta px-2.5 py-1 text-sm font-medium text-cta-fg after:absolute after:inset-0 group-hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export default function ExercisesPage() {
  const trpc = useTRPC()
  // Decoration only: the list is complete without it, so failures stay silent.
  const { data } = useQuery(trpc.runs.list.queryOptions())
  const runs = data?.status === 'ok' ? data.runs : []
  const { exercises: everything, libraryPending } = useExerciseCatalog()
  const [source, setSource] = useState<SourceFilter>(loadSource)
  useEffect(() => {
    try {
      localStorage.setItem(SOURCE_KEY, source)
    } catch {
      // As with the view: the choice still holds for this page.
    }
  }, [source])
  const hasOwn = everything.some((exercise) => isLibraryExerciseId(exercise.id))
  // With nothing of the user's own there is nothing to filter, and a remembered "Yours" must not empty the page.
  // What is remembered is the choice itself, not what it fell back to: it holds again once there is something to show.
  const shownSource = hasOwn ? source : 'all'
  // A remembered "Yours" waits for the library instead of flashing the whole pack first.
  const waitingForOwn = libraryPending && source === 'yours'
  const fromSource = everything.filter(
    (exercise) => shownSource === 'all' || isLibraryExerciseId(exercise.id) === (shownSource === 'yours'),
  )
  // Loose, so the page also renders inside Storybook's ad hoc router.
  const query = queryOfSearch(useSearch({ strict: false }))
  const navigate = useNavigate()
  const setQuery = (next: ExerciseQuery) =>
    // Replaced, not pushed: Back leaves the list instead of undoing the filter a keystroke at a time.
    void navigate({ to: '.', search: searchOfQuery(next), replace: true })
  const catalog = filterExercises(fromSource, query)
  // Areas always read in vocabulary order; only those with something in them are shown.
  const areas = EXERCISE_AREAS.filter((area) => catalog.some((exercise) => exercise.area === area))
  const maxLevel = Math.max(...everything.map((exercise) => exercise.level), 3)
  // Grouped once: with a pack this size, filtering the runs again for every row adds up.
  const runsOf = new Map<string, ExerciseRun[]>()
  for (const run of runs) {
    const ofExercise = runsOf.get(run.exerciseId)
    if (ofExercise) ofExercise.push(run)
    else runsOf.set(run.exerciseId, [run])
  }
  const [view, setView] = useState<ListView>(loadView)
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      // Private mode or a full quota: the choice still holds for this page.
    }
  }, [view])

  return (
    <div className={PAGE_WIDE}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Exercises</h1>
          <p className="mt-1 max-w-xl text-sm text-fg-2">
            Technique, scales, arpeggios, lines and studies — by style and by
            level. Pick an exercise, pick up the guitar, and play.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasOwn && (
            <div role="radiogroup" aria-label="Show" className="inline-flex rounded-lg border border-line bg-panel p-0.5">
              {SOURCES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={shownSource === id}
                  onClick={() => setSource(id)}
                  className={`inline-flex cursor-pointer items-center rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                    shownSource === id ? 'bg-fg text-panel' : 'text-fg-2 hover:text-fg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div role="radiogroup" aria-label="View" className="inline-flex rounded-lg border border-line bg-panel p-0.5">
            {VIEWS.map(({ id, label, icon: ViewIcon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={view === id}
                onClick={() => setView(id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                  view === id ? 'bg-fg text-panel' : 'text-fg-2 hover:text-fg'
                }`}
              >
                <ViewIcon />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5">
        <ExerciseFilter exercises={fromSource} query={query} onChange={setQuery} />
      </div>
      {waitingForOwn && <p className="mt-7 text-sm text-muted" role="status">Loading your exercises…</p>}
      {!waitingForOwn && catalog.length === 0 && (
        <p className="mt-7 text-sm text-muted" role="status">
          Nothing matches{activeFilterCount(query) > 0 ? ' these filters' : ''}.{' '}
          <button type="button" onClick={() => setQuery(EVERYTHING)} className="cursor-pointer underline underline-offset-2 hover:text-fg">
            Show everything
          </button>
        </p>
      )}
      {!waitingForOwn && areas.map((area) => {
        const exercises = catalog.filter((exercise) => exercise.area === area)
        return (
          <section key={area} className="mt-7" aria-labelledby={`area-${area}`}>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${AREA_BADGE[area]}`} />
              <h2 id={`area-${area}`} className="font-display text-base font-semibold tracking-tight">
                {AREA_LABELS[area]}
              </h2>
              <span className="text-sm text-muted tabular-nums">{exercises.length}</span>
            </div>
            <ul
              className={
                view === 'cards'
                  ? 'mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3'
                  : 'mt-2.5 divide-y divide-line rounded-2xl border border-line bg-panel'
              }
            >
              {exercises.map((exercise) => {
                const Item = view === 'cards' ? ExerciseCard : ExerciseRow
                return (
                  <Item
                    key={exercise.id}
                    exercise={exercise}
                    maxLevel={maxLevel}
                    runs={runsOf.get(exercise.id) ?? NO_RUNS}
                  />
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

interface ItemProps {
  exercise: Exercise
  /** The highest level on the page, so every row shows the same number of dots. */
  maxLevel: number
  /** This exercise's runs, newest first. */
  runs: ExerciseRun[]
}

function minutesOf(exercise: Exercise): number {
  return Math.max(Math.round(exerciseSeconds(exercise) / 60), 1)
}

function playedLine(runs: ExerciseRun[]): string {
  const last = runs[0]
  if (!last) return 'Not played yet'
  const started = new Date(last.startedAt)
  const named = dayLabel(started, new Date())
  // Only today and yesterday have names; older days get a short date.
  const when =
    named === 'Today' || named === 'Yesterday'
      ? named.toLowerCase()
      : started.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return `Played ${runs.length}× · last ${when}`
}

function LevelDots({ level, maxLevel }: { level: number; maxLevel: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1" role="img" aria-label={`Level ${level}`}>
      {Array.from({ length: maxLevel }, (_, index) => (
        <span key={index} className={`h-1.5 w-1.5 rounded-full ${index < level ? 'bg-fg' : 'bg-line-strong'}`} />
      ))}
    </span>
  )
}

/** The simple view: one line per exercise, no picture. */
function ExerciseRow({ exercise, maxLevel, runs }: ItemProps) {
  return (
    <li className="group relative flex items-center gap-4 px-3.5 py-2 first:rounded-t-2xl last:rounded-b-2xl hover:bg-panel-2/60">
      <div className="min-w-0 flex-1">
        {/* Beside the heading, not in it: the heading's name stays the title alone. */}
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-medium text-fg">{exercise.title}</h3>
          <SourceTag exerciseId={exercise.id} className="shrink-0" />
        </div>
        <p className="mt-0.5 text-sm text-muted tabular-nums">
          ~{minutesOf(exercise)} min · {exercise.tempoBpm} BPM
          <span className="hidden sm:inline"> · {playedLine(runs)}</span>
        </p>
      </div>
      {isLibraryExerciseId(exercise.id) && <DeleteExercise exercise={exercise} />}
      <LevelDots level={exercise.level} maxLevel={maxLevel} />
      <Link
        to="/exercises/$exerciseId"
        params={{ exerciseId: exercise.id }}
        aria-label={`Start ${exercise.title}`}
        className={START_LINK}
      >
        Start
      </Link>
    </li>
  )
}

function ExerciseCard({ exercise, maxLevel, runs }: ItemProps) {
  return (
    <li className="group relative flex flex-col rounded-2xl border border-line bg-panel p-2 transition-shadow focus-within:border-line-strong hover:border-line-strong hover:shadow-lg hover:shadow-shade">
      <ExerciseThumb exercise={exercise} className="aspect-[5/2]" />
      <div className="flex flex-1 flex-col px-1 pt-2.5 pb-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[15px] leading-snug font-semibold tracking-tight text-fg">
            {exercise.title}
          </h3>
          <span className="mt-1.5">
            <LevelDots level={exercise.level} maxLevel={maxLevel} />
          </span>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted tabular-nums">
          <SourceTag exerciseId={exercise.id} />
          <span className="inline-flex items-center gap-1"><ClockIcon />~{minutesOf(exercise)} min</span>
          <span className="inline-flex items-center gap-1"><ClickIcon />{exercise.tempoBpm} BPM</span>
          {/* A bare tonic says nothing the title has not; only a key is worth the room. */}
          {homeLabel(exercise)?.endsWith(' major') && <span>{displayAccidentals(homeLabel(exercise) ?? '')}</span>}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {playedLine(runs)}
          </p>
          {isLibraryExerciseId(exercise.id) && <DeleteExercise exercise={exercise} />}
          {/* The whole card is the target; the link stretches over it. */}
          <Link
            to="/exercises/$exerciseId"
            params={{ exerciseId: exercise.id }}
            aria-label={`Start ${exercise.title}`}
            className={`${START_LINK} after:rounded-2xl`}
          >
            Start
          </Link>
        </div>
      </div>
    </li>
  )
}

/**
 * Remove one of the user's own exercises. Two presses, the second within a
 * few seconds: deleting is for good, and the whole card is otherwise a link.
 */
function DeleteExercise({ exercise }: { exercise: Exercise }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])
  const remove = useMutation(
    trpc.exercises.delete.mutationOptions({
      onSettled: () => queryClient.invalidateQueries({ queryKey: trpc.exercises.list.queryKey() }),
    }),
  )
  const failed = remove.isError || (remove.data !== undefined && remove.data.status !== 'ok')
  return (
    // Above the card's stretched link, so the press lands here.
    <span className="relative z-10 shrink-0">
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => (armed ? remove.mutate({ exerciseId: exercise.id }) : setArmed(true))}
        aria-label={armed ? `Delete ${exercise.title} for good` : `Delete ${exercise.title}`}
        className={`cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-50 ${
          armed ? 'border-danger-text text-danger-text' : 'border-line text-muted hover:text-fg'
        }`}
      >
        {armed ? 'Delete for good?' : 'Delete'}
      </button>
      {failed && <span role="alert" className="ml-2 text-xs text-danger-text">Could not delete</span>}
    </span>
  )
}
