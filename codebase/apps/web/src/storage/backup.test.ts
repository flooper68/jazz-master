import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyPlan } from '../planner'
import {
  createStorageBackup,
  dailyPlansStore,
  defaultProfile,
  importStorageBackupText,
  MAX_STORAGE_BACKUP_BYTES,
  notationPreferencesStore,
  playAlongTemposStore,
  profileStore,
  serializeStorageBackup,
  sessionsStore,
  type PracticeSession,
} from './index'

const exportedAt = new Date('2026-07-08T10:00:00.000Z')

const session: PracticeSession = {
  id: 'session-1',
  lessonId: 'major-scale-open',
  startedAt: '2026-07-08T09:30:00.000Z',
  durationSeconds: 180,
  completed: true,
  results: [{ exerciseId: 'exercise-1', grade: 'got-it' }],
  score: 94,
}

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
  it('exports all typed local stores', () => {
    profileStore.set(defaultProfile('2026-07-08T08:00:00.000Z'))
    sessionsStore.set([session])
    dailyPlansStore.set({ [plan.date]: plan })
    playAlongTemposStore.set({ 'exercise-1': 88 })
    notationPreferencesStore.set({ displayMode: 'tab' })

    expect(createStorageBackup(exportedAt)).toEqual({
      app: 'jazz-master',
      version: 1,
      exportedAt: '2026-07-08T10:00:00.000Z',
      stores: {
        profile: {
          version: 1,
          data: defaultProfile('2026-07-08T08:00:00.000Z'),
        },
        sessions: { version: 1, data: [session] },
        dailyPlans: { version: 1, data: { [plan.date]: plan } },
        playAlongTempos: { version: 1, data: { 'exercise-1': 88 } },
        notationPreferences: { version: 1, data: { displayMode: 'tab' } },
      },
    })
  })

  it('imports a valid backup into every store', () => {
    profileStore.set(defaultProfile('2026-07-07T08:00:00.000Z'))
    sessionsStore.set([])
    dailyPlansStore.set({})

    const backup = serializeStorageBackup(exportedAt)
    localStorage.clear()

    expect(importStorageBackupText(backup)).toEqual({ ok: true })
    expect(profileStore.get()).toEqual(defaultProfile('2026-07-07T08:00:00.000Z'))
    expect(sessionsStore.get()).toEqual([])
    expect(dailyPlansStore.get()).toEqual({})
    expect(playAlongTemposStore.get()).toEqual({})
    expect(notationPreferencesStore.get()).toEqual({ displayMode: 'both' })
  })

  it('rejects malformed backups without overwriting existing data', () => {
    profileStore.set(defaultProfile('2026-07-08T08:00:00.000Z'))
    sessionsStore.set([session])

    const invalid = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        ...createStorageBackup(exportedAt).stores,
        sessions: { version: 1, data: [{ ...session, durationSeconds: -1 }] },
      },
    })

    expect(importStorageBackupText(invalid)).toEqual({
      ok: false,
      error: 'Session history is invalid.',
    })
    expect(profileStore.get()).toEqual(defaultProfile('2026-07-08T08:00:00.000Z'))
    expect(sessionsStore.get()).toEqual([session])
  })

  it('rolls back when a backup cannot be fully written', () => {
    const originalSetItem = Storage.prototype.setItem
    profileStore.set(defaultProfile('2026-07-08T08:00:00.000Z'))
    sessionsStore.set([session])

    profileStore.set({
      ...defaultProfile('2026-07-09T08:00:00.000Z'),
      minutesPerDay: 45,
    })
    sessionsStore.set([])
    const backup = serializeStorageBackup(exportedAt)

    profileStore.set(defaultProfile('2026-07-08T08:00:00.000Z'))
    sessionsStore.set([session])
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === 'jazz-master:sessions') {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      }
      return originalSetItem.call(this, key, value)
    })

    expect(importStorageBackupText(backup)).toEqual({
      ok: false,
      error: 'Backup could not be written.',
    })
    expect(profileStore.get()).toEqual(defaultProfile('2026-07-08T08:00:00.000Z'))
    expect(sessionsStore.get()).toEqual([session])
  })

  it('rejects backups with malformed dates', () => {
    const profile = {
      ...defaultProfile('2026-07-08T08:00:00.000Z'),
      createdAt: 'not-a-date',
    }
    const invalid = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        ...createStorageBackup(exportedAt).stores,
        profile: { version: 1, data: profile },
      },
    })

    expect(importStorageBackupText(invalid)).toEqual({
      ok: false,
      error: 'Profile data is invalid.',
    })
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
