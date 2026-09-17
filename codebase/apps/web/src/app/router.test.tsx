import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../content'
import { renderRoute } from '../test/renderRoute'

const exercise = EXERCISES[0]
/** The stage heading carries the title, then the meter and tempo. */
const stageHeading = { level: 1, name: new RegExp(`^${exercise.title}`) } as const

describe('app router', () => {
  it('renders home at the app root and the exercise list at /exercises', async () => {
    const { unmount } = await renderRoute('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Home' }),
    ).toBeInTheDocument()
    unmount()
    await renderRoute('/exercises')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Exercises' }),
    ).toBeInTheDocument()
  })

  it('renders the player for an exercise URL', async () => {
    await renderRoute(`/exercises/${exercise.id}`)
    expect(screen.getByRole('heading', stageHeading)).toBeInTheDocument()
  })

  it('renders the history at /history, reached from the navigation', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(nav).getByRole('link', { name: 'History' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'History' }),
    ).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'History' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('shows the app title in the persistent layout', async () => {
    await renderRoute('/')
    expect(screen.getByText('woodshed')).toBeInTheDocument()
  })

  it.each(['/practice', '/profile', '/lessons/scales-major-open', '/exercises/no-such-exercise', '/no-such-page'])(
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
    await renderRoute('/exercises')
    const start = screen.getByRole('link', { name: `Start ${exercise.title}` })
    expect(start).toHaveAttribute('href', `/app/exercises/${exercise.id}`)

    await user.click(start)
    expect(await screen.findByRole('heading', stageHeading)).toHaveFocus()
    // Playing an exercise is still being in Exercises.
    expect(screen.getByRole('link', { name: 'Exercises' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Exercises' }))
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
