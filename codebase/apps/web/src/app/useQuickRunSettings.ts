import { useSyncExternalStore } from 'react'
import { quickRunSettings, subscribeQuickRunSettings, type QuickRunSettings } from '../appData/quickRun'

/**
 * What to play next as the user chose it — the generated session, or a routine
 * named as next. One value for the whole app: the sidebar's panel sets it and
 * the home card re-plans from the same answer in the same render.
 */
export function useQuickRunSettings(): QuickRunSettings {
  return useSyncExternalStore(subscribeQuickRunSettings, quickRunSettings, quickRunSettings)
}
