import { describe, expect, it } from 'vitest'
import { DEFAULT_PLAYER_PREFS, loadPlayerPrefs, PLAYER_PREFS_KEY, savePlayerPrefs } from './playerPrefs'

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
    savePlayerPrefs({ click: false, voice: true, countIn: false, view: 'notation' }, storage)
    expect(loadPlayerPrefs(storage)).toEqual({ click: false, voice: true, countIn: false, view: 'notation' })
  })

  it('falls back to the defaults for missing, broken or partial data', () => {
    expect(loadPlayerPrefs(memoryStorage())).toEqual(DEFAULT_PLAYER_PREFS)
    expect(loadPlayerPrefs(memoryStorage({ [PLAYER_PREFS_KEY]: '{oops' }))).toEqual(DEFAULT_PLAYER_PREFS)
    expect(loadPlayerPrefs(memoryStorage({ [PLAYER_PREFS_KEY]: '{"view":"sideways","voice":true}' }))).toEqual({
      ...DEFAULT_PLAYER_PREFS,
      voice: true,
    })
    expect(loadPlayerPrefs(null)).toEqual(DEFAULT_PLAYER_PREFS)
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
