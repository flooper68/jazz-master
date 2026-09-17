import { createFileRoute } from '@tanstack/react-router'
import { NewRoutinePage } from '../pages/RoutineEditorPage'

export const Route = createFileRoute('/routines/new')({
  component: NewRoutinePage,
})
