import { createFileRoute } from '@tanstack/react-router'
import GoalPage from '../pages/GoalPage'

export const Route = createFileRoute('/teacher/$goalId')({
  component: GoalPage,
})
