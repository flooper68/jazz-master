import { useLocation, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PracticeSession } from '../../appData/session'
import { AREA_LABELS } from '../../components/areaLabels'
import { PracticeRunner } from '../../components/PracticeRunner'
import { useViewFocus } from '../../components/useViewFocus'
import { LESSONS } from '../../content'
import type { Lesson } from '../../content'
import { completedLessonIdsOn } from '../../dashboard'
import { useTodayPlan, type DailyPlan, type TodayPlanStatus } from '../../planner'
import { useTRPC } from '../trpc'
import { usePreferences } from '../usePreferences'

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

// Navigation state the dashboard's Start handoff sends (TASK-019), carried as
// typed history state so it stays out of the URL.
declare module '@tanstack/history' {
  interface HistoryState {
    startLessonId?: string
  }
}

function startRun(lesson: Lesson): ActiveRun {
  return { lesson, sessionId: crypto.randomUUID(), startedAt: Date.now() }
}

export default function PracticePage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const { status, message, plan, sessions, refreshSessions } = useTodayPlan()
  const preferenceControls = usePreferences()
  const { mutate: saveSession } = useMutation(
    trpc.sessions.upsert.mutationOptions({
      onSuccess() {
        refreshSessions()
        void queryClient.invalidateQueries({
          queryKey: trpc.sessions.list.queryKey(),
        })
      },
    }),
  )
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(() => {
    const lesson = location.state.startLessonId
      ? lessonById.get(location.state.startLessonId)
      : undefined
    return lesson ? startRun(lesson) : null
  })
  const completedLessonIds = useMemo(
    () => completedLessonIdsOn(sessions, plan.date),
    [plan.date, sessions],
  )
  // ISSUE-002: returning from a run (End lesson / Done) is a same-route view
  // swap; refocus the list heading. The ref is only attached in the list view —
  // on list → runner the incoming PracticeRunner focuses its own heading.
  const listHeadingRef = useViewFocus<HTMLHeadingElement>(
    activeRun ? `run-${activeRun.sessionId}` : 'list',
  )
  const saveQueueRef = useRef(Promise.resolve())
  const saveSessionProgress = useCallback(
    (session: PracticeSession) => {
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(
          () =>
            new Promise<void>((resolve) => {
              saveSession(session, {
                onSettled() {
                  resolve()
                },
              })
            }),
        )
      return saveQueueRef.current
    },
    [saveSession],
  )

  // Consume the handoff state so refresh/back doesn't restart the lesson.
  useEffect(() => {
    if (location.state.startLessonId == null) return
    void navigate({
      to: '/practice',
      replace: true,
      state: (prev) => ({ ...prev, startLessonId: undefined }),
    })
  }, [location.state.startLessonId, navigate])

  const startLesson = (lesson: Lesson) => {
    setActiveRun(startRun(lesson))
  }

  const exitRun = () => {
    setActiveRun(null)
    refreshSessions()
  }

  if (activeRun) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Practice
        </h1>
        <div className="mt-6">
          {preferenceControls.message && (
            <p role="alert" className="mb-3 text-sm text-red-300">
              {preferenceControls.message}
            </p>
          )}
          {preferenceControls.status === 'pending' ? (
            <p className="text-sm text-zinc-300">Loading practice settings...</p>
          ) : preferenceControls.status === 'error' ? (
            <div>
              <p className="text-sm text-zinc-300">
                Practice settings must load before this lesson can start.
              </p>
              <button
                type="button"
                onClick={exitRun}
                className="mt-3 rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
              >
                Back to lessons
              </button>
            </div>
          ) : (
            <>
              <p aria-live="polite" className="mb-3 text-sm text-zinc-400">
                {preferenceControls.isSaving ? 'Saving practice settings...' : ''}
              </p>
              <PracticeRunner
                key={activeRun.sessionId}
                lesson={activeRun.lesson}
                sessionId={activeRun.sessionId}
                startedAt={activeRun.startedAt}
                onSessionChange={saveSessionProgress}
                onExit={exitRun}
                preferences={preferenceControls.preferences}
                onNotationDisplayModeChange={
                  preferenceControls.saveNotationDisplayMode
                }
                onScoringToleranceChange={
                  preferenceControls.saveScoringTolerance
                }
                onPlayAlongTempoChange={preferenceControls.savePlayAlongTempo}
              />
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1
        ref={listHeadingRef}
        tabIndex={-1}
        className="font-display text-2xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        Practice
      </h1>
      <p className="mt-4 text-zinc-300">
        The v1 lesson pack — scales and arpeggios by level. Pick a lesson and
        start a guided session.
      </p>
      <TodayPlan
        status={status}
        message={message}
        plan={plan}
        completedLessonIds={completedLessonIds}
        onStart={startLesson}
      />
      {areas.map((area) => (
        <section key={area} className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium text-zinc-400">
            {AREA_LABELS[area]}
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
  status,
  message,
  plan,
  completedLessonIds,
  onStart,
}: {
  status: TodayPlanStatus
  message: string | null
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
      {status === 'pending' ? (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">Loading today's plan...</p>
        </div>
      ) : status !== 'ready' ? (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">
            {message ?? "Today's plan could not be loaded."}
          </p>
        </div>
      ) : plan.items.length === 0 ? (
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
                    {done ? 'Done today' : AREA_LABELS[item.area]}
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
