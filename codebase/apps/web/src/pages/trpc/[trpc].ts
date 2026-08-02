import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import {
  createClerkKeyPairClientFromEnv,
  type ClerkKeyPairClient,
} from '../../server/auth/clerkKeyPair'
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
// Built once per isolate, not per request: the client holds the short-lived
// key-pair result that keeps a public probe from turning into repeated Clerk
// traffic. Same env source order the Clerk middleware reads (`middleware.ts`) —
// the deployed Worker only exposes its secret through `cloudflare:workers`.
let clerkKeyPairClient: ClerkKeyPairClient | null | undefined

function getClerkKeyPairClient(): ClerkKeyPairClient | null {
  if (clerkKeyPairClient === undefined) {
    clerkKeyPairClient = createClerkKeyPairClientFromEnv({
      cloudflareEnv: env,
      metaEnv: import.meta.env,
      processEnv: typeof process === 'undefined' ? undefined : process.env,
    })
  }

  return clerkKeyPairClient
}

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
        clerkKeys: getClerkKeyPairClient(),
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
