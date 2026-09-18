import { z } from 'zod'
import { objectSchema } from '../agentTools/descriptors'
import { routineExercises, routinePlan, sessionSearch } from '../appData/quickRun'
import type { Routine } from '../appData/routine'
import type { Exercise } from '../content'
import type { AgentConfirm } from './agentConfirm'
import type { PageTool, PageToolAnswer } from './modelContext'
import type { PlayerState } from './playerTools'

/**
 * Tools that move the app itself: where the user is, going somewhere else,
 * opening an exercise, starting a routine. They go where the app's own links
 * go and nowhere else — a page is named, never a URL.
 */

export const APP_PAGES = {
  home: '/',
  exercises: '/exercises',
  routines: '/routines',
  new_routine: '/routines/new',
  history: '/history',
} as const

export type AppPage = keyof typeof APP_PAGES

/** Where the app can be sent. The session and one exercise carry what they play; the pages carry nothing. */
export type AppDestination =
  | { page: AppPage }
  | { exerciseId: string }
  | { session: { x: string; r?: string } }

export interface UiToolDeps {
  /** The app-relative path and its search, e.g. `/exercises/abc`. */
  location(): { path: string; search: Record<string, unknown> }
  go(destination: AppDestination): Promise<void>
  /** Everything the user can play: the built-in pack and their own. */
  exercises(): Promise<readonly Exercise[]>
  /** The user's routines, or null when they cannot be read. */
  routines(): Promise<readonly Routine[] | null>
  /** The player on the page now, or null. */
  player(): PlayerState | null
  confirm: AgentConfirm['ask']
}

const pageInput = z.strictObject({ page: z.enum(Object.keys(APP_PAGES) as [AppPage, ...AppPage[]]).describe('The page to show.') })
const exerciseInput = z.strictObject({ exerciseId: z.string().min(1).max(100).describe('An `id` from list_builtin_exercises or list_exercises.') })
const routineInput = z.strictObject({ routineId: z.string().min(1).max(100).describe('The `id` of a routine from list_routines.') })

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const
const MOVES = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const

function pageOf(path: string): AppPage | 'exercise' | 'session' | 'edit_routine' | 'unknown' {
  const named = (Object.entries(APP_PAGES) as [AppPage, string][]).find(([, pagePath]) => pagePath === (path === '' ? '/' : path))
  if (named) return named[0]
  if (path.startsWith('/exercises/')) return 'exercise'
  if (path === '/session') return 'session'
  if (/^\/routines\/[^/]+\/edit$/.test(path)) return 'edit_routine'
  return 'unknown'
}

const STAYED: PageToolAnswer = { status: 'refused', message: 'The user chose to stay where they are. Do not try again unless they ask.' }

export function uiPageTools({ location, go, exercises, routines, player, confirm }: UiToolDeps): PageTool[] {
  function view() {
    const { path, search } = location()
    return { page: pageOf(path), path, ...(Object.keys(search).length > 0 ? { search } : {}), player: player() }
  }
  /** Moving on can cost the user something the app does not keep: a half-made routine, a run in full flow. Then it is theirs to say. */
  async function mayLeave(signal?: AbortSignal): Promise<boolean> {
    const page = pageOf(location().path)
    if (page === 'new_routine' || page === 'edit_routine') return confirm({ question: 'Let the assistant leave this page?', consequence: 'Changes to the routine that are not saved yet are lost.' }, signal)
    if (player()?.playing) return confirm({ question: 'Let the assistant leave the exercise you are playing?', consequence: 'Playing stops, and this run is not saved.' }, signal)
    return true
  }
  return [
    {
      name: 'get_current_view',
      title: 'Look at the app',
      description:
        'Where the user is in Count-in right now: the page, and — when an exercise is on the stage — what the player is doing. Call it first, and again after moving: the player tools (player_play and the rest) exist only while `player` is not null.',
      inputSchema: objectSchema({}, []),
      annotations: { ...READ_ONLY, untrustedContentHint: true },
      execute: async () => ({ status: 'ok', ...view(), pages: Object.keys(APP_PAGES) }),
    },
    {
      name: 'navigate',
      title: 'Go to a page',
      description: 'Show one of the app\'s pages: `home`, `exercises` (the catalog), `routines`, `new_routine` (the empty routine form) or `history` (past practice). To play something use open_exercise or start_routine instead. Where leaving would lose the user something unsaved, they are asked first.',
      inputSchema: z.toJSONSchema(pageInput, { io: 'input' }),
      annotations: MOVES,
      async execute(args, { signal }) {
        const parsed = pageInput.safeParse(args)
        if (!parsed.success) return { status: 'invalid', problems: [`page: one of ${Object.keys(APP_PAGES).join(', ')}`] }
        if (!(await mayLeave(signal))) return STAYED
        await go({ page: parsed.data.page })
        return { status: 'ok', page: parsed.data.page }
      },
    },
    {
      name: 'open_exercise',
      title: 'Open an exercise',
      description: 'Put one exercise on the stage, ready to play: its notation, tab and the player. It does not start playing; call player_play for that.',
      inputSchema: z.toJSONSchema(exerciseInput, { io: 'input' }),
      annotations: MOVES,
      async execute(args, { signal }) {
        const parsed = exerciseInput.safeParse(args)
        if (!parsed.success) return { status: 'invalid', problems: ['exerciseId: give the id of the exercise to open'] }
        const exercise = (await exercises()).find((candidate) => candidate.id === parsed.data.exerciseId)
        if (!exercise) return { status: 'not_found', message: 'No exercise has that id. List them with list_builtin_exercises and list_exercises.' }
        if (!(await mayLeave(signal))) return STAYED
        await go({ exerciseId: exercise.id })
        return { status: 'ok', exercise: { id: exercise.id, title: exercise.title } }
      },
    },
    {
      name: 'start_routine',
      title: 'Start a practice routine',
      description: "Start one of the user's practice routines, as its Start button does: its exercises come up one after another, the first one on the stage. It does not start playing; call player_play for that.",
      inputSchema: z.toJSONSchema(routineInput, { io: 'input' }),
      annotations: MOVES,
      async execute(args, { signal }) {
        const parsed = routineInput.safeParse(args)
        if (!parsed.success) return { status: 'invalid', problems: ['routineId: give the id of the routine to start'] }
        const listed = await routines()
        if (listed === null) return { status: 'error', message: 'The routines could not be read.' }
        const routine = listed.find((candidate) => candidate.id === parsed.data.routineId)
        if (!routine) return { status: 'not_found', message: 'The user has no routine with that id. List them with list_routines.' }
        const playable = routineExercises(routine, await exercises())
        if (playable.length === 0) return { status: 'empty', message: 'None of the exercises in this routine exist any more.' }
        if (!(await mayLeave(signal))) return STAYED
        await go({ session: sessionSearch(routinePlan(routine, playable)) })
        return { status: 'ok', routine: { id: routine.id, name: routine.name }, exerciseIds: playable.map((exercise) => exercise.id) }
      },
    },
  ]
}
