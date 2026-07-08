import type { DailyPlan } from '../planner'
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
  MINUTES_PER_DAY_OPTIONS,
  PRACTICE_AREAS,
  profileStore,
  type PracticeArea,
  type PracticeProfile,
  type SkillLevel,
} from './profile'
import {
  sessionsStore,
  type ExerciseScore,
  type ExerciseGrade,
  type PracticeSession,
  type ScoreTolerancePreset,
  type ScoreVerdict,
} from './sessions'
import {
  DEFAULT_SCORE_TOLERANCE,
  isScoreTolerancePreset,
  scoringPreferencesStore,
  type ScoringPreferences,
} from './scoringPreferences'
import { dailyPlansStore, type StoredDailyPlans } from './dailyPlans'
import { storageKey } from './store'

export const STORAGE_BACKUP_APP = 'jazz-master'
export const STORAGE_BACKUP_VERSION = 1
export const MAX_STORAGE_BACKUP_BYTES = 1024 * 1024

const PLAN_AREAS = ['scales', 'arpeggios', 'chords', 'standards'] as const
const EXERCISE_GRADES: readonly ExerciseGrade[] = ['got-it', 'shaky', 'missed']
const SCORE_VERDICTS: readonly ScoreVerdict[] = [
  'correct',
  'early',
  'late',
  'wrong-pitch',
  'missed',
]

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
    profile: StoreBackup<PracticeProfile | null>
    sessions: StoreBackup<PracticeSession[]>
    dailyPlans: StoreBackup<StoredDailyPlans>
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
      profile: { version: 1, data: profileStore.get() },
      sessions: { version: 1, data: sessionsStore.get() },
      dailyPlans: { version: 1, data: dailyPlansStore.get() },
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
    toPersistedEntry('profile', backup.stores.profile),
    toPersistedEntry('sessions', backup.stores.sessions),
    toPersistedEntry('daily-plans', backup.stores.dailyPlans),
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

  const profile = parseStoreBackup(
    value.stores.profile,
    isPracticeProfileOrNull,
  )
  const sessions = parseStoreBackup(value.stores.sessions, isPracticeSessions)
  const dailyPlans = parseStoreBackup(value.stores.dailyPlans, isStoredDailyPlans)
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

  if (!profile.ok) return { ok: false, error: 'Profile data is invalid.' }
  if (!sessions.ok) return { ok: false, error: 'Session history is invalid.' }
  if (!dailyPlans.ok) return { ok: false, error: 'Daily plans are invalid.' }
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
        profile: toStoreBackup(profile),
        sessions: toStoreBackup(sessions),
        dailyPlans: toStoreBackup(dailyPlans),
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

function isPracticeProfileOrNull(
  value: unknown,
): value is PracticeProfile | null {
  if (value === null) return true
  if (!isRecord(value)) return false
  return (
    isSkillLevelRecord(value.levels) &&
    Array.isArray(value.goalAreas) &&
    value.goalAreas.length > 0 &&
    value.goalAreas.every(isPracticeArea) &&
    typeof value.minutesPerDay === 'number' &&
    MINUTES_PER_DAY_OPTIONS.includes(
      value.minutesPerDay as (typeof MINUTES_PER_DAY_OPTIONS)[number],
    ) &&
    isIsoDateTimeString(value.createdAt)
  )
}

function isSkillLevelRecord(value: unknown): value is Record<PracticeArea, SkillLevel> {
  if (!isRecord(value)) return false
  return PRACTICE_AREAS.every((area) => isSkillLevel(value[area]))
}

function isPracticeArea(value: unknown): value is PracticeArea {
  return (
    typeof value === 'string' &&
    PRACTICE_AREAS.includes(value as PracticeArea)
  )
}

function isSkillLevel(value: unknown): value is SkillLevel {
  return value === 1 || value === 2 || value === 3
}

function isPracticeSessions(value: unknown): value is PracticeSession[] {
  return Array.isArray(value) && value.every(isPracticeSession)
}

function isPracticeSession(value: unknown): value is PracticeSession {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.lessonId === 'string' &&
    isIsoDateTimeString(value.startedAt) &&
    typeof value.durationSeconds === 'number' &&
    Number.isFinite(value.durationSeconds) &&
    value.durationSeconds >= 0 &&
    typeof value.completed === 'boolean' &&
    Array.isArray(value.results) &&
    value.results.every(isExerciseResult) &&
    (value.score === undefined ||
      (typeof value.score === 'number' && Number.isFinite(value.score)))
  )
}

function isExerciseResult(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.exerciseId === 'string' &&
    EXERCISE_GRADES.includes(value.grade as ExerciseGrade) &&
    (value.score === undefined || isExerciseScore(value.score))
  )
}

function isExerciseScore(value: unknown): value is ExerciseScore {
  if (!isRecord(value)) return false
  return (
    typeof value.score === 'number' &&
    Number.isFinite(value.score) &&
    value.score >= 0 &&
    value.score <= 100 &&
    isScoreTolerancePreset(value.tolerance as ScoreTolerancePreset) &&
    isScoreComponents(value.components) &&
    Array.isArray(value.perNote) &&
    value.perNote.every(isExerciseScoreNote) &&
    typeof value.extras === 'number' &&
    Number.isInteger(value.extras) &&
    value.extras >= 0 &&
    isIsoDateTimeString(value.analyzedAt)
  )
}

function isScoreComponents(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    isPercent(value.pitch) &&
    isPercent(value.timing) &&
    isPercent(value.completeness)
  )
}

function isPercent(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  )
}

function isExerciseScoreNote(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.expectedId === 'string' &&
    typeof value.expectedNote === 'string' &&
    SCORE_VERDICTS.includes(value.verdict as ScoreVerdict) &&
    (value.timingOffsetSeconds === null ||
      (typeof value.timingOffsetSeconds === 'number' &&
        Number.isFinite(value.timingOffsetSeconds))) &&
    (value.pitchCents === null ||
      (typeof value.pitchCents === 'number' && Number.isFinite(value.pitchCents)))
  )
}

function isStoredDailyPlans(value: unknown): value is StoredDailyPlans {
  if (!isRecord(value)) return false
  return Object.entries(value).every(
    ([date, plan]) =>
      typeof date === 'string' && isDailyPlan(plan) && plan.date === date,
  )
}

function isDailyPlan(value: unknown): value is DailyPlan {
  if (!isRecord(value)) return false
  return (
    isPlanDateString(value.date) &&
    typeof value.totalMinutes === 'number' &&
    Number.isFinite(value.totalMinutes) &&
    value.totalMinutes >= 0 &&
    Array.isArray(value.items) &&
    value.items.every(isPlanItem)
  )
}

function isIsoDateTimeString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return Number.isFinite(date.valueOf()) && date.toISOString() === value
}

function isPlanDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.valueOf()) && date.toISOString().startsWith(value)
}

function isPlanItem(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.lessonId === 'string' &&
    typeof value.lessonTitle === 'string' &&
    typeof value.area === 'string' &&
    PLAN_AREAS.includes(value.area as (typeof PLAN_AREAS)[number]) &&
    typeof value.estimatedMinutes === 'number' &&
    Number.isFinite(value.estimatedMinutes) &&
    value.estimatedMinutes >= 0 &&
    typeof value.reason === 'string'
  )
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
