import { describe, expect, it } from 'vitest'
import {
  clampSidebarWidth,
  DEFAULT_SIDEBAR_PREFS,
  loadSidebarPrefs,
  saveSidebarPrefs,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
} from './sidebarPrefs'

describe('sidebar prefs', () => {
  it('keeps the width inside its bounds', () => {
    expect(clampSidebarWidth(10)).toBe(SIDEBAR_MIN)
    expect(clampSidebarWidth(9_000)).toBe(SIDEBAR_MAX)
    expect(clampSidebarWidth(250.4)).toBe(250)
    expect(clampSidebarWidth(Number.NaN)).toBe(DEFAULT_SIDEBAR_PREFS.width)
  })

  it('falls back to the defaults for missing, broken or partial storage', () => {
    expect(loadSidebarPrefs(null)).toEqual(DEFAULT_SIDEBAR_PREFS)
    expect(loadSidebarPrefs({ getItem: () => '{nope' })).toEqual(DEFAULT_SIDEBAR_PREFS)
    expect(loadSidebarPrefs({ getItem: () => JSON.stringify({ width: 5_000, collapsed: 'yes' }) })).toEqual({
      ...DEFAULT_SIDEBAR_PREFS,
      width: SIDEBAR_MAX,
    })
  })

  it('round-trips what was saved', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    }
    const prefs = { width: 300, collapsed: true, collapsedOnStage: false }
    saveSidebarPrefs(prefs, storage)
    expect(loadSidebarPrefs(storage)).toEqual(prefs)
  })
})
