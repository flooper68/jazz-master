import { useNavigate, useParams } from '@tanstack/react-router'
import { ExerciseRunner } from '../../components/ExerciseRunner'
import { EXERCISES } from '../../content'
import NotFoundPage from './NotFoundPage'

const exerciseById = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]))

/** The player page: one run of the exercise named in the URL. */
export default function ExercisePage() {
  const navigate = useNavigate()
  // Loose params so the page also renders inside Storybook's ad hoc router;
  // the route file's loader already turned an unknown id into a 404.
  const { exerciseId } = useParams({ strict: false })
  const exercise = exerciseById.get(exerciseId ?? '')

  if (!exercise) return <NotFoundPage />

  // The player is a full-bleed stage: cancel the shell's page padding and
  // take the viewport height below the header.
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-4.5rem)] min-h-[520px] flex-col px-2 py-2 md:-mx-10 md:-my-10">
      {/* Keyed on the exercise so an exercise-to-exercise navigation starts a fresh run. */}
      <ExerciseRunner
        key={exercise.id}
        exercise={exercise}
        onExit={() => void navigate({ to: '/' })}
      />
    </div>
  )
}
