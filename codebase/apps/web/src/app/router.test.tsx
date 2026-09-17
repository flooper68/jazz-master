import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../content'
import { renderRoute } from '../test/renderRoute'

const exercise = EXERCISES[0]
/** The stage heading carries the title, then the meter and tempo. */
const stageHeading = { level: 1, name: new RegExp(`^${exercise.title}`) } as const

describe('app router', () => {
  it('renders the exercise list at the app root', async () => {
    await renderRoute('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Exercises' }),
    ).toBeInTheDocument()
  })

  it('renders the player for an exercise URL', async () => {
    await renderRoute(`/exercises/${exercise.id}`)
    expect(screen.getByRole('heading', stageHeading)).toBeInTheDocument()
  })

  it('shows the app title in the persistent layout', async () => {
    await renderRoute('/')
    expect(screen.getByText('woodshed')).toBeInTheDocument()
  })

  it.each(['/practice', '/history', '/profile', '/lessons/scales-major-open', '/exercises/no-such-exercise', '/no-such-page'])(
    'renders not found for %s',
    async (path) => {
      await renderRoute(path)
      expect(
        screen.getByRole('heading', { level: 1, name: 'Page not found' }),
      ).toBeInTheDocument()
    },
  )

  it('navigates from the list into an exercise and back', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const start = screen.getByRole('link', { name: `Start ${exercise.title}` })
    expect(start).toHaveAttribute('href', `/app/exercises/${exercise.id}`)

    await user.click(start)
    expect(await screen.findByRole('heading', stageHeading)).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Back to exercises' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Exercises' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: `Start ${exercise.title}`,
      }),
    ).toBeInTheDocument()
  })
})
