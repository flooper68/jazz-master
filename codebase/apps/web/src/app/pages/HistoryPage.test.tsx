import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import {
  resetTrpcTestData,
  seedTrpcTestRuns,
  setTrpcTestRunsRepositoryAvailable,
} from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
})

const at = (daysAgo: number, hour: number) => {
  const date = new Date(Date.now() - daysAgo * 86_400_000)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

describe('HistoryPage', () => {
  it('invites a first run when nothing was played', async () => {
    await renderRoute('/history')
    expect(await screen.findByText('Nothing played yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pick an exercise' })).toHaveAttribute('href', expect.stringMatching(/^\/app\/?$/))
  })

  it('lists runs a day at a time with what was played, how it went, and a way back in', async () => {
    seedTrpcTestRuns([
      { id: '11111111-1111-4111-8111-111111111111', exerciseId: 'lines-ii-v-i-f-line', startedAt: at(0, 9), durationSeconds: 96, tempoBpm: 90, passes: 4, completed: true, rating: 8 },
      { id: '22222222-2222-4222-8222-222222222222', exerciseId: 'scales-major-open-g', startedAt: at(1, 18), durationSeconds: 45, tempoBpm: 60, passes: 1, completed: false, rating: null },
    ])
    await renderRoute('/history')

    const today = within(await screen.findByRole('region', { name: 'Today' }))
    const line = within(today.getByRole('listitem'))
    expect(line.getByRole('heading', { level: 3, name: 'Gm7 – C7 – Fmaj7 — a bebop line' })).toBeInTheDocument()
    expect(line.getByText('Standards')).toBeInTheDocument()
    expect(line.getByText(/1:36 played · 90 BPM · 4 passes$/)).toBeInTheDocument()
    expect(line.getByLabelText('Felt 8 out of 10')).toBeInTheDocument()
    expect(line.getByRole('link', { name: 'Play Gm7 – C7 – Fmaj7 — a bebop line again' })).toHaveAttribute(
      'href',
      '/app/exercises/lines-ii-v-i-f-line',
    )

    const yesterday = within(within(screen.getByRole('region', { name: 'Yesterday' })).getByRole('listitem'))
    expect(yesterday.getByText(/0:45 played · 60 BPM · 1 pass · ended early$/)).toBeInTheDocument()
    expect(yesterday.getByText('Not rated')).toBeInTheDocument()

    // The totals across everything listed.
    expect(screen.getByText('Runs').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('Time played').nextElementSibling).toHaveTextContent('2 min')
    expect(screen.getByText('Days').nextElementSibling).toHaveTextContent('2')
  })

  it('says so when the history cannot be loaded', async () => {
    setTrpcTestRunsRepositoryAvailable(false)
    await renderRoute('/history')
    expect(await screen.findByRole('alert')).toHaveTextContent('Your history could not be loaded.')
  })
})
