import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  DEFAULT_NOTATION_DISPLAY_MODE,
  DEFAULT_SCORE_TOLERANCE,
  clampPlayAlongTempo,
  defaultPracticePreferences,
  isNotationDisplayMode,
  isScoreTolerancePreset,
  type NotationDisplayMode,
  type PracticePreferences,
} from '../../appData/preferences'
import type { ScoreTolerancePreset } from '../../appData/session'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { playAlongTempos, schema, userPreferences, users } from './schema'

export interface PreferenceRepository {
  getPreferences(clerkUserId: string): Promise<PracticePreferences>
  setNotationDisplayMode(
    clerkUserId: string,
    mode: NotationDisplayMode,
  ): Promise<NotationDisplayMode>
  setScoringTolerance(
    clerkUserId: string,
    tolerance: ScoreTolerancePreset,
  ): Promise<ScoreTolerancePreset>
  setPlayAlongTempo(
    clerkUserId: string,
    exerciseId: string,
    tempoBpm: number,
  ): Promise<number>
}

interface PreferenceRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function createPreferenceRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: PreferenceRepositoryOptions = {}): PreferenceRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) return null

  return {
    async getPreferences(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const [preferenceRows, tempoRows] = await Promise.all([
          db
            .select()
            .from(userPreferences)
            .where(eq(userPreferences.clerkUserId, clerkUserId))
            .limit(1),
          db
            .select()
            .from(playAlongTempos)
            .where(eq(playAlongTempos.clerkUserId, clerkUserId)),
        ])
        const preferences = defaultPracticePreferences()
        const row = preferenceRows[0]

        if (row) {
          preferences.notationDisplayMode = toNotationDisplayMode(
            row.notationDisplayMode,
          )
          preferences.scoringTolerance = toScoreTolerance(
            row.scoringTolerance,
          )
        }

        for (const tempo of tempoRows) {
          preferences.playAlongTempos[tempo.exerciseId] = clampPlayAlongTempo(
            tempo.tempoBpm,
          )
        }

        return preferences
      } finally {
        await db.$client.end()
      }
    },

    async setNotationDisplayMode(clerkUserId, mode) {
      const db = drizzle(connectionString, { schema })

      try {
        await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()
          await tx
            .insert(userPreferences)
            .values({
              clerkUserId,
              notationDisplayMode: mode,
              scoringTolerance: DEFAULT_SCORE_TOLERANCE,
            })
            .onConflictDoUpdate({
              target: userPreferences.clerkUserId,
              set: { notationDisplayMode: mode, updatedAt: new Date() },
            })
        })
        return mode
      } finally {
        await db.$client.end()
      }
    },

    async setScoringTolerance(clerkUserId, tolerance) {
      const db = drizzle(connectionString, { schema })

      try {
        await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()
          await tx
            .insert(userPreferences)
            .values({
              clerkUserId,
              notationDisplayMode: DEFAULT_NOTATION_DISPLAY_MODE,
              scoringTolerance: tolerance,
            })
            .onConflictDoUpdate({
              target: userPreferences.clerkUserId,
              set: { scoringTolerance: tolerance, updatedAt: new Date() },
            })
        })
        return tolerance
      } finally {
        await db.$client.end()
      }
    },

    async setPlayAlongTempo(clerkUserId, exerciseId, tempoBpm) {
      const db = drizzle(connectionString, { schema })
      const clampedTempo = clampPlayAlongTempo(tempoBpm)

      try {
        await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()
          await tx
            .insert(playAlongTempos)
            .values({ clerkUserId, exerciseId, tempoBpm: clampedTempo })
            .onConflictDoUpdate({
              target: [playAlongTempos.clerkUserId, playAlongTempos.exerciseId],
              set: { tempoBpm: clampedTempo, updatedAt: new Date() },
            })
        })
        return clampedTempo
      } finally {
        await db.$client.end()
      }
    },
  }
}

function toNotationDisplayMode(value: string): NotationDisplayMode {
  if (!isNotationDisplayMode(value)) {
    throw new Error(`Unexpected notation display mode "${value}"`)
  }
  return value
}

function toScoreTolerance(value: string): ScoreTolerancePreset {
  if (!isScoreTolerancePreset(value)) {
    throw new Error(`Unexpected scoring tolerance "${value}"`)
  }
  return value
}
