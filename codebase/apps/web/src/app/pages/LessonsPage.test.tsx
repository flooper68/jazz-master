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
    for (const lesson of LESSONS) {
      expect(
        screen.getByRole('link', { name: `Start ${lesson.title}` }),
      ).toHaveAttribute('href', `/app/lessons/${lesson.id}`)
    }
  })

  it('shows level, duration, and exercise count per lesson', async () => {
    await renderRoute('/')
    const item = within(
      screen.getByText('Major scale I — open position').closest('li') as HTMLElement,
    )
    expect(item.getByText('Level 1 · ~6 min')).toBeInTheDocument()
    expect(item.getByText('3 exercises')).toBeInTheDocument()
  })
})
