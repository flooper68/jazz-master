import { clerkMiddleware } from '@clerk/astro/server'
import type { MiddlewareHandler } from 'astro'
import { env } from 'cloudflare:workers'
import { redirectSignedOutAppRequest } from './server/auth/appRouteAuth'
import { assertClerkRuntimeEnv } from './server/auth/clerkEnv'

const clerkAuthMiddleware = clerkMiddleware((auth, context, next) => {
  const redirect = redirectSignedOutAppRequest(auth(), context.url)

  if (redirect) {
    return redirect
  }

  return next()
})

export const onRequest: MiddlewareHandler = (context, next) => {
  assertClerkRuntimeEnv({
    cloudflareEnv: env,
    metaEnv: import.meta.env,
    processEnv: typeof process === 'undefined' ? undefined : process.env,
  })

  return clerkAuthMiddleware(context, next)
}
