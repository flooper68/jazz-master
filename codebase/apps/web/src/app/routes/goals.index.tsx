import { createFileRoute } from '@tanstack/react-router'
import GoalsPage from '../pages/GoalsPage'

export const Route = createFileRoute('/goals/')({
  component: GoalsPage,
})
