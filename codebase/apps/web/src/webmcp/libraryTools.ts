import { TRPCClientError, type TRPCClient } from '@trpc/client'
import { LIBRARY_TOOL_DESCRIPTORS, builtinExerciseSummaries, toolArgument, type LibraryToolName } from '../agentTools/descriptors'
import { parseExerciseInput } from '../content/exerciseInput'
import type { AppRouter } from '../server/trpc/router'
import type { AgentConfirm } from './agentConfirm'
import type { PageTool, PageToolAnswer } from './modelContext'

/**
 * The library and routine tools as the page carries them out: over the same
 * tRPC wire, with the same signed-in session, as the app's own buttons — so an
 * agent in the browser can do what the user can and nothing more. After a
 * change the page's cached lists are refreshed, so the user watches it land.
 */

export interface LibraryToolDeps {
  client: TRPCClient<AppRouter>
  /** Re-read a list the app is showing. */
  refresh(list: 'exercises' | 'routines'): Promise<void>
  confirm: AgentConfirm['ask']
}

type Execute = (args: unknown, options: { signal?: AbortSignal }) => Promise<PageToolAnswer>

const REFUSED: PageToolAnswer = { status: 'refused', message: 'The user did not allow this. Do not try again unless they ask.' }

/** The user decided about one routine; if it is no longer that routine, their answer does not carry over. */
const CHANGED: PageToolAnswer = { status: 'changed', message: 'The routine changed while the user was deciding, so nothing was done. Look again with list_routines.' }

/** A name as the question shows it: the agent may have chosen it, so it gets a line, not a paragraph. */
function quoted(name: string): string {
  return `“${name.length > 60 ? `${name.slice(0, 59)}…` : name}”`
}

/** A routine's name, for the question put to the user; null when the user has no such routine. */
async function routineName(client: LibraryToolDeps['client'], routineId: string): Promise<string | null> {
  const listed = await client.routines.list.query()
  if (listed.status !== 'ok') return null
  return listed.routines.find((routine) => routine.id === routineId)?.name ?? null
}

function executors({ client, refresh, confirm }: LibraryToolDeps): Record<LibraryToolName, Execute> {
  return {
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
    list_routines: () => client.routines.list.query(),
    async create_routine(args) {
      const result = await client.routines.create.mutate({ routine: toolArgument(args, 'routine') })
      if (result.status === 'ok') await refresh('routines')
      return result
    },
    async update_routine(args, { signal }) {
      const routineId = toolArgument(args, 'routineId')
      if (typeof routineId !== 'string' || routineId.length === 0) return { status: 'invalid', problems: ['routineId: give the id of the routine to change'] }
      const name = await routineName(client, routineId)
      if (name === null) return { status: 'not_found' }
      const allowed = await confirm({ question: `Let the assistant change the routine ${quoted(name)}?`, consequence: 'Its name, note and exercises are replaced with what the assistant sends.' }, signal)
      if (!allowed) return REFUSED
      if ((await routineName(client, routineId)) !== name) return CHANGED
      const result = await client.routines.update.mutate({ routineId, routine: toolArgument(args, 'routine') })
      if (result.status === 'ok') await refresh('routines')
      return result
    },
    async delete_routine(args, { signal }) {
      const routineId = toolArgument(args, 'routineId')
      if (typeof routineId !== 'string' || routineId.length === 0) return { status: 'invalid', problems: ['routineId: give the id of the routine to delete'] }
      const name = await routineName(client, routineId)
      if (name === null) return { status: 'ok', deleted: false }
      const allowed = await confirm({ question: `Let the assistant delete the routine ${quoted(name)}?`, consequence: 'The routine is deleted for good. Its exercises stay.' }, signal)
      if (!allowed) return REFUSED
      if ((await routineName(client, routineId)) !== name) return CHANGED
      const result = await client.routines.delete.mutate({ routineId })
      if (result.status === 'ok') await refresh('routines')
      return result
    },
  }
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
