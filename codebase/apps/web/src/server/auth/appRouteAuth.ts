export interface AppRouteAuthObject {
  userId: string | null
  redirectToSignIn: (options: { returnBackUrl: string }) => Response
}

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

  return authObject.redirectToSignIn({
    returnBackUrl: url.toString(),
  })
}
