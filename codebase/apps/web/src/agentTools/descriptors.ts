import { z } from 'zod'
import { foldRuns } from '../appData/memory'
import { planNextSession, planSeed } from '../appData/nextSession'
import { MOST_ROUTINE_ITEMS, routineInputSchema } from '../appData/routine'
import type { ExerciseRun } from '../appData/run'
import { EXERCISES, type Exercise } from '../content'
import { HIGHEST_FRET, NOTE_LENGTHS_IN_BEATS, exerciseInputSchema } from '../content/exerciseInput'

/**
 * What an AI agent is told about each tool — its name, what it does, what it
 * takes. Said once, here, and carried out twice: by the MCP server
 * (server/mcp/tools), for a client holding an OAuth token, and by the page
 * itself (webmcp/), for an agent in the signed-in user's browser. The two can
 * never describe the same tool differently.
 */

export interface AgentToolDescriptor {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  /** MCP's hints, and WebMCP's own: `untrustedContentHint` marks an answer carrying text a user — or an agent — wrote. */
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean; untrustedContentHint?: boolean }
}

/** One named argument of a tool call, or undefined when the call is not an object or lacks it. */
export function toolArgument(args: unknown, name: string): unknown {
  return typeof args === 'object' && args !== null && name in args ? (args as Record<string, unknown>)[name] : undefined
}

/** What list_builtin_exercises answers with, through either door: the pack without its tabs, with the labels it is filtered by. */
export function builtinExerciseSummaries() {
  return EXERCISES.map(({ id, title, area, level, key, tonic, tempoBpm, styles, contexts, techniques, feel, voicings, series }) => ({
    id, title, area, level, key, tonic, tempoBpm, styles, contexts, techniques, feel, voicings, series,
  }))
}

/**
 * What get_next_session answers with, through either door: the slots the home
 * card shows, in the same order and with the same reasons, worked out from the
 * same pure functions.
 *
 * Days are counted in the runtime's own timezone. In the browser (WebMCP) that
 * is the user's, so the answer matches the page exactly. On the `/mcp` server
 * it is the worker's — UTC — which shifts both today and the grouping of runs
 * into days, so a user well away from UTC can get a plan that differs from the
 * page. The tool says so; a timezone argument is the fix when it matters.
 */
export function nextSessionAnswer(runs: readonly ExerciseRun[], catalog: readonly Exercise[]) {
  const { slots } = planNextSession(foldRuns(runs, catalog), catalog, planSeed(runs))
  return {
    status: 'ok' as const,
    slots: slots.map((slot) => ({
      exerciseId: slot.exercise.id,
      title: slot.exercise.title,
      area: slot.exercise.area,
      tempoBpm: slot.tempoBpm,
      targetTempoBpm: slot.exercise.tempoBpm,
      reason: slot.reason,
    })),
  }
}

export function objectSchema(properties: Record<string, unknown>, required: string[]): Record<string, unknown> {
  return { type: 'object', properties, required, additionalProperties: false }
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const
const READS_USER_TEXT = { ...READ_ONLY, untrustedContentHint: true } as const
const ADDS = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } as const
const REPLACES = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false } as const

/** What a model needs to know to write a valid exercise the first time; the schema says the rest. */
const EXERCISE_FORMAT = [
  'An exercise is a guitar tab in standard tuning with a rhythm: `notes` is an ordered list of events, each',
  '`{ string, fret, beats }`. `string` is 1 (high E) to 6 (low E); `fret` is 0 (open) to ' + `${HIGHEST_FRET}` + ';',
  `\`beats\` is the note's length in quarter-note beats and must be one of ${NOTE_LENGTHS_IN_BEATS.join(', ')}`,
  '(0.5 is an eighth note). A chord is one event: its lowest string is the note, and the rest go in `above` as',
  '`[{ string, fret }, ...]` from the next string up, each higher in pitch than the last (open C is `{ "string": 5,',
  '"fret": 3, "beats": 1, "above": [{ "string": 4, "fret": 2 }, { "string": 3, "fret": 0 }, { "string": 2, "fret": 1 },',
  '{ "string": 1, "fret": 0 }] }`). There are no rests: something sounds on every beat.',
  'The note lengths must add up to a whole number of bars (`beatsPerBar`, default 4); end on a long note to land on',
  'the bar line. `key` is the MAJOR key whose signature the notation uses (`C`, `F`, `Bb`, `F#`): for a minor or modal',
  'line give the relative major (D Dorian and A minor are both `C`) and name the note it is built on in `tonic` (`D`,',
  '`A`), which is the root the neck diagram marks. `tempoBpm` is the target tempo. `duration` is how',
  'long to stay on it: `{ "kind": "repetitions", "count": 4 }` or `{ "kind": "minutes", "minutes": 2 }`. `level` runs',
  'from 1 (beginner) to 5. `about` is optional teaching text, a paragraph per entry: the theory, the fingering, what to',
  'listen for. Keep a pass short — 2 to 8 bars is typical — and keep the fingering playable in one position.',
  'Label it so the user can find it: `area` is required (`technique` for mechanics with no musical material, `patterns`',
  'for sequences and intervals, `lines` for licks, riffs and vocabulary, `etudes` for studies and tunes). The rest are',
  'optional, each from the fixed list in the schema, and an exercise takes every value that is true of it: `styles`',
  '(leave it out for a fundamental that belongs to every style; `jazz/bebop` already counts as `jazz`), `contexts` (the',
  'harmony it is played over), `techniques`, `feel`, and `voicings` for chord shapes. Exercises sharing a `series` slug',
  "belong together and are learned in the order they were added. `tags` are the user's own free-text labels.",
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

const exerciseArgument = { exercise: z.toJSONSchema(exerciseInputSchema, { io: 'input' }) }
const routineArgument = { routine: z.toJSONSchema(routineInputSchema, { io: 'input' }) }
const routineIdArgument = { routineId: { type: 'string', description: 'The `id` of a routine from list_routines.' } }

export type LibraryToolName =
  | 'get_next_session'
  | 'list_exercises'
  | 'validate_exercise'
  | 'create_exercise'
  | 'list_builtin_exercises'
  | 'list_routines'
  | 'create_routine'
  | 'update_routine'
  | 'delete_routine'

/** The library and routine tools, in the order a client lists them. */
export const LIBRARY_TOOL_DESCRIPTORS: readonly (AgentToolDescriptor & { name: LibraryToolName })[] = [
  {
    name: 'get_next_session',
    title: 'What to practise next',
    description:
      "What Count-in would have the signed-in user practise now: the exercises of their next session, in playing order, each with the tempo to start at and the reason it is there (overdue, due today, new, ahead of schedule). It is worked out from their run history by the same code the app's home page uses. Nothing is stored and calling it changes nothing. Note on days: the scheduler counts calendar days, and over this server they are counted in UTC — a user in another timezone may see a slightly different plan in the app itself.",
    inputSchema: objectSchema({}, []),
    annotations: READS_USER_TEXT,
  },
  {
    name: 'list_exercises',
    title: 'List my exercises',
    description:
      "List the exercises in the signed-in user's own Count-in library (not the built-in pack), oldest first, with their full tabs. Use it to see what the user already has before adding more, and as examples of the format.",
    inputSchema: objectSchema({}, []),
    annotations: READS_USER_TEXT,
  },
  {
    name: 'validate_exercise',
    title: 'Check an exercise',
    description: `Check an exercise without saving it. Returns \`{ "status": "ok" }\` or the list of problems, each saying where it is and how to fix it. ${EXERCISE_FORMAT}`,
    inputSchema: objectSchema(exerciseArgument, ['exercise']),
    annotations: READ_ONLY,
  },
  {
    name: 'create_exercise',
    title: 'Add an exercise to my library',
    description: `Add a new exercise to the signed-in user's Count-in library; it appears in the app beside the built-in pack, ready to practise. Returns the stored exercise with its id, or the problems to fix — fix them and call again. Each call adds a new exercise; there is no update. ${EXERCISE_FORMAT}`,
    inputSchema: objectSchema(exerciseArgument, ['exercise']),
    annotations: ADDS,
  },
  {
    name: 'list_builtin_exercises',
    title: 'List the built-in exercises',
    description:
      'List the exercises that ship with Count-in — id, title, area, level, key, tempo and the labels they are filtered by — without their tabs. Every user has these; use their ids in a routine alongside ids from list_exercises.',
    inputSchema: objectSchema({}, []),
    annotations: READ_ONLY,
  },
  {
    name: 'list_routines',
    title: 'List my practice routines',
    description: "List the signed-in user's practice routines, oldest first, each with its id, name and ordered exercise ids. Call it before changing or deleting a routine, and to avoid making one that already exists.",
    inputSchema: objectSchema({}, []),
    annotations: READS_USER_TEXT,
  },
  {
    name: 'create_routine',
    title: 'Create a practice routine',
    description: `Create a new practice routine for the signed-in user; it appears in the app under Routines and as a source for Quick run. Returns the stored routine with its id, or the problems to fix — fix them and call again. ${ROUTINE_FORMAT}`,
    inputSchema: objectSchema(routineArgument, ['routine']),
    annotations: ADDS,
  },
  {
    name: 'update_routine',
    title: 'Change a practice routine',
    description: `Replace one of the signed-in user's routines — its name, its note and its whole item list — with the routine given. To add, remove or reorder exercises, send the full new list. Returns the stored routine, the problems to fix, or \`not_found\` when the user has no routine with that id. ${ROUTINE_FORMAT}`,
    inputSchema: objectSchema({ ...routineIdArgument, ...routineArgument }, ['routineId', 'routine']),
    annotations: REPLACES,
  },
  {
    name: 'delete_routine',
    title: 'Delete a practice routine',
    description: "Delete one of the signed-in user's practice routines for good. The exercises in it are not touched. Only do this when the user asked for it.",
    inputSchema: objectSchema(routineIdArgument, ['routineId']),
    annotations: REPLACES,
  },
]
