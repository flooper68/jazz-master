import { createFileRoute } from '@tanstack/react-router'
import ExercisesPage from '../pages/ExercisesPage'

export const Route = createFileRoute('/')({
  component: ExercisesPage,
})
