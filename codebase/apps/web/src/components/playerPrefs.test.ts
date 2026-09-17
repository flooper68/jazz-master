import { describe, expect, it } from 'vitest'
import { clampZoom, DEFAULT_PLAYER_PREFS, loadPlayerPrefs, PLAYER_PREFS_KEY, savePlayerPrefs } from './playerPrefs'

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial))
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe('player prefs', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage()
    savePlayerPrefs({ click: false, voice: true, countIn: false, view: 'notation', guitar: 'steel', zoom: 1.5 }, storage)
    expect(loadPlayerPrefs(storage)).toEqual({ click: false, voice: true, countIn: false, view: 'notation', guitar: 'steel', zoom: 1.5 })
  })

  it('falls back to the defaults for missing, broken or partial data', () => {
    expect(loadPlayerPrefs(memoryStorage())).toEqual(DEFAULT_PLAYER_PREFS)
    expect(loadPlayerPrefs(memoryStorage({ [PLAYER_PREFS_KEY]: '{oops' }))).toEqual(DEFAULT_PLAYER_PREFS)
    expect(loadPlayerPrefs(memoryStorage({ [PLAYER_PREFS_KEY]: '{"view":"sideways","voice":true,"guitar":"kazoo"}' }))).toEqual({
      ...DEFAULT_PLAYER_PREFS,
      voice: true,
    })
    expect(loadPlayerPrefs(null)).toEqual(DEFAULT_PLAYER_PREFS)
    expect(loadPlayerPrefs(memoryStorage({ [PLAYER_PREFS_KEY]: '{"zoom":9}' })).zoom).toBe(2)
  })

  it('keeps zoom inside its range in tenths', () => {
    expect(clampZoom(0.5)).toBe(0.8)
    expect(clampZoom(1.44)).toBe(1.4)
    expect(clampZoom(3)).toBe(2)
    expect(clampZoom(Number.NaN)).toBe(1)
  })

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(loadPlayerPrefs(broken)).toEqual(DEFAULT_PLAYER_PREFS)
    expect(() => savePlayerPrefs(DEFAULT_PLAYER_PREFS, broken)).not.toThrow()
  })
})
