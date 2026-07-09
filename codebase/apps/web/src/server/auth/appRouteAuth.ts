export interface AppRouteAuthObject {
  userId: string | null
  redirectToSignIn: (options: { returnBackUrl: string }) => Response
}

export function isProtectedAppPath(pathname: string) {
  return pathname === '/app' || pathname.startsWith('/app/')
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
