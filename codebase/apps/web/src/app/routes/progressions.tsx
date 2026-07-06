import { createFileRoute } from '@tanstack/react-router'
import ProgressionsPage from '../pages/ProgressionsPage'

export const Route = createFileRoute('/progressions')({
  component: ProgressionsPage,
})
