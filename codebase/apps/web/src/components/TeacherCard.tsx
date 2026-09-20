import { Link } from '@tanstack/react-router'
import type { Goal } from '../appData/goal'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

/** A goal with how far along it is, as `goals.list` answers. */
export interface GoalProgress {
  id: string
  solidity: number[] | null
  openStages: number[] | null
}

interface TeacherCardProps {
  goals: readonly Goal[]
  progress: readonly GoalProgress[]
  pending: boolean
}

/**
 * The teacher on the home page: the path you are on, and the way to the
 * conversation that changes it. It sits above the day because it is the reason
 * the day looks the way it does — the path decides what the practice offers.
 * A player with no path is shown the door to their first lesson instead.
 */
export function TeacherCard({ goals, progress, pending }: TeacherCardProps) {
  const active = goals.filter((goal) => goal.status === 'active').slice(0, 2)
  return (
    <section
      aria-labelledby="home-teacher"
      className="rounded-2xl border border-accent/40 bg-accent-soft/40 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6"
    >
      <div className="min-w-0 flex-1">
        <h2 id="home-teacher" className="font-display text-base font-semibold tracking-tight">
          {pending ? 'Your path' : active.length === 0 ? 'Have your first lesson' : 'Your path'}
        </h2>
        {pending ? (
          <p className="mt-1 text-sm text-muted">Looking at what you are working on…</p>
        ) : active.length === 0 ? (
          <p className="mt-1 text-sm text-fg-2">
            Tell the teacher what you want to play, and it writes you a path — stages that open as you get solid.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {active.map((goal) => {
              const found = progress.find((item) => item.id === goal.id)
              const open = found?.openStages ?? [0]
              const solidity = found?.solidity ?? []
              const current = open[open.length - 1] ?? 0
              const stage = goal.stages[current]
              return (
                <li key={goal.id} className="min-w-0">
                  <Link
                    to="/teacher/$goalId"
                    params={{ goalId: goal.id }}
                    className={`font-medium text-fg underline-offset-4 hover:underline ${FOCUS}`}
                  >
                    {goal.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {stage?.title ?? `Stage ${current + 1}`} · {Math.round((solidity[current] ?? 0) * 100)}% solid ·{' '}
                    {open.length} of {goal.stages.length} {goal.stages.length === 1 ? 'stage' : 'stages'} open
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <Link
        to="/teacher"
        className={`mt-3 inline-flex shrink-0 items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg sm:mt-0 ${FOCUS}`}
      >
        {active.length === 0 && !pending ? 'Start the lesson' : 'Talk to the teacher'}
      </Link>
    </section>
  )
}
