import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PAGE_WIDE } from '../../components/pageFrame'
import type { LessonKind } from '../../server/lesson/lesson'
import { useGoals } from '../useGoals'
import { useTRPC } from '../trpc'
import { TeacherChat } from './TeacherChat'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const CARD = 'rounded-2xl border border-line bg-panel'

/**
 * The teacher: one screen for what you are working toward and the conversation
 * that shapes it (docs/product/next-session-design.md §4, §10).
 *
 * Goals and the lesson used to be two pages. They are one thing to the player —
 * the teacher runs the portfolio, you talk to it — so they are one screen: the
 * conversation, and beside it the paths it has written, each opening on skill.
 * The page shows the paths and lets one be adjusted; it never authors one, the
 * teacher does. Owner decision 2026-09-20, session JM-S-28: "this is the core
 * flow of the whole app".
 */
export default function TeacherPage() {
  const { goals, pending, failed } = useGoals()
  const trpc = useTRPC()
  // The solidity of each stage comes from the same answer the tools give, so
  // the page and the teacher never disagree about what is open.
  const { data } = useQuery(trpc.goals.list.queryOptions())
  const progress = data?.status === 'ok' ? data.goals : []
  const kind: LessonKind = goals.length === 0 ? 'first_lesson' : 'check_in'

  return (
    <div className={PAGE_WIDE}>
      <h1 className="font-display text-2xl font-bold tracking-tight">Teacher</h1>
      <p className="mt-1 max-w-xl text-sm text-fg-2">
        What you are working toward, and the conversation that shapes it. The teacher writes your path; you tell it
        what you want.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <TeacherChat kind={kind} pending={pending} />

        <section aria-labelledby="teacher-paths" className="min-w-0">
          <h2 id="teacher-paths" className="font-display text-base font-semibold tracking-tight">
            Your path
          </h2>

          {pending ? (
            <p className="mt-3 text-sm text-muted">Loading your goals…</p>
          ) : failed ? (
            <p role="alert" className="mt-3 text-sm text-danger-text">
              Your goals could not be loaded. Try again in a moment.
            </p>
          ) : goals.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-line-strong p-6 text-center">
              <p className="font-medium text-fg">No path yet</p>
              <p className="mt-1 text-sm text-muted">Your first lesson writes one — say what you want to play.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {goals.map((goal) => {
                const solidity = progress.find((item) => item.id === goal.id)?.solidity ?? []
                const open = progress.find((item) => item.id === goal.id)?.openStages ?? [0]
                const items = goal.stages.reduce((sum, stage) => sum + stage.items.length, 0)
                return (
                  <li key={goal.id} className={`${CARD} p-4`}>
                    <Link
                      to="/teacher/$goalId"
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
                    {/* One chip per stage: how solid it is, and whether it has opened. */}
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
        </section>
      </div>
    </div>
  )
}
