import { defaultProfile } from '../appData/profile'
import type { PracticeSession } from '../appData/session'
import { LESSONS } from '../content'

export const profile = defaultProfile('2026-09-14T09:00:00.000Z')
export const lesson = LESSONS[0]
export const sessions: PracticeSession[] = [{
  id: 'storybook-completed', lessonId: lesson.id,
  startedAt: '2026-09-14T09:00:00.000Z', durationSeconds: 480,
  completed: true, score: 86,
  results: lesson.exercises.map((exercise, index) => ({
    exerciseId: exercise.id, grade: index === 0 ? 'shaky' : 'got-it',
  })),
}, {
  id: 'storybook-incomplete', lessonId: LESSONS[1].id,
  startedAt: '2026-09-13T16:00:00.000Z', durationSeconds: 120,
  completed: false,
  results: [{ exerciseId: LESSONS[1].exercises[0].id, grade: 'missed' }],
}]
