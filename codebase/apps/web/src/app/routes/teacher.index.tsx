import { createFileRoute } from '@tanstack/react-router'
import TeacherPage from '../pages/TeacherPage'

export const Route = createFileRoute('/teacher/')({
  component: TeacherPage,
})
