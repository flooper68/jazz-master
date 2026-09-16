import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LESSONS } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import { resetTrpcTestData } from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
})

describe('LessonsPage', () => {
  it('lists every lesson under its area with a link into the player', async () => {
    await renderRoute('/')
    expect(screen.getByRole('heading', { name: 'Scales' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Arpeggios' }),
    ).toBeInTheDocument()
    for (const lesson of LESSONS) {
      expect(
        screen.getByRole('link', { name: `Start ${lesson.title}` }),
      ).toHaveAttribute('href', `/app/lessons/${lesson.id}`)
    }
  })

  it('shows level, duration, exercise count, and prerequisites per lesson', async () => {
    await renderRoute('/')
    const dorianItem = screen
      .getByText('Dorian — the ii-chord scale')
      .closest('li')
    expect(dorianItem).not.toBeNull()
    const item = within(dorianItem as HTMLElement)
    expect(item.getByText('Level 2 · ~12 min')).toBeInTheDocument()
    expect(
      item.getByText(
        '4 exercises · after: Major scale I — open position, Major scale II — middle position, adding flat keys',
      ),
    ).toBeInTheDocument()
  })
})
