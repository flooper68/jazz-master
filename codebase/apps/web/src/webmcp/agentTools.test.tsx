import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../test/renderRoute'
import { resetTrpcTestData } from '../test/trpcTestFetch'
import { installDevModelContext, type ModelContextShim } from './devModelContext'
import { pageModelContext } from './modelContext'

// Mounted as production mounts it: StrictMode runs every effect twice, so every tool is offered, taken back and offered again.
const renderApp = (path: string) => renderRoute(path, { strict: true })

/** The agent's side of the page: list the tools, call one. */
function agent() {
  const modelContext = pageModelContext() as ModelContextShim
  return {
    names: async () => (await modelContext.getTools()).map(({ name }) => name),
    call: async (name: string, args: unknown = {}) => JSON.parse(await modelContext.executeTool({ name }, JSON.stringify(args))) as Record<string, unknown>,
  }
}

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  vi.stubGlobal('AudioContext', undefined)
  installDevModelContext()
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete (document as { modelContext?: unknown }).modelContext
})

describe('an agent in the user\'s browser', () => {
  it('is offered the library and app tools, and the player\'s only while a player is up', async () => {
    const view = await renderApp('/exercises')
    await screen.findByRole('heading', { level: 1, name: 'Exercises' })
    const names = await agent().names()
    expect(names).toEqual(expect.arrayContaining(['list_exercises', 'create_exercise', 'list_goals', 'set_priority', 'get_current_view', 'navigate', 'open_exercise', 'start_exercise']))
    expect(names).not.toContain('player_play')
    expect(new Set(names).size).toBe(names.length)

    // Opening one is reading it: there is no player on the exercise page.
    expect(await agent().call('open_exercise', { exerciseId: 'scales-major-open-c' })).toMatchObject({ status: 'ok' })
    await screen.findByRole('heading', { level: 1, name: 'C major — open position' })
    expect(await agent().names()).not.toContain('player_play')

    // Practising it makes a session of one, and that is where the player lives.
    expect(await agent().call('start_exercise', { exerciseId: 'scales-major-open-c' })).toMatchObject({ status: 'ok' })
    await screen.findByRole('button', { name: /^Play C major/ })
    expect(await agent().names()).toContain('player_play')
    expect(await agent().call('get_current_view')).toMatchObject({ page: 'session', path: '/session', player: { exerciseId: 'scales-major-open-c', playing: false } })

    expect(await agent().call('navigate', { page: 'history' })).toMatchObject({ status: 'ok' })
    await screen.findByRole('heading', { level: 1, name: 'History' })
    expect(await agent().names()).not.toContain('player_play')

    view.unmount()
    expect(await agent().names()).toEqual([])
  })

  it('mutes an exercise only after the user allows it on the page', async () => {
    const user = userEvent.setup()
    await renderApp('/exercises')
    await screen.findByRole('heading', { level: 1, name: 'Exercises' })

    const refused = agent().call('set_priority', { exerciseId: 'scales-major-open-c', priority: 'muted' })
    const prompt = await screen.findByRole('alertdialog', { name: /mute “scales-major-open-c”/ })
    expect(within(prompt).getByRole('button', { name: 'Refuse' })).toHaveFocus()
    await user.click(within(prompt).getByRole('button', { name: 'Refuse' }))
    expect(await refused).toMatchObject({ status: 'refused' })

    const allowed = agent().call('set_priority', { exerciseId: 'scales-major-open-c', priority: 'muted' })
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Allow' }))
    expect(await allowed).toMatchObject({ status: 'ok' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('takes Escape on the question as a no', async () => {
    await renderApp('/exercises')
    await screen.findByRole('heading', { level: 1, name: 'Exercises' })
    const asked = agent().call('set_priority', { exerciseId: 'scales-major-open-c', priority: 'muted' })
    const prompt = await screen.findByRole('alertdialog')
    // jsdom's dialog has no cancel event of its own; this is the one a browser fires on Escape.
    prompt.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(await asked).toMatchObject({ status: 'refused' })
  })

  it('asks before taking the user away from a run in full flow', async () => {
    const user = userEvent.setup()
    await renderApp('/')
    expect(await agent().call('start_exercise', { exerciseId: 'scales-major-open-c' })).toMatchObject({ status: 'ok' })
    await screen.findByRole('button', { name: /^Play C major/ })
    expect(await agent().call('player_play')).toMatchObject({ status: 'ok', player: { playing: true } })

    const leaving = agent().call('navigate', { page: 'history' })
    await user.click(within(await screen.findByRole('alertdialog', { name: /leave the exercise you are playing/ })).getByRole('button', { name: 'Refuse' }))
    expect(await leaving).toMatchObject({ status: 'refused' })
    expect(await agent().call('get_current_view')).toMatchObject({ page: 'session' })
  })

  it('starts an exercise and works the player', async () => {
    await renderApp('/')
    expect(await agent().call('start_exercise', { exerciseId: 'scales-major-open-c' })).toMatchObject({ status: 'ok' })
    await screen.findByRole('button', { name: /^Play C major/ })
    expect(await agent().call('player_set_tempo', { bpm: 96 })).toMatchObject({ status: 'ok', player: { tempoBpm: 96 } })
    expect(await agent().call('player_play')).toMatchObject({ status: 'ok', player: { playing: true, soundAvailable: false } })
    expect(await screen.findByRole('button', { name: /^Pause/ })).toBeInTheDocument()
    expect(await agent().call('player_stop')).toMatchObject({ status: 'ok', player: { playing: false, bar: 1, beat: 1 } })
  })
})
