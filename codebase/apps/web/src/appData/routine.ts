import { z } from 'zod'

/**
 * A practice routine: a named, ordered set of exercises the user (or an AI
 * client over MCP) has put together ahead of time — a blueprint for a
 * session. It holds references, not copies: an exercise edited or added to
 * the library is what the routine plays next time. Items are objects rather
 * than bare ids so an item can later carry its own settings (a tempo, a
 * duration) without the stored shape changing.
 */

export const MOST_ROUTINE_ITEMS = 30

export const routineItemSchema = z.strictObject({
  /** A pack id (`scales-major-open-c`) or a library id (`user-<uuid>`). */
  exerciseId: z.string().trim().min(1).max(100),
})

export const routineInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  /** What the routine is for, in a sentence or two. */
  about: z.string().trim().max(500).optional(),
  items: z.array(routineItemSchema).min(1).max(MOST_ROUTINE_ITEMS),
})

export type RoutineItem = z.infer<typeof routineItemSchema>
export type RoutineInput = z.infer<typeof routineInputSchema>

/** A routine as stored: the input plus its identity. */
export interface Routine extends RoutineInput {
  id: string
}

export const routineSchema = routineInputSchema.extend({ id: z.string().min(1) })

export type ParsedRoutineInput = { ok: true; routine: RoutineInput } | { ok: false; problems: string[] }

/**
 * Parse a routine from an untrusted source and hold it to what is known:
 * every item must name an exercise that exists for this user. Problems say
 * where they are and what to do about them.
 */
export function parseRoutineInput(input: unknown, knownExerciseIds: ReadonlySet<string>): ParsedRoutineInput {
  const parsed = routineInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'routine'}: ${issue.message}`),
    }
  }
  const seen = new Set<string>()
  const problems = parsed.data.items.flatMap((item, index) => {
    if (!knownExerciseIds.has(item.exerciseId)) {
      return [`items.${index}.exerciseId: no exercise "${item.exerciseId}" — use an id from the built-in pack or from the user's library`]
    }
    // A session plays each exercise once; a repeat would silently vanish.
    if (seen.has(item.exerciseId)) return [`items.${index}.exerciseId: "${item.exerciseId}" is already in the routine — list each exercise once`]
    seen.add(item.exerciseId)
    return []
  })
  return problems.length > 0 ? { ok: false, problems } : { ok: true, routine: parsed.data }
}
