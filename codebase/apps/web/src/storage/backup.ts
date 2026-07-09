import {
  DEFAULT_NOTATION_DISPLAY_MODE,
  isNotationDisplayMode,
  type NotationPreferences,
  notationPreferencesStore,
} from './notationPreferences'
import {
  MAX_PLAY_ALONG_TEMPO_BPM,
  MIN_PLAY_ALONG_TEMPO_BPM,
  playAlongTemposStore,
  type StoredPlayAlongTempos,
} from './playAlongTempos'
import {
  DEFAULT_SCORE_TOLERANCE,
  isScoreTolerancePreset,
  scoringPreferencesStore,
  type ScoringPreferences,
} from './scoringPreferences'
import { storageKey } from './store'

export const STORAGE_BACKUP_APP = 'jazz-master'
export const STORAGE_BACKUP_VERSION = 1
export const MAX_STORAGE_BACKUP_BYTES = 1024 * 1024

interface StoreBackup<T> {
  version: number
  data: T
}

interface PersistedEnvelope<T> {
  version: number
  data: T
}

interface PersistedEntry {
  key: string
  value: string
}

export interface StorageBackup {
  app: typeof STORAGE_BACKUP_APP
  version: typeof STORAGE_BACKUP_VERSION
  exportedAt: string
  stores: {
    playAlongTempos: StoreBackup<StoredPlayAlongTempos>
    notationPreferences: StoreBackup<NotationPreferences>
    scoringPreferences: StoreBackup<ScoringPreferences>
  }
}

export type ImportStorageBackupResult =
  | { ok: true }
  | { ok: false; error: string }

export function createStorageBackup(exportedAt = new Date()): StorageBackup {
  return {
    app: STORAGE_BACKUP_APP,
    version: STORAGE_BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    stores: {
      playAlongTempos: { version: 1, data: playAlongTemposStore.get() },
      notationPreferences: {
        version: 1,
        data: notationPreferencesStore.get(),
      },
      scoringPreferences: {
        version: 1,
        data: scoringPreferencesStore.get(),
      },
    },
  }
}

export function serializeStorageBackup(exportedAt = new Date()): string {
  return `${JSON.stringify(createStorageBackup(exportedAt), null, 2)}\n`
}

export function importStorageBackupText(
  text: string,
): ImportStorageBackupResult {
  if (new Blob([text]).size > MAX_STORAGE_BACKUP_BYTES) {
    return { ok: false, error: 'Backup file is too large.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Backup file is not valid JSON.' }
  }

  const backup = parseStorageBackup(parsed)
  if (!backup.ok) return backup

  if (!persistBackupStores(backup.value)) {
    return { ok: false, error: 'Backup could not be written.' }
  }

  return { ok: true }
}

function persistBackupStores(backup: StorageBackup): boolean {
  const entries: PersistedEntry[] = [
    toPersistedEntry('play-along-tempos', backup.stores.playAlongTempos),
    toPersistedEntry('notation-preferences', backup.stores.notationPreferences),
    toPersistedEntry('scoring-preferences', backup.stores.scoringPreferences),
  ]

  const previous = new Map<string, string | null>()
  try {
    for (const entry of entries) {
      previous.set(entry.key, localStorage.getItem(entry.key))
    }
    for (const entry of entries) {
      localStorage.setItem(entry.key, entry.value)
    }
    const verified = entries.every(
      (entry) => localStorage.getItem(entry.key) === entry.value,
    )
    if (verified) return true
  } catch {
    // Fall through to rollback.
  }

  rollbackEntries(previous)
  return false
}

function toPersistedEntry<T>(
  name: string,
  backup: StoreBackup<T>,
): PersistedEntry {
  const envelope: PersistedEnvelope<T> = {
    version: backup.version,
    data: backup.data,
  }
  return { key: storageKey(name), value: JSON.stringify(envelope) }
}

function rollbackEntries(previous: Map<string, string | null>): void {
  for (const [key, value] of previous) {
    try {
      if (value === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, value)
      }
    } catch {
      console.warn(`[storage] failed to roll back "${key}" during backup import`)
    }
  }
}

function parseStorageBackup(
  value: unknown,
): { ok: true; value: StorageBackup } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'Backup file has the wrong shape.' }
  if (value.app !== STORAGE_BACKUP_APP) {
    return { ok: false, error: 'Backup file is not for Jazz Master.' }
  }
  if (value.version !== STORAGE_BACKUP_VERSION) {
    return { ok: false, error: 'Backup version is not supported.' }
  }
  if (!isIsoDateTimeString(value.exportedAt)) {
    return { ok: false, error: 'Backup export date is missing.' }
  }
  if (!isRecord(value.stores)) {
    return { ok: false, error: 'Backup stores are missing.' }
  }

  const playAlongTempos = parseStoreBackup(
    value.stores.playAlongTempos,
    isStoredPlayAlongTempos,
  )
  const notationPreferences = parseStoreBackup(
    value.stores.notationPreferences,
    isNotationPreferences,
  )
  const scoringPreferences =
    value.stores.scoringPreferences === undefined
      ? {
          ok: true as const,
          version: 1 as const,
          data: { tolerance: DEFAULT_SCORE_TOLERANCE },
        }
      : parseStoreBackup(value.stores.scoringPreferences, isScoringPreferences)

  if (!playAlongTempos.ok) {
    return { ok: false, error: 'Play-along tempos are invalid.' }
  }
  if (!notationPreferences.ok) {
    return { ok: false, error: 'Notation preferences are invalid.' }
  }
  if (!scoringPreferences.ok) {
    return { ok: false, error: 'Scoring preferences are invalid.' }
  }

  return {
    ok: true,
    value: {
      app: STORAGE_BACKUP_APP,
      version: STORAGE_BACKUP_VERSION,
      exportedAt: value.exportedAt,
      stores: {
        playAlongTempos: toStoreBackup(playAlongTempos),
        notationPreferences: toStoreBackup(notationPreferences),
        scoringPreferences: toStoreBackup(scoringPreferences),
      },
    },
  }
}

function parseStoreBackup<T>(
  value: unknown,
  isData: (data: unknown) => data is T,
): { ok: true; version: 1; data: T } | { ok: false } {
  if (!isRecord(value)) return { ok: false }
  if (value.version !== 1) return { ok: false }
  if (!isData(value.data)) return { ok: false }
  return { ok: true, version: 1, data: value.data }
}

function toStoreBackup<T>(parsed: { version: 1; data: T }): StoreBackup<T> {
  return { version: parsed.version, data: parsed.data }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDateTimeString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return Number.isFinite(date.valueOf()) && date.toISOString() === value
}

function isStoredPlayAlongTempos(
  value: unknown,
): value is StoredPlayAlongTempos {
  if (!isRecord(value)) return false
  return Object.values(value).every(
    (tempo) =>
      typeof tempo === 'number' &&
      Number.isFinite(tempo) &&
      tempo >= MIN_PLAY_ALONG_TEMPO_BPM &&
      tempo <= MAX_PLAY_ALONG_TEMPO_BPM,
  )
}

function isNotationPreferences(
  value: unknown,
): value is NotationPreferences {
  if (!isRecord(value)) return false
  return (
    isNotationDisplayMode(value.displayMode) ||
    value.displayMode === DEFAULT_NOTATION_DISPLAY_MODE
  )
}

function isScoringPreferences(value: unknown): value is ScoringPreferences {
  if (!isRecord(value)) return false
  return (
    isScoreTolerancePreset(value.tolerance) ||
    value.tolerance === DEFAULT_SCORE_TOLERANCE
  )
}
