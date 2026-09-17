import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXERCISES } from '../../content'
import { renderRoute } from '../../test/renderRoute'

const exercise = EXERCISES[0]

beforeEach(() => {
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

  it('renders not found for an unknown exercise', async () => {
    await renderRoute('/exercises/nope')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
