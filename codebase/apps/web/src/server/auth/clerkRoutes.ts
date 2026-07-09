export const clerkAuthRoutes = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  appFallback: '/app',
} as const

export const clerkRedirectParam = 'redirect_url'

export function getAppReturnPath(url: URL) {
  return `${url.pathname}${url.search}`
}

export function createAppHostedSignInUrl(url: URL) {
  const signInUrl = new URL(clerkAuthRoutes.signIn, url)
  signInUrl.searchParams.set(clerkRedirectParam, getAppReturnPath(url))

  return signInUrl
}
