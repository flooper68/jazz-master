import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { describe, expect, it } from 'vitest'
import { createMemoryUserExerciseRepository } from '../../test/memoryUserExercises'
import type { RunRepository } from '../db/runs'
import { createMemoryGoalRepository } from '../../test/memoryGoals'
import { createMemoryRunRepository } from '../../test/memoryRuns'
import type { UserExerciseRepository } from '../db/userExercises'
import { handleMcpRequest, MCP_PROTOCOL_VERSIONS } from './protocol'

const line = {
  title: 'D Dorian — fifth position',
  area: 'scales',
  level: 2,
  tempoBpm: 80,
  duration: { kind: 'repetitions', count: 4 },
  key: 'C',
  notes: [
    { string: 5, fret: 5, beats: 1 },
    { string: 5, fret: 7, beats: 1 },
    { string: 5, fret: 8, beats: 1 },
    { string: 4, fret: 5, beats: 1 },
  ],
}

/** The official MCP client, talking to the handler as it would over HTTP. */
async function connect(
  clerkUserId: string,
  userExercises: UserExerciseRepository | null,
  runs: RunRepository | null = createMemoryRunRepository(),
  goals = createMemoryGoalRepository(),
) {
  const client = new Client({ name: 'test-client', version: '0.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL('https://jazz.test/mcp'), {
    fetch: (url, init) => handleMcpRequest(new Request(url, init), { clerkUserId, userExercises, runs, goals }),
  })
  await client.connect(transport)
  return client
}

function post(body: unknown, raw = false) {
  return handleMcpRequest(
    new Request('https://jazz.test/mcp', { method: 'POST', body: raw ? (body as string) : JSON.stringify(body) }),
    {
      clerkUserId: 'user_123',
      userExercises: createMemoryUserExerciseRepository(),
      runs: createMemoryRunRepository(),
      goals: createMemoryGoalRepository(),
    },
  )
}

describe('the MCP server, through the official client', () => {
  it('shakes hands and offers its tools with schemas a client can show', async () => {
    const client = await connect('user_123', createMemoryUserExerciseRepository())
    expect(client.getServerVersion()).toMatchObject({ name: 'jazz-master' })
    const { tools } = await client.listTools()
    expect(tools.map((tool) => tool.name)).toEqual([
      'get_next_session',
      'list_exercises',
      'validate_exercise',
      'create_exercise',
      'list_builtin_exercises',
      'list_goals',
      'set_goal',
      'set_path',
      'set_priority',
      'get_exercise_state',
      'list_runs',
    ])
    const create = tools.find((tool) => tool.name === 'create_exercise')!
    expect(create.inputSchema).toMatchObject({ type: 'object', required: ['exercise'] })
    expect(create.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false })
    expect(tools[0].annotations?.readOnlyHint).toBe(true)
  })

  it('creates an exercise in the caller’s library and lists it back, and nobody else’s', async () => {
    const repository = createMemoryUserExerciseRepository()
    const mine = await connect('user_123', repository)
    const created = await mine.callTool({ name: 'create_exercise', arguments: { exercise: line } })
    expect(created.isError).toBeFalsy()
    expect(created.structuredContent).toMatchObject({ status: 'ok', exercise: { title: line.title, id: expect.stringMatching(/^user-/) } })

    const listed = await mine.callTool({ name: 'list_exercises', arguments: {} })
    expect(listed.structuredContent).toMatchObject({ status: 'ok', exercises: [{ title: line.title }] })
    const theirs = await connect('user_456', repository)
    expect((await theirs.callTool({ name: 'list_exercises', arguments: {} })).structuredContent).toEqual({ status: 'ok', exercises: [] })
  })

  it('hands a model the problems to fix, as a tool error rather than a protocol error', async () => {
    const repository = createMemoryUserExerciseRepository()
    const client = await connect('user_123', repository)
    const broken = { ...line, notes: line.notes.slice(0, 3) }
    for (const name of ['validate_exercise', 'create_exercise']) {
      const result = await client.callTool({ name, arguments: { exercise: broken } })
      expect(result.isError).toBe(true)
      expect(result.structuredContent).toEqual({ status: 'invalid', problems: [expect.stringContaining('ends mid-bar')] })
    }
    expect(await repository.listExercises('user_123')).toEqual([])
    expect((await client.callTool({ name: 'validate_exercise', arguments: { exercise: line } })).structuredContent).toEqual({ status: 'ok' })
    expect(await repository.listExercises('user_123')).toEqual([])
  })

  it('says so when there is no database behind it', async () => {
    const client = await connect('user_123', null)
    const result = await client.callTool({ name: 'create_exercise', arguments: { exercise: line } })
    expect(result).toMatchObject({ isError: true, structuredContent: { status: 'unconfigured' } })
  })
})

describe('the MCP server, on the wire', () => {
  it('speaks the version the client asks for when it knows it, and its newest otherwise', async () => {
    const initialize = (protocolVersion: string) =>
      post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion, capabilities: {}, clientInfo: { name: 'x', version: '0' } } })
    expect((await (await initialize('2025-03-26')).json()).result.protocolVersion).toBe('2025-03-26')
    expect((await (await initialize('1999-01-01')).json()).result.protocolVersion).toBe(MCP_PROTOCOL_VERSIONS[0])
  })

  it('accepts notifications silently, and refuses streams and sessions it does not have', async () => {
    expect((await post({ jsonrpc: '2.0', method: 'notifications/initialized' })).status).toBe(202)
    const get = await handleMcpRequest(new Request('https://jazz.test/mcp'), { clerkUserId: 'user_123', userExercises: null, runs: null, goals: null })
    expect(get.status).toBe(405)
    expect(get.headers.get('allow')).toBe('POST')
  })

  it('answers each message of a batch on its own, and refuses a batch built to exhaust the database', async () => {
    const batch = await (await post([{ jsonrpc: '2.0', id: 1, method: 'ping' }, { nonsense: true }, { jsonrpc: '2.0', method: 'notifications/initialized' }])).json()
    expect(batch).toEqual([{ jsonrpc: '2.0', id: 1, result: {} }, { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } }])
    const flood = Array.from({ length: 21 }, (_, id) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'list_exercises', arguments: {} } }))
    const refused = await post(flood)
    expect(refused.status).toBe(400)
    expect(await refused.json()).toMatchObject({ error: { code: -32600, message: 'A batch holds at most 20 messages' } })
  })

  it('reports a fault inside a tool as an internal error, without its cause', async () => {
    const broken = { listExercises: () => Promise.reject(new Error('x')), createExercise: () => Promise.reject(new Error('x')), deleteExercise: () => Promise.reject(new Error('x')) }
    // The library turns repository failures into results; a throw past it is simulated by a context that is not an object.
    const response = await handleMcpRequest(
      new Request('https://jazz.test/mcp', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'list_exercises', arguments: {} } }) }),
      null as unknown as { clerkUserId: string; userExercises: typeof broken; runs: null; goals: null },
    )
    expect(await response.json()).toEqual({ jsonrpc: '2.0', id: 9, error: { code: -32603, message: 'Internal error' } })
  })

  it('refuses a body by its declared size before reading it', async () => {
    const response = await handleMcpRequest(
      new Request('https://jazz.test/mcp', { method: 'POST', headers: { 'content-length': '999999' }, body: '{}' }),
      { clerkUserId: 'user_123', userExercises: null, runs: null, goals: null },
    )
    expect(response.status).toBe(413)
  })

  it('answers junk with JSON-RPC errors, not exceptions', async () => {
    expect(await (await post('{not json', true)).json()).toMatchObject({ error: { code: -32700 } })
    expect(await (await post({ hello: 'world' })).json()).toMatchObject({ error: { code: -32600 } })
    expect(await (await post({ jsonrpc: '2.0', id: 7, method: 'resources/list' })).json()).toMatchObject({ id: 7, error: { code: -32601 } })
    expect(await (await post({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'drop_tables' } })).json()).toMatchObject({
      id: 8,
      error: { code: -32602 },
    })
    expect((await post('x'.repeat(300_000), true)).status).toBe(413)
  })
})

describe('exercise labels over MCP', () => {
  it('lists the built-in exercises with the labels they are filtered by, and offers the vocabularies in the schema', async () => {
    const client = await connect('user_123', createMemoryUserExerciseRepository())
    const builtin = await client.callTool({ name: 'list_builtin_exercises', arguments: {} })
    const listed = (builtin.structuredContent as { exercises: { id: string; styles?: string[]; contexts?: string[]; feel?: string }[] }).exercises
    expect(listed.find((exercise) => exercise.id === 'lines-ii-v-i-f-line')).toMatchObject({
      styles: ['jazz/bebop'],
      contexts: ['major-ii-V-I'],
      feel: 'swing-8',
    })

    // A model can only land on the fixed words if the tool shows them.
    const { tools } = await client.listTools()
    const schema = JSON.stringify(tools.find((tool) => tool.name === 'create_exercise')?.inputSchema)
    for (const word of ['etudes', 'jazz/bebop', 'rhythm-changes', 'rest-stroke', 'drop-2', 'shuffle']) expect(schema).toContain(word)
  })

  it('stores a labelled exercise, and refuses a label outside the vocabulary by name', async () => {
    const client = await connect('user_123', createMemoryUserExerciseRepository())
    const labelled = { ...line, styles: ['blues', 'rock'], techniques: ['alternate'], series: 'my-licks', tags: ['from lesson 3'] }
    const stored = await client.callTool({ name: 'create_exercise', arguments: { exercise: labelled } })
    expect((stored.structuredContent as { exercise: typeof labelled }).exercise).toMatchObject({ styles: ['blues', 'rock'], tags: ['from lesson 3'] })

    const refused = await client.callTool({ name: 'validate_exercise', arguments: { exercise: { ...line, styles: ['bagpipes'] } } })
    expect(refused.isError).toBe(true)
    expect(JSON.stringify(refused.structuredContent)).toContain('styles.0')
  })
})

describe('the next session over MCP', () => {
  it('answers with the slots the app shows, each at its tempo and with its reason', async () => {
    const runs = createMemoryRunRepository()
    const yesterday = new Date(Date.now() - 86_400_000)
    yesterday.setHours(10, 0, 0, 0)
    await runs.saveRun('user_123', {
      id: '11111111-1111-4111-8111-111111111111',
      exerciseId: 'scales-major-open-c',
      startedAt: yesterday.toISOString(),
      durationSeconds: 120,
      tempoBpm: 60,
      passes: 4,
      completed: true,
      difficulty: 'good',
      feel: null,
      sessionId: null,
    })
    const client = await connect('user_123', createMemoryUserExerciseRepository(), runs)

    const answer = await client.callTool({ name: 'get_next_session', arguments: {} })
    expect(answer.isError).toBeFalsy()
    const { slots } = answer.structuredContent as { slots: { exerciseId: string; tempoBpm: number; reason: string }[] }
    // The length is the budget's business; what matters here is that the tool
    // answers with the same plan the page would show.
    expect(slots.length).toBeGreaterThan(1)
    expect(slots[0]).toMatchObject({ exerciseId: 'scales-major-open-c', tempoBpm: 60, reason: 'Due today · at its tempo, 60 BPM' })
    for (const slot of slots) expect(slot.reason.length).toBeGreaterThan(0)
  })

  it('keeps one user\u2019s history from another', async () => {
    const runs = createMemoryRunRepository()
    await runs.saveRun('user_123', {
      id: '22222222-2222-4222-8222-222222222222',
      exerciseId: 'scales-major-open-c',
      startedAt: new Date().toISOString(),
      durationSeconds: 120,
      tempoBpm: 60,
      passes: 4,
      completed: true,
      difficulty: 'again',
      feel: null,
      sessionId: null,
    })
    const theirs = await connect('user_456', createMemoryUserExerciseRepository(), runs)
    const { slots } = (await theirs.callTool({ name: 'get_next_session', arguments: {} })).structuredContent as {
      slots: { reason: string }[]
    }
    // A fresh account has played nothing, so every slot is new.
    expect(slots.every((slot) => slot.reason === 'New \u2014 not played yet')).toBe(true)
  })

  it('says so when no run database is configured', async () => {
    const client = await connect('user_123', createMemoryUserExerciseRepository(), null)
    const answer = await client.callTool({ name: 'get_next_session', arguments: {} })
    expect(answer.isError).toBe(true)
    expect(answer.structuredContent).toEqual({ status: 'unconfigured' })
  })
})

describe('a server with no library database', () => {
  it('says unconfigured rather than pretending the library is empty', async () => {
    const client = await connect('user_123', null)
    const listed = await client.callTool({ name: 'list_exercises', arguments: {} })
    expect(listed.isError).toBe(true)
    expect(listed.structuredContent).toEqual({ status: 'unconfigured' })
  })
})
