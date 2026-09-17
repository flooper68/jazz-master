import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { dayLabel } from '../../appData/history'
import type { ExerciseRun } from '../../appData/run'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { ClickIcon, ClockIcon, GridIcon, RowsIcon } from '../../components/icons'
import { EXERCISES, exerciseSeconds, type Exercise } from '../../content'
import { useTRPC } from '../trpc'
import { PAGE_WIDE } from '../../components/pageFrame'

// Authored order is the order to learn them in, so grouping keeps it within each area.
const areas = [...new Set(EXERCISES.map((exercise) => exercise.area))]
const MAX_LEVEL = Math.max(...EXERCISES.map((exercise) => exercise.level), 3)

type ListView = 'cards' | 'list'
const VIEW_KEY = 'jazz-master.exercises-view'
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

const START_LINK =
  'shrink-0 rounded-lg bg-cta px-3 py-1.5 text-sm font-medium text-cta-fg after:absolute after:inset-0 group-hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export default function ExercisesPage() {
  const trpc = useTRPC()
  // Decoration only: the list is complete without it, so failures stay silent.
  const { data } = useQuery(trpc.runs.list.queryOptions())
  const runs = data?.status === 'ok' ? data.runs : []
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Exercises</h1>
          <p className="mt-2 max-w-xl text-fg-2">
            Scales, arpeggios and lines by level. Pick an exercise, pick up the
            guitar, and play.
          </p>
        </div>
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
      {areas.map((area) => {
        const exercises = EXERCISES.filter((exercise) => exercise.area === area)
        return (
          <section key={area} className="mt-10" aria-labelledby={`area-${area}`}>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${AREA_BADGE[area]}`} />
              <h2 id={`area-${area}`} className="font-display text-lg font-semibold tracking-tight">
                {AREA_LABELS[area]}
              </h2>
              <span className="text-sm text-muted tabular-nums">{exercises.length}</span>
            </div>
            <ul
              className={
                view === 'cards'
                  ? 'mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-4'
                  : 'mt-3 divide-y divide-line rounded-2xl border border-line bg-panel'
              }
            >
              {exercises.map((exercise) => {
                const Item = view === 'cards' ? ExerciseCard : ExerciseRow
                return (
                  <Item
                    key={exercise.id}
                    exercise={exercise}
                    runs={runs.filter((run) => run.exerciseId === exercise.id)}
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

function LevelDots({ level }: { level: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1" role="img" aria-label={`Level ${level}`}>
      {Array.from({ length: MAX_LEVEL }, (_, index) => (
        <span key={index} className={`h-1.5 w-1.5 rounded-full ${index < level ? 'bg-fg' : 'bg-line-strong'}`} />
      ))}
    </span>
  )
}

/** The simple view: one line per exercise, no picture. */
function ExerciseRow({ exercise, runs }: ItemProps) {
  return (
    <li className="group relative flex items-center gap-4 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-panel-2/60">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-fg">{exercise.title}</h3>
        <p className="mt-0.5 text-sm text-muted tabular-nums">
          ~{minutesOf(exercise)} min · {exercise.tempoBpm} BPM
          <span className="hidden sm:inline"> · {playedLine(runs)}</span>
        </p>
      </div>
      <LevelDots level={exercise.level} />
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

function ExerciseCard({ exercise, runs }: ItemProps) {
  return (
    <li className="group relative flex flex-col rounded-2xl border border-line bg-panel p-2.5 transition-shadow focus-within:border-line-strong hover:border-line-strong hover:shadow-lg hover:shadow-shade">
      <ExerciseThumb exercise={exercise} className="aspect-[5/2]" />
      <div className="flex flex-1 flex-col px-1 pt-3 pb-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base leading-snug font-semibold tracking-tight text-fg">
            {exercise.title}
          </h3>
          <span className="mt-1.5">
            <LevelDots level={exercise.level} />
          </span>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted tabular-nums">
          <span className="inline-flex items-center gap-1"><ClockIcon />~{minutesOf(exercise)} min</span>
          <span className="inline-flex items-center gap-1"><ClickIcon />{exercise.tempoBpm} BPM</span>
          {exercise.key && <span>{exercise.key} major</span>}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {playedLine(runs)}
          </p>
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
