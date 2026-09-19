import { parseBio, parseLogInput, type PlayerBio, type PlayerLogEntry } from '../../appData/player'
import { LogLimitError, type PlayerRepository } from '../db/player'

/**
 * The teacher's memory as the outside sees it. tRPC (the app's own lesson) and
 * MCP (an AI client) both come through here, so the bio and the log are held to
 * the same rules whichever door wrote them — the pattern `library/goals` set.
 *
 * Nothing here is read by the scheduler. That is the point of the file living
 * beside the others rather than inside them: the practice is a pure function of
 * runs, the catalogue, the paths and the clock (§2), and memory that could move
 * a due date would quietly make it a function of what an AI believes.
 */

export interface PlayerStores {
  player?: PlayerRepository | null
}

type Unavailable = { status: 'unconfigured' }
type ReadFailed = { status: 'error'; message: 'Player memory read failed' }
type WriteFailed = { status: 'error'; message: 'Player memory write failed' }

export type BioReadResult = { status: 'ok'; bio: PlayerBio | null } | Unavailable | ReadFailed

export type BioWriteResult =
  | { status: 'ok'; bio: PlayerBio | null }
  | { status: 'invalid'; problems: string[] }
  | Unavailable
  | WriteFailed

export type LogReadResult = { status: 'ok'; entries: PlayerLogEntry[] } | Unavailable | ReadFailed

export type LogWriteResult =
  | { status: 'ok'; entry: PlayerLogEntry }
  | { status: 'invalid'; problems: string[] }
  | { status: 'full'; message: string }
  | Unavailable
  | WriteFailed

/** What the teacher knows about this player, or null when it has never written one. */
export async function readBio(stores: PlayerStores, clerkUserId: string): Promise<BioReadResult> {
  if (!stores.player) return { status: 'unconfigured' }
  try {
    return { status: 'ok', bio: await stores.player.readBio(clerkUserId) }
  } catch {
    return { status: 'error', message: 'Player memory read failed' }
  }
}

/**
 * Replace the bio whole. It is a reduction, not a journal: a lesson reads what
 * is there, decides what the player now looks like, and writes that — so there
 * is no append, and clearing it is the same gesture as never having written one.
 */
export async function writeBio(
  stores: PlayerStores,
  clerkUserId: string,
  bio: unknown,
): Promise<BioWriteResult> {
  if (!stores.player) return { status: 'unconfigured' }
  const parsed = parseBio(bio)
  if (!parsed.ok) return { status: 'invalid', problems: parsed.problems }
  try {
    return { status: 'ok', bio: await stores.player.writeBio(clerkUserId, parsed.bio) }
  } catch {
    return { status: 'error', message: 'Player memory write failed' }
  }
}

/** The log, newest first. */
export async function listLog(
  stores: PlayerStores,
  clerkUserId: string,
  limit?: unknown,
): Promise<LogReadResult> {
  if (!stores.player) return { status: 'unconfigured' }
  const asked = typeof limit === 'number' && Number.isFinite(limit) ? Math.floor(limit) : undefined
  try {
    return { status: 'ok', entries: await stores.player.listLog(clerkUserId, asked) }
  } catch {
    return { status: 'error', message: 'Player memory read failed' }
  }
}

/** Append one summary. There is no update and no delete: a rewritable record of a conversation is not a record. */
export async function appendLog(
  stores: PlayerStores,
  clerkUserId: string,
  entry: unknown,
): Promise<LogWriteResult> {
  if (!stores.player) return { status: 'unconfigured' }
  const parsed = parseLogInput(entry)
  if (!parsed.ok) return { status: 'invalid', problems: parsed.problems }
  try {
    return { status: 'ok', entry: await stores.player.appendLog(clerkUserId, parsed.entry) }
  } catch (error) {
    if (error instanceof LogLimitError) return { status: 'full', message: error.message }
    return { status: 'error', message: 'Player memory write failed' }
  }
}
