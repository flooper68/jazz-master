import type { SessionNote } from '../appData/note'
import type { NoteRepository } from '../server/db/notes'

/**
 * The note repository without a database, for tests on either side of the wire.
 *
 * **Keyed the way the table is keyed** — by the owner and the sitting together,
 * on reads, writes *and deletes*. A fake that is laxer than the schema turns
 * every ownership test into a test of the fake, which is the one thing these
 * tests exist to rule out.
 */
export function createMemoryNoteRepository(): NoteRepository {
  const stored = new Map<string, SessionNote>()
  const key = (clerkUserId: string, sessionId: string) => `${clerkUserId}\u0000${sessionId}`
  return {
    async listNotes(clerkUserId) {
      return [...stored.entries()]
        .filter(([id]) => id.startsWith(`${clerkUserId}\u0000`))
        .map(([, note]) => ({ ...note }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    },
    async saveNote(clerkUserId, sessionId, text) {
      const id = key(clerkUserId, sessionId)
      const trimmed = text.trim()
      if (trimmed.length === 0) {
        stored.delete(id)
        return null
      }
      const note: SessionNote = {
        sessionId,
        text: trimmed,
        createdAt: stored.get(id)?.createdAt ?? new Date().toISOString(),
      }
      stored.set(id, note)
      return { ...note }
    },
  }
}
