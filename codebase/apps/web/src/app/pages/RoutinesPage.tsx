import { Link, useNavigate } from '@tanstack/react-router'
import { routineExercises, routinePlan, sessionSearch } from '../../appData/quickRun'
import type { Routine } from '../../appData/routine'
import { AREA_BADGE } from '../../components/areaLabels'
import { PlayIcon, PlusIcon } from '../../components/icons'
import { PAGE_WIDE } from '../../components/pageFrame'
import { exerciseSeconds, type Exercise } from '../../content'
import { useExerciseCatalog } from '../useExerciseCatalog'
import { useRoutines } from '../useRoutines'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const BUTTON_PRIMARY = `inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-cta px-3 py-1.5 text-sm font-medium text-cta-fg hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`

/**
 * Practice routines: named, ordered sets of exercises put together ahead of
 * time — here, or by an AI client over MCP — and played straight through.
 * A card says what a routine is and starts it; making and changing one each
 * have a page of their own.
 */
export default function RoutinesPage() {
  const { routines, pending, failed } = useRoutines()
  const { exercises } = useExerciseCatalog()

  return (
    <div className={PAGE_WIDE}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Routines</h1>
          <p className="mt-1 max-w-xl text-sm text-fg-2">
            Sets of exercises prepared ahead of time and played straight through.
          </p>
        </div>
        <Link to="/routines/new" className={BUTTON_PRIMARY}>
          <PlusIcon />
          New routine
        </Link>
      </div>

      {pending ? (
        <p className="mt-7 text-sm text-muted">Loading your routines…</p>
      ) : failed ? (
        <p role="alert" className="mt-7 text-sm text-danger-text">
          Your routines could not be loaded. Try again in a moment.
        </p>
      ) : routines.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="font-medium text-fg">No routines yet</p>
          <p className="mt-1 text-sm text-muted">Put a few exercises together — a warm-up, a ii–V–I workout — and play them in one go.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-3">
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} exercises={exercises} />
          ))}
        </ul>
      )}
    </div>
  )
}

function minutesLabel(exercises: readonly Exercise[]): string {
  const seconds = exercises.reduce((sum, exercise) => sum + exerciseSeconds(exercise), 0)
  return `~${Math.max(Math.round(seconds / 60), 1)} min`
}

/** What a routine is, at a glance, and Start. What is in it, and changing it, are one press away on its own page. */
function RoutineCard({ routine, exercises }: { routine: Routine; exercises: readonly Exercise[] }) {
  const navigate = useNavigate()
  const playable = routineExercises(routine, exercises)
  const areas = [...new Set(playable.map((exercise) => exercise.area))]
  return (
    <li aria-label={routine.name} className="flex flex-col rounded-2xl border border-line bg-panel p-3.5 hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-base leading-snug font-semibold tracking-tight text-fg">{routine.name}</h2>
        <span aria-hidden="true" className="mt-1.5 flex shrink-0 items-center gap-1">
          {areas.map((area) => (
            <span key={area} className={`h-2 w-2 rounded-full ${AREA_BADGE[area]}`} />
          ))}
        </span>
      </div>
      {routine.about && <p className="mt-1 line-clamp-2 text-sm text-fg-2">{routine.about}</p>}
      <p className="mt-auto pt-3 text-[13px] text-muted tabular-nums">
        {playable.length} {playable.length === 1 ? 'exercise' : 'exercises'} · {minutesLabel(playable)}
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Link
          to="/routines/$routineId/edit"
          params={{ routineId: routine.id }}
          aria-label={`Edit ${routine.name}`}
          className={`-ml-2 rounded-lg px-2 py-1 text-sm text-muted hover:bg-panel-2 hover:text-fg ${FOCUS}`}
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={playable.length === 0}
          onClick={() => void navigate({ to: '/session', search: sessionSearch(routinePlan(routine, playable)) })}
          aria-label={`Start ${routine.name}`}
          className={BUTTON_PRIMARY}
        >
          <PlayIcon />
          Start
        </button>
      </div>
    </li>
  )
}
