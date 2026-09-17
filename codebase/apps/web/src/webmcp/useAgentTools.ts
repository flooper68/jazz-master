import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTRPC, useTRPCClient } from '../app/trpc'
import { EXERCISES } from '../content'
import { agentConfirm } from './agentConfirm'
import { libraryPageTools } from './libraryTools'
import { registerPageTools } from './modelContext'
import { activePlayerState } from './playerTools'
import { APP_PAGES, uiPageTools } from './uiTools'

/**
 * Offer the app's tools to an agent in the user's browser for as long as the
 * app is mounted. Everything the tools touch is what the app already has: its
 * tRPC client, its query cache, its router.
 */
export function useAgentTools(): void {
  const client = useTRPCClient()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    // Read through the cache the pages share, but never trust it to be fresh: an agent acts on what it is told.
    const library = () => queryClient.fetchQuery({ ...trpc.exercises.list.queryOptions(), staleTime: 0 })
    const routines = () => queryClient.fetchQuery({ ...trpc.routines.list.queryOptions(), staleTime: 0 })
    return registerPageTools([
      ...libraryPageTools({
        client,
        refresh: (list) => queryClient.invalidateQueries({ queryKey: list === 'exercises' ? trpc.exercises.list.queryKey() : trpc.routines.list.queryKey() }),
        confirm: agentConfirm.ask,
      }),
      ...uiPageTools({
        location() {
          const { pathname, search } = router.state.location
          const base = router.basepath.replace(/\/$/, '')
          return { path: pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname, search: search as Record<string, unknown> }
        },
        async go(destination) {
          if ('page' in destination) await router.navigate({ to: APP_PAGES[destination.page] })
          else if ('exerciseId' in destination) await router.navigate({ to: '/exercises/$exerciseId', params: { exerciseId: destination.exerciseId } })
          else await router.navigate({ to: '/session', search: destination.session })
        },
        async exercises() {
          const listed = await library().catch(() => null)
          return listed?.status === 'ok' ? [...EXERCISES, ...listed.exercises] : EXERCISES
        },
        async routines() {
          const listed = await routines().catch(() => null)
          return listed?.status === 'ok' ? listed.routines : null
        },
        player: activePlayerState,
        confirm: agentConfirm.ask,
      }),
    ])
  }, [client, trpc, queryClient, router])
}
