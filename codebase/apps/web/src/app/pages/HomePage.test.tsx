import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import {
  resetTrpcTestData,
  seedTrpcTestRuns,
  setTrpcTestRunsRepositoryAvailable,
} from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
})

const at = (daysAgo: number) => {
  const date = new Date(Date.now() - daysAgo * 86_400_000)
  date.setHours(10, 0, 0, 0)
  return date.toISOString()
}

const stat = (label: string) => screen.getByText(label).nextElementSibling as HTMLElement

describe('HomePage', () => {
  it('stands empty before the first run, with the pack on offer', async () => {
    await renderRoute('/')
    expect(screen.getByRole('heading', { level: 2, name: 'Start with a quick run' })).toBeInTheDocument()
    expect(await screen.findByText('Nothing played yet — your runs show up here.')).toBeInTheDocument()
    expect(stat('Streak')).toHaveTextContent('0 days')
    expect(stat('Felt this week')).toHaveTextContent('—')

    // Nothing played: the first exercises of the pack are what is worth picking up.
    const next = within(screen.getByRole('region', { name: 'Worth picking up' }))
    expect(next.getAllByText('Not played yet')).toHaveLength(3)
    expect(next.getByRole('link', { name: 'Start C major — open position' })).toHaveAttribute(
      'href',
      '/app/exercises/scales-major-open-c',
    )
  })

  it('shows the week, the streak, what was played and what felt hard', async () => {
    seedTrpcTestRuns([
      { id: '11111111-1111-4111-8111-111111111111', exerciseId: 'lines-ii-v-i-f-line', startedAt: at(0), durationSeconds: 300, tempoBpm: 90, passes: 4, completed: true, rating: 9, sessionId: '33333333-3333-4333-8333-333333333333' },
      { id: '22222222-2222-4222-8222-222222222222', exerciseId: 'scales-major-open-c', startedAt: at(1), durationSeconds: 180, tempoBpm: 60, passes: 5, completed: true, rating: 3, sessionId: null },
    ])
    await renderRoute('/')

    expect(await screen.findByRole('heading', { level: 2, name: 'Ready for today?' })).toBeInTheDocument()
    expect(screen.getByText(/· 2 days in a row$/)).toBeInTheDocument()
    expect(stat('This week')).toHaveTextContent('8 min')
    expect(stat('This week')).toHaveTextContent('2 runs')
    expect(stat('Streak')).toHaveTextContent('2 days')
    expect(stat('Felt this week')).toHaveTextContent('6/10')

    // The chart says each day's value without the hover.
    const chart = within(screen.getByRole('list', { name: 'Minutes played per day, oldest first' }))
    expect(chart.getAllByRole('listitem')).toHaveLength(7)
    expect(chart.getByLabelText(/: 5 min · 1 run$/)).toBeInTheDocument()
    expect(chart.getAllByLabelText(/: 0 min · 0 runs$/)).toHaveLength(5)

    const recent = within(screen.getByRole('region', { name: 'Recently played' }))
    const [latest] = recent.getAllByRole('listitem')
    expect(within(latest).getByText('Gm7 – C7 – Fmaj7 — a bebop line')).toBeInTheDocument()
    expect(within(latest).getByText('Today · 90 BPM · quick run')).toBeInTheDocument()
    expect(within(latest).getByLabelText('Felt 9 out of 10')).toBeInTheDocument()
    expect(recent.getByRole('link', { name: 'All history' })).toHaveAttribute('href', '/app/history')

    // What felt hard comes first, then what was never played.
    const next = within(screen.getByRole('region', { name: 'Worth picking up' }))
    const picks = next.getAllByRole('listitem')
    expect(within(picks[0]).getByText('Felt 9/10 last time')).toBeInTheDocument()
    expect(within(picks[1]).getByText('Not played yet')).toBeInTheDocument()
  })

  it('starts a quick run from its own button', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Start a quick run' }))
    expect(await screen.findByText('Quick run · 1 of 3')).toBeInTheDocument()
  })

  it('says so when the runs cannot be loaded, and still offers the pack', async () => {
    setTrpcTestRunsRepositoryAvailable(false)
    await renderRoute('/')
    expect(await screen.findByRole('alert')).toHaveTextContent('Your runs could not be loaded')
    expect(screen.getByRole('link', { name: 'All exercises' })).toHaveAttribute('href', '/app/exercises')
  })
})
