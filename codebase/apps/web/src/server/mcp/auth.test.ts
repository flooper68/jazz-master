import { describe, expect, it } from 'vitest'
import { authorizationServerUrl, mcpUserId, TEST_AUTH_SEAM, protectedResourceMetadata, tokenIsForThisResource, unauthorizedResponse } from './auth'

const origin = 'https://jazz.test'
const jwt = (payload: object) => `h.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.s`
const request = (token?: string) => new Request(`${origin}/mcp`, { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {} })
const locals = (authObject: object) => ({ auth: (options?: object) => ({ ...authObject, asked: options }) })

describe('MCP OAuth resource server', () => {
  it('points a refused client at the metadata that names Clerk', async () => {
    const response = unauthorizedResponse(origin)
    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toBe('Bearer resource_metadata="https://jazz.test/.well-known/oauth-protected-resource/mcp"')
    expect(unauthorizedResponse(origin, 'invalid_token').headers.get('www-authenticate')).toContain('error="invalid_token"')
    expect(protectedResourceMetadata(origin, 'https://clerk.example')).toMatchObject({
      resource: 'https://jazz.test/mcp',
      authorization_servers: ['https://clerk.example'],
      bearer_methods_supported: ['header'],
    })
  })

  it('finds the Clerk instance from the publishable key', () => {
    expect(authorizationServerUrl(`pk_test_${btoa('organic-ostrich-34.clerk.accounts.dev$')}`)).toBe('https://organic-ostrich-34.clerk.accounts.dev')
    expect(authorizationServerUrl(undefined)).toBeNull()
    expect(authorizationServerUrl('nonsense')).toBeNull()
  })

  it('takes the user from an OAuth token and from nothing else', () => {
    const token = jwt({ sub: 'user_123' })
    expect(mcpUserId(locals({ isAuthenticated: true, tokenType: 'oauth_token', userId: 'user_123' }), request(token), origin)).toBe('user_123')
    // A signed-in browser session is not an MCP credential.
    expect(mcpUserId(locals({ isAuthenticated: true, tokenType: 'session_token', userId: 'user_123' }), request(), origin)).toBeNull()
    expect(mcpUserId(locals({ isAuthenticated: false, tokenType: 'oauth_token', userId: null }), request(token), origin)).toBeNull()
    // An auth object with a user but no token type is nothing we know — unless it is the marked dev-only test seam.
    expect(mcpUserId(locals({ userId: 'user_123' }), request(), origin)).toBeNull()
    expect(mcpUserId(locals({ userId: 'user_123', tokenType: null }), request(), origin)).toBeNull()
    expect(mcpUserId(locals({ userId: 'user_e2e', [TEST_AUTH_SEAM]: true }), request(), origin)).toBe('user_e2e')
    expect(mcpUserId({}, request(token), origin)).toBeNull()
    expect(mcpUserId(null, request(token), origin)).toBeNull()
  })

  it('refuses a token that names another resource, and accepts one that names this or none', () => {
    expect(tokenIsForThisResource(request(jwt({ aud: 'https://jazz.test/mcp' })), origin)).toBe(true)
    expect(tokenIsForThisResource(request(jwt({ aud: ['https://other.test', 'https://jazz.test/mcp'] })), origin)).toBe(true)
    expect(tokenIsForThisResource(request(jwt({ sub: 'user_123' })), origin)).toBe(true)
    expect(tokenIsForThisResource(request('oat_opaque_token'), origin)).toBe(true)
    expect(tokenIsForThisResource(request(jwt({ aud: 'https://evil.test/mcp' })), origin)).toBe(false)
    expect(tokenIsForThisResource(request('a.%%%.c'), origin)).toBe(false)
    const authed = locals({ isAuthenticated: true, tokenType: 'oauth_token', userId: 'user_123' })
    expect(mcpUserId(authed, request(jwt({ aud: 'https://evil.test/mcp' })), origin)).toBeNull()
  })
})
