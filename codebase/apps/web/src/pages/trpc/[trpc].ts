import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import {
  createConsoleStructuredLogger,
  createRequestLogMetadata,
  logTrpcRequest,
  statusFromTrpcError,
} from '../../server/observability/logger'
import {
  createAuthContextFromLocals,
  createContext,
} from '../../server/trpc/context'
import { appRouter } from '../../server/trpc/router'

// Catch-all tRPC endpoint (RES-002 rec 4): every /trpc/* request flows
// through tRPC's fetch adapter, which routes on the path after `endpoint`.
export const ALL: APIRoute = (opts) => {
  const logger = createConsoleStructuredLogger()
  const requestMetadata = createRequestLogMetadata(opts.request)
  const startedAt = Date.now()

  return fetchRequestHandler({
    endpoint: '/trpc',
    req: opts.request,
    router: appRouter,
    createContext: () =>
      createContext({
        auth: createAuthContextFromLocals(opts.locals),
        hyperdrive: env.HYPERDRIVE,
        logger,
        requestMetadata,
      }),
    responseMeta({ paths, type, errors, eagerGeneration }) {
      if (!eagerGeneration) {
        const firstError = errors[0]

        logTrpcRequest({
          logger,
          metadata: requestMetadata,
          paths: paths ?? [],
          type,
          outcome: firstError ? 'error' : 'ok',
          status: statusFromTrpcError(firstError),
          errorCode: firstError?.code,
          durationMs: Date.now() - startedAt,
        })
      }

      return {}
    },
  })
}
