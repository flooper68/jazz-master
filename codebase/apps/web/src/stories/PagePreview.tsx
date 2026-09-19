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
import ExercisePage from '../app/pages/ExercisePage'
import HistoryPage from '../app/pages/HistoryPage'
import SessionPage from '../app/pages/SessionPage'
import NotFoundPage from '../app/pages/NotFoundPage'
import type { ExerciseRun } from '../appData/run'
import { runs } from './fixtures'

export type Scenario = 'ready' | 'empty' | 'error'

/** In-memory transport: no HTTP fallback and no account/database access. */
function fixtureLink(scenario: Scenario): TRPCLink<AppRouter> {
  let currentRuns: ExerciseRun[] = scenario === 'empty' ? [] : structuredClone(runs)
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
      createRoute({ getParentRoute: () => root, path: '/session', component: SessionPage, validateSearch: (search: Record<string, unknown>): { x: string; m?: number } => ({ x: typeof search.x === 'string' ? search.x : '', ...(Number.isInteger(Number(search.m)) ? { m: Number(search.m) } : {}) }) }),
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
