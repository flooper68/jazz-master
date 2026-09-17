import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import { getTrpcTestRuns, resetTrpcTestData } from '../../test/trpcTestFetch'

type User = ReturnType<typeof userEvent.setup>

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  // jsdom has no Web Audio; the player carries on without the click.
  vi.stubGlobal('AudioContext', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function playAndFinish(user: User, title: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: `Play ${title}` }))
  await user.click(screen.getByRole('button', { name: `Finish ${title}` }))
}

describe('SessionPage', () => {
  it('plays the exercises in the URL straight through, then sums up and rates the run on one screen', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-g,lines-ii-v-i-f-line')

    expect(screen.getByRole('heading', { level: 1, name: /^G major — open position/ })).toBeInTheDocument()
    expect(screen.getByText('Quick run · 1 of 2')).toBeInTheDocument()
    await playAndFinish(user, 'G major — open position')

    // No summary in between: finishing moves straight to the next exercise.
    expect(await screen.findByRole('heading', { level: 1, name: /^Gm7 – C7 – Fmaj7 — a bebop line/ })).toHaveFocus()
    expect(screen.getByText('Quick run · 2 of 2')).toBeInTheDocument()
    await playAndFinish(user, 'Gm7 – C7 – Fmaj7 — a bebop line')

    expect(screen.getByRole('heading', { level: 1, name: 'Quick run complete' })).toHaveFocus()
    expect(screen.getByText(/^2 of 2 played/)).toBeInTheDocument()
    const [first, second] = screen.getAllByRole('listitem')
    expect(within(first).getByText('G major — open position')).toBeInTheDocument()
    expect(within(second).getByText('Gm7 – C7 – Fmaj7 — a bebop line')).toBeInTheDocument()

    // Each played exercise is rated here, on its own scale.
    await user.click(within(first).getByRole('button', { name: '4 out of 10 for G major — open position' }))
    expect(within(first).getByText('4/10 · Working on it')).toBeInTheDocument()
    expect(within(second).getByRole('button', { name: '7 out of 10 for Gm7 – C7 – Fmaj7 — a bebop line' })).toBeDisabled()

    // Both runs are saved under one session, the rating on the right one.
    await waitFor(() =>
      expect(getTrpcTestRuns().find((run) => run.exerciseId === 'scales-major-open-g')?.rating).toBe(4),
    )
    expect(getTrpcTestRuns()).toHaveLength(2)
    const sessionIds = new Set(getTrpcTestRuns().map((run) => run.sessionId))
    expect(sessionIds.size).toBe(1)
    expect([...sessionIds][0]).toMatch(/^[0-9a-f-]{36}$/)
    expect(getTrpcTestRuns().find((run) => run.exerciseId === 'lines-ii-v-i-f-line')?.rating).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Back to exercises' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  it('marks an exercise finished without playing as skipped', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await user.click(screen.getByRole('button', { name: 'Finish C major — open position' }))
    expect(screen.getByText(/^0 of 1 played/)).toBeInTheDocument()
    expect(within(screen.getByRole('listitem')).getByText('Skipped')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /^How hard was it\?/ })).toBeNull()
    expect(getTrpcTestRuns()).toEqual([])
  })

  it('draws another quick run from the summary', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await user.click(screen.getByRole('button', { name: 'Finish C major — open position' }))
    await user.click(screen.getByRole('button', { name: 'Another quick run' }))
    expect(await screen.findByText('Quick run · 1 of 3')).toBeInTheDocument()
  })

  it('can be ended early, back to the exercises', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c,scales-major-open-g')
    await user.click(screen.getByRole('button', { name: 'End quick run' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  it.each(['/session', '/session?x=', '/session?x=nope,also-nope'])('renders not found for %s', async (path) => {
    await renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
