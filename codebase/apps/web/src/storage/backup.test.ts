import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createStorageBackup,
  importStorageBackupText,
  MAX_STORAGE_BACKUP_BYTES,
  notationPreferencesStore,
  playAlongTemposStore,
  scoringPreferencesStore,
  serializeStorageBackup,
} from './index'

const exportedAt = new Date('2026-07-08T10:00:00.000Z')

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('storage backup', () => {
  it('exports remaining typed local stores without plans or session history', () => {
    playAlongTemposStore.set({ 'exercise-1': 88 })
    notationPreferencesStore.set({ displayMode: 'tab' })
    scoringPreferencesStore.set({ tolerance: 'lenient' })

    expect(createStorageBackup(exportedAt)).toEqual({
      app: 'jazz-master',
      version: 1,
      exportedAt: '2026-07-08T10:00:00.000Z',
      stores: {
        playAlongTempos: { version: 1, data: { 'exercise-1': 88 } },
        notationPreferences: { version: 1, data: { displayMode: 'tab' } },
        scoringPreferences: { version: 1, data: { tolerance: 'lenient' } },
      },
    })
  })

  it('imports a valid backup into every store', () => {
    const backup = serializeStorageBackup(exportedAt)
    localStorage.clear()

    expect(importStorageBackupText(backup)).toEqual({ ok: true })
    expect(playAlongTemposStore.get()).toEqual({})
    expect(notationPreferencesStore.get()).toEqual({ displayMode: 'both' })
    expect(scoringPreferencesStore.get()).toEqual({ tolerance: 'standard' })
  })

  it('rejects malformed backups without overwriting existing data', () => {
    playAlongTemposStore.set({ 'exercise-1': 88 })

    const invalid = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        ...createStorageBackup(exportedAt).stores,
        playAlongTempos: {
          version: 1,
          data: { 'exercise-1': 999 },
        },
      },
    })

    expect(importStorageBackupText(invalid)).toEqual({
      ok: false,
      error: 'Play-along tempos are invalid.',
    })
    expect(playAlongTemposStore.get()).toEqual({ 'exercise-1': 88 })
  })

  it('rolls back when a backup cannot be fully written', () => {
    const originalSetItem = Storage.prototype.setItem
    playAlongTemposStore.set({ 'exercise-1': 88 })

    playAlongTemposStore.set({})
    const backup = serializeStorageBackup(exportedAt)

    playAlongTemposStore.set({ 'exercise-1': 88 })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === 'jazz-master:play-along-tempos') {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      }
      return originalSetItem.call(this, key, value)
    })

    expect(importStorageBackupText(backup)).toEqual({
      ok: false,
      error: 'Backup could not be written.',
    })
    expect(playAlongTemposStore.get()).toEqual({ 'exercise-1': 88 })
  })

  it('ignores legacy profile data in imported backups', () => {
    const invalid = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        ...createStorageBackup(exportedAt).stores,
        profile: { version: 1, data: { createdAt: 'not-a-date' } },
      },
    })

    expect(importStorageBackupText(invalid)).toEqual({ ok: true })
  })

  it('ignores legacy daily plan data in imported backups', () => {
    const legacy = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        ...createStorageBackup(exportedAt).stores,
        dailyPlans: {
          version: 1,
          data: {
            '2026-07-09': {
              date: 'wrong-date',
              totalMinutes: -1,
              items: 'invalid',
            },
          },
        },
      },
    })

    expect(importStorageBackupText(legacy)).toEqual({ ok: true })
    expect(localStorage.getItem('jazz-master:daily-plans')).toBeNull()
  })

  it('rejects invalid JSON', () => {
    expect(importStorageBackupText('{not-json')).toEqual({
      ok: false,
      error: 'Backup file is not valid JSON.',
    })
  })

  it('rejects oversized imports', () => {
    expect(importStorageBackupText('x'.repeat(MAX_STORAGE_BACKUP_BYTES + 1))).toEqual({
      ok: false,
      error: 'Backup file is too large.',
    })
  })
})
