import { TRPCClientError, type TRPCClient } from '@trpc/client'
import {
  LIBRARY_TOOL_DESCRIPTORS,
  builtinExerciseSummaries,
  exerciseStateAnswer,
  goalsAnswer,
  nextSessionAnswer,
  runsAnswer,
  toolArgument,
  type LibraryToolName,
} from '../agentTools/descriptors'
import { parseGoalInput, type Goal } from '../appData/goal'
import { foldRuns } from '../appData/memory'
import { resolveTargets } from '../appData/targets'
import { EXERCISES } from '../content'
import { parseExerciseInput } from '../content/exerciseInput'
import type { AppRouter } from '../server/trpc/router'
import type { AgentConfirm } from './agentConfirm'
import type { PageTool, PageToolAnswer } from './modelContext'

/**
 * The library, goal and scheduling tools as the page carries them out: over the same
 * tRPC wire, with the same signed-in session, as the app's own buttons — so an
 * agent in the browser can do what the user can and nothing more. After a
 * change the page's cached lists are refreshed, so the user watches it land.
 */

export interface LibraryToolDeps {
  client: TRPCClient<AppRouter>
  /** Re-read a list the app is showing. */
  refresh(list: 'exercises' | 'goals'): Promise<void>
  confirm: AgentConfirm['ask']
}

type Execute = (args: unknown, options: { signal?: AbortSignal }) => Promise<PageToolAnswer>

function executors({ client, refresh }: LibraryToolDeps): Record<LibraryToolName, Execute> {
  return {
    async get_next_session() {
      const listed = await client.runs.list.query()
      if (listed.status !== 'ok') return listed
      const goals = await client.goals.list.query()
      return nextSessionAnswer(
        listed.runs,
        await catalog(client),
        goals.status === 'ok' ? goals.goals.map(withoutProgress) : [],
      )
    },
    list_exercises: () => client.exercises.list.query(),
    async validate_exercise(args) {
      const parsed = parseExerciseInput(toolArgument(args, 'exercise'))
      return parsed.ok ? { status: 'ok' } : { status: 'invalid', problems: parsed.problems }
    },
    async create_exercise(args) {
      const result = await client.exercises.create.mutate(toolArgument(args, 'exercise'))
      if (result.status === 'ok') await refresh('exercises')
      return result
    },
    async list_builtin_exercises() {
      return { status: 'ok', exercises: builtinExerciseSummaries() }
    },
    async list_goals() {
      const listed = await client.goals.list.query()
      if (listed.status !== 'ok') return listed
      const stored = listed.goals.map(withoutProgress)
      return goalsAnswer(stored, await foldedState(client, stored))
    },

    async set_goal(args) {
      const goalId = toolArgument(args, 'goalId')
      if (goalId !== undefined && typeof goalId !== 'string') {
        return { status: 'invalid', problems: ['goalId: give the id of a goal from list_goals, or leave it out to create one'] }
      }
      const parsed = parseGoalInput(toolArgument(args, 'goal'), await knownExerciseIds(client))
      if (!parsed.ok) return { status: 'invalid', problems: parsed.problems }
      const result =
        goalId === undefined
          ? await client.goals.create.mutate(parsed.goal)
          : await client.goals.update.mutate({ goalId, goal: parsed.goal })
      if (result.status === 'ok') await refresh('goals')
      return result
    },

    async set_path(args) {
      const goalId = toolArgument(args, 'goalId')
      if (typeof goalId !== 'string') return { status: 'invalid', problems: ['goalId: give the id of a goal from list_goals'] }
      const listed = await client.goals.list.query()
      if (listed.status !== 'ok') return listed
      const existing = listed.goals.find((goal) => goal.id === goalId)
      if (!existing) return { status: 'not_found' }
      // Only the path changes; the goal's own title, status and weight stand.
      // The listed goal also carries how far along it is, which is not part of
      // the goal and would be refused on the way back in.
      const { id: _id, ...rest } = withoutProgress(existing)
      const parsed = parseGoalInput({ ...rest, stages: toolArgument(args, 'stages') }, await knownExerciseIds(client))
      if (!parsed.ok) return { status: 'invalid', problems: parsed.problems }
      const result = await client.goals.update.mutate({ goalId, goal: parsed.goal })
      if (result.status === 'ok') await refresh('goals')
      return result
    },

    get_player_bio: () => client.player.readBio.query(),

    async write_player_bio(args) {
      const bio = toolArgument(args, 'bio')
      if (typeof bio !== 'string') return { status: 'invalid', problems: ['bio: give the whole new bio as a string'] }
      return await client.player.writeBio.mutate({ bio })
    },

    async list_player_log(args) {
      const limit = toolArgument(args, 'limit')
      return await client.player.listLog.query(typeof limit === 'number' ? { limit } : undefined)
    },

    async append_player_log(args) {
      const kind = toolArgument(args, 'kind')
      const summary = toolArgument(args, 'summary')
      if (typeof summary !== 'string' || summary.trim().length === 0) {
        return { status: 'invalid', problems: ['summary: say what was discussed and decided'] }
      }
      if (kind !== 'onboarding' && kind !== 'after_session' && kind !== 'on_demand' && kind !== 'check_in') {
        return { status: 'invalid', problems: ['kind: one of onboarding, after_session, on_demand, check_in'] }
      }
      return await client.player.appendLog.mutate({ kind, summary })
    },

    async get_exercise_state() {
      const listed = await client.runs.list.query()
      if (listed.status !== 'ok') return listed
      const goals = await client.goals.list.query()
      return exerciseStateAnswer(
        listed.runs,
        await catalog(client),
        goals.status === 'ok' ? goals.goals : [],
      )
    },

    async list_runs(args) {
      const listed = await client.runs.list.query()
      if (listed.status !== 'ok') return listed
      const limit = toolArgument(args, 'limit')
      const offset = toolArgument(args, 'offset')
      return runsAnswer(listed.runs, typeof limit === 'number' ? limit : undefined, typeof offset === 'number' ? offset : undefined)
    },
  }
}

/** A listed goal without the progress the list adds to it — the goal as it is stored. */
function withoutProgress<T extends { solidity?: unknown; openStages?: unknown }>(goal: T): Omit<T, 'solidity' | 'openStages'> {
  const { solidity: _solidity, openStages: _openStages, ...rest } = goal
  return rest
}

/** Everything this user can practise: the pack plus their own library. */
async function catalog(client: LibraryToolDeps['client']) {
  const library = await client.exercises.list.query()
  return library.status === 'ok' ? [...EXERCISES, ...library.exercises] : [...EXERCISES]
}

async function knownExerciseIds(client: LibraryToolDeps['client']): Promise<Set<string>> {
  return new Set((await catalog(client)).map((exercise) => exercise.id))
}

/** The fold, against the targets the paths ask for — what the home card sees. */
async function foldedState(client: LibraryToolDeps['client'], goals: readonly Goal[]) {
  const listed = await client.runs.list.query()
  const known = await catalog(client)
  return foldRuns(listed.status === 'ok' ? listed.runs : [], known, undefined, resolveTargets(known, goals))
}

/** A fault is an answer too — an agent cannot read a thrown error — but a refused input is not a lost connection. */
function failure(error: unknown): PageToolAnswer {
  if (import.meta.env.DEV) console.warn('WebMCP: a library tool failed', error)
  const code = error instanceof TRPCClientError ? (error.data as { code?: string } | undefined)?.code : undefined
  if (code === 'BAD_REQUEST') return { status: 'invalid', problems: ['The arguments are not what this tool takes; check them against its input schema.'] }
  if (code === 'UNAUTHORIZED') return { status: 'error', message: 'The user is signed out of Count-in.' }
  return { status: 'error', message: 'The request to Count-in failed. The user may be offline.' }
}

export function libraryPageTools(deps: LibraryToolDeps): PageTool[] {
  const execute = executors(deps)
  return LIBRARY_TOOL_DESCRIPTORS.map((descriptor) => ({
    ...descriptor,
    execute: (args, options) => execute[descriptor.name](args, options).catch(failure),
  }))
}
