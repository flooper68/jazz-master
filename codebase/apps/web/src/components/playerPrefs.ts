import { DEFAULT_PLAYER_PREFS, parsePlayerPrefs, type PlayerPrefs } from '../appData/playerPrefs'

/**
 * Where the player's preferences are kept in this browser, and the one copy
 * of them the app reads. The shape itself lives in `appData/playerPrefs`,
 * which the server validates against too.
 */

export { clampZoom, DEFAULT_PLAYER_PREFS, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../appData/playerPrefs'
export type { PlayerPrefs } from '../appData/playerPrefs'

export const PLAYER_PREFS_KEY = 'jazz-master.player-prefs'
/**
 * Set the moment a choice is made here and cleared only when the account has
 * confirmed it. It is what stops a change made in the last moment before a
 * reload — or one whose write failed — from being quietly overwritten by the
 * account's older copy on the next visit.
 */
export const PLAYER_PREFS_UNSAVED_KEY = 'jazz-master.player-prefs.unsaved'

export function markPlayerPrefsUnsaved(): void {
  try {
    safeStorage()?.setItem(PLAYER_PREFS_UNSAVED_KEY, '1')
  } catch {
    // Nothing to remember it with; the change still holds for this run.
  }
}

export function markPlayerPrefsSaved(): void {
  try {
    safeStorage()?.removeItem(PLAYER_PREFS_UNSAVED_KEY)
  } catch {
    // As above.
  }
}

/** True when this browser holds a choice the account has not confirmed. */
export function playerPrefsUnsaved(): boolean {
  try {
    return safeStorage()?.getItem(PLAYER_PREFS_UNSAVED_KEY) === '1'
  } catch {
    return false
  }
}

/** The last saved preferences, or the defaults; storage that is missing or broken is ignored. */
export function loadPlayerPrefs(storage: Pick<Storage, 'getItem'> | null = safeStorage()): PlayerPrefs {
  try {
    const raw = storage?.getItem(PLAYER_PREFS_KEY)
    if (!raw) return DEFAULT_PLAYER_PREFS
    return parsePlayerPrefs(JSON.parse(raw))
  } catch {
    return DEFAULT_PLAYER_PREFS
  }
}

export function savePlayerPrefs(prefs: PlayerPrefs, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(PLAYER_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode or a full quota: the choice still holds for this run.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/**
 * The preferences are one set per app, not one per component: the player's
 * Advanced panel and the account menu's Player settings both write them, and
 * a player already on screen must follow at once. Read through `playerPrefs`,
 * written through `setPlayerPrefs`.
 */
let current: PlayerPrefs | null = null
const listeners = new Set<() => void>()

export function playerPrefs(): PlayerPrefs {
  if (current === null) current = loadPlayerPrefs()
  return current
}

export function setPlayerPrefs(prefs: PlayerPrefs): void {
  current = prefs
  savePlayerPrefs(prefs)
  for (const listener of listeners) listener()
}

export function subscribePlayerPrefs(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Forget what was read, so a test (or a fresh sign-in) starts from storage
 * again. It resets this module only: a mounted `usePlayerPrefsSync` keeps
 * whatever it already knows about the account.
 */
export function resetPlayerPrefs(): void {
  current = null
  for (const listener of listeners) listener()
}
