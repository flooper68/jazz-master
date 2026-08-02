import { describe, expect, it, vi } from 'vitest'
import {
  compareSigningKeyIds,
  createClerkKeyPairClient,
  createClerkKeyPairClientFromEnv,
  decodeFrontendApiHost,
  frontendJwksUrl,
  readSigningKeyIds,
} from './clerkKeyPair'

// The two instances from ISSUE-011: the committed publishable key moved to
// `organic-ostrich-34` while the Worker secret stayed on `popular-mouse-86`.
const organicOstrichKey =
  'pk_test_b3JnYW5pYy1vc3RyaWNoLTM0LmNsZXJrLmFjY291bnRzLmRldiQ'
const organicOstrichKid = 'ins_3GIWHzXQ58bmkmuI1GWnysDda0B'
const popularMouseKid = 'ins_3765hAlKxkijpAkQ0mVrm8LHrss'

function jwksResponse(kids: string[]) {
  return new Response(JSON.stringify({ keys: kids.map((kid) => ({ kid })) }), {
    status: 200,
  })
}

describe('decodeFrontendApiHost', () => {
  it('decodes the Frontend API host from a publishable key', () => {
    expect(decodeFrontendApiHost(organicOstrichKey)).toBe(
      'organic-ostrich-34.clerk.accounts.dev',
    )
  })

  it('decodes live keys as well as test keys', () => {
    const liveKey = `pk_live_${btoa('clerk.jazz-master.example$')}`

    expect(decodeFrontendApiHost(liveKey)).toBe('clerk.jazz-master.example')
  })

  it('returns null for a key without a recognised prefix', () => {
    expect(decodeFrontendApiHost('sk_test_notapublishablekey')).toBeNull()
  })

  it('returns null when the encoded payload is not a bare host', () => {
    expect(decodeFrontendApiHost(`pk_test_${btoa('https://evil.example/x$')}`)).toBeNull()
  })

  it('returns null for undecodable base64', () => {
    expect(decodeFrontendApiHost('pk_test_!!!not-base64!!!')).toBeNull()
  })
})

describe('frontendJwksUrl', () => {
  it('builds the well-known JWKS URL for a Frontend API host', () => {
    expect(frontendJwksUrl('organic-ostrich-34.clerk.accounts.dev')).toBe(
      'https://organic-ostrich-34.clerk.accounts.dev/.well-known/jwks.json',
    )
  })
})

describe('readSigningKeyIds', () => {
  it('reads the kid of every key', () => {
    expect(
      readSigningKeyIds({ keys: [{ kid: 'a' }, { kid: 'b' }] }),
    ).toEqual(['a', 'b'])
  })

  it('ignores entries without a usable kid', () => {
    expect(readSigningKeyIds({ keys: [{ kid: '' }, { kid: 3 }, {}] })).toEqual([])
  })

  it('returns an empty list for a malformed payload', () => {
    expect(readSigningKeyIds(null)).toEqual([])
    expect(readSigningKeyIds({})).toEqual([])
  })
})

describe('compareSigningKeyIds', () => {
  it('matches when the instances share a signing key', () => {
    expect(
      compareSigningKeyIds([organicOstrichKid], [organicOstrichKid]),
    ).toBe('ok')
  })

  it('reports a mismatch for the ISSUE-011 key pair', () => {
    expect(compareSigningKeyIds([organicOstrichKid], [popularMouseKid])).toBe(
      'mismatch',
    )
  })

  it('reports a mismatch when either side has no keys', () => {
    expect(compareSigningKeyIds([], [organicOstrichKid])).toBe('mismatch')
    expect(compareSigningKeyIds([organicOstrichKid], [])).toBe('mismatch')
  })
})

describe('createClerkKeyPairClient', () => {
  it('is unavailable when either key is missing', () => {
    expect(
      createClerkKeyPairClient({ publishableKey: organicOstrichKey }),
    ).toBeNull()
    expect(createClerkKeyPairClient({ secretKey: 'sk_test_x' })).toBeNull()
  })

  it('is unavailable when the publishable key cannot be decoded', () => {
    expect(
      createClerkKeyPairClient({
        publishableKey: 'pk_test_!!!',
        secretKey: 'sk_test_x',
      }),
    ).toBeNull()
  })

  it('reports ok when both instances share a signing key', async () => {
    const fetchImpl = vi.fn(async () => jwksResponse([organicOstrichKid]))

    const client = createClerkKeyPairClient({
      publishableKey: organicOstrichKey,
      secretKey: 'sk_test_x',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(client?.check()).resolves.toBe('ok')
  })

  it('reports a mismatch when the secret key reaches a different instance', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.startsWith('https://organic-ostrich-34')
        ? jwksResponse([organicOstrichKid])
        : jwksResponse([popularMouseKid]),
    )

    const client = createClerkKeyPairClient({
      publishableKey: organicOstrichKey,
      secretKey: 'sk_test_x',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(client?.check()).resolves.toBe('mismatch')
  })

  it('sends the secret key only to the Clerk Backend API', async () => {
    const calls: Array<{ url: string; authorization: string | null }> = []
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        authorization:
          (init?.headers as Record<string, string> | undefined)?.[
            'Authorization'
          ] ?? null,
      })
      return jwksResponse([organicOstrichKid])
    })

    const client = createClerkKeyPairClient({
      publishableKey: organicOstrichKey,
      secretKey: 'sk_test_secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await client?.check()

    const frontend = calls.find((call) => call.url.includes('well-known'))
    const backend = calls.find((call) => call.url.includes('api.clerk.com'))

    expect(frontend?.authorization).toBeNull()
    expect(backend?.authorization).toBe('Bearer sk_test_secret')
  })

  it('reuses a result within the cache window and refetches after it', async () => {
    const fetchImpl = vi.fn(async () => jwksResponse([organicOstrichKid]))
    let clock = 1_000

    const client = createClerkKeyPairClient({
      publishableKey: organicOstrichKey,
      secretKey: 'sk_test_x',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      cacheTtlMs: 60_000,
      now: () => clock,
    })

    await client?.check()
    await client?.check()
    expect(fetchImpl).toHaveBeenCalledTimes(2) // one pair of JWKS requests

    clock += 60_001
    await client?.check()
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('does not cache failures, so a transient outage retries', async () => {
    let failing = true
    const fetchImpl = vi.fn(async () =>
      failing
        ? new Response('nope', { status: 503 })
        : jwksResponse([organicOstrichKid]),
    )

    const client = createClerkKeyPairClient({
      publishableKey: organicOstrichKey,
      secretKey: 'sk_test_x',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => 1_000,
    })

    await expect(client?.check()).rejects.toThrow('status 503')

    failing = false
    await expect(client?.check()).resolves.toBe('ok')
  })

  it('throws when a JWKS endpoint fails', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 401 }))

    const client = createClerkKeyPairClient({
      publishableKey: organicOstrichKey,
      secretKey: 'sk_test_x',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(client?.check()).rejects.toThrow('status 401')
  })

  it('throws when a JWKS endpoint returns no signing keys', async () => {
    const fetchImpl = vi.fn(async () => jwksResponse([]))

    const client = createClerkKeyPairClient({
      publishableKey: organicOstrichKey,
      secretKey: 'sk_test_x',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(client?.check()).rejects.toThrow('no signing keys')
  })
})

describe('createClerkKeyPairClientFromEnv', () => {
  it('reads both keys from the runtime env sources', async () => {
    const fetchImpl = vi.fn(async () => jwksResponse([organicOstrichKid]))

    const client = createClerkKeyPairClientFromEnv(
      {
        cloudflareEnv: {
          PUBLIC_CLERK_PUBLISHABLE_KEY: organicOstrichKey,
          CLERK_SECRET_KEY: 'sk_test_x',
        },
      },
      fetchImpl as unknown as typeof fetch,
    )

    await expect(client?.check()).resolves.toBe('ok')
  })

  it('is unavailable when the runtime env has no Clerk keys', () => {
    expect(createClerkKeyPairClientFromEnv({ cloudflareEnv: {} })).toBeNull()
  })
})
