import { clerkMiddleware } from '@clerk/astro/server'
import type { MiddlewareHandler } from 'astro'
import { env } from 'cloudflare:workers'
import {
  createAuthConfigurationUnavailableResponse,
  getAuthRouteMode,
  redirectSignedOutAppRequest,
} from './server/auth/appRouteAuth'
import {
  hasClerkRuntimeEnv,
  type ClerkRuntimeEnvSources,
} from './server/auth/clerkEnv'

const clerkAuthMiddleware = clerkMiddleware((auth, context, next) => {
  const redirect = redirectSignedOutAppRequest(auth(), context.url)

  if (redirect) {
    return redirect
  }

  return next()
})

export const onRequest: MiddlewareHandler = (context, next) => {
  const runtimeEnv = {
    cloudflareEnv: env,
    metaEnv: import.meta.env,
    processEnv: typeof process === 'undefined' ? undefined : process.env,
  } satisfies ClerkRuntimeEnvSources
  const routeMode = getAuthRouteMode(
    context.url.pathname,
    hasClerkRuntimeEnv(runtimeEnv),
  )

  if (routeMode === 'public') {
    return next()
  }

  if (routeMode === 'unconfiguredProtectedApp') {
    return createAuthConfigurationUnavailableResponse()
  }

  return clerkAuthMiddleware(context, next)
}
