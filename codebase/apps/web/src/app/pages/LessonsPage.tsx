import { Link } from '@tanstack/react-router'
import { AREA_LABELS } from '../../components/areaLabels'
import { LESSONS } from '../../content'

// Authored order is curriculum order, so grouping preserves level progression.
const areas = [...new Set(LESSONS.map((lesson) => lesson.area))]
const titleById = new Map(LESSONS.map((lesson) => [lesson.id, lesson.title]))

export default function LessonsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Lessons
      </h1>
      <p className="mt-4 text-fg-2">
        Scales and arpeggios by level. Pick a lesson, pick up the guitar, and
        play.
      </p>
      {areas.map((area) => (
        <section key={area} className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium text-muted">
            {AREA_LABELS[area]}
          </h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-panel">
            {LESSONS.filter((lesson) => lesson.area === area).map((lesson) => (
              <li key={lesson.id} className="p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-medium text-fg">{lesson.title}</h3>
                  <span className="shrink-0 text-sm text-muted">
                    Level {lesson.level} · ~{lesson.estimatedMinutes} min
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4">
                  <p className="text-sm text-muted">
                    {lesson.exercises.length} exercises
                    {lesson.prerequisites.length > 0 &&
                      ` · after: ${lesson.prerequisites
                        .map((id) => titleById.get(id) ?? id)
                        .join(', ')}`}
                  </p>
                  <Link
                    to="/lessons/$lessonId"
                    params={{ lessonId: lesson.id }}
                    aria-label={`Start ${lesson.title}`}
                    className="shrink-0 rounded-lg bg-cta px-3 py-1 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                  >
                    Start
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
