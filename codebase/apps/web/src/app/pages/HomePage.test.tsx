import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetQuickRunSettings } from '../../appData/quickRun'
import { renderRoute } from '../../test/renderRoute'
import {
  resetTrpcTestData,
  seedTrpcTestRuns,
  setTrpcTestRunsRepositoryAvailable,
} from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  resetQuickRunSettings()
})

const at = (daysAgo: number) => {
  const date = new Date(Date.now() - daysAgo * 86_400_000)
  date.setHours(10, 0, 0, 0)
  return date.toISOString()
}

const stat = (label: string) => screen.getByText(label).nextElementSibling as HTMLElement

describe('HomePage', () => {
  it('stands empty before the first run, with the pack on offer', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const session = within(screen.getByRole('region', { name: 'Next session' }))
    // Until the runs are in, the card offers nothing rather than a plan that knows nothing.
    expect(session.getByText('Working out what to practise…')).toBeInTheDocument()
    expect(session.getByRole('button', { name: 'Play' })).toBeDisabled()

    // Then it says how much there is, and nothing else to read before starting.
    expect(await session.findByText('5 exercises, put together from what you have played.')).toBeInTheDocument()
    expect(session.getByRole('button', { name: 'Play' })).toBeEnabled()
    expect(session.queryByRole('listitem')).toBeNull()

    // The plan itself is a press away: nothing played, so every slot is new.
    await user.click(session.getByRole('button', { name: 'What\u2019s in it' }))
    const plan = within(screen.getByRole('dialog', { name: 'Next session' }))
    expect(plan.getAllByRole('listitem')).toHaveLength(5)
    expect(plan.getAllByText('New — not played yet')).toHaveLength(5)
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
      { id: '11111111-1111-4111-8111-111111111111', exerciseId: 'lines-ii-v-i-f-line', startedAt: at(0), durationSeconds: 300, tempoBpm: 90, passes: 4, completed: true, difficulty: 'hard' as const, sessionId: '33333333-3333-4333-8333-333333333333' },
      { id: '22222222-2222-4222-8222-222222222222', exerciseId: 'scales-major-open-c', startedAt: at(1), durationSeconds: 180, tempoBpm: 60, passes: 5, completed: true, difficulty: 'easy' as const, sessionId: null },
    ])
    await renderRoute('/')

    // The card is there from the first paint; the runs arriving is what the rest waits on.
    expect(screen.getByRole('heading', { level: 2, name: 'Next session' })).toBeInTheDocument()
    expect(await screen.findByText(/· 2 days in a row$/)).toBeInTheDocument()
    expect(stat('This week')).toHaveTextContent('8 min')
    expect(stat('This week')).toHaveTextContent('2 runs')
    expect(stat('Streak')).toHaveTextContent('2 days')
    // One Hard and one Easy: the tie falls to the harder answer.
    expect(stat('Felt this week')).toHaveTextContent('Hard')

    // The chart says each day's value without the hover.
    const chart = within(screen.getByRole('list', { name: 'Minutes played per day, oldest first' }))
    expect(chart.getAllByRole('listitem')).toHaveLength(7)
    expect(chart.getByLabelText(/: 5 min · 1 run$/)).toBeInTheDocument()
    expect(chart.getAllByLabelText(/: 0 min · 0 runs$/)).toHaveLength(5)

    const recent = within(screen.getByRole('region', { name: 'Recently played' }))
    const [latest] = recent.getAllByRole('listitem')
    expect(within(latest).getByText('Gm7 – C7 – Fmaj7 — a bebop line')).toBeInTheDocument()
    expect(within(latest).getByText('Today · 90 BPM · quick run')).toBeInTheDocument()
    expect(within(latest).getByText('Hard')).toBeInTheDocument()
    expect(recent.getByRole('link', { name: 'All history' })).toHaveAttribute('href', '/app/history')

    // What went badly comes first, then what was never played.
    const next = within(screen.getByRole('region', { name: 'Worth picking up' }))
    const picks = next.getAllByRole('listitem')
    expect(within(picks[0]).getByText('Felt hard last time')).toBeInTheDocument()
    expect(within(picks[1]).getByText('Not played yet')).toBeInTheDocument()

    // Yesterday's scale is due back today and leads the session, at its own
    // tempo; the rest of the slots are the pack's new items. Each says why —
    // behind What's in it, so the card itself stays an answer and a Play.
    const session = within(screen.getByRole('region', { name: 'Next session' }))
    await userEvent.setup().click(session.getByRole('button', { name: 'What\u2019s in it' }))
    const slots = within(screen.getByRole('dialog', { name: 'Next session' })).getAllByRole('listitem')
    expect(slots).toHaveLength(5)
    expect(slots[0]).toHaveTextContent('C major — open position')
    expect(slots[0]).toHaveTextContent('Due today · at its tempo, 60 BPM')
    expect(slots.filter((slot) => slot.textContent?.includes('New — not played yet'))).toHaveLength(4)
  })

  it('plays the next session from the card, at the tempos it planned', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    await user.click(await screen.findByRole('button', { name: 'Play' }))
    expect(await screen.findByText('Next session · 1 of 5')).toBeInTheDocument()
  })

  it('says so when the runs cannot be loaded, and still offers the pack', async () => {
    setTrpcTestRunsRepositoryAvailable(false)
    await renderRoute('/')
    expect(await screen.findByRole('alert')).toHaveTextContent('Your runs could not be loaded')
    expect(screen.getByRole('link', { name: 'All exercises' })).toHaveAttribute('href', '/app/exercises')
  })
})
