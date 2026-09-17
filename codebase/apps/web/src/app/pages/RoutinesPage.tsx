import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useId, useState } from 'react'
import { routineExercises, sessionSearch } from '../../appData/quickRun'
import { MOST_ROUTINE_ITEMS, type Routine, type RoutineInput } from '../../appData/routine'
import { AREA_BADGE, AREA_LABELS } from '../../components/areaLabels'
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, PlayIcon, PlusIcon } from '../../components/icons'
import { PAGE_READING } from '../../components/pageFrame'
import { exerciseSeconds, type Exercise } from '../../content'
import { useTRPC } from '../trpc'
import { useExerciseCatalog } from '../useExerciseCatalog'
import { useRoutines } from '../useRoutines'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const BUTTON_PRIMARY = `inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-cta px-3 py-1.5 text-sm font-medium text-cta-fg hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`
const BUTTON_SECONDARY = `inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1 text-sm font-medium text-fg hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`
const ICON_BUTTON = `inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-panel text-fg-2 hover:border-line-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS}`
const FIELD = `w-full rounded-lg border border-line bg-field px-2.5 py-1.5 text-sm text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg`

/** What the editor is open on: a new routine, or one being changed. */
type Editing = { kind: 'new' } | { kind: 'existing'; routine: Routine }

/**
 * Practice routines: named, ordered sets of exercises put together ahead of
 * time — here, or by an AI client over MCP — and played straight through.
 */
export default function RoutinesPage() {
  const { routines, pending, failed } = useRoutines()
  const { exercises } = useExerciseCatalog()
  const [editing, setEditing] = useState<Editing | null>(null)

  return (
    <div className={PAGE_READING}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Routines</h1>
          <p className="mt-1 max-w-xl text-sm text-fg-2">
            A routine is a set of exercises prepared ahead of time and played straight through. Start one here, or
            choose it as what Quick run plays.
          </p>
        </div>
        {editing === null && (
          <button type="button" onClick={() => setEditing({ kind: 'new' })} className={BUTTON_PRIMARY}>
            <PlusIcon />
            New routine
          </button>
        )}
      </div>

      {editing?.kind === 'new' && (
        <RoutineEditor exercises={exercises} onClose={() => setEditing(null)} />
      )}

      {pending ? (
        <p className="mt-7 text-sm text-muted">Loading your routines…</p>
      ) : failed ? (
        <p role="alert" className="mt-7 text-sm text-danger-text">
          Your routines could not be loaded. Try again in a moment.
        </p>
      ) : routines.length === 0 && editing === null ? (
        <div className="mt-7 rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="font-medium text-fg">No routines yet</p>
          <p className="mt-1 text-sm text-muted">Put a few exercises together — a warm-up, a ii–V–I workout — and play them in one go.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {routines.map((routine) =>
            editing?.kind === 'existing' && editing.routine.id === routine.id ? (
              <li key={routine.id}>
                <RoutineEditor routine={routine} exercises={exercises} onClose={() => setEditing(null)} />
              </li>
            ) : (
              <RoutineCard
                key={routine.id}
                routine={routine}
                exercises={exercises}
                onEdit={() => setEditing({ kind: 'existing', routine })}
              />
            ),
          )}
        </ul>
      )}
    </div>
  )
}

function minutesLabel(exercises: readonly Exercise[]): string {
  const seconds = exercises.reduce((sum, exercise) => sum + exerciseSeconds(exercise), 0)
  return `~${Math.max(Math.round(seconds / 60), 1)} min`
}

function RoutineCard({ routine, exercises, onEdit }: { routine: Routine; exercises: readonly Exercise[]; onEdit: () => void }) {
  const navigate = useNavigate()
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const playable = routineExercises(routine, exercises)
  return (
    <li className="rounded-2xl border border-line bg-panel p-3.5" aria-label={routine.name}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold tracking-tight text-fg">{routine.name}</h2>
          <p className="mt-0.5 text-[13px] text-muted tabular-nums">
            {playable.length} {playable.length === 1 ? 'exercise' : 'exercises'} · {minutesLabel(playable)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DeleteRoutine routine={routine} />
          <button type="button" onClick={onEdit} aria-label={`Edit ${routine.name}`} className={BUTTON_SECONDARY}>
            Edit
          </button>
          <button
            type="button"
            disabled={playable.length === 0}
            onClick={() => void navigate({ to: '/session', search: sessionSearch({ exercises: playable, routine }) })}
            aria-label={`Start ${routine.name}`}
            className={BUTTON_PRIMARY}
          >
            <PlayIcon />
            Start
          </button>
        </div>
      </div>
      {routine.about && <p className="mt-2 text-sm text-fg-2">{routine.about}</p>}
      <ol className="mt-3 divide-y divide-line rounded-xl border border-line">
        {routine.items.map((item, index) => {
          const exercise = byId.get(item.exerciseId)
          return (
            <li key={item.exerciseId} className="flex items-center gap-3 px-3 py-1.5 text-sm">
              <span className="w-4 shrink-0 text-right text-xs text-muted tabular-nums">{index + 1}</span>
              {exercise ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-fg">{exercise.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[exercise.area]}`}>
                    {AREA_LABELS[exercise.area]}
                  </span>
                </>
              ) : (
                <span className="min-w-0 flex-1 truncate text-muted italic">No longer in your exercises — skipped</span>
              )}
            </li>
          )
        })}
      </ol>
    </li>
  )
}

/** Two presses, the second within a few seconds: deleting is for good. */
function DeleteRoutine({ routine }: { routine: Routine }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])
  const remove = useMutation(
    trpc.routines.delete.mutationOptions({
      onSettled: () => queryClient.invalidateQueries({ queryKey: trpc.routines.list.queryKey() }),
    }),
  )
  const failed = remove.isError || (remove.data !== undefined && remove.data.status !== 'ok')
  return (
    <span className="shrink-0">
      {failed && <span role="alert" className="mr-2 text-xs text-danger-text">Could not delete</span>}
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => (armed ? remove.mutate({ routineId: routine.id }) : setArmed(true))}
        aria-label={armed ? `Delete ${routine.name} for good` : `Delete ${routine.name}`}
        className={`cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS} ${
          armed ? 'border-danger-text text-danger-text' : 'border-line text-muted hover:text-fg'
        }`}
      >
        {armed ? 'Delete for good?' : 'Delete'}
      </button>
    </span>
  )
}

interface RoutineEditorProps {
  /** The routine being changed; absent for a new one. */
  routine?: Routine
  exercises: readonly Exercise[]
  onClose: () => void
}

/** Name it, say what it is for, and put its exercises in playing order. */
function RoutineEditor({ routine, exercises, onClose }: RoutineEditorProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const ids = { name: useId(), about: useId(), add: useId() }
  const [name, setName] = useState(routine?.name ?? '')
  const [about, setAbout] = useState(routine?.about ?? '')
  const [itemIds, setItemIds] = useState<string[]>(() => routine?.items.map((item) => item.exerciseId) ?? [])
  const [problems, setProblems] = useState<string[]>([])
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const addable = exercises.filter((exercise) => !itemIds.includes(exercise.id))
  const [adding, setAdding] = useState('')
  const toAdd = addable.some((exercise) => exercise.id === adding) ? adding : (addable[0]?.id ?? '')

  const onSettled = () => queryClient.invalidateQueries({ queryKey: trpc.routines.list.queryKey() })
  const create = useMutation(trpc.routines.create.mutationOptions({ onSettled }))
  const update = useMutation(trpc.routines.update.mutationOptions({ onSettled }))
  const saving = create.isPending || update.isPending

  function move(index: number, delta: number): void {
    setItemIds((current) => {
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(index + delta, 0, moved)
      return next
    })
  }

  async function save(): Promise<void> {
    const input: RoutineInput = {
      name,
      ...(about.trim() ? { about } : {}),
      items: itemIds.map((exerciseId) => ({ exerciseId })),
    }
    try {
      const result = routine
        ? await update.mutateAsync({ routineId: routine.id, routine: input })
        : await create.mutateAsync({ routine: input })
      if (result.status === 'ok') return onClose()
      setProblems(
        result.status === 'invalid'
          ? result.problems
          : result.status === 'full'
            ? [result.message]
            : result.status === 'not_found'
              ? ['This routine no longer exists.']
              : ['The routine could not be saved. Try again in a moment.'],
      )
    } catch {
      setProblems(['The routine could not be saved. Try again in a moment.'])
    }
  }

  return (
    <form
      className="mt-6 rounded-2xl border border-line-strong bg-panel p-3.5 first:mt-0"
      aria-label={routine ? `Edit ${routine.name}` : 'New routine'}
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.name} className="text-xs font-medium text-muted">Name</label>
          <input
            id={ids.name}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            placeholder="Morning warm-up"
            className={`mt-1 ${FIELD}`}
          />
        </div>
        <div>
          <label htmlFor={ids.about} className="text-xs font-medium text-muted">What it is for <span className="font-normal">· optional</span></label>
          <input
            id={ids.about}
            value={about}
            onChange={(event) => setAbout(event.target.value)}
            maxLength={500}
            placeholder="Ten minutes before the gig"
            className={`mt-1 ${FIELD}`}
          />
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-muted">Exercises, in playing order</p>
      {itemIds.length === 0 ? (
        <p className="mt-1 rounded-xl border border-dashed border-line-strong px-3 py-4 text-center text-sm text-muted">
          Nothing in it yet — add the first exercise below.
        </p>
      ) : (
        <ol className="mt-1 divide-y divide-line rounded-xl border border-line">
          {itemIds.map((exerciseId, index) => {
            const title = byId.get(exerciseId)?.title ?? 'No longer in your exercises'
            return (
              <li key={exerciseId} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
                <span className="w-4 shrink-0 text-right text-xs text-muted tabular-nums">{index + 1}</span>
                <span className={`min-w-0 flex-1 truncate ${byId.has(exerciseId) ? 'text-fg' : 'text-muted italic'}`}>{title}</span>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${title} up`} className={ICON_BUTTON}>
                  <ArrowUpIcon />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === itemIds.length - 1} aria-label={`Move ${title} down`} className={ICON_BUTTON}>
                  <ArrowDownIcon />
                </button>
                <button type="button" onClick={() => setItemIds((current) => current.filter((id) => id !== exerciseId))} aria-label={`Remove ${title}`} className={ICON_BUTTON}>
                  <CloseIcon />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-2 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={ids.add} className="sr-only">Exercise to add</label>
          <select
            id={ids.add}
            value={toAdd}
            onChange={(event) => setAdding(event.target.value)}
            disabled={addable.length === 0 || itemIds.length >= MOST_ROUTINE_ITEMS}
            className={FIELD}
          >
            {addable.length === 0 && <option value="">Every exercise is already in</option>}
            {[...new Set(addable.map((exercise) => exercise.area))].map((area) => (
              <optgroup key={area} label={AREA_LABELS[area]}>
                {addable.filter((exercise) => exercise.area === area).map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>{exercise.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={!toAdd || itemIds.length >= MOST_ROUTINE_ITEMS}
          onClick={() => setItemIds((current) => [...current, toAdd])}
          className={BUTTON_SECONDARY}
        >
          <PlusIcon />
          Add
        </button>
      </div>

      {problems.length > 0 && (
        <ul role="alert" className="mt-3 space-y-0.5 text-sm text-danger-text">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={saving || name.trim() === '' || itemIds.length === 0} className={BUTTON_PRIMARY}>
          {routine ? 'Save changes' : 'Create routine'}
        </button>
        <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
          Cancel
        </button>
      </div>
    </form>
  )
}
