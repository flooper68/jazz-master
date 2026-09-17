import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import { resetTrpcTestData, seedTrpcTestLibrary } from '../../test/trpcTestFetch'

const chords = {
  title: 'Dm7 shell voicings, broken',
  area: 'chords' as const,
  level: 4,
  tempoBpm: 72,
  duration: { kind: 'repetitions' as const, count: 4 },
  key: 'C',
  notes: [
    { string: 5 as const, fret: 5, beats: 1 },
    { string: 4 as const, fret: 3, beats: 1 },
    { string: 3 as const, fret: 5, beats: 2 },
  ],
}

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  vi.stubGlobal('AudioContext', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the user’s own exercises, in the app', () => {
  it('lists them beside the pack, under their area, marked as the user’s', async () => {
    await seedTrpcTestLibrary([chords])
    await renderRoute('/exercises')
    const heading = await screen.findByRole('heading', { level: 3, name: /Dm7 shell voicings, broken/ })
    const card = within(heading.closest('li') as HTMLElement)
    expect(card.getByText('Yours')).toBeInTheDocument()
    // An area the pack has nothing in appears once the library does.
    expect(screen.getByRole('heading', { level: 2, name: 'Chords' })).toBeInTheDocument()
    // The pack is untouched, and carries no such mark.
    const pack = within(screen.getByRole('heading', { level: 3, name: 'C major — open position' }).closest('li') as HTMLElement)
    expect(pack.queryByText('Yours')).toBeNull()
    expect(pack.queryByRole('button', { name: /^Delete / })).toBeNull()
    // Level 4 is past the pack's three dots; every row grows to match.
    expect(card.getByRole('img', { name: 'Level 4' }).children).toHaveLength(4)
    expect(pack.getByRole('img', { name: 'Level 1' }).children).toHaveLength(4)
  })

  it('opens one in the player by its id', async () => {
    const [stored] = await seedTrpcTestLibrary([chords])
    await renderRoute(`/exercises/${stored.id}`)
    expect(await screen.findByRole('button', { name: `Play ${chords.title}` })).toBeInTheDocument()
  })

  it('says not found for a library id that is not in the library, once the library has answered', async () => {
    await renderRoute('/exercises/user-00000000-0000-4000-8000-999999999999')
    expect(await screen.findByRole('heading', { level: 1, name: /not found/i })).toBeInTheDocument()
  })

  it('deletes one on the second press, not the first', async () => {
    const user = userEvent.setup()
    await seedTrpcTestLibrary([chords])
    await renderRoute('/exercises')
    await user.click(await screen.findByRole('button', { name: `Delete ${chords.title}` }))
    expect(screen.getByRole('heading', { level: 3, name: /Dm7 shell voicings/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: `Delete ${chords.title} for good` }))
    await waitFor(() => expect(screen.queryByRole('heading', { level: 3, name: /Dm7 shell voicings/ })).toBeNull())
    expect(screen.queryByRole('heading', { level: 2, name: 'Chords' })).toBeNull()
  })
})
