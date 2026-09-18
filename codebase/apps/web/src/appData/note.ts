/**
 * What the user wrote about a whole sitting. The shape and its one rule live
 * here, away from the server, because the page needs both and nothing about a
 * note is the database's business (docs/product/next-session-design.md §8).
 */

/** A note is a paragraph, not a diary: the cap also bounds what a runaway client can write. */
export const LONGEST_NOTE = 2000

export interface SessionNote {
  /** The sitting it belongs to; runs carry the same id, and there is no sessions table. */
  sessionId: string
  text: string
  createdAt: string
}
