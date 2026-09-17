import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { EXERCISES } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import { resetTrpcTestData, seedTrpcTestRuns } from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
})

function card(title: string) {
  return within(screen.getByRole('heading', { level: 3, name: title }).closest('li') as HTMLElement)
}

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
    const clocked = card('C major — open position')
    expect(clocked.getByRole('img', { name: 'Level 1' })).toBeInTheDocument()
    expect(clocked.getByText('~2 min')).toBeInTheDocument()
    expect(clocked.getByText('60 BPM')).toBeInTheDocument()
    expect(clocked.getByText('C major')).toBeInTheDocument()
    // Four passes of 28 beats at 80 BPM is 84 seconds.
    const passes = card('Gm7 – C7 – Fmaj7 — arpeggios up and down')
    expect(passes.getByRole('img', { name: 'Level 2' })).toBeInTheDocument()
    expect(passes.getByText('~1 min')).toBeInTheDocument()
  })

  it('says how often and how recently each exercise was played', async () => {
    const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString()
    const run = (id: string, exerciseId: string, startedAt: string) => ({
      id, exerciseId, startedAt, durationSeconds: 60, tempoBpm: 60, passes: 3, completed: true, rating: null,
    })
    seedTrpcTestRuns([
      run('11111111-1111-4111-8111-111111111111', 'scales-major-open-c', at(0)),
      run('22222222-2222-4222-8222-222222222222', 'scales-major-open-c', at(3)),
    ])
    await renderRoute('/')
    expect(await card('C major — open position').findByText('Played 2× · last today')).toBeInTheDocument()
    expect(card('G major — open position').getByText('Not played yet')).toBeInTheDocument()
  })

  it('switches between cards and a plain list, and remembers the choice', async () => {
    const user = userEvent.setup()
    const { unmount } = await renderRoute('/')
    const view = screen.getByRole('radiogroup', { name: 'View' })
    expect(within(view).getByRole('radio', { name: 'Cards' })).toBeChecked()

    await user.click(within(view).getByRole('radio', { name: 'List' }))
    expect(within(view).getByRole('radio', { name: 'List' })).toBeChecked()
    // Same exercises, same links — just no pictures.
    expect(screen.getAllByRole('link', { name: /^Start / })).toHaveLength(EXERCISES.length)
    expect(card('C major — open position').getByText(/~2 min · 60 BPM/)).toBeInTheDocument()

    unmount()
    await renderRoute('/')
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()
  })
})
