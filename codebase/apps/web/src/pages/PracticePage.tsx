import { useEffect, useMemo, useState } from 'react'
import { PracticeRunner } from '../components/PracticeRunner'
import { LESSONS } from '../content'
import type { Lesson, LessonArea } from '../content'
import { generatePlan, toPlanDate, type DailyPlan } from '../planner'
import {
  defaultProfile,
  getDailyPlan,
  profileStore,
  saveDailyPlan,
  sessionsStore,
  type PracticeSession,
} from '../storage'

const AREA_LABELS: Partial<Record<LessonArea, string>> = {
  scales: 'Scales',
  arpeggios: 'Arpeggios',
}

// Authored order is curriculum order, so grouping preserves level progression.
const areas = [...new Set(LESSONS.map((lesson) => lesson.area))]
const titleById = new Map(LESSONS.map((lesson) => [lesson.id, lesson.title]))
const lessonById = new Map(LESSONS.map((lesson) => [lesson.id, lesson]))

/** A started run — identity is minted here so the runner's render stays pure. */
interface ActiveRun {
  lesson: Lesson
  sessionId: string
  startedAt: number
}

export default function PracticePage() {
  const [today] = useState(() => new Date())
  const [planDate] = useState(() => toPlanDate(today))
  const [profile] = useState(
    () => profileStore.get() ?? defaultProfile(today.toISOString()),
  )
  const [sessions, setSessions] = useState(() => sessionsStore.get())
  const [storedPlan, setStoredPlan] = useState<DailyPlan | null>(() =>
    getDailyPlan(planDate),
  )
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null)
  const plan = useMemo(
    () => storedPlan ?? generatePlan(profile, sessions, LESSONS, today),
    [profile, sessions, storedPlan, today],
  )
  const completedLessonIds = useMemo(
    () => completedLessonsForDate(sessions, plan.date),
    [plan.date, sessions],
  )

  useEffect(() => {
    if (storedPlan !== null) return
    saveDailyPlan(plan)
    setStoredPlan(plan)
  }, [plan, storedPlan])

  const startLesson = (lesson: Lesson) => {
    setActiveRun({
      lesson,
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
    })
  }

  const exitRun = () => {
    setActiveRun(null)
    setSessions(sessionsStore.get())
  }

  if (activeRun) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Practice
        </h1>
        <div className="mt-6">
          <PracticeRunner
            key={activeRun.sessionId}
            lesson={activeRun.lesson}
            sessionId={activeRun.sessionId}
            startedAt={activeRun.startedAt}
            onExit={exitRun}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Practice</h1>
      <p className="mt-4 text-zinc-300">
        The v1 lesson pack — scales and arpeggios by level. Pick a lesson and
        start a guided session.
      </p>
      <TodayPlan
        plan={plan}
        completedLessonIds={completedLessonIds}
        onStart={startLesson}
      />
      {areas.map((area) => (
        <section key={area} className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium text-zinc-400">
            {AREA_LABELS[area] ?? area}
          </h2>
          <ul className="mt-2 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
            {LESSONS.filter((lesson) => lesson.area === area).map((lesson) => (
              <li key={lesson.id} className="p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium text-zinc-100">{lesson.title}</span>
                  <span className="shrink-0 text-sm text-zinc-400">
                    Level {lesson.level} · ~{lesson.estimatedMinutes} min
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4">
                  <p className="text-sm text-zinc-400">
                    {lesson.exercises.length} exercises
                    {lesson.prerequisites.length > 0 &&
                      ` · after: ${lesson.prerequisites
                        .map((id) => titleById.get(id) ?? id)
                        .join(', ')}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => startLesson(lesson)}
                    className="shrink-0 rounded-md bg-amber-500 px-3 py-1 text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                    aria-label={`Start ${lesson.title}`}
                  >
                    Start
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function TodayPlan({
  plan,
  completedLessonIds,
  onStart,
}: {
  plan: DailyPlan
  completedLessonIds: ReadonlySet<string>
  onStart: (lesson: Lesson) => void
}) {
  return (
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
            No matching lessons yet. Adjust your profile goals or browse the
            lesson pack below.
          </p>
        </div>
      ) : (
        <ol className="mt-3 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
          {plan.items.map((item, index) => {
            const lesson = lessonById.get(item.lessonId)
            const done = completedLessonIds.has(item.lessonId)
            return (
              <li key={item.lessonId} className="p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-zinc-500">
                      Item {index + 1}
                    </p>
                    <h3 className="mt-1 font-medium text-zinc-100">
                      {item.lessonTitle}
                    </h3>
                  </div>
                  <span className="shrink-0 text-sm text-zinc-400">
                    ~{item.estimatedMinutes} min
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{item.reason}</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">
                    {done ? 'Done today' : AREA_LABELS[item.area] ?? item.area}
                  </span>
                  <button
                    type="button"
                    onClick={() => lesson && onStart(lesson)}
                    disabled={!lesson}
                    className="shrink-0 rounded-md bg-amber-500 px-3 py-1 text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                    aria-label={`Start planned lesson ${item.lessonTitle}`}
                  >
                    {done ? 'Practice again' : 'Start'}
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function completedLessonsForDate(
  sessions: readonly PracticeSession[],
  date: string,
): ReadonlySet<string> {
  return new Set(
    sessions
      .filter(
        (session) =>
          session.completed && toPlanDate(new Date(session.startedAt)) === date,
      )
      .map((session) => session.lessonId),
  )
}
