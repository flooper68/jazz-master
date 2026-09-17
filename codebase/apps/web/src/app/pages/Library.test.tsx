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
    // It sits in its own area's section, among the pack's chords.
    const section = within(screen.getByRole('region', { name: 'Chords' }))
    expect(section.getByRole('heading', { level: 3, name: /Dm7 shell voicings, broken/ })).toBeInTheDocument()
    // The pack is untouched, and carries no such mark.
    const pack = within(screen.getByRole('heading', { level: 3, name: 'C major — open position' }).closest('li') as HTMLElement)
    expect(pack.queryByText('Yours')).toBeNull()
    expect(pack.getByText('Built-in')).toBeInTheDocument()
    expect(card.queryByText('Built-in')).toBeNull()
    expect(pack.queryByRole('button', { name: /^Delete / })).toBeNull()
    // Every row shows as many dots as the hardest exercise on the page has levels.
    expect(card.getByRole('img', { name: 'Level 4' }).children).toHaveLength(5)
    expect(pack.getByRole('img', { name: 'Level 1' }).children).toHaveLength(5)
  })

  it('opens one in the player by its id', async () => {
    const [stored] = await seedTrpcTestLibrary([chords])
    await renderRoute(`/exercises/${stored.id}`)
    expect(await screen.findByRole('button', { name: `Play ${chords.title}` })).toBeInTheDocument()
    // The player says whose it is, too.
    expect(within(screen.getByRole('region', { name: `${chords.title} player` })).getByText('Yours')).toBeInTheDocument()
  })

  it('says not found for a library id that is not in the library, once the library has answered', async () => {
    await renderRoute('/exercises/user-00000000-0000-4000-8000-999999999999')
    expect(await screen.findByRole('heading', { level: 1, name: /not found/i })).toBeInTheDocument()
  })

  it('filters the list to the built-in pack or to the user’s own, and remembers it', async () => {
    const user = userEvent.setup()
    await seedTrpcTestLibrary([chords])
    const { unmount } = await renderRoute('/exercises')
    const show = await screen.findByRole('radiogroup', { name: 'Show' })
    expect(within(show).getByRole('radio', { name: 'All' })).toBeChecked()

    await user.click(within(show).getByRole('radio', { name: 'Built-in' }))
    expect(screen.queryByRole('heading', { level: 3, name: /Dm7 shell voicings/ })).toBeNull()
    expect(screen.getByRole('heading', { level: 3, name: 'C major — open position' })).toBeInTheDocument()

    await user.click(within(show).getByRole('radio', { name: 'Yours' }))
    expect(screen.getByRole('heading', { level: 3, name: /Dm7 shell voicings/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'C major — open position' })).toBeNull()
    expect(screen.queryByRole('heading', { level: 2, name: 'Scales' })).toBeNull()

    unmount()
    await renderRoute('/exercises')
    expect(within(await screen.findByRole('radiogroup', { name: 'Show' })).getByRole('radio', { name: 'Yours' })).toBeChecked()
  })

  it('falls back to everything when the last of the user’s own is deleted while filtered to them', async () => {
    const user = userEvent.setup()
    await seedTrpcTestLibrary([chords])
    localStorage.setItem('jazz-master.exercises-source', 'yours')
    await renderRoute('/exercises')
    await user.click(await screen.findByRole('button', { name: `Delete ${chords.title}` }))
    await user.click(screen.getByRole('button', { name: `Delete ${chords.title} for good` }))
    // Nothing of the user's is left: the page shows the pack rather than going empty, and the filter goes with it.
    expect(await screen.findByRole('heading', { level: 3, name: 'C major — open position' })).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Show' })).toBeNull()
  })

  it('waits for the library instead of flashing the pack when the remembered filter is the user’s own', async () => {
    await seedTrpcTestLibrary([chords])
    localStorage.setItem('jazz-master.exercises-source', 'yours')
    await renderRoute('/exercises')
    // Whatever is on screen first, it is never a pack exercise.
    expect(screen.queryByRole('heading', { level: 3, name: 'C major — open position' })).toBeNull()
    expect(await screen.findByRole('heading', { level: 3, name: /Dm7 shell voicings/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'C major — open position' })).toBeNull()
  })

  it('offers no filter, and hides nothing, while the user has no exercises of their own', async () => {
    localStorage.setItem('jazz-master.exercises-source', 'yours')
    await renderRoute('/exercises')
    expect(await screen.findByRole('heading', { level: 3, name: 'C major — open position' })).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Show' })).toBeNull()
  })

  it('deletes one on the second press, not the first', async () => {
    const user = userEvent.setup()
    await seedTrpcTestLibrary([chords])
    await renderRoute('/exercises')
    await user.click(await screen.findByRole('button', { name: `Delete ${chords.title}` }))
    expect(screen.getByRole('heading', { level: 3, name: /Dm7 shell voicings/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: `Delete ${chords.title} for good` }))
    await waitFor(() => expect(screen.queryByRole('heading', { level: 3, name: /Dm7 shell voicings/ })).toBeNull())
  })
})
