import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_NOTATION_DISPLAY_MODE,
  getNotationDisplayMode,
  notationPreferencesStore,
  saveNotationDisplayMode,
} from './notationPreferences'

beforeEach(() => {
  localStorage.clear()
})

describe('notationPreferencesStore', () => {
  it('defaults to staff and tablature', () => {
    expect(getNotationDisplayMode()).toBe(DEFAULT_NOTATION_DISPLAY_MODE)
  })

  it('saves the selected display mode', () => {
    saveNotationDisplayMode('staff')
    expect(getNotationDisplayMode()).toBe('staff')

    saveNotationDisplayMode('tab')
    expect(getNotationDisplayMode()).toBe('tab')
  })

  it('falls back to both systems for malformed stored data', () => {
    notationPreferencesStore.set({
      displayMode: 'lead-sheet' as unknown as 'both',
    })

    expect(getNotationDisplayMode()).toBe('both')
  })
})
