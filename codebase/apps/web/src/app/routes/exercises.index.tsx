import { createFileRoute } from '@tanstack/react-router'
import { validateExerciseSearch } from '../../appData/exerciseSearch'
import ExercisesPage from '../pages/ExercisesPage'

export const Route = createFileRoute('/exercises/')({
  // The filter lives in the URL, so a filtered list survives a reload and can be linked to.
  validateSearch: validateExerciseSearch,
  component: ExercisesPage,
})
