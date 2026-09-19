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

/**
 * The unsaved-run banner, told apart from the player's own audio notice: the
 * stage stays mounted behind the summary dialog, so both alerts are on screen.
 */
function unsavedAlert(): HTMLElement | null {
  return screen.queryAllByRole('alert').find((node) => node.textContent?.startsWith('This run was not saved.')) ?? null
}

describe('ExercisePage', () => {
  it('plays the exercise named in the URL, sums it up, and goes back to the list', async () => {
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)

    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(screen.getByRole('button', { name: `Finish ${exercise.title}` }))
    expect(
      screen.getByRole('heading', { level: 2, name: 'Exercise complete' }),
    ).toBeInTheDocument()
    // The stage is still behind the dialog, so the title is on screen twice.
    expect(within(screen.getByRole('dialog')).getByText(exercise.title)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Exercises' }),
    ).toBeInTheDocument()
  })

  it('saves the run when it reaches the summary, and again with its answer', async () => {
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)
    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(screen.getByRole('button', { name: `Finish ${exercise.title}` }))

    await waitFor(() => expect(getTrpcTestRuns()).toHaveLength(1))
    expect(getTrpcTestRuns()[0]).toMatchObject({
      exerciseId: exercise.id,
      tempoBpm: exercise.tempoBpm,
      completed: false,
      difficulty: null,
    })

    const answer = screen.getByRole('group', { name: /^How did it go\?/ })
    await user.click(within(answer).getByRole('button', { name: 'Good' }))
    await waitFor(() => expect(getTrpcTestRuns()[0].difficulty).toBe('good'))
    expect(getTrpcTestRuns()).toHaveLength(1)
    expect(unsavedAlert()).toBeNull()
  })

  it('saves nothing for a run left from the stage', async () => {
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)
    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Exercises' }))
    await screen.findByRole('heading', { level: 1, name: 'Exercises' })
    expect(getTrpcTestRuns()).toEqual([])
  })

  it('says so when the run was not saved, and sends it again on request', async () => {
    setTrpcTestRunsRepositoryAvailable(false)
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)
    await user.click(screen.getByRole('button', { name: `Play ${exercise.title}` }))
    await user.click(screen.getByRole('button', { name: `Finish ${exercise.title}` }))

    await waitFor(() => expect(unsavedAlert()).not.toBeNull())
    expect(getTrpcTestRuns()).toEqual([])

    setTrpcTestRunsRepositoryAvailable(true)
    await user.click(within(unsavedAlert()!).getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(unsavedAlert()).toBeNull())
    expect(getTrpcTestRuns()).toHaveLength(1)
  })

  it('renders not found for an unknown exercise', async () => {
    await renderRoute('/exercises/nope')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
