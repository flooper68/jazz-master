import { Badge, Select } from '../../components/ui/Primitives'
import { useId, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { PracticeSession } from '../../appData/session'
import { AREA_LABELS } from '../../components/areaLabels'
import { LESSONS } from '../../content'
import type { LessonArea } from '../../content'
import {
  filterSessions,
  formatDuration,
  formatTime,
  groupSessionsByDay,
  tallyGrades,
  type TimeRange,
} from '../../history'
import { useTRPC } from '../trpc'

const GRADE_LABELS = {
  'got-it': 'Got it',
  shaky: 'Shaky',
  missed: 'Missed',
} as const

const RANGE_OPTIONS: readonly { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

const filterAreas = [...new Set(LESSONS.map((lesson) => lesson.area))]
const lessonById = new Map(LESSONS.map((lesson) => [lesson.id, lesson]))
const areaByLessonId = new Map(
  LESSONS.map((lesson) => [lesson.id, lesson.area]),
)
const exerciseTitleById = new Map(
  LESSONS.flatMap((lesson) =>
    lesson.exercises.map((exercise) => [exercise.id, exercise.title] as const),
  ),
)

const EMPTY_SESSIONS: readonly PracticeSession[] = []

export default function HistoryPage() {
  const trpc = useTRPC()
  const sessionsQuery = useQuery(trpc.sessions.list.queryOptions())
  const sessions =
    sessionsQuery.data?.status === 'ok'
      ? sessionsQuery.data.sessions
      : EMPTY_SESSIONS
  const [now] = useState(() => new Date())
  const [area, setArea] = useState<LessonArea | 'all'>('all')
  const [range, setRange] = useState<TimeRange>('all')

  const dayGroups = useMemo(
    () =>
      groupSessionsByDay(
        filterSessions(sessions, { area, range }, areaByLessonId, now),
      ),
    [area, now, range, sessions],
  )

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">History</h1>
      <p className="mt-4 text-fg-2">
        Every practice session, day by day. Expand a session for per-exercise
        grades.
      </p>
      {sessionsQuery.isPending ? (
        <div className="mt-8 max-w-2xl rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm text-fg-2">Loading history...</p>
        </div>
      ) : sessionsQuery.isError || sessionsQuery.data?.status === 'error' ? (
        <div className="mt-8 max-w-2xl rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm text-fg-2">
            Practice history could not be loaded.
          </p>
        </div>
      ) : sessionsQuery.data?.status === 'unconfigured' ? (
        <div className="mt-8 max-w-2xl rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm text-fg-2">
            Practice history is not configured yet.
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-8 max-w-2xl rounded-2xl border border-line bg-panel p-4">
          <p className="text-sm text-fg-2">
            No practice sessions yet. Run your first lesson on the{' '}
            <Link
              to="/practice"
              className="font-medium text-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              Practice page
            </Link>{' '}
            and it will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex max-w-2xl flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-muted">
              Area
              <Select
                value={area}
                onChange={(event) =>
                  setArea(event.target.value as LessonArea | 'all')
                }
              >
                <option value="all">All areas</option>
                {filterAreas.map((filterArea) => (
                  <option key={filterArea} value={filterArea}>
                    {AREA_LABELS[filterArea]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              Period
              <Select
                value={range}
                onChange={(event) =>
                  setRange(event.target.value as TimeRange)
                }
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {dayGroups.length === 0 ? (
            <div className="mt-6 max-w-2xl rounded-2xl border border-line bg-panel p-4">
              <p className="text-sm text-fg-2">
                No sessions match these filters.
              </p>
            </div>
          ) : (
            dayGroups.map((group) => (
              <section key={group.date} className="mt-8 max-w-2xl">
                <h2 className="text-sm font-medium text-muted">
                  {group.date}
                </h2>
                <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-panel">
                  {group.sessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}

function SessionRow({ session }: { session: PracticeSession }) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const lesson = lessonById.get(session.lessonId)
  const title = lesson?.title ?? session.lessonId
  const tally = tallyGrades(session.results)
  // Keeps the accessible name containing the visible text in both states
  // (WCAG 2.5.3 Label in Name).
  const toggleText = expanded ? 'Hide details' : 'Details'

  return (
    <li className="p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium text-fg">{title}</h3>
        <span className="shrink-0 text-sm text-muted">
          {formatTime(session.startedAt)} · {formatDuration(session.durationSeconds)}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <span className="flex items-baseline gap-3 text-sm text-muted">
          <span>
            <span aria-hidden="true">
              {tally.gotIt} ✓ · {tally.shaky} ~ · {tally.missed} ✗
            </span>
            <span className="sr-only">
              {tally.gotIt} got it, {tally.shaky} shaky, {tally.missed} missed
            </span>
          </span>
          {!session.completed && (
            <Badge>Incomplete</Badge>
          )}
          {session.score !== undefined && <span>Score {session.score}</span>}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={`${toggleText} for ${title} at ${formatTime(session.startedAt)}`}
          className="shrink-0 text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {toggleText}
        </button>
      </div>
      {expanded && (
        <div id={detailsId} className="mt-3 border-t border-line pt-3">
          {!session.completed && lesson && (
            <p className="text-sm text-muted">
              {session.results.length} of {lesson.exercises.length} exercises
              graded before the session ended.
            </p>
          )}
          <ul className="mt-2 flex flex-col gap-1">
            {session.results.map((result) => (
              <li
                key={result.exerciseId}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="text-fg-2">
                  {exerciseTitleById.get(result.exerciseId) ?? result.exerciseId}
                </span>
                <span className="shrink-0 text-muted">
                  {GRADE_LABELS[result.grade]}
                  {result.score !== undefined && ` · Score ${result.score.score}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}
