import {
  LIBRARY_TOOL_DESCRIPTORS,
  builtinExerciseSummaries,
  toolArgument as argument,
  type AgentToolDescriptor,
  type LibraryToolName,
} from '../../agentTools/descriptors'
import type { RoutineRepository } from '../db/routines'
import type { UserExerciseRepository } from '../db/userExercises'
import { checkLibraryExercise, createLibraryExercise, listLibrary } from '../library/library'
import { deleteRoutine, listRoutines, saveRoutine } from '../library/routines'

/**
 * The tools an AI client gets: look at the user's library, check an exercise,
 * add one; and look at, make, change and delete practice routines. What each
 * tool says of itself lives in agentTools/descriptors, which the page's own
 * WebMCP tools share; here is how the server carries each one out. Each goes
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

/** A tool's answer: the same object as text, for a model to read, and as structure, for a client to use. */
function text(result: Record<string, unknown>, isError = false): McpToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: isError || undefined }
}

type McpToolCall = (args: unknown, context: McpToolContext) => Promise<McpToolResult>

interface McpTool extends AgentToolDescriptor {
  call: McpToolCall
}

const CALLS: Record<LibraryToolName, McpToolCall> = {
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
  async list_routines(_args, context) {
    const result = await listRoutines(context, context.clerkUserId)
    return text(result, result.status !== 'ok')
  },
  async create_routine(args, context) {
    const result = await saveRoutine(context, context.clerkUserId, argument(args, 'routine'))
    return text(result, result.status !== 'ok')
  },
  async update_routine(args, context) {
    const routineId = argument(args, 'routineId')
    if (typeof routineId !== 'string') return text({ status: 'invalid', problems: ['routineId: give the id of the routine to change'] }, true)
    const result = await saveRoutine(context, context.clerkUserId, argument(args, 'routine'), routineId)
    return text(result, result.status !== 'ok')
  },
  async delete_routine(args, context) {
    const routineId = argument(args, 'routineId')
    if (typeof routineId !== 'string') return text({ status: 'invalid', problems: ['routineId: give the id of the routine to delete'] }, true)
    const result = await deleteRoutine(context, context.clerkUserId, routineId)
    return text(result, result.status !== 'ok')
  },
}

export const MCP_TOOLS: readonly McpTool[] = LIBRARY_TOOL_DESCRIPTORS.map((descriptor) => ({ ...descriptor, call: CALLS[descriptor.name] }))
