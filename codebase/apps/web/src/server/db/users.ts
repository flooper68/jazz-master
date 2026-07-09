import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { schema, users } from './schema'

export interface AppUser {
  clerkUserId: string
  createdAt: string
  updatedAt: string
}

export interface UserRepository {
  ensureUser(clerkUserId: string): Promise<AppUser>
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
  }
}

function serializeUser(row: typeof users.$inferSelect): AppUser {
  return {
    clerkUserId: row.clerkUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
