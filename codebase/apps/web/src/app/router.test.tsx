import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { LESSONS } from '../content'
import { renderRoute } from '../test/renderRoute'
import { resetTrpcTestData } from '../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
})

describe('app router', () => {
  it('renders the lesson list at the app root', async () => {
    await renderRoute('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Lessons' }),
    ).toBeInTheDocument()
  })

  it('renders the player for a lesson URL', async () => {
    await renderRoute(`/lessons/${LESSONS[0].id}`)
    expect(
      screen.getByRole('heading', { level: 1, name: LESSONS[0].title }),
    ).toBeInTheDocument()
  })

  it('shows the app title in the persistent layout', async () => {
    await renderRoute('/')
    expect(screen.getByText('woodshed')).toBeInTheDocument()
  })

  it.each(['/practice', '/history', '/profile', '/lessons/no-such-lesson', '/no-such-page'])(
    'renders not found for %s',
    async (path) => {
      await renderRoute(path)
      expect(
        screen.getByRole('heading', { level: 1, name: 'Page not found' }),
      ).toBeInTheDocument()
    },
  )

  it('navigates from the list into a lesson and back', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const lesson = LESSONS[0]
    const start = screen.getByRole('link', { name: `Start ${lesson.title}` })
    expect(start).toHaveAttribute('href', `/app/lessons/${lesson.id}`)

    await user.click(start)
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: lesson.title,
    })
    expect(heading).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'End lesson' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Lessons' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: `Start ${lesson.title}`,
      }),
    ).toBeInTheDocument()
  })
})
