import { createFileRoute } from '@tanstack/react-router'
import LessonPage from '../pages/LessonPage'

export const Route = createFileRoute('/lesson')({
  component: LessonPage,
})
