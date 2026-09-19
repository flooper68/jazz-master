import { useSyncExternalStore } from 'react'
import { playerPrefs, subscribePlayerPrefs, type PlayerPrefs } from './playerPrefs'

/**
 * The sound and view choices as the user left them. One value for the whole
 * app: the account menu's Player settings and the player's own Advanced panel
 * set the same thing, and both re-render from it in the same pass.
 */
export function usePlayerPrefs(): PlayerPrefs {
  return useSyncExternalStore(subscribePlayerPrefs, playerPrefs, playerPrefs)
}
