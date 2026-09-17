import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../../content'
import { renderRoute } from '../../test/renderRoute'

describe('ExercisesPage', () => {
  it('lists every exercise under its area with a link into the player', async () => {
    await renderRoute('/')
    for (const area of ['Scales', 'Arpeggios', 'Standards']) {
      expect(screen.getByRole('heading', { level: 2, name: area })).toBeInTheDocument()
    }
    for (const exercise of EXERCISES) {
      expect(
        screen.getByRole('link', { name: `Start ${exercise.title}` }),
      ).toHaveAttribute('href', `/app/exercises/${exercise.id}`)
    }
  })

  it('shows level, length and tempo per exercise, the length read from the exercise itself', async () => {
    await renderRoute('/')
    const clocked = within(
      screen.getByText('C major — open position').closest('li') as HTMLElement,
    )
    expect(clocked.getByText('Level 1 · ~2 min · 60 BPM')).toBeInTheDocument()
    // Four passes of 28 beats at 80 BPM is 84 seconds.
    const passes = within(
      screen.getByText('Gm7 – C7 – Fmaj7 — arpeggios up and down').closest('li') as HTMLElement,
    )
    expect(passes.getByText('Level 2 · ~1 min · 80 BPM')).toBeInTheDocument()
  })
})
