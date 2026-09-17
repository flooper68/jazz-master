import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTER_ROUTINES } from '../../content/starterRoutines'
import { renderRoute } from '../../test/renderRoute'
import {
  getTrpcTestRoutines,
  resetTrpcTestData,
  seedTrpcTestRoutines,
  setTrpcTestRoutinesRepositoryAvailable,
} from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  vi.stubGlobal('AudioContext', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const warmUp = {
  name: 'Warm-up',
  about: 'Ten minutes before the gig.',
  items: [{ exerciseId: 'scales-major-open-c' }, { exerciseId: 'lines-ii-v-i-f-line' }],
}

describe('RoutinesPage', () => {
  it('gives a new user the starter routines as cards: what each is, Start, and a way to change it', async () => {
    await renderRoute('/routines')
    for (const routine of STARTER_ROUTINES) {
      expect(await screen.findByRole('listitem', { name: routine.name })).toBeInTheDocument()
    }
    const card = within(screen.getByRole('listitem', { name: 'Open-position warm-up' }))
    expect(card.getByText(/^The major scale in three keys/)).toBeInTheDocument()
    expect(card.getByText(/^3 exercises · ~\d+ min$/)).toBeInTheDocument()
    expect(card.getByRole('button', { name: 'Start Open-position warm-up' })).toBeEnabled()
    // A card stays quiet: no delete on it, no exercise list.
    expect(card.queryByRole('button', { name: /^Delete/ })).toBeNull()
    expect(card.queryByText('G major — open position')).toBeNull()
    // They are stored, not just shown.
    const stored = await getTrpcTestRoutines()
    expect(stored.map((routine) => routine.name)).toEqual(STARTER_ROUTINES.map((routine) => routine.name))
    expect(card.getByRole('link', { name: 'Edit Open-position warm-up' })).toHaveAttribute('href', `/app/routines/${stored[0].id}/edit`)
    expect(screen.getByRole('link', { name: 'New routine' })).toHaveAttribute('href', '/app/routines/new')
  })

  it('starts a routine: its exercises in its order, under its name', async () => {
    const user = userEvent.setup()
    await seedTrpcTestRoutines([{ name: 'Backwards', items: [{ exerciseId: 'lines-ii-v-i-f-line' }, { exerciseId: 'scales-major-open-c' }] }])
    await renderRoute('/routines')

    await user.click(await screen.findByRole('button', { name: 'Start Backwards' }))
    expect(await screen.findByRole('heading', { level: 1, name: /^Gm7 – C7 – Fmaj7 — a bebop line/ })).toBeInTheDocument()
    expect(await screen.findByText('Backwards · 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'End routine' })).toBeInTheDocument()
  })

  it('says so when the routines cannot be loaded', async () => {
    setTrpcTestRoutinesRepositoryAvailable(false)
    await renderRoute('/routines')
    expect(await screen.findByRole('alert')).toHaveTextContent('Your routines could not be loaded.')
  })
})

describe('the new routine page', () => {
  it('creates a routine — a name, exercises added and put in order — and returns to the cards', async () => {
    const user = userEvent.setup()
    await renderRoute('/routines')
    await user.click(await screen.findByRole('link', { name: 'New routine' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'New routine' })).toBeInTheDocument()
    // Making a routine is still being in Routines.
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Routines' })).toHaveAttribute('aria-current', 'page')
    const editor = within(screen.getByRole('form', { name: 'New routine' }))
    const create = editor.getByRole('button', { name: 'Create routine' })
    expect(create).toBeDisabled()
    expect(editor.queryByRole('button', { name: /^Delete/ })).toBeNull()

    await user.type(editor.getByLabelText('Name'), 'ii–V–I workout')
    await user.selectOptions(editor.getByLabelText('Exercise to add'), 'Gm7 – C7 – Fmaj7 — a bebop line')
    await user.click(editor.getByRole('button', { name: 'Add' }))
    await user.selectOptions(editor.getByLabelText('Exercise to add'), 'Gm7 – C7 – Fmaj7 — arpeggios up and down')
    await user.click(editor.getByRole('button', { name: 'Add' }))
    // Arpeggios before the line: move it up.
    await user.click(editor.getByRole('button', { name: 'Move Gm7 – C7 – Fmaj7 — arpeggios up and down up' }))
    // What is in the routine is no longer on offer.
    expect(within(editor.getByLabelText('Exercise to add')).queryByRole('option', { name: 'Gm7 – C7 – Fmaj7 — a bebop line' })).toBeNull()

    await user.click(create)
    expect(await screen.findByRole('heading', { level: 1, name: 'Routines' })).toBeInTheDocument()
    const card = within(await screen.findByRole('listitem', { name: 'ii–V–I workout' }))
    expect(card.getByText(/^2 exercises · ~\d+ min$/)).toBeInTheDocument()
    expect((await getTrpcTestRoutines()).at(-1)).toMatchObject({
      name: 'ii–V–I workout',
      items: [{ exerciseId: 'lines-ii-v-i-f-arpeggios' }, { exerciseId: 'lines-ii-v-i-f-line' }],
    })
  })

  it('narrows what the picker offers, and Enter in the search does not save the routine', async () => {
    const user = userEvent.setup()
    await renderRoute('/routines/new')
    const editor = within(await screen.findByRole('form', { name: 'New routine' }))
    await user.type(editor.getByLabelText('Name'), 'Modes')
    await user.click(editor.getByRole('button', { name: 'Add' }))

    await user.type(editor.getByRole('searchbox', { name: 'Search exercises' }), 'dorian{Enter}')
    const offered = () => within(editor.getByLabelText('Exercise to add')).getAllByRole('option').map((option) => option.textContent)
    await waitFor(() => expect(offered()).not.toContain('Ode to Joy'))
    expect(offered()).toContain('D Dorian — fifth position')
    // Still on the editor, and nothing stored beyond the starters.
    expect(screen.getByRole('heading', { level: 1, name: 'New routine' })).toBeInTheDocument()
    expect((await getTrpcTestRoutines()).map((routine) => routine.name)).not.toContain('Modes')
  })

  it('goes back to the cards on Cancel, storing nothing', async () => {
    const user = userEvent.setup()
    await seedTrpcTestRoutines([warmUp])
    await renderRoute('/routines/new')
    await user.type(screen.getByLabelText('Name'), 'Never mind')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Routines' })).toBeInTheDocument()
    expect((await getTrpcTestRoutines()).map((routine) => routine.name)).toEqual(['Warm-up'])
  })
})

describe('the edit routine page', () => {
  it('opens from a card, renames the routine and takes an exercise out', async () => {
    const user = userEvent.setup()
    await seedTrpcTestRoutines([warmUp])
    await renderRoute('/routines')

    await user.click(await screen.findByRole('link', { name: 'Edit Warm-up' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Edit routine' })).toBeInTheDocument()
    const editor = within(screen.getByRole('form', { name: 'Edit Warm-up' }))
    expect(editor.getByLabelText('Name')).toHaveValue('Warm-up')
    await user.clear(editor.getByLabelText('Name'))
    await user.type(editor.getByLabelText('Name'), 'Warm-up, short')
    await user.click(editor.getByRole('button', { name: 'Remove Gm7 – C7 – Fmaj7 — a bebop line' }))
    await user.click(editor.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('listitem', { name: 'Warm-up, short' })).toBeInTheDocument()
    const stored = await getTrpcTestRoutines()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ name: 'Warm-up, short', about: warmUp.about, items: [{ exerciseId: 'scales-major-open-c' }] })
  })

  it('deletes with two presses and returns to the cards — and once everything is deleted, the starters do not come back', async () => {
    const user = userEvent.setup()
    const [routine] = await seedTrpcTestRoutines([warmUp])
    await renderRoute(`/routines/${routine.id}/edit`)

    await user.click(await screen.findByRole('button', { name: 'Delete Warm-up' }))
    expect(await getTrpcTestRoutines()).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Delete Warm-up for good' }))
    await waitFor(async () => expect(await getTrpcTestRoutines()).toEqual([]))
    expect(await screen.findByRole('heading', { level: 1, name: 'Routines' })).toBeInTheDocument()
    expect(await screen.findByText('No routines yet')).toBeInTheDocument()
  })

  it('renders not found for a routine that is not the user’s', async () => {
    await seedTrpcTestRoutines([warmUp])
    await renderRoute('/routines/10000000-0000-4000-8000-00000000ffff/edit')
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
