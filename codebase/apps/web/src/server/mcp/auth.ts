import { decodeFrontendApiHost } from '../auth/clerkKeyPair'

/**
 * The OAuth side of the MCP server. Count-in is the *resource server*:
 * Clerk is the authorization server that signs users in and issues tokens;
 * this module says where Clerk is (RFC 9728 metadata), challenges a request
 * that has no token, and turns a verified token into a user. The token
 * itself is verified by Clerk's middleware — nothing here touches a secret.
 */

export const MCP_PATH = '/mcp'
/** What an MCP client needs leave to see: who the user is. The tools need nothing more than the user id. */
export const MCP_SCOPES = ['profile', 'email'] as const

/** The canonical URL of the MCP server, which is also the `resource` a token is minted for. */
export function mcpResourceUrl(origin: string): string {
  return `${origin}${MCP_PATH}`
}

export function protectedResourceMetadataUrl(origin: string): string {
  return `${origin}/.well-known/oauth-protected-resource${MCP_PATH}`
}

/** The Clerk instance that issues tokens, from the publishable key; null when the key is absent or malformed. */
export function authorizationServerUrl(publishableKey: string | undefined): string | null {
  const host = publishableKey ? decodeFrontendApiHost(publishableKey) : null
  return host ? `https://${host}` : null
}

/** RFC 9728: where a client that was just refused should go to get a token. */
export function protectedResourceMetadata(origin: string, authorizationServer: string) {
  return {
    resource: mcpResourceUrl(origin),
    authorization_servers: [authorizationServer],
    scopes_supported: [...MCP_SCOPES],
    bearer_methods_supported: ['header'],
    resource_name: 'Count-in',
  }
}

/** Any origin may read these: they are public, and the MCP endpoint takes a bearer token, never a cookie. */
export const MCP_CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id',
  'access-control-expose-headers': 'www-authenticate',
  'access-control-max-age': '86400',
} as const

/** 401 with the pointer an MCP client follows to discover Clerk and start the OAuth flow. */
export function unauthorizedResponse(origin: string, error?: 'invalid_token'): Response {
  const challenge = [`Bearer resource_metadata="${protectedResourceMetadataUrl(origin)}"`, ...(error ? [`error="${error}"`] : [])].join(', ')
  return new Response(JSON.stringify({ error: error ?? 'unauthorized', message: 'Sign in with Count-in to use this MCP server.' }), {
    status: 401,
    headers: { 'content-type': 'application/json', 'www-authenticate': challenge, ...MCP_CORS_HEADERS },
  })
}

/** The middleware marks the auth object it installs for the dev-only test-auth header, so nothing else can pass for it. */
export const TEST_AUTH_SEAM = 'jazzMasterTestAuth'

type OAuthAuthObject = { isAuthenticated?: boolean; tokenType?: string | null; userId?: string | null }
type LocalsWithOAuth = { auth?: (options?: { acceptsToken: 'oauth_token' }) => OAuthAuthObject }

/**
 * The user an MCP request acts for, or null. Only an OAuth access token
 * counts: a browser's session cookie is deliberately not accepted here, so a
 * page the user happens to have open can never drive their library.
 */
export function mcpUserId(locals: unknown, request: Request, origin: string): string | null {
  const auth = (locals as LocalsWithOAuth | null)?.auth
  if (typeof auth !== 'function') return null
  const authObject = auth({ acceptsToken: 'oauth_token' })
  if (!authObject?.userId) return null
  // Clerk answers a session, an API key or a bad token with no user id at all; this is the belt to that brace.
  // The one object without a token type is the test-auth seam's, which the middleware only installs outside production.
  if (authObject.tokenType !== 'oauth_token' && !(TEST_AUTH_SEAM in authObject)) return null
  return tokenIsForThisResource(request, origin) ? authObject.userId : null
}

/**
 * A token minted for another resource is not ours to accept, even though
 * Clerk signed it. JWT access tokens carry `aud` when the client named a
 * resource (RFC 8707); one with no `aud`, or an opaque token, passes — Clerk
 * has already verified it, and there is nothing further to compare.
 */
export function tokenIsForThisResource(request: Request, origin: string): boolean {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const parts = token.split('.')
  if (parts.length !== 3) return true
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { aud?: string | string[] }
    if (payload.aud === undefined) return true
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    const ours = [mcpResourceUrl(origin), `${mcpResourceUrl(origin)}/`, origin, `${origin}/`]
    return audiences.some((audience) => ours.includes(audience))
  } catch {
    return false
  }
}
