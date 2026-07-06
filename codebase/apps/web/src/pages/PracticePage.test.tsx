import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LESSONS } from '../content'
import PracticePage from './PracticePage'

describe('PracticePage', () => {
  it('lists every lesson in the pack', () => {
    render(<PracticePage />)
    expect(
      screen.getByRole('heading', { name: 'Practice' }),
    ).toBeInTheDocument()
    for (const lesson of LESSONS) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument()
    }
  })

  it('groups lessons under their area headings', () => {
    render(<PracticePage />)
    expect(screen.getByRole('heading', { name: 'Scales' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Arpeggios' }),
    ).toBeInTheDocument()
  })

  it('shows level, duration, exercise count, and prerequisites per lesson', () => {
    render(<PracticePage />)
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

  it('starts a guided session from a lesson and returns to the list on end', async () => {
    const user = userEvent.setup()
    render(<PracticePage />)
    const first = LESSONS[0]

    await user.click(
      screen.getByRole('button', { name: `Start ${first.title}` }),
    )
    expect(
      screen.getByText(`Exercise 1 of ${first.exercises.length}`),
    ).toBeInTheDocument()
    expect(screen.getByText(first.exercises[0].title)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'End lesson' }))
    expect(
      screen.getByRole('button', { name: `Start ${first.title}` }),
    ).toBeInTheDocument()
  })
})
