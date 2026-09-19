import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import {
  resetTrpcTestData,
  seedTrpcTestNote,
  seedTrpcTestRuns,
  setTrpcTestRunsRepositoryAvailable,
} from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
})

const at = (daysAgo: number, hour: number, minute = 0) => {
  const date = new Date(Date.now() - daysAgo * 86_400_000)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const SITTING = '33333333-3333-4333-8333-333333333333'

describe('HistoryPage', () => {
  it('invites a first run when nothing was played', async () => {
    await renderRoute('/history')
    expect(await screen.findByText('Nothing played yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pick an exercise' })).toHaveAttribute('href', '/app/exercises')
  })

  it('lists practice runs a day at a time, and opens one onto the exercises it held', async () => {
    const user = userEvent.setup()
    seedTrpcTestRuns([
      { id: '11111111-1111-4111-8111-111111111111', exerciseId: 'lines-ii-v-i-f-line', startedAt: at(0, 9), durationSeconds: 96, tempoBpm: 90, passes: 4, completed: true, difficulty: 'hard' as const, feel: null, sessionId: SITTING },
      { id: '44444444-4444-4444-8444-444444444444', exerciseId: 'scales-major-open-c', startedAt: at(0, 9, 5), durationSeconds: 24, tempoBpm: 60, passes: 1, completed: false, difficulty: 'hard' as const, feel: 'loved' as const, sessionId: SITTING },
      { id: '22222222-2222-4222-8222-222222222222', exerciseId: 'scales-major-open-g', startedAt: at(1, 18), durationSeconds: 45, tempoBpm: 60, passes: 1, completed: false, difficulty: null, feel: null, sessionId: null },
    ])
    await seedTrpcTestNote(SITTING, 'Hands cold, second half better.')
    await renderRoute('/history')

    // Today's sitting is one row, not two — the two exercises are inside it.
    const today = within(await screen.findByRole('region', { name: 'Today' }))
    const rows = today.getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    const sitting = within(rows[0])
    expect(sitting.getByText(/2 exercises$/)).toBeInTheDocument()
    expect(sitting.getByText(/^2:00 played · 1 ended early$/)).toBeInTheDocument()
    expect(sitting.getByText('Hard')).toBeInTheDocument()
    expect(sitting.getByText('Loved it')).toBeInTheDocument()
    // What was written at the end of that sitting belongs to the sitting.
    expect(sitting.getByText('“Hands cold, second half better.”')).toBeInTheDocument()
    // The whole run is what Play again plays: its order, its tempos, its length.
    expect(sitting.getByRole('link', { name: /^Play this run again/ })).toHaveAttribute(
      'href',
      '/app/session?x=lines-ii-v-i-f-line%4090%2Cscales-major-open-c%4060&m=2',
    )
    // Until it is opened, the exercises are not the list.
    expect(sitting.queryByRole('heading', { level: 3 })).toBeNull()

    await user.click(sitting.getByRole('button', { expanded: false }))
    expect(sitting.getByRole('heading', { level: 3, name: 'Gm7 – C7 – Fmaj7 — a bebop line' })).toBeInTheDocument()
    expect(sitting.getByText(/1:36 played · 90 BPM · 4 passes$/)).toBeInTheDocument()
    expect(sitting.getByText(/0:24 played · 60 BPM · 1 pass · ended early$/)).toBeInTheDocument()
    expect(sitting.getByRole('link', { name: 'Play Gm7 – C7 – Fmaj7 — a bebop line again' })).toHaveAttribute(
      'href',
      '/app/session?x=lines-ii-v-i-f-line',
    )

    // A run recorded before sittings were the only way to play is a run of one,
    // and a sitting nobody answered says so rather than showing nothing.
    const yesterdayRows = within(screen.getByRole('region', { name: 'Yesterday' })).getAllByRole('listitem')
    expect(yesterdayRows).toHaveLength(1)
    const yesterday = within(yesterdayRows[0])
    expect(yesterday.getByText(/1 exercise$/)).toBeInTheDocument()
    expect(yesterday.getByText('Not answered')).toBeInTheDocument()
    await user.click(yesterday.getByRole('button', { expanded: false }))
    expect(yesterday.getByText(/0:45 played · 60 BPM · 1 pass · ended early$/)).toBeInTheDocument()
    expect(yesterday.getByRole('link', { name: 'Play G major — open position again' })).toHaveAttribute(
      'href',
      '/app/session?x=scales-major-open-g',
    )

    // The totals count sittings, not exercises.
    expect(screen.getByText('Practice runs').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('Time played').nextElementSibling).toHaveTextContent('3 min')
    expect(screen.getByText('Days').nextElementSibling).toHaveTextContent('2')
  })

  it('says so when the history cannot be loaded', async () => {
    setTrpcTestRunsRepositoryAvailable(false)
    await renderRoute('/history')
    expect(await screen.findByRole('alert')).toHaveTextContent('Your history could not be loaded.')
  })
})
