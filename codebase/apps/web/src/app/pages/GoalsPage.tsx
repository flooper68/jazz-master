import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PAGE_WIDE } from '../../components/pageFrame'
import { useGoals } from '../useGoals'
import { useTRPC } from '../trpc'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const CARD = 'rounded-2xl border border-line bg-panel'

/**
 * Goals and the paths to them. A goal is something the user wants to be able to
 * do; its path is the stages of exercises that get there, and the practice runs
 * it — stages open as the one before them goes solid.
 *
 * Paths are written by an assistant over MCP rather than filled in on a form
 * (docs/product/next-session-design.md §11), so this page shows what is there
 * and lets it be adjusted; it does not author.
 */
export default function GoalsPage() {
  const { goals, pending, failed } = useGoals()
  const trpc = useTRPC()
  // The solidity of each stage comes from the same answer the tools give, so
  // the page and an assistant never disagree about what is open.
  const { data } = useQuery(trpc.goals.list.queryOptions())
  const progress = data?.status === 'ok' ? data.goals : []

  return (
    <div className={PAGE_WIDE}>
      <h1 className="font-display text-2xl font-bold tracking-tight">Goals</h1>
      <p className="mt-1 max-w-xl text-sm text-fg-2">
        What you are working toward, and the path there. Ask your assistant for a path — it writes them; this page
        adjusts what is already here.
      </p>

      {pending ? (
        <p className="mt-7 text-sm text-muted">Loading your goals…</p>
      ) : failed ? (
        <p role="alert" className="mt-7 text-sm text-danger-text">
          Your goals could not be loaded. Try again in a moment.
        </p>
      ) : goals.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="font-medium text-fg">No goals yet</p>
          <p className="mt-1 text-sm text-muted">
            Tell your assistant what you want to be able to play, and it will write you a path to it.
          </p>
        </div>
      ) : (
        <ul className="mt-7 space-y-3">
          {goals.map((goal) => {
            const solidity = progress.find((item) => item.id === goal.id)?.solidity ?? []
            const open = progress.find((item) => item.id === goal.id)?.openStages ?? [0]
            const items = goal.stages.reduce((sum, stage) => sum + stage.items.length, 0)
            return (
              <li key={goal.id} className={`${CARD} p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <Link
                      to="/goals/$goalId"
                      params={{ goalId: goal.id }}
                      className={`font-display text-lg font-bold tracking-tight text-fg underline-offset-4 hover:underline ${FOCUS}`}
                    >
                      {goal.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      {goal.stages.length} {goal.stages.length === 1 ? 'stage' : 'stages'} · {items}{' '}
                      {items === 1 ? 'exercise' : 'exercises'}
                      {goal.status !== 'active' && ` · ${goal.status}`}
                    </p>
                  </div>
                </div>
                {/* One bar per stage: how solid it is, and whether it has opened. */}
                <ol className="mt-3 flex flex-wrap gap-1.5" aria-label={`Stages of ${goal.title}`}>
                  {goal.stages.map((stage, index) => {
                    const share = Math.round((solidity[index] ?? 0) * 100)
                    const opened = open.includes(index)
                    return (
                      <li
                        key={index}
                        className={`rounded-lg px-2 py-1 text-xs font-medium tabular-nums ${
                          opened ? 'bg-accent-soft text-accent-text' : 'bg-panel-2 text-muted'
                        }`}
                      >
                        {stage.title ?? `Stage ${index + 1}`} · {opened ? `${share}%` : 'locked'}
                      </li>
                    )
                  })}
                </ol>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
