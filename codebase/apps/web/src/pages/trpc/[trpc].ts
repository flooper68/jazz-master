import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { APIRoute } from 'astro'
import { createContext } from '../../server/trpc/context'
import { appRouter } from '../../server/trpc/router'

// Catch-all tRPC endpoint (RES-002 rec 4): every /trpc/* request flows
// through tRPC's fetch adapter, which routes on the path after `endpoint`.
export const ALL: APIRoute = (opts) =>
  fetchRequestHandler({
    endpoint: '/trpc',
    req: opts.request,
    router: appRouter,
    createContext,
  })
