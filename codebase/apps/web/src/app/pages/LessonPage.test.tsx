import { screen, waitFor } from '@testing-library/react'
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

async function finishCurrentExercise(user: User): Promise<void> {
  await user.click(screen.getByRole('button', { name: /^Play / }))
  await user.click(screen.getByRole('button', { name: /^Next: finish / }))
}

describe('LessonPage', () => {
  it('persists progress to the server and marks the finished run complete', async () => {
    const user = userEvent.setup()
    await renderRoute(`/lessons/${lesson.id}`)

    await finishCurrentExercise(user)
    await waitFor(() => {
      expect(getTrpcTestSessions()).toHaveLength(1)
    })
    expect(getTrpcTestSessions()[0]).toMatchObject({
      lessonId: lesson.id,
      completed: false,
      exercisesCompleted: 1,
    })

    for (let i = 1; i < lesson.exercises.length; i++) {
      await finishCurrentExercise(user)
    }
    expect(
      screen.getByRole('heading', { level: 1, name: /^Lesson complete/ }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(getTrpcTestSessions()[0]).toMatchObject({
        completed: true,
        exercisesCompleted: lesson.exercises.length,
      })
    })

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Lessons' }),
    ).toBeInTheDocument()
  })

  it('keeps the run usable and says so when a save does not land', async () => {
    setTrpcTestSessionsRepositoryAvailable(false)
    const user = userEvent.setup()
    await renderRoute(`/lessons/${lesson.id}`)

    await finishCurrentExercise(user)

    expect(screen.getByText('Exercise 2 of 3')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The last save failed. Your progress is sent again with the next exercise.',
    )
    expect(getTrpcTestSessions()).toEqual([])

    setTrpcTestSessionsRepositoryAvailable(true)
    await finishCurrentExercise(user)
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull()
    })
    expect(getTrpcTestSessions()[0].exercisesCompleted).toBe(2)
  })

  it('starts a fresh run when leaving and reopening a lesson', async () => {
    const user = userEvent.setup()
    await renderRoute(`/lessons/${lesson.id}`)
    await finishCurrentExercise(user)
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

    await finishCurrentExercise(user)
    await waitFor(() => {
      expect(getTrpcTestSessions()).toHaveLength(2)
    })
    expect(
      getTrpcTestSessions().map((session) => session.exercisesCompleted),
    ).toEqual([1, 1])
  })

  it('renders not found for an unknown lesson', async () => {
    await renderRoute('/lessons/nope')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
