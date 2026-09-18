import { and, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { LONGEST_NOTE, type SessionNote } from '../../appData/note'
import {
  readDatabaseUrl,
  resolveDatabaseConnectionString,
  type HyperdriveConnection,
} from './connection'
import { schema, sessionNotes, users } from './schema'

/**
 * What the user said about a whole sitting, in their own words. One note per
 * session, rewritten in place: the session id is the key, because runs already
 * carry it and there is no sessions table to hang it from.
 *
 * Nothing reads these but the user — no AI, no assembler (that is steps 5–6).
 * They are kept because a sentence written at the end of a session is worth
 * more later than anything that could be inferred from the numbers.
 */

export interface NoteRepository {
  /** Newest first. */
  listNotes(clerkUserId: string): Promise<SessionNote[]>
  /**
   * Write the note for this sitting, or replace it. Empty text deletes it, so
   * clearing the box is the same gesture as never writing one. Returns the
   * stored note, or null when it was deleted.
   */
  saveNote(clerkUserId: string, sessionId: string, text: string): Promise<SessionNote | null>
}

interface NoteRepositoryOptions {
  databaseUrl?: string
  hyperdrive?: HyperdriveConnection | null
}

export function createNoteRepository({
  databaseUrl = readDatabaseUrl(),
  hyperdrive = null,
}: NoteRepositoryOptions = {}): NoteRepository | null {
  const connectionString = resolveDatabaseConnectionString({ databaseUrl, hyperdrive })
  if (!connectionString) return null

  return {
    async listNotes(clerkUserId) {
      const db = drizzle(connectionString, { schema })
      try {
        const rows = await db
          .select()
          .from(sessionNotes)
          .where(eq(sessionNotes.clerkUserId, clerkUserId))
          .orderBy(desc(sessionNotes.createdAt))
        return rows.map(serializeNote)
      } finally {
        await db.$client.end()
      }
    },

    async saveNote(clerkUserId, sessionId, text) {
      const db = drizzle(connectionString, { schema })
      const trimmed = text.trim().slice(0, LONGEST_NOTE)
      try {
        return await db.transaction(async (tx) => {
          await tx.insert(users).values({ clerkUserId }).onConflictDoNothing()

          if (trimmed.length === 0) {
            // Scoped to the owner, so one user cannot clear another's note by
            // guessing a session id.
            await tx
              .delete(sessionNotes)
              .where(and(eq(sessionNotes.sessionId, sessionId), eq(sessionNotes.clerkUserId, clerkUserId)))
            return null
          }

          // The key is (owner, sitting), so a conflict can only ever be this
          // user's own earlier note: there is no other user's row to reach.
          const [row] = await tx
            .insert(sessionNotes)
            .values({ sessionId, clerkUserId, text: trimmed, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: [sessionNotes.clerkUserId, sessionNotes.sessionId],
              set: { text: trimmed, updatedAt: new Date() },
            })
            .returning()

          if (!row) throw new Error('Session note row was not returned after save')
          return serializeNote(row)
        })
      } finally {
        await db.$client.end()
      }
    },
  }
}

function serializeNote(row: typeof sessionNotes.$inferSelect): SessionNote {
  return {
    sessionId: row.sessionId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  }
}
