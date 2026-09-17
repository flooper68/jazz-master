import { z } from 'zod'
import { exerciseInputSchema, HIGHEST_FRET, NOTE_LENGTHS_IN_BEATS } from '../../content/exerciseInput'
import { MOST_ROUTINE_ITEMS, routineInputSchema } from '../../appData/routine'
import { EXERCISES } from '../../content'
import type { RoutineRepository } from '../db/routines'
import type { UserExerciseRepository } from '../db/userExercises'
import { checkLibraryExercise, createLibraryExercise, listLibrary } from '../library/library'
import { deleteRoutine, listRoutines, saveRoutine } from '../library/routines'

/**
 * The tools an AI client gets: look at the user's library, check an exercise,
 * add one; and look at, make, change and delete practice routines. Each goes
 * through the same library functions the app uses, so nothing can be stored
 * over MCP that the app would refuse.
 */

export interface McpToolContext {
  clerkUserId: string
  userExercises: UserExerciseRepository | null
  routines: RoutineRepository | null
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

/** What a model needs to know to put a routine together. */
const ROUTINE_FORMAT = [
  'A practice routine is a named, ordered list of exercises prepared ahead of time; the user starts it in the app and',
  'plays it straight through, top to bottom. `name` is what the user sees (up to 80 characters). `about` is optional: a',
  `sentence or two on what the routine is for. \`items\` is the playing order, 1 to ${MOST_ROUTINE_ITEMS} entries, each`,
  '`{ "exerciseId": "…" }`. An id is either a built-in one from list_builtin_exercises or one of the user\'s own from',
  'list_exercises (those start with `user-`); any other id is refused. A routine refers to exercises, it does not copy',
  'them. Order it like a practice session: warm up with easier material, then the harder work.',
].join(' ')

const routineArgument = { routine: z.toJSONSchema(routineInputSchema, { io: 'input' }) }
const routineIdArgument = { routineId: { type: 'string', description: 'The `id` of a routine from list_routines.' } }

function argument(args: unknown, name: string): unknown {
  return typeof args === 'object' && args !== null && name in args ? (args as Record<string, unknown>)[name] : undefined
}

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
  {
    name: 'list_builtin_exercises',
    title: 'List the built-in exercises',
    description:
      'List the exercises that ship with Jazz Master — id, title, area, level, key, tempo — without their tabs. Every user has these; use their ids in a routine alongside ids from list_exercises.',
    inputSchema: objectSchema({}, []),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async call() {
      return text({
        status: 'ok',
        exercises: EXERCISES.map(({ id, title, area, level, key, tempoBpm }) => ({ id, title, area, level, key, tempoBpm })),
      })
    },
  },
  {
    name: 'list_routines',
    title: 'List my practice routines',
    description: "List the signed-in user's practice routines, oldest first, each with its id, name and ordered exercise ids. Call it before changing or deleting a routine, and to avoid making one that already exists.",
    inputSchema: objectSchema({}, []),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async call(_args, context) {
      const result = await listRoutines(context, context.clerkUserId)
      return text(result, result.status !== 'ok')
    },
  },
  {
    name: 'create_routine',
    title: 'Create a practice routine',
    description: `Create a new practice routine for the signed-in user; it appears in the app under Routines and as a source for Quick run. Returns the stored routine with its id, or the problems to fix — fix them and call again. ${ROUTINE_FORMAT}`,
    inputSchema: objectSchema(routineArgument, ['routine']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    async call(args, context) {
      const result = await saveRoutine(context, context.clerkUserId, argument(args, 'routine'))
      return text(result, result.status !== 'ok')
    },
  },
  {
    name: 'update_routine',
    title: 'Change a practice routine',
    description: `Replace one of the signed-in user's routines — its name, its note and its whole item list — with the routine given. To add, remove or reorder exercises, send the full new list. Returns the stored routine, the problems to fix, or \`not_found\` when the user has no routine with that id. ${ROUTINE_FORMAT}`,
    inputSchema: objectSchema({ ...routineIdArgument, ...routineArgument }, ['routineId', 'routine']),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    async call(args, context) {
      const routineId = argument(args, 'routineId')
      if (typeof routineId !== 'string') return text({ status: 'invalid', problems: ['routineId: give the id of the routine to change'] }, true)
      const result = await saveRoutine(context, context.clerkUserId, argument(args, 'routine'), routineId)
      return text(result, result.status !== 'ok')
    },
  },
  {
    name: 'delete_routine',
    title: 'Delete a practice routine',
    description: "Delete one of the signed-in user's practice routines for good. The exercises in it are not touched. Only do this when the user asked for it.",
    inputSchema: objectSchema(routineIdArgument, ['routineId']),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    async call(args, context) {
      const routineId = argument(args, 'routineId')
      if (typeof routineId !== 'string') return text({ status: 'invalid', problems: ['routineId: give the id of the routine to delete'] }, true)
      const result = await deleteRoutine(context, context.clerkUserId, routineId)
      return text(result, result.status !== 'ok')
    },
  },
]
