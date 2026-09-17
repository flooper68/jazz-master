import { clerkMiddleware } from '@clerk/astro/server'
import type { MiddlewareHandler } from 'astro'
import { env } from 'cloudflare:workers'
import {
  createAuthConfigurationUnavailableResponse,
  getAuthRouteMode,
  readPlaywrightTestAuthUserId,
  redirectSignedOutAppRequest,
} from './server/auth/appRouteAuth'
import { MCP_PATH, TEST_AUTH_SEAM, unauthorizedResponse } from './server/mcp/auth'
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

type LocalsWithAuth = App.Locals & {
  auth?: () => { userId: string | null; [TEST_AUTH_SEAM]?: true }
}

export const onRequest: MiddlewareHandler = (context, next) => {
  if (context.url.pathname.startsWith('/_storybook/previews/')) {
    return renderStaticPreview(next)
  }

  const runtimeEnv = {
    cloudflareEnv: env,
    metaEnv: import.meta.env,
    processEnv: typeof process === 'undefined' ? undefined : process.env,
  } satisfies ClerkRuntimeEnvSources
  const playwrightUserId = readPlaywrightTestAuthUserId(
    context.request,
    runtimeEnv,
  )

  if (playwrightUserId) {
    const locals = context.locals as LocalsWithAuth
    locals.auth = () => ({
      userId: playwrightUserId,
      // Lets the MCP endpoint tell this dev-only stand-in from a real Clerk auth object.
      [TEST_AUTH_SEAM]: true,
    })
    return next()
  }

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

  if (isMcpSurface(context.url.pathname)) {
    return authenticateMcpRequest(context, next)
  }

  return clerkAuthMiddleware(context, next)
}

/** The MCP endpoint and the public discovery documents a client reads to recover from a refused token. */
function isMcpSurface(pathname: string): boolean {
  return pathname === MCP_PATH || pathname.startsWith('/.well-known/oauth-')
}

// Clerk throws on a bearer token it cannot even decode. For an MCP client that
// is an ordinary event — a stale or garbled token — and the answer it needs is
// the 401 that sends it back through sign-in, not a 500. Anything else Clerk
// throws (its keys unreachable, a misconfigured secret) is our fault, not the
// token's: telling the client to sign in again would loop it for ever.
async function authenticateMcpRequest(
  context: Parameters<MiddlewareHandler>[0],
  next: Parameters<MiddlewareHandler>[1],
): Promise<Response> {
  let reachedRoute = false
  try {
    const response = await clerkAuthMiddleware(context, () => {
      reachedRoute = true
      return next()
    })
    return response ?? next()
  } catch (error) {
    // A fault in the route itself stays a fault.
    if (reachedRoute) throw error
    if (!context.request.headers.has('authorization')) throw error
    // The discovery documents are public: a bad token must not stand between a client and the way out.
    if (context.url.pathname !== MCP_PATH) return next()
    if (isUndecodableTokenError(error)) return unauthorizedResponse(context.url.origin, 'invalid_token')
    console.error(JSON.stringify({ event: 'mcp_auth_fault', message: error instanceof Error ? error.message : String(error) }))
    return new Response(JSON.stringify({ error: 'temporarily_unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'retry-after': '30' },
    })
  }
}

/** Clerk's decoder failing on the token itself: not JSON, not base64, not a JWT. */
function isUndecodableTokenError(error: unknown): boolean {
  if (error instanceof SyntaxError) return true
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /token|jwt|base64|json|decod|malformed/i.test(text)
}

async function renderStaticPreview(next: () => Promise<Response>): Promise<Response> {
  // These are generated, inert UI fixtures. Astro integrations inject page
  // scripts (including Clerk) globally; exclude those from catalog documents.
  const response = await next()
  if (!response.headers.get('content-type')?.includes('text/html')) return response
  const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(html, { status: response.status, headers })
}
