import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineStore } from './store'

interface Profile {
  instrument: string
  minutesPerDay: number
}

const sampleStore = () =>
  defineStore<Profile>({
    name: 'profile',
    version: 1,
    defaultValue: () => ({ instrument: 'guitar', minutesPerDay: 20 }),
  })

const KEY = 'jazz-master:profile'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('defineStore', () => {
  it('round-trips a value through set and get', () => {
    const store = sampleStore()
    store.set({ instrument: 'archtop', minutesPerDay: 45 })
    expect(store.get()).toEqual({ instrument: 'archtop', minutesPerDay: 45 })
  })

  it('persists under the namespaced key in a versioned envelope', () => {
    sampleStore().set({ instrument: 'guitar', minutesPerDay: 30 })
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      version: 1,
      data: { instrument: 'guitar', minutesPerDay: 30 },
    })
  })

  it('returns the default when nothing is persisted', () => {
    expect(sampleStore().get()).toEqual({ instrument: 'guitar', minutesPerDay: 20 })
  })

  it('returns a fresh default each time, never a shared object', () => {
    const store = sampleStore()
    const a = store.get()
    a.minutesPerDay = 999
    expect(store.get().minutesPerDay).toBe(20)
  })

  it('returns the default and warns on corrupt JSON', () => {
    localStorage.setItem(KEY, '{not json')
    expect(sampleStore().get()).toEqual({ instrument: 'guitar', minutesPerDay: 20 })
    expect(console.warn).toHaveBeenCalledOnce()
  })

  it('returns the default and warns on a malformed envelope', () => {
    localStorage.setItem(KEY, JSON.stringify({ instrument: 'guitar' }))
    expect(sampleStore().get()).toEqual({ instrument: 'guitar', minutesPerDay: 20 })
    expect(console.warn).toHaveBeenCalledOnce()
  })

  it('update transforms the current value in place', () => {
    const store = sampleStore()
    store.set({ instrument: 'guitar', minutesPerDay: 30 })
    store.update((p) => ({ ...p, minutesPerDay: p.minutesPerDay + 15 }))
    expect(store.get().minutesPerDay).toBe(45)
  })

  it('reset removes the persisted value so get returns the default', () => {
    const store = sampleStore()
    store.set({ instrument: 'archtop', minutesPerDay: 45 })
    store.reset()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(store.get()).toEqual({ instrument: 'guitar', minutesPerDay: 20 })
  })

  it('returns the default and warns when the read itself throws (disabled storage, SSR)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('storage disabled', 'SecurityError')
    })
    expect(sampleStore().get()).toEqual({ instrument: 'guitar', minutesPerDay: 20 })
    expect(console.warn).toHaveBeenCalledOnce()
  })

  it('does not throw when the write fails (quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })
    const store = sampleStore()
    expect(() => store.set({ instrument: 'guitar', minutesPerDay: 30 })).not.toThrow()
    expect(console.warn).toHaveBeenCalledOnce()
  })

  describe('migration', () => {
    interface ProfileV2 {
      instrument: string
      minutesPerDay: number
      styles: string[]
    }

    const migratedFrom: number[] = []

    const v2Store = () =>
      defineStore<ProfileV2>({
        name: 'profile',
        version: 2,
        defaultValue: () => ({ instrument: 'guitar', minutesPerDay: 20, styles: [] }),
        migrate: (persisted, fromVersion) => {
          migratedFrom.push(fromVersion)
          const old = persisted as Profile
          return { ...old, styles: ['bebop'] }
        },
      })

    it('migrates v1 data to v2 and persists the migrated value', () => {
      sampleStore().set({ instrument: 'archtop', minutesPerDay: 45 })

      migratedFrom.length = 0
      expect(v2Store().get()).toEqual({ instrument: 'archtop', minutesPerDay: 45, styles: ['bebop'] })
      expect(migratedFrom).toEqual([1])
      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
        version: 2,
        data: { instrument: 'archtop', minutesPerDay: 45, styles: ['bebop'] },
      })
    })

    it('falls back to the default when the migration throws', () => {
      sampleStore().set({ instrument: 'archtop', minutesPerDay: 45 })
      const store = defineStore<ProfileV2>({
        name: 'profile',
        version: 2,
        defaultValue: () => ({ instrument: 'guitar', minutesPerDay: 20, styles: [] }),
        migrate: () => {
          throw new Error('cannot migrate')
        },
      })
      expect(store.get()).toEqual({ instrument: 'guitar', minutesPerDay: 20, styles: [] })
      expect(console.warn).toHaveBeenCalledOnce()
    })

    it('falls back to the default when old data exists but no migrate is defined', () => {
      sampleStore().set({ instrument: 'archtop', minutesPerDay: 45 })
      const store = defineStore<ProfileV2>({
        name: 'profile',
        version: 2,
        defaultValue: () => ({ instrument: 'guitar', minutesPerDay: 20, styles: [] }),
      })
      expect(store.get()).toEqual({ instrument: 'guitar', minutesPerDay: 20, styles: [] })
      expect(console.warn).toHaveBeenCalledOnce()
    })

    it('falls back to the default when the persisted version is newer than the store', () => {
      v2Store().set({ instrument: 'archtop', minutesPerDay: 45, styles: [] })
      expect(sampleStore().get()).toEqual({ instrument: 'guitar', minutesPerDay: 20 })
      expect(console.warn).toHaveBeenCalledOnce()
    })
  })
})
