import { createFileRoute } from '@tanstack/react-router'
import LessonsPage from '../pages/LessonsPage'

export const Route = createFileRoute('/')({
  component: LessonsPage,
})
