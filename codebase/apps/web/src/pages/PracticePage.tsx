import { useState } from 'react'
import { PracticeRunner } from '../components/PracticeRunner'
import { LESSONS } from '../content'
import type { Lesson, LessonArea } from '../content'

const AREA_LABELS: Partial<Record<LessonArea, string>> = {
  scales: 'Scales',
  arpeggios: 'Arpeggios',
}

// Authored order is curriculum order, so grouping preserves level progression.
const areas = [...new Set(LESSONS.map((lesson) => lesson.area))]
const titleById = new Map(LESSONS.map((lesson) => [lesson.id, lesson.title]))

/** A started run — identity is minted here so the runner's render stays pure. */
interface ActiveRun {
  lesson: Lesson
  sessionId: string
  startedAt: number
}

export default function PracticePage() {
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null)

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
            onExit={() => setActiveRun(null)}
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
                    onClick={() =>
                      setActiveRun({
                        lesson,
                        sessionId: crypto.randomUUID(),
                        startedAt: Date.now(),
                      })
                    }
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
