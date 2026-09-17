import { Link } from '@tanstack/react-router'
import { AREA_LABELS } from '../../components/areaLabels'
import { EXERCISES, exerciseSeconds } from '../../content'

// Authored order is the order to learn them in, so grouping keeps it within each area.
const areas = [...new Set(EXERCISES.map((exercise) => exercise.area))]

export default function ExercisesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Exercises
      </h1>
      <p className="mt-4 text-fg-2">
        Scales, arpeggios and lines by level. Pick an exercise, pick up the
        guitar, and play.
      </p>
      {areas.map((area) => (
        <section key={area} className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium text-muted">
            {AREA_LABELS[area]}
          </h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-panel">
            {EXERCISES.filter((exercise) => exercise.area === area).map((exercise) => (
              <li key={exercise.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <h3 className="font-medium text-fg">{exercise.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    Level {exercise.level} · ~{Math.max(Math.round(exerciseSeconds(exercise) / 60), 1)} min · {exercise.tempoBpm} BPM
                  </p>
                </div>
                <Link
                  to="/exercises/$exerciseId"
                  params={{ exerciseId: exercise.id }}
                  aria-label={`Start ${exercise.title}`}
                  className="shrink-0 rounded-lg bg-cta px-3 py-1 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  Start
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
