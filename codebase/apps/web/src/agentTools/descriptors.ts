import { z } from 'zod'
import { exerciseCosts, lastRunEnded } from '../appData/cost'
import { foldRuns } from '../appData/memory'
import { recoveryState } from '../appData/recovery'
import { planNextSession, planSeed } from '../appData/nextSession'
import { goalInputSchema, type Goal } from '../appData/goal'
import type { ExerciseState } from '../appData/memory'
import { pathsProgress } from '../appData/path'
import { resolveTargets } from '../appData/targets'
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
 * What get_next_session answers with, through either door: the same pure
 * functions the home card plans with, over the same four inputs — the runs, the
 * catalogue, the paths and what the user said about single exercises.
 *
 * Not yet the card's plan exactly: the card also passes the session length the
 * user chose, and this does not, so a user who asked for ten minutes is
 * answered here at the default budget.
 *
 * Days are counted in the runtime's own timezone. In the browser (WebMCP) that
 * is the user's, so the answer matches the page exactly. On the `/mcp` server
 * it is the worker's — UTC — which shifts both today and the grouping of runs
 * into days, so a user well away from UTC can get a plan that differs from the
 * page. The tool says so; a timezone argument is the fix when it matters.
 */
export function nextSessionAnswer(
  runs: readonly ExerciseRun[],
  catalog: readonly Exercise[],
  goals: readonly Goal[],
) {
  // The same inputs the home card assembles from, so a tool and the page can
  // never describe two different sessions.
  const targets = resolveTargets(catalog, goals)
  const state = foldRuns(runs, catalog, undefined, targets)
  const { slots } = planNextSession({
    state,
    catalog,
    seed: planSeed(runs),
    costs: exerciseCosts(runs, catalog),
    lastRunEnded: lastRunEnded(runs),
    recovering: recoveryState(runs).recovering,
    targets,
    paths: pathsProgress(goals, state),
  })
  return {
    status: 'ok' as const,
    slots: slots.map((slot) => ({
      exerciseId: slot.exercise.id,
      title: slot.exercise.title,
      area: slot.exercise.area,
      tempoBpm: slot.tempoBpm,
      // What this exercise is judged against here and now — the path's target
      // where one asks, not the tempo the exercise happens to be written at.
      targetTempoBpm: targets.get(slot.exercise.id) ?? slot.exercise.tempoBpm,
      reason: slot.reason,
    })),
  }
}

/**
 * What list_goals answers with: every goal, its path, and how far along each
 * stage is — worked out by the same pure functions the home card uses, so a
 * model and the page never disagree about what is open.
 */
export function goalsAnswer(goals: readonly Goal[], state: ReadonlyMap<string, ExerciseState>) {
  const progress = new Map(pathsProgress(goals, state).map((path) => [path.goal.id, path]))
  return {
    status: 'ok' as const,
    goals: goals.map((goal) => ({
      ...goal,
      solidity: progress.get(goal.id)?.solidity ?? null,
      openStages: progress.get(goal.id)?.openStages ?? null,
    })),
  }
}

/** What get_exercise_state answers with: the fold, flattened. */
export function exerciseStateAnswer(
  runs: readonly ExerciseRun[],
  catalog: readonly Exercise[],
  goals: readonly Goal[],
) {
  const targets = resolveTargets(catalog, goals)
  const state = foldRuns(runs, catalog, undefined, targets)
  return {
    status: 'ok' as const,
    exercises: catalog.flatMap((exercise) => {
      const found = state.get(exercise.id)
      if (!found) return []
      return [
        {
          exerciseId: exercise.id,
          title: exercise.title,
          band: found.band,
          interval: found.interval,
          due: found.due,
          bestTempo: found.bestTempo,
          margin: found.margin,
          nextTempo: found.nextTempo,
          targetTempoBpm: targets.get(exercise.id) ?? exercise.tempoBpm,
          lastReview: found.lastReview,
          feel: found.feel,
        },
      ]
    }),
  }
}

/** What list_runs answers with: the user's own runs, newest first, a page at a time. */
export function runsAnswer(runs: readonly ExerciseRun[], limit = 50, offset = 0) {
  const page = Math.min(Math.max(Math.trunc(limit), 1), 200)
  const from = Math.max(Math.trunc(offset), 0)
  const ordered = [...runs].sort((a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0))
  return { status: 'ok' as const, total: ordered.length, runs: ordered.slice(from, from + page) }
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

const exerciseArgument = { exercise: z.toJSONSchema(exerciseInputSchema, { io: 'input' }) }
const goalArgument = { goal: z.toJSONSchema(goalInputSchema, { io: 'input' }) }
const goalIdArgument = { goalId: { type: 'string', description: 'The `id` of a goal from list_goals.' } }

/** What a model needs to know to write a path that the scheduler can actually run. */
const PATH_FORMAT = [
  'A goal is something the user wants to be able to do; its `stages` are how the practice gets there.',
  'Each stage is an ordered list of `{ exerciseId, targetTempoBpm }`, and the target is what counts as',
  'having that exercise *for this goal* — it replaces the tempo the exercise is written at wherever the',
  'schedule asks how fast is fast enough. Stage 1 is what the user starts on; a later stage opens only',
  'once the one before it is mostly solid, so put the groundwork first and the payoff last. An exercise',
  'belongs to one stage of one path — never repeat an id. Use ids from list_builtin_exercises and',
  'list_exercises.',
].join(' ')

export type LibraryToolName =
  | 'get_next_session'
  | 'list_exercises'
  | 'validate_exercise'
  | 'create_exercise'
  | 'list_builtin_exercises'
  | 'list_goals'
  | 'set_goal'
  | 'set_path'
  | 'get_exercise_state'
  | 'list_runs'

/** The library, goal and scheduling tools, in the order a client lists them. */
export const LIBRARY_TOOL_DESCRIPTORS: readonly (AgentToolDescriptor & { name: LibraryToolName })[] = [
  {
    name: 'get_next_session',
    title: 'What to practise next',
    description:
      "What Count-in would have the signed-in user practise now: the exercises of their next session, in playing order, each with the tempo to start at and the reason it is there (overdue, due today, new, ahead of schedule). It is worked out from their run history, and it follows their goals: a path decides what is open to be practised, a path's target is the tempo each of its exercises is judged against, and an exercise the user muted is never offered. Nothing is stored and calling it changes nothing. Note on days: the scheduler counts calendar days, and over this server they are counted in UTC — a user in another timezone may see a slightly different plan in the app itself.",
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
      'List the exercises that ship with Count-in — id, title, area, level, key, tempo and the labels they are filtered by — without their tabs. Every user has these; use their ids in a path alongside ids from list_exercises.',
    inputSchema: objectSchema({}, []),
    annotations: READ_ONLY,
  },
  {
    name: 'list_goals',
    title: 'List my goals and paths',
    description:
      "List the signed-in user's goals, oldest first: each one's id, title, status, weight and its whole path of stages, plus how solid each stage is and which stages are open. Also returns what the user has said about single exercises (pinned, boosted, muted, and any tempo override). Call it before changing a goal, and to avoid making one that already exists.",
    inputSchema: objectSchema({}, []),
    annotations: READS_USER_TEXT,
  },
  {
    name: 'set_goal',
    title: 'Create or replace a goal',
    description: `Create a goal with its path, or replace one whole by passing its \`goalId\`. Replacing takes the goal as given — to add or reorder a stage, send the full new list of stages. Returns the stored goal with its id, or the problems to fix. ${PATH_FORMAT}`,
    inputSchema: objectSchema({ goalId: { ...goalIdArgument.goalId, description: 'Omit to create; pass the id of an existing goal to replace it.' }, ...goalArgument }, ['goal']),
    annotations: REPLACES,
  },
  {
    name: 'set_path',
    title: 'Replace a goal\u2019s stages',
    description: `Replace the stages of an existing goal, leaving its title, status and weight alone — the usual way to extend a path the user has outgrown. Send the full new list of stages. Returns the stored goal, or \`not_found\` when the user has no goal with that id. ${PATH_FORMAT}`,
    inputSchema: objectSchema(
      { ...goalIdArgument, stages: z.toJSONSchema(goalInputSchema, { io: 'input' }).properties?.stages ?? { type: 'array' } },
      ['goalId', 'stages'],
    ),
    annotations: REPLACES,
  },
  {
    name: 'get_exercise_state',
    title: 'What the scheduler knows about each exercise',
    description:
      "What the scheduler has worked out about every exercise from the signed-in user's runs: its band (new, stuck, hard, fine, easy), the days between reviews, the day it is next due, the fastest it has been played, how that compares with the tempo it is judged against, and how it last felt. Nothing is stored and calling it changes nothing.",
    inputSchema: objectSchema({}, []),
    annotations: READS_USER_TEXT,
  },
  {
    name: 'list_runs',
    title: 'List my practice runs',
    description:
      "List the signed-in user's own practice runs, newest first: which exercise, when, how long, at what tempo, whether it was played through, how it went and how it felt. Paged — pass `limit` and `offset`. Use it to answer questions about what somebody has actually been doing, rather than guessing from the plan.",
    inputSchema: objectSchema(
      {
        limit: { type: 'integer', description: 'How many runs to return, 1 to 200. Defaults to 50.' },
        offset: { type: 'integer', description: 'How many to skip, for paging. Defaults to 0.' },
      },
      [],
    ),
    annotations: READS_USER_TEXT,
  },
]
