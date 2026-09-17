import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXERCISES } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import {
  getTrpcTestRuns,
  resetTrpcTestData,
  setTrpcTestRunsRepositoryAvailable,
} from '../../test/trpcTestFetch'

const exercise = EXERCISES[0]

beforeEach(() => {
  resetTrpcTestData()
  // jsdom has no Web Audio; the player reports the click as unavailable and
  // carries on, which is the behavior under test here.
  vi.stubGlobal('AudioContext', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ExercisePage', () => {
  it('plays the exercise named in the URL, sums it up, and goes back to the list', async () => {
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)

    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(screen.getByRole('button', { name: `Finish ${exercise.title}` }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Exercise complete' }),
    ).toBeInTheDocument()
    expect(screen.getByText(exercise.title)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to exercises' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Exercises' }),
    ).toBeInTheDocument()
  })

  it('saves the run when it reaches the summary, and again with its rating', async () => {
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)
    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(screen.getByRole('button', { name: `Finish ${exercise.title}` }))

    await waitFor(() => expect(getTrpcTestRuns()).toHaveLength(1))
    expect(getTrpcTestRuns()[0]).toMatchObject({
      exerciseId: exercise.id,
      tempoBpm: exercise.tempoBpm,
      completed: false,
      rating: null,
    })

    const rating = screen.getByRole('group', { name: /^How hard was it\?/ })
    await user.click(within(rating).getByRole('button', { name: '4 out of 10' }))
    await waitFor(() => expect(getTrpcTestRuns()[0].rating).toBe(4))
    expect(getTrpcTestRuns()).toHaveLength(1)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('saves nothing for a run left from the stage', async () => {
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)
    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(screen.getByRole('button', { name: 'Back to exercises' }))
    await screen.findByRole('heading', { level: 1, name: 'Exercises' })
    expect(getTrpcTestRuns()).toEqual([])
  })

  it('says so when the run was not saved, and sends it again on request', async () => {
    setTrpcTestRunsRepositoryAvailable(false)
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)
    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(screen.getByRole('button', { name: `Finish ${exercise.title}` }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('This run was not saved.')
    expect(getTrpcTestRuns()).toEqual([])

    setTrpcTestRunsRepositoryAvailable(true)
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(getTrpcTestRuns()).toHaveLength(1)
  })

  it('renders not found for an unknown exercise', async () => {
    await renderRoute('/exercises/nope')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
