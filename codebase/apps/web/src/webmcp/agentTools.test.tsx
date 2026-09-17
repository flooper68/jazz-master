import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../test/renderRoute'
import { getTrpcTestRoutines, resetTrpcTestData, seedTrpcTestRoutines } from '../test/trpcTestFetch'
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
    const view = await renderApp('/routines')
    await screen.findByRole('heading', { level: 1, name: 'Routines' })
    const names = await agent().names()
    expect(names).toEqual(expect.arrayContaining(['list_routines', 'create_routine', 'delete_routine', 'get_current_view', 'navigate', 'open_exercise', 'start_routine']))
    expect(names).not.toContain('player_play')
    expect(new Set(names).size).toBe(names.length)

    expect(await agent().call('open_exercise', { exerciseId: 'scales-major-open-c' })).toMatchObject({ status: 'ok' })
    await screen.findByRole('button', { name: /^Play / })
    expect(await agent().names()).toContain('player_play')
    expect(await agent().call('get_current_view')).toMatchObject({ page: 'exercise', path: '/exercises/scales-major-open-c', player: { exerciseId: 'scales-major-open-c', playing: false } })

    expect(await agent().call('navigate', { page: 'history' })).toMatchObject({ status: 'ok' })
    await screen.findByRole('heading', { level: 1, name: 'History' })
    expect(await agent().names()).not.toContain('player_play')

    view.unmount()
    expect(await agent().names()).toEqual([])
  })

  it('makes a routine that turns up on the page the user is looking at', async () => {
    await renderApp('/routines')
    await screen.findByRole('heading', { level: 1, name: 'Routines' })
    const made = await agent().call('create_routine', { routine: { name: 'From the assistant', items: [{ exerciseId: 'scales-major-open-c' }] } })
    expect(made).toMatchObject({ status: 'ok' })
    expect(await screen.findByRole('listitem', { name: 'From the assistant' })).toBeInTheDocument()
  })

  it('deletes a routine only after the user allows it on the page', async () => {
    const user = userEvent.setup()
    const [stored] = await seedTrpcTestRoutines([{ name: 'Warm-up', items: [{ exerciseId: 'scales-major-open-c' }] }])
    await renderApp('/routines')
    await screen.findByRole('listitem', { name: 'Warm-up' })

    const refused = agent().call('delete_routine', { routineId: stored.id })
    const prompt = await screen.findByRole('alertdialog', { name: /delete the routine “Warm-up”/ })
    expect(within(prompt).getByRole('button', { name: 'Refuse' })).toHaveFocus()
    await user.click(within(prompt).getByRole('button', { name: 'Refuse' }))
    expect(await refused).toMatchObject({ status: 'refused' })
    expect(await getTrpcTestRoutines()).toHaveLength(1)

    const allowed = agent().call('delete_routine', { routineId: stored.id })
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Allow' }))
    expect(await allowed).toEqual({ status: 'ok', deleted: true })
    await waitFor(() => expect(screen.queryByRole('listitem', { name: 'Warm-up' })).toBeNull())
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('takes Escape on the question as a no', async () => {
    const [stored] = await seedTrpcTestRoutines([{ name: 'Warm-up', items: [{ exerciseId: 'scales-major-open-c' }] }])
    await renderApp('/routines')
    await screen.findByRole('listitem', { name: 'Warm-up' })
    const asked = agent().call('delete_routine', { routineId: stored.id })
    const prompt = await screen.findByRole('alertdialog')
    // jsdom's dialog has no cancel event of its own; this is the one a browser fires on Escape.
    prompt.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(await asked).toMatchObject({ status: 'refused' })
    expect(await getTrpcTestRoutines()).toHaveLength(1)
  })

  it('asks before taking the user away from a routine they are still writing', async () => {
    const user = userEvent.setup()
    await renderApp('/routines/new')
    await user.type(await screen.findByLabelText('Name'), 'Half-made')
    const leaving = agent().call('navigate', { page: 'history' })
    await user.click(within(await screen.findByRole('alertdialog', { name: /leave this page/ })).getByRole('button', { name: 'Refuse' }))
    expect(await leaving).toMatchObject({ status: 'refused' })
    expect(screen.getByLabelText('Name')).toHaveValue('Half-made')
  })

  it('starts a routine and works the player', async () => {
    const [stored] = await seedTrpcTestRoutines([{ name: 'Warm-up', items: [{ exerciseId: 'scales-major-open-c' }] }])
    await renderApp('/')
    expect(await agent().call('start_routine', { routineId: stored.id })).toMatchObject({ status: 'ok', exerciseIds: ['scales-major-open-c'] })
    await screen.findByRole('button', { name: /^Play / })
    expect(await agent().call('player_set_tempo', { bpm: 96 })).toMatchObject({ status: 'ok', player: { tempoBpm: 96 } })
    expect(await agent().call('player_play')).toMatchObject({ status: 'ok', player: { playing: true, soundAvailable: false } })
    expect(await screen.findByRole('button', { name: /^Pause/ })).toBeInTheDocument()
    expect(await agent().call('player_stop')).toMatchObject({ status: 'ok', player: { playing: false, bar: 1, beat: 1 } })
  })
})
