import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetQuickRunSettings } from '../../appData/quickRun'
import { renderRoute } from '../../test/renderRoute'
import { getTrpcTestNotes, getTrpcTestRuns, resetTrpcTestData, seedTrpcTestRoutines } from '../../test/trpcTestFetch'

type User = ReturnType<typeof userEvent.setup>

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  resetQuickRunSettings()
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
  it('plays the exercises in the URL straight through, then sums up and answers the run on one screen', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-g,lines-ii-v-i-f-line')

    expect(screen.getByRole('heading', { level: 1, name: /^G major — open position/ })).toBeInTheDocument()
    expect(screen.getByText('Next session · 1 of 2')).toBeInTheDocument()
    await playAndFinish(user, 'G major — open position')

    // No summary in between: finishing moves straight to the next exercise.
    expect(await screen.findByRole('heading', { level: 1, name: /^Gm7 – C7 – Fmaj7 — a bebop line/ })).toHaveFocus()
    expect(screen.getByText('Next session · 2 of 2')).toBeInTheDocument()
    await playAndFinish(user, 'Gm7 – C7 – Fmaj7 — a bebop line')

    expect(screen.getByRole('heading', { level: 1, name: 'Next session complete' })).toHaveFocus()
    expect(screen.getByText(/^2 of 2 played/)).toBeInTheDocument()
    const [first, second] = screen.getAllByRole('listitem')
    expect(within(first).getByText('G major — open position')).toBeInTheDocument()
    expect(within(second).getByText('Gm7 – C7 – Fmaj7 — a bebop line')).toBeInTheDocument()

    // Each played exercise is answered here, on its own four buttons.
    await user.click(within(first).getByRole('button', { name: 'Good for G major — open position' }))
    expect(within(first).getByText('Clean, with effort')).toBeInTheDocument()
    expect(within(second).getByRole('button', { name: 'Again for Gm7 – C7 – Fmaj7 — a bebop line' })).toBeEnabled()

    // Both runs are saved under one session, the answer on the right one.
    await waitFor(() =>
      expect(getTrpcTestRuns().find((run) => run.exerciseId === 'scales-major-open-g')?.difficulty).toBe('good'),
    )
    expect(getTrpcTestRuns()).toHaveLength(2)
    const sessionIds = new Set(getTrpcTestRuns().map((run) => run.sessionId))
    expect(sessionIds.size).toBe(1)
    expect([...sessionIds][0]).toMatch(/^[0-9a-f-]{36}$/)
    expect(getTrpcTestRuns().find((run) => run.exerciseId === 'lines-ii-v-i-f-line')?.difficulty).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Back to exercises' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  it('answers how it felt beside how it went, and keeps the two apart', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await playAndFinish(user, 'C major — open position')

    // Two questions on the summary, and neither is answered for the user.
    expect(screen.getByRole('group', { name: /^How did it go\?/ })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /^How did it feel\?/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Loved it for C major — open position' }))
    await waitFor(() => expect(getTrpcTestRuns()[0]?.feel).toBe('loved'))
    // Saying how it felt says nothing about how it went.
    expect(getTrpcTestRuns()[0]?.difficulty).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Good for C major — open position' }))
    await waitFor(() => expect(getTrpcTestRuns()[0]?.difficulty).toBe('good'))
    expect(getTrpcTestRuns()[0]?.feel).toBe('loved')

    // Pressing the chosen answer again clears it.
    await user.click(screen.getByRole('button', { name: 'Loved it for C major — open position' }))
    await waitFor(() => expect(getTrpcTestRuns()[0]?.feel).toBeNull())
  })

  it('keeps a note about the whole sitting, once something has been played', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await playAndFinish(user, 'C major — open position')

    const note = screen.getByLabelText(/^Anything worth remembering\?/)
    await user.type(note, 'The ii–V finally sat in the pocket.')
    // Written away when the box is left, not on every keypress.
    expect(await getTrpcTestNotes()).toEqual([])
    await user.tab()
    await waitFor(async () =>
      expect(await getTrpcTestNotes()).toMatchObject([{ text: 'The ii–V finally sat in the pocket.' }]),
    )
  })

  it('offers no note for a sitting where nothing was played', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await user.click(screen.getByRole('button', { name: 'Finish C major — open position' }))
    expect(screen.queryByLabelText(/^Anything worth remembering\?/)).toBeNull()
  })

  it('marks an exercise finished without playing as skipped', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await user.click(screen.getByRole('button', { name: 'Finish C major — open position' }))
    expect(screen.getByText(/^0 of 1 played/)).toBeInTheDocument()
    expect(within(screen.getByRole('listitem')).getByText('Skipped')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /^How did it go\?/ })).toBeNull()
    expect(getTrpcTestRuns()).toEqual([])
  })

  it('asks the scheduler what now from the summary', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await user.click(screen.getByRole('button', { name: 'Finish C major — open position' }))
    await user.click(screen.getByRole('button', { name: 'What now?' }))
    expect(await screen.findByText(/^Next session · 1 of \d+$/)).toBeInTheDocument()
  })

  it('starts each exercise at the tempo the plan asked for', async () => {
    await renderRoute('/session?x=scales-major-open-c@48')
    // The written tempo is 60; the URL asked for 48, and the readout follows the plan.
    expect(screen.getByRole('spinbutton', { name: /[Tt]empo/ })).toHaveValue(48)
  })

  it('plays a routine under its name, and offers it again at the end', async () => {
    const user = userEvent.setup()
    const [routine] = await seedTrpcTestRoutines([{ name: 'Warm-up', items: [{ exerciseId: 'scales-major-open-c' }] }])
    await renderRoute(`/session?x=scales-major-open-c&r=${routine.id}`)

    expect(await screen.findByText('Warm-up · 1 of 1')).toBeInTheDocument()
    await playAndFinish(user, 'C major — open position')
    expect(screen.getByRole('heading', { level: 1, name: 'Warm-up complete' })).toHaveFocus()
    await waitFor(() => expect(getTrpcTestRuns()).toHaveLength(1))
    const first = getTrpcTestRuns()[0].sessionId

    await user.click(screen.getByRole('button', { name: 'Play it again' }))
    expect(await screen.findByText('Warm-up · 1 of 1')).toBeInTheDocument()
    await playAndFinish(user, 'C major — open position')
    // A second time through is a session of its own.
    await waitFor(() => expect(getTrpcTestRuns()).toHaveLength(2))
    expect(new Set(getTrpcTestRuns().map((run) => run.sessionId)).size).toBe(2)
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('can be ended early, back to the exercises', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c,scales-major-open-g')
    await user.click(screen.getByRole('button', { name: 'End session' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  it.each(['/session', '/session?x=', '/session?x=nope,also-nope'])('renders not found for %s', async (path) => {
    await renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
