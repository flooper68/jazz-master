import { z } from 'zod'
import { exerciseInputSchema, HIGHEST_FRET, NOTE_LENGTHS_IN_BEATS } from '../../content/exerciseInput'
import type { UserExerciseRepository } from '../db/userExercises'
import { checkLibraryExercise, createLibraryExercise, listLibrary } from '../library/library'

/**
 * The tools an AI client gets: look at the user's library, check an exercise,
 * add one. Each goes through the same library functions the app uses, so
 * nothing can be stored over MCP that the app would refuse.
 */

export interface McpToolContext {
  clerkUserId: string
  userExercises: UserExerciseRepository | null
}

export interface McpToolResult {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

interface McpTool {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean }
  call(args: unknown, context: McpToolContext): Promise<McpToolResult>
}

/** What a model needs to know to write a valid exercise the first time; the schema says the rest. */
const EXERCISE_FORMAT = [
  'An exercise is a guitar tab in standard tuning with a rhythm: `notes` is an ordered list of single notes, each',
  '`{ string, fret, beats }`. `string` is 1 (high E) to 6 (low E); `fret` is 0 (open) to ' + `${HIGHEST_FRET}` + ';',
  `\`beats\` is the note's length in quarter-note beats and must be one of ${NOTE_LENGTHS_IN_BEATS.join(', ')}`,
  '(0.5 is an eighth note). There are no rests and no chords: one note sounds at a time, so write a chord as an arpeggio.',
  'The note lengths must add up to a whole number of bars (`beatsPerBar`, default 4); end on a long note to land on',
  'the bar line. `key` is the MAJOR key whose signature the notation uses (`C`, `F`, `Bb`, `F#`): for a minor or modal',
  'line give the relative major (D Dorian and A minor are both `C`). `tempoBpm` is the target tempo. `duration` is how',
  'long to stay on it: `{ "kind": "repetitions", "count": 4 }` or `{ "kind": "minutes", "minutes": 2 }`. `level` runs',
  'from 1 (beginner) to 5. `about` is optional teaching text, a paragraph per entry: the theory, the fingering, what to',
  'listen for. Keep a pass short — 2 to 8 bars is typical — and keep the fingering playable in one position.',
].join(' ')

const exerciseArgument = { exercise: z.toJSONSchema(exerciseInputSchema, { io: 'input' }) }

function objectSchema(properties: Record<string, unknown>, required: string[]): Record<string, unknown> {
  return { type: 'object', properties, required, additionalProperties: false }
}

function text(result: Record<string, unknown>, isError = false): McpToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: isError || undefined }
}

function exerciseOf(args: unknown): unknown {
  return typeof args === 'object' && args !== null && 'exercise' in args ? (args as { exercise: unknown }).exercise : undefined
}

export const MCP_TOOLS: readonly McpTool[] = [
  {
    name: 'list_exercises',
    title: 'List my exercises',
    description:
      "List the exercises in the signed-in user's own Jazz Master library (not the built-in pack), oldest first, with their full tabs. Use it to see what the user already has before adding more, and as examples of the format.",
    inputSchema: objectSchema({}, []),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async call(_args, { clerkUserId, userExercises }) {
      const result = await listLibrary(userExercises, clerkUserId)
      return text(result, result.status !== 'ok')
    },
  },
  {
    name: 'validate_exercise',
    title: 'Check an exercise',
    description: `Check an exercise without saving it. Returns \`{ "status": "ok" }\` or the list of problems, each saying where it is and how to fix it. ${EXERCISE_FORMAT}`,
    inputSchema: objectSchema(exerciseArgument, ['exercise']),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async call(args) {
      const result = checkLibraryExercise(exerciseOf(args))
      return text(result, result.status !== 'ok')
    },
  },
  {
    name: 'create_exercise',
    title: 'Add an exercise to my library',
    description: `Add a new exercise to the signed-in user's Jazz Master library; it appears in the app beside the built-in pack, ready to practise. Returns the stored exercise with its id, or the problems to fix — fix them and call again. Each call adds a new exercise; there is no update. ${EXERCISE_FORMAT}`,
    inputSchema: objectSchema(exerciseArgument, ['exercise']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    async call(args, { clerkUserId, userExercises }) {
      const result = await createLibraryExercise(userExercises, clerkUserId, exerciseOf(args))
      return text(result, result.status !== 'ok')
    },
  },
]
