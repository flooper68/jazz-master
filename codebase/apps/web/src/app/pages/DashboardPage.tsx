import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
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

const linkClasses =
  'font-medium text-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { status, message, today, profile, sessions, plan } = useTodayPlan()
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
    void navigate({
      to: '/practice',
      state: (prev) => ({ ...prev, startLessonId: nextItem.lessonId }),
    })
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Dashboard
      </h1>
      <p className="mt-4 text-fg-2">
        What to practice now, and how the week is going.
      </p>

      <section className="mt-8 max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium text-muted">Today's plan</h2>
          <span className="shrink-0 text-sm text-muted">
            {plan.totalMinutes} min · {plan.date}
          </span>
        </div>
        {status === 'pending' ? (
          <div className="mt-3 rounded-2xl border border-line bg-panel p-4">
            <p className="text-sm text-fg-2">Loading today's plan...</p>
          </div>
        ) : status !== 'ready' ? (
          <div className="mt-3 rounded-2xl border border-line bg-panel p-4">
            <p className="text-sm text-fg-2">
              {message ?? "Today's plan could not be loaded."}
            </p>
          </div>
        ) : plan.items.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-line bg-panel p-4">
            <p className="text-sm text-fg-2">
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
          <div className="mt-3 rounded-2xl border border-line bg-panel">
            <ol className="divide-y divide-line">
              {plan.items.map((item) => {
                const done = completedLessonIds.has(item.lessonId)
                return (
                  <li key={item.lessonId} className="p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-medium text-fg">
                        {item.lessonTitle}
                      </h3>
                      <span className="shrink-0 text-sm text-muted">
                        {done ? 'Done today' : `~${item.estimatedMinutes} min`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{item.reason}</p>
                  </li>
                )
              })}
            </ol>
            <div className="flex items-center justify-between gap-4 border-t border-line p-4">
              <span className="text-sm text-muted">
                {planDone
                  ? 'Plan complete — nice work.'
                  : `Next up: ${nextItem.lessonTitle}`}
              </span>
              <button
                type="button"
                onClick={startPracticing}
                className="shrink-0 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
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
        <div className="rounded-2xl border border-line bg-panel p-4">
          <h2 className="text-sm font-medium text-muted">Streak</h2>
          <p className="mt-2 text-3xl font-bold text-fg">
            {streak} {streak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {streak === 0
              ? 'Practice today to start one.'
              : 'Consecutive days practiced.'}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <h2 className="text-sm font-medium text-muted">This week</h2>
          <p className="mt-2 text-3xl font-bold text-fg">
            {practicedMinutes}
            <span className="text-base font-normal text-muted">
              {' '}
              of {budgetMinutes} min
            </span>
          </p>
          <div
            aria-hidden="true"
            className="mt-3 h-2 overflow-hidden rounded-full bg-panel-2"
          >
            <div
              className="h-full rounded-full bg-cta"
              style={{
                width: `${Math.min(100, budgetMinutes > 0 ? (practicedMinutes / budgetMinutes) * 100 : 0)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            Last {WEEK_DAYS} days against your {profile.minutesPerDay} min/day
            budget.
          </p>
        </div>
      </section>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-medium text-muted">Areas</h2>
        <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-panel">
          {areas.map((status) => (
            <li key={status.area} className="p-4">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-medium text-fg">
                  {AREA_LABELS[status.area]}
                </h3>
                <span className="shrink-0 text-sm text-muted">
                  {status.completedLessonCount} of {status.lessonCount} lessons
                  completed
                </span>
              </div>
              <p className="mt-1 text-sm">
                {status.attentionLessonTitles.length > 0 ? (
                  <span className="text-accent-text">
                    Needs attention: {status.attentionLessonTitles.join(', ')}
                  </span>
                ) : status.lastPracticedDate ? (
                  <span className="text-muted">
                    Last practiced {status.lastPracticedDate}.
                  </span>
                ) : (
                  <span className="text-muted">Not practiced yet.</span>
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
