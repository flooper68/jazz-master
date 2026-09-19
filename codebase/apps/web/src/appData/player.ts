import { z } from 'zod'

/**
 * What the teacher remembers about the player between lessons
 * (docs/product/next-session-design.md §10).
 *
 * Two things, and they are to each other what exercise state is to runs —
 * except the reducing is judgement, so the teacher does it and the result is
 * stored rather than derived:
 *
 * - the **log** is one summary per lesson, append-only: what was said, what was
 *   decided, and why. The transcript may be kept elsewhere; nothing later reads
 *   it, because a summary is what the next lesson can actually use.
 * - the **bio** is the reduction of everything known about the player —
 *   preferences, skills, what they have learned, what bores them. One living
 *   document, written by the first lesson and updated by every later one.
 *
 * **Where they disagree, runs win.** The bio holds what runs cannot tell: taste,
 * history from before the app, what somebody *said* they can do. If it claims a
 * skill the runs contradict, the runs are right and the teacher rewrites the
 * bio — never the other way round. Nothing here is ever read by the scheduler:
 * the practice stays a pure function of runs, the catalog, the paths and the
 * clock (§2), and a bio that lied could otherwise move a due date.
 */

/** Long enough for a real picture of a player, short enough to stay a reduction rather than a transcript. */
export const LONGEST_BIO = 8000
/** One lesson's summary. Past this it has stopped being a summary. */
export const LONGEST_LOG_ENTRY = 4000

/** Which of §10's four inputs produced an entry. */
export const LOG_KINDS = ['onboarding', 'after_session', 'on_demand', 'check_in'] as const
export type LogKind = (typeof LOG_KINDS)[number]

export const playerBioSchema = z.strictObject({
  /** Free prose, the teacher's own words. Empty means there is no bio yet. */
  bio: z.string().trim().max(LONGEST_BIO),
  /** When it was last reduced, ISO-8601. */
  updatedAt: z.string(),
})

export type PlayerBio = z.infer<typeof playerBioSchema>

export const playerLogEntrySchema = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(LOG_KINDS),
  /** What was said, what was decided, and why — in the teacher's words. */
  summary: z.string().trim().min(1).max(LONGEST_LOG_ENTRY),
  createdAt: z.string(),
})

export type PlayerLogEntry = z.infer<typeof playerLogEntrySchema>

/** What a lesson passes when it appends: the rest is the store's to fill in. */
export const playerLogInputSchema = z.strictObject({
  kind: z.enum(LOG_KINDS),
  summary: z.string().trim().min(1).max(LONGEST_LOG_ENTRY),
})

export type PlayerLogInput = z.infer<typeof playerLogInputSchema>

export type ParsedLogInput = { ok: true; entry: PlayerLogInput } | { ok: false; problems: string[] }

/** Parse an entry from an untrusted source, saying what is wrong rather than throwing. */
export function parseLogInput(input: unknown): ParsedLogInput {
  const parsed = playerLogInputSchema.safeParse(input)
  if (parsed.success) return { ok: true, entry: parsed.data }
  return {
    ok: false,
    problems: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'entry'}: ${issue.message}`),
  }
}

export type ParsedBio = { ok: true; bio: string } | { ok: false; problems: string[] }

/**
 * Parse a bio. Empty is allowed and means "there is nothing worth keeping yet"
 * — clearing it is the same gesture as never having written one, the way a
 * session note behaves.
 */
export function parseBio(input: unknown): ParsedBio {
  const parsed = z.string().trim().max(LONGEST_BIO).safeParse(input)
  if (parsed.success) return { ok: true, bio: parsed.data }
  return {
    ok: false,
    problems: parsed.error.issues.map((issue) => `bio: ${issue.message}`),
  }
}
