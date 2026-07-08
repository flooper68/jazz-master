import { defineStore } from './store'

export const NOTATION_DISPLAY_MODES = ['both', 'staff', 'tab'] as const

export type NotationDisplayMode = (typeof NOTATION_DISPLAY_MODES)[number]

export interface NotationPreferences {
  displayMode: NotationDisplayMode
}

export const DEFAULT_NOTATION_DISPLAY_MODE: NotationDisplayMode = 'both'

export const notationPreferencesStore = defineStore<NotationPreferences>({
  name: 'notation-preferences',
  version: 1,
  defaultValue: () => ({ displayMode: DEFAULT_NOTATION_DISPLAY_MODE }),
})

export function isNotationDisplayMode(
  value: unknown,
): value is NotationDisplayMode {
  return (
    typeof value === 'string' &&
    NOTATION_DISPLAY_MODES.includes(value as NotationDisplayMode)
  )
}

export function getNotationDisplayMode(): NotationDisplayMode {
  const preferences = notationPreferencesStore.get()
  return isNotationDisplayMode(preferences.displayMode)
    ? preferences.displayMode
    : DEFAULT_NOTATION_DISPLAY_MODE
}

export function saveNotationDisplayMode(mode: NotationDisplayMode): void {
  notationPreferencesStore.update(() => ({ displayMode: mode }))
}
