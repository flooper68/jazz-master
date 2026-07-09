import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { useState, type ReactNode } from 'react'
import type { AppRouter } from '../server/trpc/router'
import { ProfileProvider } from './ProfileProvider'
import { TRPCProvider } from './trpc'

interface AppProvidersProps {
  children: ReactNode
  /** Test seam: jsdom has no network, so tests inject an in-process fetch
   * that serves requests through the real tRPC fetch adapter. */
  fetch?: typeof globalThis.fetch
}

// Exactly one QueryClient: TRPCProvider receives the same instance that backs
// QueryClientProvider, so tRPC and any direct React Query usage share a cache
// (RES-002 rec 5 — never two query caches).
export function AppProviders({ children, fetch }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: '/trpc', fetch })],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <ProfileProvider>{children}</ProfileProvider>
      </TRPCProvider>
    </QueryClientProvider>
  )
}
