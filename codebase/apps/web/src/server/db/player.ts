import { count, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  LONGEST_BIO,
  LONGEST_LOG_ENTRY,
  playerLogEntrySchema,
  type PlayerBio,
  type PlayerLogEntry,
  type PlayerLogInput,
} from '../../appData/player'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { playerBios, playerLog, schema, users } from './schema'

/**
 * The teacher's memory of one player: the bio it keeps rewriting, and the log
 * it only ever adds to (docs/product/next-session-design.md §10).
 *
 * Owner-scoped like everything else here — every read and write carries the
 * signed-in user, so an id from somewhere else names nothing.
 */

/** A log is a record, not a feed; past this the oldest entries stop being worth carrying. */
export const MOST_LOG_ENTRIES = 500

export class LogLimitError extends Error {
  constructor() {
    super(`A user keeps at most ${MOST_LOG_ENTRIES} log entries`)
    this.name = 'LogLimitError'
  }
}

export interface PlayerRepository {
  /** The bio, or null when this player has none yet. */
  readBio(clerkUserId: string): Promise<PlayerBio | null>
  /** Write the bio, replacing whatever was there. Empty text deletes it, as clearing a note does. */
  writeBio(clerkUserId: string, bio: string): Promise<PlayerBio | null>
  /** Newest first. */
  listLog(clerkUserId: string, limit?: number): Promise<PlayerLogEntry[]>
  /** Append one entry. There is deliberately no update and no delete. */
  appendLog(clerkUserId: string, entry: PlayerLogInput): Promise<PlayerLogEntry>
}

interface PlayerRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
  newId?: () => string
}

export function createPlayerRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
  newId = () => crypto.randomUUID(),
}: PlayerRepositoryOptions = {}): PlayerRepository | null {
  const connectionString = resolveDatabaseConnectionString({ databaseUrl, hyperdrive })
  if (!connectionString) return null

  return {
    async readBio(clerkUserId) {
      const db = drizzle(connectionString, { schema })
      try {
        const [row] = await db.select().from(playerBios).where(eq(playerBios.clerkUserId, clerkUserId))
        return row ? serializeBio(row) : null
      } finally {
        await db.$client.end()
      }
    },

    async writeBio(clerkUserId, bio) {
      const db = drizzle(connectionString, { schema })
      const trimmed = bio.trim().slice(0, LONGEST_BIO)
      try {
        return await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()

          if (trimmed.length === 0) {
            await tx.delete(playerBios).where(eq(playerBios.clerkUserId, clerkUserId))
            return null
          }

          // The key is the owner, so a conflict can only ever be this user's
          // own earlier bio: there is no other user's row to reach.
          const [row] = await tx
            .insert(playerBios)
            .values({ clerkUserId, bio: trimmed, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: playerBios.clerkUserId,
              set: { bio: trimmed, updatedAt: new Date() },
            })
            .returning()

          if (!row) throw new Error('Player bio row was not returned after save')
          return serializeBio(row)
        })
      } finally {
        await db.$client.end()
      }
    },

    async listLog(clerkUserId, limit = MOST_LOG_ENTRIES) {
      const db = drizzle(connectionString, { schema })
      try {
        const rows = await db
          .select()
          .from(playerLog)
          .where(eq(playerLog.clerkUserId, clerkUserId))
          .orderBy(desc(playerLog.createdAt))
          .limit(Math.min(Math.max(1, limit), MOST_LOG_ENTRIES))
        return rows.flatMap(serializeLogEntry)
      } finally {
        await db.$client.end()
      }
    },

    async appendLog(clerkUserId, entry) {
      const db = drizzle(connectionString, { schema })
      try {
        return await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()

          const [{ value: held } = { value: 0 }] = await tx
            .select({ value: count() })
            .from(playerLog)
            .where(eq(playerLog.clerkUserId, clerkUserId))
          if (held >= MOST_LOG_ENTRIES) throw new LogLimitError()

          const [row] = await tx
            .insert(playerLog)
            .values({
              id: newId(),
              clerkUserId,
              kind: entry.kind,
              summary: entry.summary.trim().slice(0, LONGEST_LOG_ENTRY),
            })
            .returning()

          if (!row) throw new Error('Player log row was not returned after save')
          const [stored] = serializeLogEntry(row)
          if (!stored) throw new Error('Player log row did not parse after save')
          return stored
        })
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeBio(row: typeof playerBios.$inferSelect): PlayerBio {
  return { bio: row.bio, updatedAt: row.updatedAt.toISOString() }
}

/**
 * A stored entry, parsed back through its own schema. A row that no longer
 * matches — written by an older shape, or edited in the database — is dropped
 * rather than handed to a lesson half-formed, exactly as a goal row is.
 */
function serializeLogEntry(row: typeof playerLog.$inferSelect): PlayerLogEntry[] {
  const parsed = playerLogEntrySchema.safeParse({
    id: row.id,
    kind: row.kind,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  })
  return parsed.success ? [parsed.data] : []
}
