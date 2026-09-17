import { createFileRoute, notFound } from '@tanstack/react-router'
import { EXERCISES } from '../../content'
import ExercisePage from '../pages/ExercisePage'
import { isLibraryExerciseId } from '../useExerciseCatalog'

const exerciseIds = new Set(EXERCISES.map((exercise) => exercise.id))

export const Route = createFileRoute('/exercises/$exerciseId')({
  loader: ({ params }) => {
    // The pack is known here and now; a library id is the page's to resolve once the library has answered.
    if (!exerciseIds.has(params.exerciseId) && !isLibraryExerciseId(params.exerciseId)) throw notFound()
  },
  component: ExercisePage,
})
