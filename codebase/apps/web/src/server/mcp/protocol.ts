import { MCP_TOOLS, type McpToolContext } from './tools'

/**
 * The MCP server: JSON-RPC over plain HTTP POST, stateless, JSON responses.
 * It is the small request/response core of the Streamable HTTP transport —
 * initialize, ping, tools/list, tools/call — with no sessions and no streams,
 * because the Worker keeps no state between requests and the tools never need
 * to push. Written by hand rather than on the SDK: a handful of tools does not justify
 * its dependency tree in a Worker bundle. The SDK's own client runs against
 * this in the tests, which is what keeps it honest.
 */

/** Newest first. A client asking for one of these gets it; any other gets the newest. */
export const MCP_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'] as const

export const MCP_SERVER_INFO = { name: 'jazz-master', title: 'Count-in', version: '1.0.0' } as const

const INSTRUCTIONS =
  "Count-in is a music practice app, guitar first, in any style. These tools add exercises to the signed-in user's own library and manage their practice routines. To add an exercise: write it, check it with validate_exercise, then save it with create_exercise. Exercises are single-note tabs with rhythm; read create_exercise's description for the format. A practice routine is a named, ordered list of exercises the user plays straight through: find ids with list_builtin_exercises and list_exercises, then use create_routine; read its description for the format."

/** Requests above this are refused before they are parsed; the largest honest exercise is a fraction of it. */
const MOST_BODY_BYTES = 256 * 1024
/**
 * A batch is a convenience, not a bulk API: every tool call opens its own
 * database connection, so one POST must not be able to ask for thousands.
 */
const MOST_BATCH_MESSAGES = 20

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: unknown
}

type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: string | number | null; result: unknown }
  | { jsonrpc: '2.0'; id: string | number | null; error: { code: number; message: string } }

const PARSE_ERROR = -32700
const INVALID_REQUEST = -32600
const METHOD_NOT_FOUND = -32601
const INVALID_PARAMS = -32602
const INTERNAL_ERROR = -32603

function isRequest(value: unknown): value is JsonRpcRequest {
  if (typeof value !== 'object' || value === null) return false
  const message = value as Record<string, unknown>
  return message.jsonrpc === '2.0' && typeof message.method === 'string'
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function rpcError(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

async function respond(message: JsonRpcRequest, context: McpToolContext): Promise<JsonRpcResponse | null> {
  // A notification carries no id and gets no reply.
  if (message.id === undefined) return null
  const id = message.id
  const params = (typeof message.params === 'object' && message.params !== null ? message.params : {}) as Record<string, unknown>

  switch (message.method) {
    case 'initialize': {
      const requested = params.protocolVersion
      const protocolVersion = MCP_PROTOCOL_VERSIONS.find((version) => version === requested) ?? MCP_PROTOCOL_VERSIONS[0]
      return {
        jsonrpc: '2.0',
        id,
        result: { protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo: MCP_SERVER_INFO, instructions: INSTRUCTIONS },
      }
    }
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} }
    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })),
        },
      }
    case 'tools/call': {
      const tool = MCP_TOOLS.find((candidate) => candidate.name === params.name)
      if (!tool) return rpcError(id, INVALID_PARAMS, `Unknown tool: ${String(params.name)}`)
      try {
        return { jsonrpc: '2.0', id, result: await tool.call(params.arguments ?? {}, context) }
      } catch {
        // The tools report their own failures as results; anything thrown is ours, and its cause stays here.
        return rpcError(id, INTERNAL_ERROR, 'Internal error')
      }
    }
    default:
      return rpcError(id, METHOD_NOT_FOUND, `Method not found: ${message.method}`)
  }
}

/** Answer one MCP HTTP request for an already authenticated user. */
export async function handleMcpRequest(request: Request, context: McpToolContext): Promise<Response> {
  if (request.method !== 'POST') {
    // No server-to-client stream and no session to end: GET and DELETE have nothing to do here.
    return new Response(null, { status: 405, headers: { allow: 'POST' } })
  }
  // Refuse an oversized body by its declared length before reading it, and by its real size after.
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MOST_BODY_BYTES) return json(rpcError(null, INVALID_REQUEST, 'Request too large'), 413)
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MOST_BODY_BYTES) return json(rpcError(null, INVALID_REQUEST, 'Request too large'), 413)

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(rpcError(null, PARSE_ERROR, 'Parse error'), 400)
  }

  const messages: unknown[] = Array.isArray(body) ? body : [body]
  if (messages.length === 0) return json(rpcError(null, INVALID_REQUEST, 'Invalid request'), 400)
  if (messages.length > MOST_BATCH_MESSAGES) {
    return json(rpcError(null, INVALID_REQUEST, `A batch holds at most ${MOST_BATCH_MESSAGES} messages`), 400)
  }

  const responses: JsonRpcResponse[] = []
  for (const message of messages) {
    // Each element stands alone: junk, or a response from the client (it never gets a request from us), costs only itself.
    const response = isRequest(message) ? await respond(message, context) : rpcError(null, INVALID_REQUEST, 'Invalid request')
    if (response) responses.push(response)
  }
  if (responses.length === 0) return new Response(null, { status: 202 })
  if (!Array.isArray(body)) return json(responses[0], 'error' in responses[0] && responses[0].id === null ? 400 : 200)
  return json(responses)
}
