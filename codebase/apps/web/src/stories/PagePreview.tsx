import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import type { AppRouter } from '../server/trpc/router'
import { TRPCProvider } from '../app/trpc'
import { ProfileProvider, useProfile } from '../app/ProfileProvider'
import { defaultPracticePreferences, isNotationDisplayMode, isScoreTolerancePreset } from '../appData/preferences'
import type { PracticeProfile } from '../appData/profile'
import type { PracticeSession } from '../appData/session'
import { Layout } from '../components/Layout'
import DashboardPage from '../app/pages/DashboardPage'
import PracticePage from '../app/pages/PracticePage'
import HistoryPage from '../app/pages/HistoryPage'
import ProfilePage from '../app/pages/ProfilePage'
import NotFoundPage from '../app/pages/NotFoundPage'
import { LESSONS } from '../content'
import { profile, sessions } from './fixtures'

export type Scenario = 'ready' | 'empty' | 'loading' | 'error'

/** In-memory transport: no HTTP fallback and no account/database access. */
function fixtureLink(scenario: Scenario): TRPCLink<AppRouter> {
  let currentProfile = structuredClone(profile)
  let currentSessions = structuredClone(scenario === 'empty' ? [] : sessions)
  const preferences = defaultPracticePreferences()
  return () => ({ op }) => observable((observer) => {
    if (scenario === 'loading' && ['planner.today', 'sessions.list'].includes(op.path)) return
    const input = op.input as Record<string, unknown> | undefined
    let data: unknown
    if (scenario === 'error' && op.path !== 'profile.get') {
      data = { status: 'error', message: 'Demo service is unavailable. Please try again.' }
    } else {
      switch (op.path) {
        case 'profile.get': data = { status: 'ok', profile: currentProfile }; break
        case 'profile.save':
          currentProfile = op.input as PracticeProfile
          data = { status: 'ok', profile: currentProfile }; break
        case 'sessions.list': data = { status: 'ok', sessions: currentSessions }; break
        case 'sessions.upsert': {
          const session = op.input as PracticeSession
          currentSessions = [...currentSessions.filter((item) => item.id !== session.id), session]
          data = { status: 'ok' }; break
        }
        case 'planner.today': {
          const items = scenario === 'empty' ? [] : LESSONS.slice(0, 2).map((item) => ({
            lessonId: item.id, lessonTitle: item.title, area: item.area,
            estimatedMinutes: item.estimatedMinutes, reason: 'Build confidence with a focused daily repetition.',
          }))
          data = { status: 'ok', profile: currentProfile, sessions: currentSessions,
            plan: { date: input?.date, items, totalMinutes: items.reduce((sum, item) => sum + item.estimatedMinutes, 0) } }
          break
        }
        case 'preferences.get': data = { status: 'ok', preferences }; break
        case 'preferences.setNotationDisplayMode':
          if (isNotationDisplayMode(input?.mode)) preferences.notationDisplayMode = input.mode
          data = { status: 'ok' }; break
        case 'preferences.setScoringTolerance':
          if (isScoreTolerancePreset(input?.tolerance)) preferences.scoringTolerance = input.tolerance
          data = { status: 'ok' }; break
        case 'preferences.setPlayAlongTempo':
          if (typeof input?.exerciseId === 'string' && typeof input.tempoBpm === 'number') {
            preferences.playAlongTempos[input.exerciseId] = input.tempoBpm
          }
          data = { status: 'ok' }; break
        default: throw new Error(`Missing Storybook fixture: ${op.path}`)
      }
    }
    observer.next({ result: { data } })
    observer.complete()
  })
}

function ProfileReady({ children }: { children: ReactNode }) {
  const { status } = useProfile()
  return status === 'ready' ? children : <p>Preparing sample profile…</p>
}

export function PagePreview({ path = '/', scenario = 'ready' }: { path?: string; scenario?: Scenario }) {
  const [environment] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
    const client = createTRPCClient<AppRouter>({ links: [fixtureLink(scenario)] })
    const root = createRootRoute({ component: Layout, notFoundComponent: NotFoundPage })
    const routes = [
      createRoute({ getParentRoute: () => root, path: '/', component: DashboardPage }),
      createRoute({ getParentRoute: () => root, path: '/practice', component: PracticePage }),
      createRoute({ getParentRoute: () => root, path: '/history', component: HistoryPage }),
      createRoute({ getParentRoute: () => root, path: '/profile', component: ProfilePage }),
      createRoute({ getParentRoute: () => root, path: '/not-found', component: NotFoundPage }),
    ]
    const router = createRouter({ routeTree: root.addChildren(routes), history: createMemoryHistory({ initialEntries: [path] }) })
    return { queryClient, client, router }
  })
  return <QueryClientProvider client={environment.queryClient}>
    <TRPCProvider trpcClient={environment.client} queryClient={environment.queryClient}>
      <ProfileProvider><ProfileReady><RouterProvider router={environment.router} /></ProfileReady></ProfileProvider>
    </TRPCProvider>
  </QueryClientProvider>
}
