import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LESSONS } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import {
  getTrpcTestSessions,
  resetTrpcTestData,
  setTrpcTestSessionsRepositoryAvailable,
} from '../../test/trpcTestFetch'

type User = ReturnType<typeof userEvent.setup>

const lesson = LESSONS[0]

beforeEach(() => {
  resetTrpcTestData()
  // jsdom has no Web Audio; the player reports the click as unavailable and
  // carries on, which is the behavior under test here.
  vi.stubGlobal('AudioContext', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function gradeCurrentExercise(user: User, grade: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: /^Play / }))
  await user.click(screen.getByRole('button', { name: /^Next: finish / }))
  const group = screen.getByRole('group', { name: /^Grade / })
  await user.click(within(group).getByRole('button', { name: grade }))
}

describe('LessonPage', () => {
  it('persists each grade to the server and marks the finished run complete', async () => {
    const user = userEvent.setup()
    await renderRoute(`/lessons/${lesson.id}`)

    await gradeCurrentExercise(user, 'Shaky')
    await waitFor(() => {
      expect(getTrpcTestSessions()).toHaveLength(1)
    })
    expect(getTrpcTestSessions()[0]).toMatchObject({
      lessonId: lesson.id,
      completed: false,
      results: [{ exerciseId: lesson.exercises[0].id, grade: 'shaky' }],
    })

    for (let i = 1; i < lesson.exercises.length; i++) {
      await gradeCurrentExercise(user, 'Got it')
    }
    expect(
      screen.getByRole('heading', { level: 1, name: /^Lesson complete/ }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(getTrpcTestSessions()[0].completed).toBe(true)
    })
    expect(getTrpcTestSessions()[0].results).toHaveLength(
      lesson.exercises.length,
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Lessons' }),
    ).toBeInTheDocument()
  })

  it('keeps the run usable and says so when a save does not land', async () => {
    setTrpcTestSessionsRepositoryAvailable(false)
    const user = userEvent.setup()
    await renderRoute(`/lessons/${lesson.id}`)

    await gradeCurrentExercise(user, 'Got it')

    expect(screen.getByText('Exercise 2 of 3')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The last save failed. Your grades are sent again with the next one.',
    )
    expect(getTrpcTestSessions()).toEqual([])

    setTrpcTestSessionsRepositoryAvailable(true)
    await gradeCurrentExercise(user, 'Got it')
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull()
    })
    expect(getTrpcTestSessions()[0].results).toHaveLength(2)
  })

  it('starts a fresh run when leaving and reopening a lesson', async () => {
    const user = userEvent.setup()
    await renderRoute(`/lessons/${lesson.id}`)
    await gradeCurrentExercise(user, 'Got it')
    await waitFor(() => {
      expect(getTrpcTestSessions()).toHaveLength(1)
    })

    await user.click(screen.getByRole('button', { name: 'End lesson' }))
    await user.click(
      await screen.findByRole('link', { name: `Start ${lesson.title}` }),
    )
    expect(
      await screen.findByText(`Exercise 1 of ${lesson.exercises.length}`),
    ).toBeInTheDocument()

    await gradeCurrentExercise(user, 'Shaky')
    await waitFor(() => {
      expect(getTrpcTestSessions()).toHaveLength(2)
    })
    expect(getTrpcTestSessions().map((s) => s.results[0].grade).sort()).toEqual([
      'got-it',
      'shaky',
    ])
  })

  it('renders not found for an unknown lesson', async () => {
    await renderRoute('/lessons/nope')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
