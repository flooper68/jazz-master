import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import type { AppRouter } from '../server/trpc/router'
import { TRPCProvider } from '../app/trpc'
import { RootLayout } from '../app/RootLayout'
import ExercisesPage from '../app/pages/ExercisesPage'
import HomePage from '../app/pages/HomePage'
import { EditRoutinePage, NewRoutinePage } from '../app/pages/RoutineEditorPage'
import RoutinesPage from '../app/pages/RoutinesPage'
import ExercisePage from '../app/pages/ExercisePage'
import HistoryPage from '../app/pages/HistoryPage'
import SessionPage from '../app/pages/SessionPage'
import NotFoundPage from '../app/pages/NotFoundPage'
import type { ExerciseRun } from '../appData/run'
import type { Routine, RoutineInput } from '../appData/routine'
import { routines, runs } from './fixtures'

export type Scenario = 'ready' | 'empty' | 'error'

/** In-memory transport: no HTTP fallback and no account/database access. */
function fixtureLink(scenario: Scenario): TRPCLink<AppRouter> {
  let currentRuns: ExerciseRun[] = scenario === 'empty' ? [] : structuredClone(runs)
  let currentRoutines: Routine[] = scenario === 'empty' ? [] : structuredClone(routines)
  return () => ({ op }) => observable((observer) => {
    let data: unknown
    if (scenario === 'error') {
      data = { status: 'error', message: 'Demo service is unavailable. Please try again.' }
    } else {
      switch (op.path) {
        case 'runs.list': data = { status: 'ok', runs: currentRuns }; break
        case 'runs.save': {
          const run = op.input as ExerciseRun
          currentRuns = [run, ...currentRuns.filter((item) => item.id !== run.id)]
          data = { status: 'ok', run }; break
        }
        // The previews show the pack; the user's own library is empty here.
        case 'exercises.list': data = { status: 'ok', exercises: [] }; break
        case 'routines.list': data = { status: 'ok', routines: currentRoutines }; break
        case 'routines.create': {
          const routine = { ...(op.input as { routine: RoutineInput }).routine, id: `story-routine-${currentRoutines.length + 1}` }
          currentRoutines = [...currentRoutines, routine]
          data = { status: 'ok', routine }; break
        }
        case 'routines.update': {
          const { routineId, routine } = op.input as { routineId: string; routine: RoutineInput }
          currentRoutines = currentRoutines.map((item) => (item.id === routineId ? { ...routine, id: routineId } : item))
          data = { status: 'ok', routine: { ...routine, id: routineId } }; break
        }
        case 'routines.delete': {
          const { routineId } = op.input as { routineId: string }
          currentRoutines = currentRoutines.filter((item) => item.id !== routineId)
          data = { status: 'ok', deleted: true }; break
        }
        case 'health': data = { status: 'ok', time: new Date().toISOString() }; break
        default: throw new Error(`Missing Storybook fixture: ${op.path}`)
      }
    }
    observer.next({ result: { data } })
    observer.complete()
  })
}

export function PagePreview({ path = '/', scenario = 'ready' }: { path?: string; scenario?: Scenario }) {
  const [environment] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
    const client = createTRPCClient<AppRouter>({ links: [fixtureLink(scenario)] })
    const root = createRootRoute({ component: RootLayout, notFoundComponent: NotFoundPage })
    const routes = [
      createRoute({ getParentRoute: () => root, path: '/', component: HomePage }),
      createRoute({ getParentRoute: () => root, path: '/exercises', component: ExercisesPage }),
      createRoute({ getParentRoute: () => root, path: '/exercises/$exerciseId', component: ExercisePage }),
      createRoute({ getParentRoute: () => root, path: '/history', component: HistoryPage }),
      createRoute({ getParentRoute: () => root, path: '/routines', component: RoutinesPage }),
      createRoute({ getParentRoute: () => root, path: '/routines/new', component: NewRoutinePage }),
      createRoute({ getParentRoute: () => root, path: '/routines/$routineId/edit', component: EditRoutinePage }),
      createRoute({ getParentRoute: () => root, path: '/session', component: SessionPage, validateSearch: (search: Record<string, unknown>): { x: string; r?: string } => ({ x: typeof search.x === 'string' ? search.x : '', ...(typeof search.r === 'string' ? { r: search.r } : {}) }) }),
      createRoute({ getParentRoute: () => root, path: '/not-found', component: NotFoundPage }),
    ]
    const router = createRouter({ routeTree: root.addChildren(routes), history: createMemoryHistory({ initialEntries: [path] }) })
    return { queryClient, client, router }
  })
  return <QueryClientProvider client={environment.queryClient}>
    <TRPCProvider trpcClient={environment.client} queryClient={environment.queryClient}>
      <RouterProvider router={environment.router} />
    </TRPCProvider>
  </QueryClientProvider>
}
