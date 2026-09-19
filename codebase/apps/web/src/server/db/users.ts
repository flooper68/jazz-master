import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { parsePlayerPrefs, type PlayerPrefs } from '../../appData/playerPrefs'
import { schema, users } from './schema'

export interface AppUser {
  clerkUserId: string
  createdAt: string
  updatedAt: string
}

export interface UserRepository {
  ensureUser(clerkUserId: string): Promise<AppUser>
  /** How the user has the player set, or null when they have never changed it. */
  readPlayerPrefs(clerkUserId: string): Promise<PlayerPrefs | null>
  /** Save the whole set; the row is created if this is the user's first write. */
  writePlayerPrefs(clerkUserId: string, prefs: PlayerPrefs): Promise<PlayerPrefs>
  /** Delete the user and, by cascade, everything saved under them: runs, exercises, routines. */
  deleteUser(clerkUserId: string): Promise<void>
}

interface UserRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function createUserRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: UserRepositoryOptions = {}): UserRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async ensureUser(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const [created] = await db
          .insert(users)
          .values({ clerkUserId })
          .onConflictDoNothing()
          .returning()

        const row =
          created ??
          (
            await db
              .select()
              .from(users)
              .where(eq(users.clerkUserId, clerkUserId))
              .limit(1)
          )[0]

        if (!row) {
          throw new Error('User row was not returned after ensure')
        }

        return serializeUser(row)
      } finally {
        await db.$client.end()
      }
    },

    async readPlayerPrefs(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        const [row] = await db
          .select({ playerPrefs: users.playerPrefs })
          .from(users)
          .where(eq(users.clerkUserId, clerkUserId))
          .limit(1)

        return row?.playerPrefs == null ? null : parsePlayerPrefs(row.playerPrefs)
      } finally {
        await db.$client.end()
      }
    },

    async writePlayerPrefs(clerkUserId, prefs) {
      const db = drizzle(connectionString, { schema })

      try {
        const [row] = await db
          .insert(users)
          .values({ clerkUserId, playerPrefs: prefs })
          .onConflictDoUpdate({
            target: users.clerkUserId,
            set: { playerPrefs: prefs, updatedAt: new Date() },
          })
          .returning({ playerPrefs: users.playerPrefs })

        return parsePlayerPrefs(row?.playerPrefs ?? prefs)
      } finally {
        await db.$client.end()
      }
    },

    async deleteUser(clerkUserId) {
      const db = drizzle(connectionString, { schema })

      try {
        await db.delete(users).where(eq(users.clerkUserId, clerkUserId))
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeUser(row: typeof users.$inferSelect): AppUser {
  return {
    clerkUserId: row.clerkUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
