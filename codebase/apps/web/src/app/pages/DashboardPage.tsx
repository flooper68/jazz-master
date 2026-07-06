import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { AREA_LABELS } from '../../components/areaLabels'
import { LESSONS } from '../../content'
import {
  areaStatuses,
  completedLessonIdsOn,
  currentStreakDays,
  minutesThisWeek,
  WEEK_DAYS,
} from '../../dashboard'
import { useTodayPlan } from '../../planner'
import type { PracticeLocationState } from './PracticePage'

const linkClasses =
  'font-medium text-amber-400 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { today, profile, sessions, plan } = useTodayPlan()
  const completedLessonIds = useMemo(
    () => completedLessonIdsOn(sessions, plan.date),
    [plan.date, sessions],
  )
  const streak = useMemo(
    () => currentStreakDays(sessions, today),
    [sessions, today],
  )
  const practicedMinutes = useMemo(
    () => minutesThisWeek(sessions, today),
    [sessions, today],
  )
  const areas = useMemo(() => areaStatuses(sessions, LESSONS), [sessions])
  const budgetMinutes = profile.minutesPerDay * WEEK_DAYS

  const nextItem =
    plan.items.find((item) => !completedLessonIds.has(item.lessonId)) ??
    plan.items[0]
  const planDone =
    plan.items.length > 0 &&
    plan.items.every((item) => completedLessonIds.has(item.lessonId))

  const startPracticing = () => {
    if (!nextItem) return
    const state: PracticeLocationState = { startLessonId: nextItem.lessonId }
    navigate('/practice', { state })
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Dashboard
      </h1>
      <p className="mt-4 text-zinc-300">
        What to practice now, and how the week is going.
      </p>

      <section className="mt-8 max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium text-zinc-400">Today's plan</h2>
          <span className="shrink-0 text-sm text-zinc-500">
            {plan.totalMinutes} min · {plan.date}
          </span>
        </div>
        {plan.items.length === 0 ? (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-300">
              No matching lessons yet. Adjust your goals on the{' '}
              <Link
                to="/profile"
                className={linkClasses}
              >
                Profile page
              </Link>{' '}
              or browse the{' '}
              <Link
                to="/practice"
                className={linkClasses}
              >
                lesson pack
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900">
            <ol className="divide-y divide-zinc-800">
              {plan.items.map((item) => {
                const done = completedLessonIds.has(item.lessonId)
                return (
                  <li key={item.lessonId} className="p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-medium text-zinc-100">
                        {item.lessonTitle}
                      </h3>
                      <span className="shrink-0 text-sm text-zinc-400">
                        {done ? 'Done today' : `~${item.estimatedMinutes} min`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{item.reason}</p>
                  </li>
                )
              })}
            </ol>
            <div className="flex items-center justify-between gap-4 border-t border-zinc-800 p-4">
              <span className="text-sm text-zinc-400">
                {planDone
                  ? 'Plan complete — nice work.'
                  : `Next up: ${nextItem.lessonTitle}`}
              </span>
              <button
                type="button"
                onClick={startPracticing}
                className="shrink-0 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
              >
                {planDone ? 'Practice again' : 'Start practicing'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section
        aria-label="Practice stats"
        className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2"
      >
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Streak</h2>
          <p className="mt-2 text-3xl font-bold text-zinc-100">
            {streak} {streak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {streak === 0
              ? 'Practice today to start one.'
              : 'Consecutive days practiced.'}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-sm font-medium text-zinc-400">This week</h2>
          <p className="mt-2 text-3xl font-bold text-zinc-100">
            {practicedMinutes}
            <span className="text-base font-normal text-zinc-400">
              {' '}
              of {budgetMinutes} min
            </span>
          </p>
          <div
            aria-hidden="true"
            className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-amber-500"
              style={{
                width: `${Math.min(100, budgetMinutes > 0 ? (practicedMinutes / budgetMinutes) * 100 : 0)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Last {WEEK_DAYS} days against your {profile.minutesPerDay} min/day
            budget.
          </p>
        </div>
      </section>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-medium text-zinc-400">Areas</h2>
        <ul className="mt-2 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
          {areas.map((status) => (
            <li key={status.area} className="p-4">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-medium text-zinc-100">
                  {AREA_LABELS[status.area]}
                </h3>
                <span className="shrink-0 text-sm text-zinc-400">
                  {status.completedLessonCount} of {status.lessonCount} lessons
                  completed
                </span>
              </div>
              <p className="mt-1 text-sm">
                {status.attentionLessonTitles.length > 0 ? (
                  <span className="text-amber-400">
                    Needs attention: {status.attentionLessonTitles.join(', ')}
                  </span>
                ) : status.lastPracticedDate ? (
                  <span className="text-zinc-400">
                    Last practiced {status.lastPracticedDate}.
                  </span>
                ) : (
                  <span className="text-zinc-400">Not practiced yet.</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 max-w-2xl text-sm">
        <Link
          to="/history"
          className={linkClasses}
        >
          See full practice history →
        </Link>
      </p>
    </div>
  )
}
