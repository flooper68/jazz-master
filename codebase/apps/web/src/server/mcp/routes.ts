import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { readClerkRuntimeKeys } from '../auth/clerkEnv'
import { createGoalRepository } from '../db/goals'
import { createRoutineRepository } from '../db/routines'
import { createRunRepository } from '../db/runs'
import { createUserExerciseRepository } from '../db/userExercises'
import { authorizationServerUrl, MCP_CORS_HEADERS, mcpUserId, protectedResourceMetadata, unauthorizedResponse } from './auth'
import { handleMcpRequest } from './protocol'

/** The Astro endpoints of the MCP server; the pages under `src/pages` only re-export these. */

function clerkIssuer(): string | null {
  const { publishableKey } = readClerkRuntimeKeys({
    cloudflareEnv: env,
    metaEnv: import.meta.env,
    processEnv: typeof process === 'undefined' ? undefined : process.env,
  })
  return authorizationServerUrl(publishableKey)
}

function publicJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    // Only a good answer is worth caching; a passing fault must not outlive itself.
    headers: { 'content-type': 'application/json', 'cache-control': status === 200 ? 'public, max-age=300' : 'no-store', ...MCP_CORS_HEADERS },
  })
}

const preflight = () => new Response(null, { status: 204, headers: MCP_CORS_HEADERS })

export const mcpEndpoint: APIRoute = async ({ request, locals, url }) => {
  if (request.method === 'OPTIONS') return preflight()
  const clerkUserId = mcpUserId(locals, request, url.origin)
  if (!clerkUserId) return unauthorizedResponse(url.origin, request.headers.has('authorization') ? 'invalid_token' : undefined)

  const response = await handleMcpRequest(request, {
    clerkUserId,
    userExercises: createUserExerciseRepository({ hyperdrive: env.HYPERDRIVE }),
    routines: createRoutineRepository({ hyperdrive: env.HYPERDRIVE }),
    runs: createRunRepository({ hyperdrive: env.HYPERDRIVE }),
    goals: createGoalRepository({ hyperdrive: env.HYPERDRIVE }),
  })
  for (const [name, value] of Object.entries(MCP_CORS_HEADERS)) response.headers.set(name, value)
  return response
}

export const protectedResourceMetadataEndpoint: APIRoute = ({ request, url }) => {
  if (request.method === 'OPTIONS') return preflight()
  const issuer = clerkIssuer()
  if (!issuer) return publicJson({ error: 'Authentication is not configured.' }, 503)
  return publicJson(protectedResourceMetadata(url.origin, issuer))
}

/**
 * Older MCP clients look for the authorization server's metadata on the MCP
 * host itself instead of following the resource metadata. Clerk's is public;
 * this hands it on unchanged.
 */
export const authorizationServerMetadataEndpoint: APIRoute = async ({ request }) => {
  if (request.method === 'OPTIONS') return preflight()
  const issuer = clerkIssuer()
  if (!issuer) return publicJson({ error: 'Authentication is not configured.' }, 503)
  try {
    const upstream = await fetch(`${issuer}/.well-known/oauth-authorization-server`, { signal: AbortSignal.timeout(5000) })
    if (!upstream.ok || !upstream.headers.get('content-type')?.includes('json')) return publicJson({ error: 'Authorization server metadata is unavailable.' }, 502)
    return publicJson(await upstream.json())
  } catch {
    return publicJson({ error: 'Authorization server metadata is unavailable.' }, 502)
  }
}
