import { describe, expect, it } from 'vitest'
import {
  createAuthConfigurationUnavailableResponse,
  getAuthRouteMode,
  isProtectedAppPath,
  playwrightTestAuthHeader,
  readPlaywrightTestAuthUserId,
  redirectSignedOutAppRequest,
  type AppRouteAuthObject,
} from './appRouteAuth'
import { clerkRedirectParam } from './clerkRoutes'

function createAuthObject(userId: string | null) {
  const authObject = {
    userId,
  } satisfies AppRouteAuthObject

  return authObject
}

describe('app route auth', () => {
  it.each([
    ['/', false],
    ['/app', true],
    ['/app/practice', true],
    ['/application', false],
  ])('classifies %s as protected=%s', (pathname, expected) => {
    expect(isProtectedAppPath(pathname)).toBe(expected)
  })

  it('redirects signed-out app requests to Clerk sign-in', () => {
    const authObject = createAuthObject(null)

    const response = redirectSignedOutAppRequest(
      authObject,
      new URL('http://localhost:4321/app/practice'),
    )

    expect(response?.status).toBe(307)
    const location = new URL(response?.headers.get('location') ?? '')
    expect(location.origin).toBe('http://localhost:4321')
    expect(location.pathname).toBe('/sign-in')
    expect(location.searchParams.get(clerkRedirectParam)).toBe('/app/practice')
  })

  it('preserves signed-out app request query strings in the return path', () => {
    const authObject = createAuthObject(null)

    const response = redirectSignedOutAppRequest(
      authObject,
      new URL('https://jazz.example/app/practice?lesson=major-scale'),
    )

    const location = new URL(response?.headers.get('location') ?? '')
    expect(location.pathname).toBe('/sign-in')
    expect(location.searchParams.get(clerkRedirectParam)).toBe(
      '/app/practice?lesson=major-scale',
    )
  })

  it('allows signed-in app requests', () => {
    const authObject = createAuthObject('user_123')

    expect(
      redirectSignedOutAppRequest(
        authObject,
        new URL('http://localhost:4321/app'),
      ),
    ).toBeNull()
  })

  it('allows public routes without auth', () => {
    const authObject = createAuthObject(null)

    expect(
      redirectSignedOutAppRequest(
        authObject,
        new URL('http://localhost:4321/'),
      ),
    ).toBeNull()
  })

  it.each([
    ['/', false, 'public'],
    ['/trpc/health', false, 'public'],
    ['/trpc/dbSmoke', false, 'public'],
    ['/trpc/users.ensure', false, 'public'],
    ['/app', false, 'unconfiguredProtectedApp'],
    ['/app/practice', false, 'unconfiguredProtectedApp'],
    ['/', true, 'clerk'],
    ['/trpc/users.ensure', true, 'clerk'],
    ['/app/practice', true, 'clerk'],
  ] as const)(
    'routes %s with configured=%s as %s',
    (pathname, clerkConfigured, expected) => {
      expect(getAuthRouteMode(pathname, clerkConfigured)).toBe(expected)
    },
  )

  it('returns a controlled response when protected app auth is unavailable', async () => {
    const response = createAuthConfigurationUnavailableResponse()

    expect(response.status).toBe(503)
    expect(response.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8',
    )
    await expect(response.text()).resolves.toBe(
      'Authentication is not configured.',
    )
  })

  it('reads Playwright test auth only when explicitly enabled outside production', () => {
    const request = new Request('http://localhost:4321/app', {
      headers: { [playwrightTestAuthHeader]: ' user_e2e ' },
    })

    expect(
      readPlaywrightTestAuthUserId(request, {
        processEnv: { PLAYWRIGHT_TEST_AUTH: '1' },
        metaEnv: { PROD: false },
      }),
    ).toBe('user_e2e')
  })

  it('ignores Playwright test auth without the test flag', () => {
    const request = new Request('http://localhost:4321/app', {
      headers: { [playwrightTestAuthHeader]: 'user_e2e' },
    })

    expect(
      readPlaywrightTestAuthUserId(request, {
        processEnv: {},
        metaEnv: { PROD: false },
      }),
    ).toBeNull()
  })

  it('disables Playwright test auth in production', () => {
    const request = new Request('http://localhost:4321/app', {
      headers: { [playwrightTestAuthHeader]: 'user_e2e' },
    })

    expect(
      readPlaywrightTestAuthUserId(request, {
        processEnv: {
          PLAYWRIGHT_TEST_AUTH: '1',
        },
        metaEnv: { PROD: true },
      }),
    ).toBeNull()
  })
})
