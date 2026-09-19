import type { PlayerPrefs } from '../appData/playerPrefs'
import type { UserRepository } from '../server/db/users'

/** The user repository without a database, for tests on either side of the wire. */
export function createMemoryUserRepository(): UserRepository {
  const rows = new Map<string, { createdAt: string; prefs: PlayerPrefs | null }>()
  const ensure = (clerkUserId: string) => {
    const row = rows.get(clerkUserId) ?? { createdAt: new Date(0).toISOString(), prefs: null }
    rows.set(clerkUserId, row)
    return row
  }
  return {
    async ensureUser(clerkUserId) {
      const row = ensure(clerkUserId)
      return { clerkUserId, createdAt: row.createdAt, updatedAt: row.createdAt }
    },
    async deleteUser(clerkUserId) {
      rows.delete(clerkUserId)
    },
    async readPlayerPrefs(clerkUserId) {
      // A read creates nothing, as in the real repository.
      return rows.get(clerkUserId)?.prefs ?? null
    },
    async writePlayerPrefs(clerkUserId, prefs) {
      ensure(clerkUserId).prefs = prefs
      return prefs
    },
  }
}
