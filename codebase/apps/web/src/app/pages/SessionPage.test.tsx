import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetQuickRunSettings } from '../../appData/quickRun'
import { renderRoute } from '../../test/renderRoute'
import { getTrpcTestNotes, getTrpcTestRuns, resetTrpcTestData } from '../../test/trpcTestFetch'

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

/** Whatever dialog is open — an exercise's summary, or the session's own. There is only ever one. */
function dialog(): HTMLElement {
  return screen.getByRole('dialog')
}

/**
 * The last exercise's summary hands over to the session's closing dialog. A
 * session of one has no such hand-over: the two dialogs are one.
 */
async function finishSession(user: User, label = 'Next session'): Promise<void> {
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Finish session' }))
  // It steps aside before the session closes, so wait for what replaces it.
  await screen.findByRole('heading', { level: 2, name: `${label} complete` })
}

/** On to the next exercise, waiting out the step. */
async function nextExercise(user: User, nextTitle: string): Promise<void> {
  await user.click(within(dialog()).getByRole('button', { name: 'Next exercise' }))
  await screen.findByRole('heading', { level: 1, name: new RegExp(`^${nextTitle}`) })
}

async function playAndFinish(user: User, title: string): Promise<void> {
  // Found, not got: an exercise reached through the session steps in, which takes a moment.
  await user.click(await screen.findByRole('button', { name: `Play ${title}` }))
  await user.click(screen.getByRole('button', { name: `Finish ${title}` }))
}

/** Finish without playing: the summary says it was skipped and offers nothing to answer. */
async function skip(user: User, title: string): Promise<void> {
  await user.click(await screen.findByRole('button', { name: `Finish ${title}` }))
  await screen.findByRole('heading', { level: 2, name: 'Exercise skipped' })
}

describe('SessionPage', () => {
  it('sums each exercise up on the way through, then sums the sitting up on one screen', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-g,lines-ii-v-i-f-line')

    expect(screen.getByRole('heading', { level: 1, name: /^G major — open position/ })).toBeInTheDocument()
    expect(screen.getByText('Next session · 1 of 2')).toBeInTheDocument()
    await playAndFinish(user, 'G major — open position')

    // The exercise is summed up before the next one starts, and says where it stands.
    // The summary is a dialog over the stage; it takes the keyboard itself.
    const summary = await screen.findByRole('dialog')
    expect(within(summary).getByRole('heading', { level: 2, name: 'Exercise complete' })).toBeInTheDocument()
    // The dialog takes the keyboard before anything in it is pressed.
    expect(summary).toHaveFocus()
    await user.click(within(summary).getByRole('button', { name: 'Good' }))
    // One answer is not the whole ask, so it waits.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The stage behind says the same, so read the position off the dialog.
    expect(within(summary).getByText('Next session · 1 of 2')).toBeInTheDocument()
    // Not mid-session: a second go at one step would drop the answer just given.
    expect(within(summary).queryByRole('button', { name: 'Play again' })).toBeNull()
    await user.click(within(summary).getByRole('button', { name: 'Next exercise' }))

    expect(await screen.findByRole('heading', { level: 1, name: /^Gm7 – C7 – Fmaj7 — a bebop line/ })).toHaveFocus()
    expect(screen.getByText('Next session · 2 of 2')).toBeInTheDocument()
    await playAndFinish(user, 'Gm7 – C7 – Fmaj7 — a bebop line')
    await finishSession(user)

    const closing = screen.getByRole('dialog')
    expect(closing).toHaveFocus()
    expect(within(closing).getByText(/^2 of 2 played/)).toBeInTheDocument()
    const [first, second] = within(closing).getAllByRole('listitem')
    expect(within(first).getByText('G major — open position')).toBeInTheDocument()
    expect(within(second).getByText('Gm7 – C7 – Fmaj7 — a bebop line')).toBeInTheDocument()

    // Nothing is asked twice: the closing dialog reads back what was answered on the way.
    expect(within(closing).queryByRole('group', { name: /^How did it go\?/ })).toBeNull()
    expect(within(first).getByText('Good')).toBeInTheDocument()
    expect(within(second).getByText('Done')).toBeInTheDocument()

    // Both runs are saved under one session, the answer on the right one.
    await waitFor(() =>
      expect(getTrpcTestRuns().find((run) => run.exerciseId === 'scales-major-open-g')?.difficulty).toBe('good'),
    )
    expect(getTrpcTestRuns()).toHaveLength(2)
    const sessionIds = new Set(getTrpcTestRuns().map((run) => run.sessionId))
    expect(sessionIds.size).toBe(1)
    expect([...sessionIds][0]).toMatch(/^[0-9a-f-]{36}$/)
    expect(getTrpcTestRuns().find((run) => run.exerciseId === 'lines-ii-v-i-f-line')?.difficulty).toBeNull()

    await user.click(within(closing).getByRole('button', { name: 'Done' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  it('answers an exercise where it was played, and keeps that answer on the closing screen', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-g,lines-ii-v-i-f-line')
    await playAndFinish(user, 'G major — open position')

    // How it went and how it felt, both asked while the exercise is still fresh.
    const summary = await screen.findByRole('dialog')
    await user.click(within(summary).getByRole('button', { name: 'Hard' }))
    await user.click(within(summary).getByRole('button', { name: 'Loved it' }))
    await waitFor(() => expect(getTrpcTestRuns()[0]?.difficulty).toBe('hard'))
    expect(getTrpcTestRuns()[0]?.feel).toBe('loved')

    await nextExercise(user, 'Gm7 – C7 – Fmaj7 — a bebop line')
    await playAndFinish(user, 'Gm7 – C7 – Fmaj7 — a bebop line')
    await finishSession(user)

    const closing = screen.getByRole('dialog')
    const [first] = within(closing).getAllByRole('listitem')
    expect(within(first).getByText('Hard')).toBeInTheDocument()
    expect(within(first).getByText('Loved it')).toBeInTheDocument()
    // Read back, not asked again.
    expect(within(closing).queryByRole('button', { name: 'Hard' })).toBeNull()
  })

  it('moves itself on once both answers are given', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-g,lines-ii-v-i-f-line')
    await playAndFinish(user, 'G major — open position')

    const summary = await screen.findByRole('dialog')
    await user.click(within(summary).getByRole('button', { name: 'Hard' }))
    await user.click(within(summary).getByRole('button', { name: 'Loved it' }))

    // Both answered is the whole ask, so nothing is left to press.
    expect(await screen.findByRole('heading', { level: 1, name: /^Gm7 – C7 – Fmaj7 — a bebop line/ })).toBeInTheDocument()
    await waitFor(() => expect(getTrpcTestRuns()[0]?.difficulty).toBe('hard'))
    expect(getTrpcTestRuns()[0]?.feel).toBe('loved')
  })

  it('lets the sitting be ended from the summary, not only from the stage', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-g,lines-ii-v-i-f-line')
    await playAndFinish(user, 'G major — open position')

    // The stage behind has its own way out; this is the one on the summary.
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'End session' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  it('says an exercise was skipped, and asks nothing about it', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-g,lines-ii-v-i-f-line')

    // Every exercise ends on its summary; one that was not played has nothing to answer.
    await skip(user, 'G major — open position')
    expect(within(dialog()).getByText('Not played')).toBeInTheDocument()
    expect(within(dialog()).queryByRole('group', { name: /^How did it go\?/ })).toBeNull()

    await nextExercise(user, 'Gm7 – C7 – Fmaj7 — a bebop line')
    expect(getTrpcTestRuns()).toEqual([])
  })

  it('answers how it felt beside how it went, and keeps the two apart', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await playAndFinish(user, 'C major — open position')

    // Two questions on the exercise's own summary, and neither is answered for the user.
    const summary = await screen.findByRole('dialog')
    expect(within(summary).getByRole('group', { name: /^How did it go\?/ })).toBeInTheDocument()
    expect(within(summary).getByRole('group', { name: /^How did it feel\?/ })).toBeInTheDocument()

    await user.click(within(summary).getByRole('button', { name: 'Loved it' }))
    await waitFor(() => expect(getTrpcTestRuns()[0]?.feel).toBe('loved'))
    // Saying how it felt says nothing about how it went.
    expect(getTrpcTestRuns()[0]?.difficulty).toBeNull()

    await user.click(within(summary).getByRole('button', { name: 'Good' }))
    await waitFor(() => expect(getTrpcTestRuns()[0]?.difficulty).toBe('good'))
    expect(getTrpcTestRuns()[0]?.feel).toBe('loved')

    // Pressing the chosen answer again clears it.
    await user.click(within(summary).getByRole('button', { name: 'Loved it' }))
    await waitFor(() => expect(getTrpcTestRuns()[0]?.feel).toBeNull())
  })

  it('keeps a note about the whole sitting, once something has been played', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await playAndFinish(user, 'C major — open position')

    // One exercise, one dialog: the sitting's note is on the exercise's own summary.
    const note = within(await screen.findByRole('dialog')).getByLabelText(/^Anything worth remembering\?/)
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
    await skip(user, 'C major — open position')
    expect(within(dialog()).queryByLabelText(/^Anything worth remembering\?/)).toBeNull()
    expect(getTrpcTestRuns()).toEqual([])
  })

  it('ends a session of one on a single dialog, not two', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')
    await playAndFinish(user, 'C major — open position')

    const only = await screen.findByRole('dialog')
    expect(within(only).getByRole('heading', { level: 2, name: 'Exercise complete' })).toBeInTheDocument()
    // It is the exercise's summary and the sitting's end at once.
    expect(within(only).getByRole('group', { name: /^How did it go\?/ })).toBeInTheDocument()
    expect(within(only).getByRole('button', { name: 'Done' })).toBeInTheDocument()
    expect(within(only).getByRole('button', { name: 'Play it again' })).toBeInTheDocument()
    expect(within(only).queryByRole('button', { name: 'Finish session' })).toBeNull()

    await user.click(within(only).getByRole('button', { name: 'Done' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  it('starts each exercise at the tempo the plan asked for', async () => {
    await renderRoute('/session?x=scales-major-open-c@48')
    // The written tempo is 60; the URL asked for 48, and the readout follows the plan.
    expect(screen.getByRole('spinbutton', { name: /[Tt]empo/ })).toHaveValue(48)
  })

  it('keeps the whole run\'s clock on the stage, counting to the length the plan was cut to', async () => {
    await renderRoute('/session?x=scales-major-open-c,scales-major-open-g&m=20')
    expect(await screen.findByLabelText('Practice run: 0:00 of ~20 min')).toBeInTheDocument()
  })

  it('counts without a target when nothing planned the run', async () => {
    await renderRoute('/session?x=scales-major-open-c')
    expect(await screen.findByLabelText('Practice run: 0:00')).toBeInTheDocument()
  })

  it('starts the clock again when the plan is played again', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c&m=20')
    const clock = await screen.findByRole('timer')
    await playAndFinish(user, 'C major — open position')
    await screen.findByRole('dialog')

    // The sitting's total stands on the closing dialog while the run is over.
    await user.click(within(dialog()).getByRole('button', { name: 'Play it again' }))
    expect(await screen.findByText('Next session · 1 of 1')).toBeInTheDocument()
    // A second sitting, a second clock: the reading is of the new run, not the old one.
    expect(screen.getByRole('timer')).not.toBe(clock)
    expect(screen.getByRole('timer')).toHaveTextContent('0:00 of ~20 min')
  })

  it('offers the same plan again at the end, as a session of its own', async () => {
    const user = userEvent.setup()
    await renderRoute('/session?x=scales-major-open-c')

    expect(await screen.findByText('Next session · 1 of 1')).toBeInTheDocument()
    await playAndFinish(user, 'C major — open position')
    expect(await screen.findByRole('dialog')).toHaveFocus()
    await waitFor(() => expect(getTrpcTestRuns()).toHaveLength(1))
    const first = getTrpcTestRuns()[0].sessionId

    await user.click(within(dialog()).getByRole('button', { name: 'Play it again' }))
    expect(await screen.findByText('Next session · 1 of 1')).toBeInTheDocument()
    await playAndFinish(user, 'C major — open position')
    await screen.findByRole('dialog')
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
