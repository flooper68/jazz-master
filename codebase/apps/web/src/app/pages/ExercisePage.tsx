import { useNavigate, useParams } from '@tanstack/react-router'
import { ExerciseRunner } from '../../components/ExerciseRunner'
import { EXERCISES, type Exercise } from '../../content'
import { STAGE_FRAME, UnsavedRunAlert, useRunSaver } from '../useRunSaver'
import NotFoundPage from './NotFoundPage'

const exerciseById = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]))

/** The player page: the exercise named in the URL, its runs saved as they are played. */
export default function ExercisePage() {
  // Loose params so the page also renders inside Storybook's ad hoc router;
  // the route file's loader already turned an unknown id into a 404.
  const { exerciseId } = useParams({ strict: false })
  const exercise = exerciseById.get(exerciseId ?? '')

  if (!exercise) return <NotFoundPage />

  // Keyed on the exercise so an exercise-to-exercise navigation starts afresh.
  return <ExerciseStage key={exercise.id} exercise={exercise} />
}

function ExerciseStage({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate()
  const { save, unsaved } = useRunSaver()

  return (
    <div className={STAGE_FRAME}>
      <UnsavedRunAlert unsaved={unsaved} onRetry={save} />
      <ExerciseRunner
        exercise={exercise}
        onRunChange={save}
        onExit={() => void navigate({ to: '/' })}
      />
    </div>
  )
}
