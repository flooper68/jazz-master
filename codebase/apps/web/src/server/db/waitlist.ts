import { drizzle } from 'drizzle-orm/node-postgres'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { schema, waitlistSignups } from './schema'

export interface WaitlistSignup {
  email: string
  /** What they want to learn, in their own words. */
  goal?: string
}

export interface WaitlistRepository {
  /** Add the address to the beta waitlist. Joining twice is not an error and changes nothing. */
  join(signup: WaitlistSignup): Promise<void>
}

interface WaitlistRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

/** One address, one row: compare addresses the way people do, not byte for byte. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function createWaitlistRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: WaitlistRepositoryOptions = {}): WaitlistRepository | null {
  const connectionString = resolveDatabaseConnectionString({
    databaseUrl,
    hyperdrive,
  })

  if (!connectionString) {
    return null
  }

  return {
    async join({ email, goal }) {
      const db = drizzle(connectionString, { schema })

      try {
        await db
          .insert(waitlistSignups)
          .values({
            id: crypto.randomUUID(),
            email: normalizeEmail(email),
            goal: goal?.trim() || null,
          })
          .onConflictDoNothing({ target: waitlistSignups.email })
      } finally {
        await db.$client.end()
      }
    },
  }
}
