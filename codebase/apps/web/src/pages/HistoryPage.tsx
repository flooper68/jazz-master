import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { LESSONS } from '../content'
import type { LessonArea } from '../content'
import {
  filterSessions,
  formatDuration,
  formatTime,
  groupSessionsByDay,
  tallyGrades,
  type TimeRange,
} from '../history'
import { sessionsStore, type PracticeSession } from '../storage'

const AREA_LABELS: Record<LessonArea, string> = {
  scales: 'Scales',
  arpeggios: 'Arpeggios',
  chords: 'Chords',
  standards: 'Standards',
}

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

const selectClasses =
  'rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400'

export default function HistoryPage() {
  // Read-only view: the store is only written by the runner, so one read at
  // mount is current for the page's lifetime.
  const [sessions] = useState(() => sessionsStore.get())
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
      <p className="mt-4 text-zinc-300">
        Every practice session, day by day. Expand a session for per-exercise
        grades.
      </p>
      {sessions.length === 0 ? (
        <div className="mt-8 max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">
            No practice sessions yet. Run your first lesson on the{' '}
            <Link
              to="/practice"
              className="font-medium text-amber-400 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              Practice page
            </Link>{' '}
            and it will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex max-w-2xl flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              Area
              <select
                value={area}
                onChange={(event) =>
                  setArea(event.target.value as LessonArea | 'all')
                }
                className={selectClasses}
              >
                <option value="all">All areas</option>
                {filterAreas.map((filterArea) => (
                  <option key={filterArea} value={filterArea}>
                    {AREA_LABELS[filterArea]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              Period
              <select
                value={range}
                onChange={(event) =>
                  setRange(event.target.value as TimeRange)
                }
                className={selectClasses}
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {dayGroups.length === 0 ? (
            <div className="mt-6 max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-300">
                No sessions match these filters.
              </p>
            </div>
          ) : (
            dayGroups.map((group) => (
              <section key={group.date} className="mt-8 max-w-2xl">
                <h2 className="text-sm font-medium text-zinc-400">
                  {group.date}
                </h2>
                <ul className="mt-2 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
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
        <h3 className="font-medium text-zinc-100">{title}</h3>
        <span className="shrink-0 text-sm text-zinc-400">
          {formatTime(session.startedAt)} · {formatDuration(session.durationSeconds)}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <span className="flex items-baseline gap-3 text-sm text-zinc-400">
          <span>
            <span aria-hidden="true">
              {tally.gotIt} ✓ · {tally.shaky} ~ · {tally.missed} ✗
            </span>
            <span className="sr-only">
              {tally.gotIt} got it, {tally.shaky} shaky, {tally.missed} missed
            </span>
          </span>
          {!session.completed && (
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-amber-400">
              Incomplete
            </span>
          )}
          {/* Reserved slot for EPIC-010 machine scores; nothing writes it yet. */}
          {session.score !== undefined && <span>Score {session.score}</span>}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={`${toggleText} for ${title} at ${formatTime(session.startedAt)}`}
          className="shrink-0 text-sm text-zinc-400 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          {toggleText}
        </button>
      </div>
      {expanded && (
        <div id={detailsId} className="mt-3 border-t border-zinc-800 pt-3">
          {!session.completed && lesson && (
            <p className="text-sm text-zinc-400">
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
                <span className="text-zinc-300">
                  {exerciseTitleById.get(result.exerciseId) ?? result.exerciseId}
                </span>
                <span className="shrink-0 text-zinc-400">
                  {GRADE_LABELS[result.grade]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}
