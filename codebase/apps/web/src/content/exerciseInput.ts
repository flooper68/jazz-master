import { keySignature } from '@jazz-master/theory'
import { z } from 'zod'
import { passBeats } from './timeline'
import { DEFAULT_BEATS_PER_BAR, type Exercise } from './types'
import { validateExercises } from './validate'

/**
 * An exercise arriving from outside the pack — a user's library, written by
 * an AI client over MCP or by the app. The pack is typed and trusted; this is
 * neither, so the shape is parsed first and only then held to the same rules
 * as the pack, plus the limits the pack never needed: what the score can
 * draw, how far up the neck a tab may go, how much text a field may carry.
 */

/** Note lengths the score has a glyph for; anything else would draw as a different rhythm than it plays. */
export const NOTE_LENGTHS_IN_BEATS = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25] as const
export const HIGHEST_FRET = 22
export const MOST_NOTES = 512
export const HIGHEST_LEVEL = 5

const noteSchema = z.strictObject({
  string: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  fret: z.number().int().min(0).max(HIGHEST_FRET),
  beats: z
    .number()
    .refine((beats) => NOTE_LENGTHS_IN_BEATS.some((length) => Math.abs(length - beats) < 1e-9), {
      message: `beats must be one of ${NOTE_LENGTHS_IN_BEATS.join(', ')}`,
    }),
})

export const exerciseInputSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  area: z.enum(['scales', 'arpeggios', 'chords', 'standards']),
  level: z.number().int().min(1).max(HIGHEST_LEVEL),
  tempoBpm: z.number().int().min(20).max(400),
  duration: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('minutes'), minutes: z.number().min(0.5).max(60) }),
    z.strictObject({ kind: z.literal('repetitions'), count: z.number().int().min(1).max(100) }),
  ]),
  notes: z.array(noteSchema).min(1).max(MOST_NOTES),
  key: z
    .string()
    .refine((key) => keySignature(key) !== null, { message: 'key must be a major key such as C, F, Bb or F#' })
    .optional(),
  beatsPerBar: z.number().int().min(2).max(12).optional(),
  about: z.array(z.string().trim().min(1).max(1200)).max(8).optional(),
})

export type ExerciseInput = z.infer<typeof exerciseInputSchema>
/** An exercise as the library hands it out: the input, plus the id it was stored under. It is an `Exercise`. */
export type LibraryExercise = ExerciseInput & { id: string }

/** Beats as a person writes them: no floating-point dust. */
function beatsText(beats: number): string {
  return String(Math.round(beats * 1000) / 1000)
}

export type ParsedExerciseInput =
  | { ok: true; exercise: ExerciseInput }
  | { ok: false; problems: string[] }

/**
 * Parse and validate an exercise from an untrusted source. Problems are
 * written for whoever has to fix them, which over MCP is a model: each says
 * where it is and what would make it right.
 */
export function parseExerciseInput(input: unknown): ParsedExerciseInput {
  const parsed = exerciseInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'exercise'}: ${issue.message}`),
    }
  }
  const exercise = parsed.data
  const beatsPerBar = exercise.beatsPerBar ?? DEFAULT_BEATS_PER_BAR
  const total = passBeats(exercise.notes)
  const over = total % beatsPerBar
  if (over > 1e-9 && beatsPerBar - over > 1e-9) {
    return {
      ok: false,
      problems: [
        `notes: the tab is ${beatsText(total)} beats long, which ends mid-bar in ${beatsPerBar}/4; lengthen notes by ${beatsText(beatsPerBar - over)} beats in total (there are no rests) or remove ${beatsText(over)}`,
      ],
    }
  }
  // The pack's own rules, last: the same function the pack is held to.
  const problems = validateExercises([{ ...exercise, id: 'candidate' } satisfies Exercise])
  if (problems.length > 0) return { ok: false, problems: problems.map((problem) => problem.message) }
  return { ok: true, exercise }
}
