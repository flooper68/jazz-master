import { createAppHostedSignInUrl } from './clerkRoutes'
import type { ClerkRuntimeEnvSources } from './clerkEnv'

export interface AppRouteAuthObject {
  userId: string | null
}

export const playwrightTestAuthHeader = 'x-jazz-master-e2e-user'

export function isProtectedAppPath(pathname: string) {
  return pathname === '/app' || pathname.startsWith('/app/')
}

export type AuthRouteMode = 'clerk' | 'public' | 'unconfiguredProtectedApp'

export function getAuthRouteMode(
  pathname: string,
  clerkConfigured: boolean,
): AuthRouteMode {
  if (clerkConfigured) {
    return 'clerk'
  }

  if (isProtectedAppPath(pathname)) {
    return 'unconfiguredProtectedApp'
  }

  return 'public'
}

export function createAuthConfigurationUnavailableResponse() {
  return new Response('Authentication is not configured.', {
    status: 503,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}

export function redirectSignedOutAppRequest(
  authObject: AppRouteAuthObject,
  url: URL,
) {
  if (!isProtectedAppPath(url.pathname) || authObject.userId) {
    return null
  }

  return new Response(null, {
    status: 307,
    headers: {
      location: createAppHostedSignInUrl(url).toString(),
    },
  })
}

export function readPlaywrightTestAuthUserId(
  request: Request,
  sources: ClerkRuntimeEnvSources,
): string | null {
  if (!isPlaywrightTestAuthEnabled(sources)) return null

  const userId = request.headers.get(playwrightTestAuthHeader)?.trim()
  return userId && userId.length > 0 ? userId : null
}

function isPlaywrightTestAuthEnabled(sources: ClerkRuntimeEnvSources): boolean {
  if (isProductionRuntime(sources)) return false
  return readBooleanFlag(sources, 'PLAYWRIGHT_TEST_AUTH')
}

function isProductionRuntime(sources: ClerkRuntimeEnvSources): boolean {
  return readBooleanFlag(sources, 'PROD')
}

function readBooleanFlag(
  sources: ClerkRuntimeEnvSources,
  name: string,
): boolean {
  const value = readRuntimeValue(sources, name)
  return value === true || value === 'true' || value === '1'
}

function readRuntimeValue(sources: ClerkRuntimeEnvSources, name: string) {
  return (
    sources.cloudflareEnv?.[name] ??
    sources.processEnv?.[name] ??
    sources.metaEnv?.[name]
  )
}
