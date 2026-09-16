import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import type { AppRouter } from '../server/trpc/router'
import { TRPCProvider } from '../app/trpc'
import type { PracticeSession } from '../appData/session'
import { Layout } from '../components/Layout'
import LessonsPage from '../app/pages/LessonsPage'
import LessonPage from '../app/pages/LessonPage'
import NotFoundPage from '../app/pages/NotFoundPage'
import { sessions } from './fixtures'

export type Scenario = 'ready' | 'error'

/** In-memory transport: no HTTP fallback and no account/database access. */
function fixtureLink(scenario: Scenario): TRPCLink<AppRouter> {
  let currentSessions = structuredClone(sessions)
  return () => ({ op }) => observable((observer) => {
    let data: unknown
    if (scenario === 'error') {
      data = { status: 'error', message: 'Demo service is unavailable. Please try again.' }
    } else {
      switch (op.path) {
        case 'sessions.list': data = { status: 'ok', sessions: currentSessions }; break
        case 'sessions.upsert': {
          const session = op.input as PracticeSession
          currentSessions = [...currentSessions.filter((item) => item.id !== session.id), session]
          data = { status: 'ok', session }; break
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
    const root = createRootRoute({ component: Layout, notFoundComponent: NotFoundPage })
    const routes = [
      createRoute({ getParentRoute: () => root, path: '/', component: LessonsPage }),
      createRoute({ getParentRoute: () => root, path: '/lessons/$lessonId', component: LessonPage }),
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
