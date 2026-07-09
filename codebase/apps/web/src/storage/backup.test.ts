import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyPlan } from '../planner'
import {
  createStorageBackup,
  dailyPlansStore,
  importStorageBackupText,
  MAX_STORAGE_BACKUP_BYTES,
  notationPreferencesStore,
  playAlongTemposStore,
  scoringPreferencesStore,
  serializeStorageBackup,
} from './index'

const exportedAt = new Date('2026-07-08T10:00:00.000Z')

const plan: DailyPlan = {
  date: '2026-07-08',
  totalMinutes: 12,
  items: [
    {
      lessonId: 'major-scale-open',
      lessonTitle: 'Major scale I - open position',
      area: 'scales',
      estimatedMinutes: 12,
      reason: 'Starts your scales goal at level 1.',
    },
  ],
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('storage backup', () => {
  it('exports remaining typed local stores without session history', () => {
    dailyPlansStore.set({ [plan.date]: plan })
    playAlongTemposStore.set({ 'exercise-1': 88 })
    notationPreferencesStore.set({ displayMode: 'tab' })
    scoringPreferencesStore.set({ tolerance: 'lenient' })

    expect(createStorageBackup(exportedAt)).toEqual({
      app: 'jazz-master',
      version: 1,
      exportedAt: '2026-07-08T10:00:00.000Z',
      stores: {
        dailyPlans: { version: 1, data: { [plan.date]: plan } },
        playAlongTempos: { version: 1, data: { 'exercise-1': 88 } },
        notationPreferences: { version: 1, data: { displayMode: 'tab' } },
        scoringPreferences: { version: 1, data: { tolerance: 'lenient' } },
      },
    })
  })

  it('imports a valid backup into every store', () => {
    dailyPlansStore.set({})

    const backup = serializeStorageBackup(exportedAt)
    localStorage.clear()

    expect(importStorageBackupText(backup)).toEqual({ ok: true })
    expect(dailyPlansStore.get()).toEqual({})
    expect(playAlongTemposStore.get()).toEqual({})
    expect(notationPreferencesStore.get()).toEqual({ displayMode: 'both' })
    expect(scoringPreferencesStore.get()).toEqual({ tolerance: 'standard' })
  })

  it('rejects malformed backups without overwriting existing data', () => {
    dailyPlansStore.set({ [plan.date]: plan })

    const invalid = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        ...createStorageBackup(exportedAt).stores,
        dailyPlans: {
          version: 1,
          data: { '2026-07-09': plan },
        },
      },
    })

    expect(importStorageBackupText(invalid)).toEqual({
      ok: false,
      error: 'Daily plans are invalid.',
    })
    expect(dailyPlansStore.get()).toEqual({ [plan.date]: plan })
  })

  it('rolls back when a backup cannot be fully written', () => {
    const originalSetItem = Storage.prototype.setItem
    dailyPlansStore.set({ [plan.date]: plan })

    dailyPlansStore.set({})
    const backup = serializeStorageBackup(exportedAt)

    dailyPlansStore.set({ [plan.date]: plan })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === 'jazz-master:daily-plans') {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      }
      return originalSetItem.call(this, key, value)
    })

    expect(importStorageBackupText(backup)).toEqual({
      ok: false,
      error: 'Backup could not be written.',
    })
    expect(dailyPlansStore.get()).toEqual({ [plan.date]: plan })
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

  it('rejects daily plans stored under the wrong date key', () => {
    const invalid = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        ...createStorageBackup(exportedAt).stores,
        dailyPlans: {
          version: 1,
          data: { '2026-07-09': plan },
        },
      },
    })

    expect(importStorageBackupText(invalid)).toEqual({
      ok: false,
      error: 'Daily plans are invalid.',
    })
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
