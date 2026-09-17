import { createFileRoute } from '@tanstack/react-router'
import RoutinesPage from '../pages/RoutinesPage'

export const Route = createFileRoute('/routines')({
  component: RoutinesPage,
})
