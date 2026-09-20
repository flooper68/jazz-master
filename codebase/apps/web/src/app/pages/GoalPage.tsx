import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import type { Goal, GoalInput, Stage } from '../../appData/goal'
import { PAGE_WIDE } from '../../components/pageFrame'
import { useExerciseCatalog } from '../useExerciseCatalog'
import { useGoals } from '../useGoals'
import { useTRPC } from '../trpc'
import NotFoundPage from './NotFoundPage'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const CARD = 'rounded-2xl border border-line bg-panel'
const QUIET = `inline-flex cursor-pointer items-center rounded-lg border border-line bg-panel px-2 py-1 text-xs font-medium text-fg hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`

/**
 * One goal's path, as it can be adjusted: the stages in order, what is in each,
 * and the tempo each exercise is wanted at. Reorder, remove, retarget, pause.
 *
 * There is no authoring here on purpose — an assistant writes paths over MCP
 * (docs/product/next-session-design.md §11). What this page is for is the
 * moment a path is nearly right and the user wants one thing moved.
 */
export default function GoalPage() {
  const { goalId } = useParams({ strict: false }) as { goalId?: string }
  const { goals, pending } = useGoals()
  const goal = goals.find((item) => item.id === goalId)

  if (pending) return <p className="p-6 text-sm text-muted" role="status">Loading your goals…</p>
  if (!goal) return <NotFoundPage />
  return <GoalEditor key={goal.id} goal={goal} />
}

function GoalEditor({ goal }: { goal: Goal }) {
  const navigate = useNavigate()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { byId } = useExerciseCatalog()
  const { mutateAsync: update, isPending } = useMutation(trpc.goals.update.mutationOptions())
  const [stages, setStages] = useState<Stage[]>(goal.stages)
  const [status, setStatus] = useState(goal.status)
  const [failed, setFailed] = useState(false)
  // A path with no stages is not a path; the save is held back rather than refused later.
  const empty = stages.every((stage) => stage.items.length === 0)

  async function save(next: Partial<GoalInput>): Promise<void> {
    const { id: _id, ...rest } = goal
    const proposed: GoalInput = { ...rest, stages, status, ...next }
    if (proposed.stages.every((stage) => stage.items.length === 0)) return
    try {
      const result = await update({
        goalId: goal.id,
        // A stage emptied to nothing goes rather than being stored empty.
        goal: { ...proposed, stages: proposed.stages.filter((stage) => stage.items.length > 0) },
      })
      setFailed(result.status !== 'ok')
      if (result.status === 'ok') await queryClient.invalidateQueries({ queryKey: trpc.goals.list.queryKey() })
    } catch {
      setFailed(true)
    }
  }

  function moveItem(stageIndex: number, itemIndex: number, by: number): void {
    const to = itemIndex + by
    const stage = stages[stageIndex]
    if (to < 0 || to >= stage.items.length) return
    const items = [...stage.items]
    const [moved] = items.splice(itemIndex, 1)
    items.splice(to, 0, moved)
    setStages(stages.map((current, index) => (index === stageIndex ? { ...current, items } : current)))
  }

  function removeItem(stageIndex: number, itemIndex: number): void {
    setStages(
      stages.map((stage, index) =>
        index === stageIndex ? { ...stage, items: stage.items.filter((_, at) => at !== itemIndex) } : stage,
      ),
    )
  }

  function retarget(stageIndex: number, itemIndex: number, targetTempoBpm: number): void {
    setStages(
      stages.map((stage, index) =>
        index === stageIndex
          ? {
              ...stage,
              items: stage.items.map((item, at) => (at === itemIndex ? { ...item, targetTempoBpm } : item)),
            }
          : stage,
      ),
    )
  }

  return (
    <div className={PAGE_WIDE}>
      <h1 className="font-display text-2xl font-bold tracking-tight">{goal.title}</h1>
      <p className="mt-1 text-sm text-fg-2">
        The path to it. A stage opens once the one before it is mostly solid, so the order is what the practice
        follows.
      </p>

      {failed && (
        <p role="alert" className="mt-4 text-sm text-danger-text">
          That change could not be saved. Try again in a moment.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const next = status === 'active' ? 'paused' : 'active'
            setStatus(next)
            void save({ status: next })
          }}
          className={QUIET}
        >
          {status === 'active' ? 'Pause this goal' : 'Resume this goal'}
        </button>
        <button type="button" disabled={isPending || empty} onClick={() => void save({})} className={QUIET}>
          Save the path
        </button>
        <span className="text-xs text-muted">
          {status === 'active' ? 'Shaping your sessions.' : 'Paused — it asks nothing of your practice.'}
        </span>
      </div>

      <ol className="mt-5 space-y-3">
        {stages.map((stage, stageIndex) => (
          <li key={stageIndex} className={`${CARD} p-4`}>
            <h2 className="font-display font-semibold tracking-tight">{stage.title ?? `Stage ${stageIndex + 1}`}</h2>
            <ul className="mt-3 space-y-2">
              {stage.items.map((item, itemIndex) => {
                const exercise = byId.get(item.exerciseId)
                return (
                  <li key={item.exerciseId} className="flex flex-wrap items-center gap-2 rounded-xl bg-panel-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                      {exercise?.title ?? 'An exercise that is no longer here'}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      Target
                      <input
                        type="number"
                        value={item.targetTempoBpm}
                        min={20}
                        max={400}
                        aria-label={`Target tempo for ${exercise?.title ?? item.exerciseId}`}
                        onChange={(event) => retarget(stageIndex, itemIndex, Number(event.target.value))}
                        onBlur={() => void save({})}
                        className={`w-16 rounded-lg border border-line bg-panel px-2 py-1 text-sm tabular-nums text-fg ${FOCUS}`}
                      />
                      BPM
                    </label>
                    <button
                      type="button"
                      onClick={() => moveItem(stageIndex, itemIndex, -1)}
                      disabled={itemIndex === 0}
                      aria-label={`Move ${exercise?.title ?? item.exerciseId} up`}
                      className={QUIET}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(stageIndex, itemIndex, 1)}
                      disabled={itemIndex === stage.items.length - 1}
                      aria-label={`Move ${exercise?.title ?? item.exerciseId} down`}
                      className={QUIET}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(stageIndex, itemIndex)}
                      aria-label={`Remove ${exercise?.title ?? item.exerciseId} from this path`}
                      className={QUIET}
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>

      <button type="button" onClick={() => void navigate({ to: '/teacher' })} className={`mt-5 ${QUIET}`}>
        Back to the teacher
      </button>
    </div>
  )
}
