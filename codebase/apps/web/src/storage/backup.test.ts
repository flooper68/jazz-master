import { describe, expect, it } from 'vitest'
import {
  createStorageBackup,
  importStorageBackupText,
  MAX_STORAGE_BACKUP_BYTES,
  serializeStorageBackup,
} from './index'

const exportedAt = new Date('2026-07-08T10:00:00.000Z')

describe('storage backup', () => {
  it('exports no stores after all durable app data moved server-side', () => {
    expect(createStorageBackup(exportedAt)).toEqual({
      app: 'jazz-master',
      version: 1,
      exportedAt: '2026-07-08T10:00:00.000Z',
      stores: {},
    })
  })

  it('accepts the empty transitional backup', () => {
    expect(importStorageBackupText(serializeStorageBackup(exportedAt))).toEqual({
      ok: true,
    })
  })

  it('ignores legacy local preference payloads without importing them', () => {
    localStorage.setItem('jazz-master:notation-preferences', 'existing')
    const legacy = JSON.stringify({
      ...createStorageBackup(exportedAt),
      stores: {
        notationPreferences: { version: 1, data: { displayMode: 'tab' } },
        scoringPreferences: { version: 1, data: { tolerance: 'strict' } },
        playAlongTempos: { version: 1, data: { 'exercise-1': 88 } },
      },
    })

    expect(importStorageBackupText(legacy)).toEqual({ ok: true })
    expect(localStorage.getItem('jazz-master:notation-preferences')).toBe(
      'existing',
    )
    expect(localStorage.getItem('jazz-master:scoring-preferences')).toBeNull()
    expect(localStorage.getItem('jazz-master:play-along-tempos')).toBeNull()
  })

  it('rejects invalid JSON', () => {
    expect(importStorageBackupText('{not-json')).toEqual({
      ok: false,
      error: 'Backup file is not valid JSON.',
    })
  })

  it('rejects oversized imports', () => {
    expect(
      importStorageBackupText('x'.repeat(MAX_STORAGE_BACKUP_BYTES + 1)),
    ).toEqual({ ok: false, error: 'Backup file is too large.' })
  })

  it('rejects unsupported backup versions', () => {
    expect(
      importStorageBackupText(
        JSON.stringify({
          ...createStorageBackup(exportedAt),
          version: 2,
        }),
      ),
    ).toEqual({ ok: false, error: 'Backup version is not supported.' })
  })
})
