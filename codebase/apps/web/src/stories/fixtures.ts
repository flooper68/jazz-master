import type { PracticeSession } from '../appData/session'
import { LESSONS } from '../content'

export const lesson = LESSONS[0]
export const sessions: PracticeSession[] = [{
  id: 'storybook-completed', lessonId: lesson.id,
  startedAt: '2026-09-14T09:00:00.000Z', durationSeconds: 480,
  completed: true,
  results: lesson.exercises.map((exercise, index) => ({
    exerciseId: exercise.id, grade: index === 0 ? 'shaky' : 'got-it',
  })),
}]
