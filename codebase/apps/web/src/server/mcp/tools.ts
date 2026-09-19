import {
  LIBRARY_TOOL_DESCRIPTORS,
  builtinExerciseSummaries,
  runsAnswer,
  toolArgument as argument,
  type AgentToolDescriptor,
  type LibraryToolName,
} from '../../agentTools/descriptors'
import type { GoalRepository } from '../db/goals'
import type { PlayerRepository } from '../db/player'
import type { RunRepository } from '../db/runs'
import type { UserExerciseRepository } from '../db/userExercises'
import { checkLibraryExercise, createLibraryExercise, listLibrary } from '../library/library'
import { exerciseState, listGoals, nextSession, saveGoal, savePath } from '../library/goals'
import { appendLog, listLog, readBio, writeBio } from '../library/player'

/**
 * The tools an AI client gets: look at the user's library, check an exercise,
 * add one; read and set their goals and paths; read and write what the teacher
 * remembers about them; and ask for the session the app would play next. What each tool says of itself lives in
 * agentTools/descriptors, which the page's own
 * WebMCP tools share; here is how the server carries each one out. Each goes
 * through the same library functions the app uses, so nothing can be stored
 * over MCP that the app would refuse.
 */

export interface McpToolContext {
  clerkUserId: string
  userExercises: UserExerciseRepository | null
  runs: RunRepository | null
  goals: GoalRepository | null
  player: PlayerRepository | null
}

export interface McpToolResult {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

/** A tool's answer: the same object as text, for a model to read, and as structure, for a client to use. */
function text(result: Record<string, unknown>, isError = false): McpToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: isError || undefined }
}

type McpToolCall = (args: unknown, context: McpToolContext) => Promise<McpToolResult>

interface McpTool extends AgentToolDescriptor {
  call: McpToolCall
}

const CALLS: Record<LibraryToolName, McpToolCall> = {
  async get_next_session(_args, context) {
    // Through the same gathering as get_exercise_state, so the plan is made
    // against the user's paths and priorities — not just their runs (JM-11).
    const result = await nextSession(context, context.clerkUserId)
    return text(result, result.status !== 'ok')
  },
  async list_exercises(_args, { clerkUserId, userExercises }) {
    const result = await listLibrary(userExercises, clerkUserId)
    return text(result, result.status !== 'ok')
  },
  async validate_exercise(args) {
    const result = checkLibraryExercise(argument(args, 'exercise'))
    return text(result, result.status !== 'ok')
  },
  async create_exercise(args, { clerkUserId, userExercises }) {
    const result = await createLibraryExercise(userExercises, clerkUserId, argument(args, 'exercise'))
    return text(result, result.status !== 'ok')
  },
  async list_builtin_exercises() {
    return text({ status: 'ok', exercises: builtinExerciseSummaries() })
  },

  async list_goals(_args, context) {
    const result = await listGoals(context, context.clerkUserId)
    return text(result, result.status !== 'ok')
  },

  async set_goal(args, context) {
    const result = await saveGoal(context, context.clerkUserId, argument(args, 'goalId'), argument(args, 'goal'))
    return text(result, result.status !== 'ok')
  },

  async set_path(args, context) {
    const result = await savePath(context, context.clerkUserId, argument(args, 'goalId'), argument(args, 'stages'))
    return text(result, result.status !== 'ok')
  },

  async get_player_bio(_args, context) {
    const result = await readBio(context, context.clerkUserId)
    return text(result, result.status !== 'ok')
  },

  async write_player_bio(args, context) {
    const result = await writeBio(context, context.clerkUserId, argument(args, 'bio'))
    return text(result, result.status !== 'ok')
  },

  async list_player_log(args, context) {
    const result = await listLog(context, context.clerkUserId, argument(args, 'limit'))
    return text(result, result.status !== 'ok')
  },

  async append_player_log(args, context) {
    const result = await appendLog(context, context.clerkUserId, {
      kind: argument(args, 'kind'),
      summary: argument(args, 'summary'),
    })
    return text(result, result.status !== 'ok')
  },

  async get_exercise_state(_args, context) {
    const result = await exerciseState(context, context.clerkUserId)
    return text(result, result.status !== 'ok')
  },

  async list_runs(args, { clerkUserId, runs }) {
    if (!runs) return text({ status: 'unconfigured' }, true)
    try {
      const limit = argument(args, 'limit')
      const offset = argument(args, 'offset')
      return text(
        runsAnswer(
          await runs.listRuns(clerkUserId),
          typeof limit === 'number' ? limit : undefined,
          typeof offset === 'number' ? offset : undefined,
        ),
      )
    } catch {
      return text({ status: 'error', message: 'Run database read failed' }, true)
    }
  },
}

export const MCP_TOOLS: readonly McpTool[] = LIBRARY_TOOL_DESCRIPTORS.map((descriptor) => ({ ...descriptor, call: CALLS[descriptor.name] }))
