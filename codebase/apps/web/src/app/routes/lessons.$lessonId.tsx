import { createFileRoute, notFound } from '@tanstack/react-router'
import { LESSONS } from '../../content'
import LessonPage from '../pages/LessonPage'

const lessonIds = new Set(LESSONS.map((lesson) => lesson.id))

export const Route = createFileRoute('/lessons/$lessonId')({
  loader: ({ params }) => {
    if (!lessonIds.has(params.lessonId)) throw notFound()
  },
  component: LessonPage,
})
