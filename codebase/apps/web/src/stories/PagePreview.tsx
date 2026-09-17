import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import type { AppRouter } from '../server/trpc/router'
import { TRPCProvider } from '../app/trpc'
import { Layout } from '../components/Layout'
import ExercisesPage from '../app/pages/ExercisesPage'
import ExercisePage from '../app/pages/ExercisePage'
import NotFoundPage from '../app/pages/NotFoundPage'

export type Scenario = 'ready' | 'error'

/** In-memory transport: no HTTP fallback and no account/database access. */
function fixtureLink(scenario: Scenario): TRPCLink<AppRouter> {
  return () => ({ op }) => observable((observer) => {
    let data: unknown
    if (scenario === 'error') {
      data = { status: 'error', message: 'Demo service is unavailable. Please try again.' }
    } else {
      switch (op.path) {
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
    const root = createRootRoute({ component: Layout, notFoundComponent: NotFoundPage })
    const routes = [
      createRoute({ getParentRoute: () => root, path: '/', component: ExercisesPage }),
      createRoute({ getParentRoute: () => root, path: '/exercises/$exerciseId', component: ExercisePage }),
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
