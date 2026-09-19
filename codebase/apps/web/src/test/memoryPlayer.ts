import type { PlayerBio, PlayerLogEntry } from '../appData/player'
import { LogLimitError, MOST_LOG_ENTRIES, type PlayerRepository } from '../server/db/player'

/**
 * The player repository without a database, for tests on either side of the
 * wire. Keyed the way the tables are keyed — the bio by its owner, the log by
 * its own id with the owner checked on every read — because a fake laxer than
 * the schema turns every ownership test into a test of the fake.
 */
export function createMemoryPlayerRepository(): PlayerRepository {
  const bios = new Map<string, PlayerBio>()
  const log = new Map<string, { clerkUserId: string; entry: PlayerLogEntry }>()
  let next = 0

  return {
    async readBio(clerkUserId) {
      const found = bios.get(clerkUserId)
      return found ? { ...found } : null
    },

    async writeBio(clerkUserId, bio) {
      const trimmed = bio.trim()
      if (trimmed.length === 0) {
        bios.delete(clerkUserId)
        return null
      }
      const stored: PlayerBio = { bio: trimmed, updatedAt: new Date().toISOString() }
      bios.set(clerkUserId, stored)
      return { ...stored }
    },

    async listLog(clerkUserId, limit = MOST_LOG_ENTRIES) {
      return [...log.values()]
        .filter((row) => row.clerkUserId === clerkUserId)
        .map((row) => ({ ...row.entry }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
        .slice(0, Math.min(Math.max(1, limit), MOST_LOG_ENTRIES))
    },

    async appendLog(clerkUserId, entry) {
      const held = [...log.values()].filter((row) => row.clerkUserId === clerkUserId).length
      if (held >= MOST_LOG_ENTRIES) throw new LogLimitError()
      next += 1
      const stored: PlayerLogEntry = {
        id: `log-${next}`,
        kind: entry.kind,
        summary: entry.summary.trim(),
        createdAt: new Date().toISOString(),
      }
      log.set(stored.id, { clerkUserId, entry: stored })
      return { ...stored }
    },
  }
}
