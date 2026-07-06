import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { AppRouter } from '../server/trpc/router'

// Type-only import of AppRouter keeps server code out of the client bundle.
// Components read procedures via useTRPC() and pass e.g.
// trpc.health.queryOptions() to plain @tanstack/react-query hooks.
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()
