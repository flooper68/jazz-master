import type { ClerkRuntimeEnvSources } from './clerkEnv'
import { readClerkRuntimeKeys } from './clerkEnv'

// ISSUE-011: the publishable key is committed in wrangler.jsonc while the
// secret key is an out-of-band Worker secret, so the two can drift onto
// different Clerk instances. A secret key does not encode its instance, so the
// only way to compare them is to ask Clerk for the signing keys each one
// reaches and look for an overlap.
const CLERK_BACKEND_JWKS_URL = 'https://api.clerk.com/v1/jwks'

const publishableKeyPrefixes = ['pk_test_', 'pk_live_'] as const

interface Jwks {
  keys?: Array<{ kid?: unknown }>
}

/**
 * A Clerk publishable key is `pk_(test|live)_` followed by the base64-encoded
 * Frontend API host with a trailing `$`.
 */
export function decodeFrontendApiHost(publishableKey: string): string | null {
  const prefix = publishableKeyPrefixes.find((candidate) =>
    publishableKey.startsWith(candidate),
  )

  if (!prefix) return null

  let decoded: string

  try {
    decoded = atob(publishableKey.slice(prefix.length))
  } catch {
    return null
  }

  const host = decoded.endsWith('$') ? decoded.slice(0, -1) : decoded

  // Guard against a decoded value that is not a bare host — it would otherwise
  // be interpolated straight into a fetch URL.
  return /^[a-z0-9.-]+$/i.test(host) ? host : null
}

export function frontendJwksUrl(frontendApiHost: string): string {
  return `https://${frontendApiHost}/.well-known/jwks.json`
}

export function readSigningKeyIds(jwks: unknown): string[] {
  const keys = (jwks as Jwks | null)?.keys

  if (!Array.isArray(keys)) return []

  return keys
    .map((key) => key?.kid)
    .filter((kid): kid is string => typeof kid === 'string' && kid.length > 0)
}

/**
 * The keys match when the instance the publishable key points at has at least
 * one signing key in common with the instance the secret key authenticates to.
 */
export function compareSigningKeyIds(
  frontendKeyIds: readonly string[],
  backendKeyIds: readonly string[],
): 'ok' | 'mismatch' {
  const backend = new Set(backendKeyIds)

  return frontendKeyIds.some((kid) => backend.has(kid)) ? 'ok' : 'mismatch'
}

export interface ClerkKeyPairClient {
  check(): Promise<'ok' | 'mismatch'>
}

interface ClerkKeyPairClientOptions {
  publishableKey?: string
  secretKey?: string
  fetchImpl?: typeof fetch
  cacheTtlMs?: number
  now?: () => number
}

// `/trpc/clerkKeys` has to stay public — it must answer precisely when auth is
// broken — so every caller would otherwise make the Worker issue two outbound
// requests to Clerk. Hammering it could rate-limit the instance and break the
// auth this check exists to protect. Results are held briefly per isolate;
// failures are not cached, so a transient outage retries on the next call.
const defaultCacheTtlMs = 60_000

async function fetchJwks(
  fetchImpl: typeof fetch,
  url: string,
  init?: RequestInit,
): Promise<string[]> {
  const response = await fetchImpl(url, init)

  if (!response.ok) {
    throw new Error(`JWKS request failed with status ${response.status}`)
  }

  const keyIds = readSigningKeyIds(await response.json())

  if (keyIds.length === 0) {
    throw new Error('JWKS response contained no signing keys')
  }

  return keyIds
}

/**
 * Returns null when either key is absent — the caller reports that as
 * `unconfigured` rather than as a failed check, mirroring `dbSmoke`.
 */
export function createClerkKeyPairClient({
  publishableKey,
  secretKey,
  fetchImpl = fetch,
  cacheTtlMs = defaultCacheTtlMs,
  now = () => Date.now(),
}: ClerkKeyPairClientOptions = {}): ClerkKeyPairClient | null {
  if (!publishableKey || !secretKey) return null

  const frontendApiHost = decodeFrontendApiHost(publishableKey)

  if (!frontendApiHost) return null

  let cached: { result: 'ok' | 'mismatch'; at: number } | null = null

  return {
    async check() {
      if (cached && now() - cached.at < cacheTtlMs) {
        return cached.result
      }

      const [frontendKeyIds, backendKeyIds] = await Promise.all([
        fetchJwks(fetchImpl, frontendJwksUrl(frontendApiHost)),
        fetchJwks(fetchImpl, CLERK_BACKEND_JWKS_URL, {
          headers: { Authorization: `Bearer ${secretKey}` },
        }),
      ])

      const result = compareSigningKeyIds(frontendKeyIds, backendKeyIds)
      cached = { result, at: now() }

      return result
    },
  }
}

export function createClerkKeyPairClientFromEnv(
  sources: ClerkRuntimeEnvSources,
  fetchImpl?: typeof fetch,
): ClerkKeyPairClient | null {
  const { publishableKey, secretKey } = readClerkRuntimeKeys(sources)

  return createClerkKeyPairClient({ publishableKey, secretKey, fetchImpl })
}
