import { createFileRoute } from '@tanstack/react-router'
import { EditRoutinePage } from '../pages/RoutineEditorPage'

export const Route = createFileRoute('/routines/$routineId/edit')({
  component: EditRoutinePage,
})
