import { act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PLAYER_PREFS } from '../appData/playerPrefs'
import {
  markPlayerPrefsUnsaved,
  PLAYER_PREFS_KEY,
  PLAYER_PREFS_UNSAVED_KEY,
  playerPrefs,
  resetPlayerPrefs,
  setPlayerPrefs,
} from '../components/playerPrefs'
import { renderRoute } from '../test/renderRoute'
import { getTrpcTestPlayerPrefs, resetTrpcTestData, seedTrpcTestPlayerPrefs } from '../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  resetPlayerPrefs()
})

/** What this browser last had, as storage holds it between visits. */
function browserHeld(prefs: Partial<typeof DEFAULT_PLAYER_PREFS>, { unsaved = false } = {}) {
  localStorage.setItem(PLAYER_PREFS_KEY, JSON.stringify({ ...DEFAULT_PLAYER_PREFS, ...prefs }))
  if (unsaved) markPlayerPrefsUnsaved()
}

describe('the player settings follow the account', () => {
  it('opens with what the account holds, and keeps a copy in this browser', async () => {
    browserHeld({ view: 'tab', click: true })
    await seedTrpcTestPlayerPrefs({ ...DEFAULT_PLAYER_PREFS, view: 'notation', click: false })

    await renderRoute('/')

    await waitFor(() => expect(playerPrefs()).toMatchObject({ view: 'notation', click: false }))
    expect(JSON.parse(localStorage.getItem(PLAYER_PREFS_KEY) ?? '{}')).toMatchObject({ view: 'notation', click: false })
  })

  it('hands up a choice the account has never confirmed, and lets it go once it has', async () => {
    // The shape of a tab closed moments after a setting was changed.
    browserHeld({ guitar: 'steel' }, { unsaved: true })
    await seedTrpcTestPlayerPrefs(null)

    await renderRoute('/')

    await waitFor(async () => expect(await getTrpcTestPlayerPrefs()).toMatchObject({ guitar: 'steel' }))
    await waitFor(() => expect(localStorage.getItem(PLAYER_PREFS_UNSAVED_KEY)).toBeNull())
  })

  it('does not pin an untouched browser’s defaults on the account', async () => {
    // Nothing was ever chosen here, so there is nothing to say — and saying it
    // would overwrite what the user chose on another device.
    await seedTrpcTestPlayerPrefs(null)

    await renderRoute('/')

    await waitFor(() => expect(playerPrefs()).toEqual(DEFAULT_PLAYER_PREFS))
    expect(await getTrpcTestPlayerPrefs()).toBeNull()
  })

  it('writes a change back to the account, mounted as the app mounts it', async () => {
    await seedTrpcTestPlayerPrefs({ ...DEFAULT_PLAYER_PREFS, guitar: 'steel' })
    // StrictMode, like the island entry: the subscription and the pending
    // write have to survive the double mount.
    await renderRoute('/', { strict: true })
    // Only once the account has answered is a change a change to it.
    await waitFor(() => expect(playerPrefs()).toMatchObject({ guitar: 'steel' }))

    act(() => setPlayerPrefs({ ...DEFAULT_PLAYER_PREFS, countIn: false, zoom: 1.5 }))
    expect(localStorage.getItem(PLAYER_PREFS_UNSAVED_KEY)).toBe('1')

    await waitFor(async () => expect(await getTrpcTestPlayerPrefs()).toMatchObject({ countIn: false, zoom: 1.5 }), {
      timeout: 4_000,
    })
    await waitFor(() => expect(localStorage.getItem(PLAYER_PREFS_UNSAVED_KEY)).toBeNull())
  })

  it('leaves the browser’s own settings alone when the account cannot be asked', async () => {
    browserHeld({ view: 'tab' }, { unsaved: true })

    // No `seedTrpcTestPlayerPrefs`: there is no user repository, as in a
    // deployment without a database.
    await renderRoute('/')

    await waitFor(() => expect(playerPrefs()).toMatchObject({ view: 'tab' }))
    expect(await getTrpcTestPlayerPrefs()).toBeNull()
    // Still unsaved: the account never took it, so the next visit tries again.
    expect(localStorage.getItem(PLAYER_PREFS_UNSAVED_KEY)).toBe('1')
  })
})
