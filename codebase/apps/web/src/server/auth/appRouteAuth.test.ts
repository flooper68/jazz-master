import { describe, expect, it } from 'vitest'
import {
  createAuthConfigurationUnavailableResponse,
  getAuthRouteMode,
  isProtectedAppPath,
  redirectSignedOutAppRequest,
  type AppRouteAuthObject,
} from './appRouteAuth'

function createAuthObject(userId: string | null) {
  const calls: unknown[] = []
  const authObject = {
    userId,
    redirectToSignIn(options) {
      calls.push(options)
      return new Response(null, {
        status: 307,
        headers: { location: '/sign-in' },
      })
    },
  } satisfies AppRouteAuthObject

  return { authObject, calls }
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
    const { authObject, calls } = createAuthObject(null)

    const response = redirectSignedOutAppRequest(
      authObject,
      new URL('http://localhost:4321/app/practice'),
    )

    expect(response?.status).toBe(307)
    expect(response?.headers.get('location')).toBe('/sign-in')
    expect(calls).toEqual([
      { returnBackUrl: 'http://localhost:4321/app/practice' },
    ])
  })

  it('allows signed-in app requests', () => {
    const { authObject, calls } = createAuthObject('user_123')

    expect(
      redirectSignedOutAppRequest(
        authObject,
        new URL('http://localhost:4321/app'),
      ),
    ).toBeNull()
    expect(calls).toEqual([])
  })

  it('allows public routes without auth', () => {
    const { authObject, calls } = createAuthObject(null)

    expect(
      redirectSignedOutAppRequest(
        authObject,
        new URL('http://localhost:4321/'),
      ),
    ).toBeNull()
    expect(calls).toEqual([])
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
})
