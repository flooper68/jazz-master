import { asc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  isPracticeArea,
  isPracticeMinutesPerDay,
  isSkillLevel,
  type PracticeArea,
  type PracticeMinutesPerDay,
  type PracticeProfile,
  type SkillLevel,
} from '../../appData/profile'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { practiceProfileGoalAreas, practiceProfiles, schema, users } from './schema'

export interface ProfileRepository {
  getProfile(clerkUserId: string): Promise<PracticeProfile | null>
  saveProfile(clerkUserId: string, profile: PracticeProfile): Promise<PracticeProfile>
}

interface ProfileRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function createProfileRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: ProfileRepositoryOptions = {}): ProfileRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async getProfile(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const row = (
          await db
            .select()
            .from(practiceProfiles)
            .where(eq(practiceProfiles.clerkUserId, clerkUserId))
            .limit(1)
        )[0]

        if (!row) return null

        const goals = await db
          .select()
          .from(practiceProfileGoalAreas)
          .where(eq(practiceProfileGoalAreas.clerkUserId, clerkUserId))
          .orderBy(asc(practiceProfileGoalAreas.position))

        return serializeProfile(row, goals)
      } finally {
        await db.$client.end()
      }
    },

    async saveProfile(clerkUserId, profile) {
      const db = drizzle(connectionString, { schema })

      try {
        return await db.transaction(async (tx) => {
          await tx
            .insert(users)
            .values({ clerkUserId })
            .onConflictDoNothing()

          const [row] = await tx
            .insert(practiceProfiles)
            .values({
              clerkUserId,
              scalesLevel: profile.levels.scales,
              arpeggiosLevel: profile.levels.arpeggios,
              chordsLevel: profile.levels.chords,
              standardsLevel: profile.levels.standards,
              earsLevel: profile.levels.ears,
              minutesPerDay: profile.minutesPerDay,
              onboardingCompletedAt: new Date(profile.createdAt),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: practiceProfiles.clerkUserId,
              set: {
                scalesLevel: profile.levels.scales,
                arpeggiosLevel: profile.levels.arpeggios,
                chordsLevel: profile.levels.chords,
                standardsLevel: profile.levels.standards,
                earsLevel: profile.levels.ears,
                minutesPerDay: profile.minutesPerDay,
                onboardingCompletedAt: new Date(profile.createdAt),
                updatedAt: new Date(),
              },
            })
            .returning()

          if (!row) {
            throw new Error('Profile row was not returned after save')
          }

          await tx
            .delete(practiceProfileGoalAreas)
            .where(eq(practiceProfileGoalAreas.clerkUserId, clerkUserId))

          const goals = await tx
            .insert(practiceProfileGoalAreas)
            .values(
              profile.goalAreas.map((area, position) => ({
                clerkUserId,
                area,
                position,
              })),
            )
            .returning()

          return serializeProfile(row, goals)
        })
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeProfile(
  row: typeof practiceProfiles.$inferSelect,
  goals: Array<typeof practiceProfileGoalAreas.$inferSelect>,
): PracticeProfile {
  return {
    levels: {
      scales: toSkillLevel(row.scalesLevel),
      arpeggios: toSkillLevel(row.arpeggiosLevel),
      chords: toSkillLevel(row.chordsLevel),
      standards: toSkillLevel(row.standardsLevel),
      ears: toSkillLevel(row.earsLevel),
    },
    goalAreas: goals.map((goal) => toPracticeArea(goal.area)),
    minutesPerDay: toPracticeMinutesPerDay(row.minutesPerDay),
    createdAt: row.onboardingCompletedAt.toISOString(),
  }
}

function toPracticeArea(value: string): PracticeArea {
  if (!isPracticeArea(value)) {
    throw new Error(`Unexpected practice area "${value}" in practice profile`)
  }

  return value
}

function toSkillLevel(value: number): SkillLevel {
  if (!isSkillLevel(value)) {
    throw new Error(`Unexpected skill level "${value}" in practice profile`)
  }

  return value
}

function toPracticeMinutesPerDay(value: number): PracticeMinutesPerDay {
  if (!isPracticeMinutesPerDay(value)) {
    throw new Error(`Unexpected minutes-per-day "${value}" in practice profile`)
  }

  return value
}
