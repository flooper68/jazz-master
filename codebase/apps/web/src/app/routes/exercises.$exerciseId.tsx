import { createFileRoute, notFound } from '@tanstack/react-router'
import { EXERCISES } from '../../content'
import ExercisePage from '../pages/ExercisePage'

const exerciseIds = new Set(EXERCISES.map((exercise) => exercise.id))

export const Route = createFileRoute('/exercises/$exerciseId')({
  loader: ({ params }) => {
    if (!exerciseIds.has(params.exerciseId)) throw notFound()
  },
  component: ExercisePage,
})
