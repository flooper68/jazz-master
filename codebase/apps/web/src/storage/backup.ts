export const STORAGE_BACKUP_APP = 'jazz-master'
export const STORAGE_BACKUP_VERSION = 1
export const MAX_STORAGE_BACKUP_BYTES = 1024 * 1024

export interface StorageBackup {
  app: typeof STORAGE_BACKUP_APP
  version: typeof STORAGE_BACKUP_VERSION
  exportedAt: string
  /** All durable app data has moved server-side. TASK-070 removes this shell. */
  stores: Record<string, never>
}

export type ImportStorageBackupResult =
  | { ok: true }
  | { ok: false; error: string }

export function createStorageBackup(exportedAt = new Date()): StorageBackup {
  return {
    app: STORAGE_BACKUP_APP,
    version: STORAGE_BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    stores: {},
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

  return parseStorageBackup(parsed)
}

function parseStorageBackup(value: unknown): ImportStorageBackupResult {
  if (!isRecord(value)) {
    return { ok: false, error: 'Backup file has the wrong shape.' }
  }
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

  // Legacy local stores are intentionally ignored; no migration bridge exists.
  return { ok: true }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDateTimeString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return Number.isFinite(date.valueOf()) && date.toISOString() === value
}
