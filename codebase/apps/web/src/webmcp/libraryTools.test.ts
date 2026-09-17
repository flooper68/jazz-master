import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LIBRARY_TOOL_DESCRIPTORS, type AgentToolDescriptor } from '../agentTools/descriptors'
import { MCP_TOOLS } from '../server/mcp/tools'
import type { AppRouter } from '../server/trpc/router'
import { getTrpcTestRoutines, resetTrpcTestData, seedTrpcTestRoutines, trpcTestFetch } from '../test/trpcTestFetch'
import { libraryPageTools, type LibraryToolDeps } from './libraryTools'

const exercise = {
  title: 'Fmaj7 arpeggio, first position',
  area: 'arpeggios',
  level: 1,
  tempoBpm: 70,
  duration: { kind: 'repetitions', count: 2 },
  key: 'F',
  notes: [
    { string: 4, fret: 3, beats: 1 },
    { string: 3, fret: 2, beats: 1 },
    { string: 2, fret: 1, beats: 1 },
    { string: 1, fret: 0, beats: 1 },
  ],
}
const warmUp = { name: 'Warm-up', items: [{ exerciseId: 'scales-major-open-c' }] }

function setUp(overrides: Partial<LibraryToolDeps> = {}) {
  const deps: LibraryToolDeps = {
    client: createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/trpc', fetch: trpcTestFetch })] }),
    refresh: vi.fn(async () => {}),
    confirm: vi.fn(async () => true),
    ...overrides,
  }
  const tools = libraryPageTools(deps)
  const call = (name: string, args: unknown = {}) => tools.find((tool) => tool.name === name)!.execute(args, {})
  return { deps, tools, call }
}

beforeEach(() => resetTrpcTestData())

describe('the library tools in the browser', () => {
  it('are the MCP server\'s tools, word for word', () => {
    const described = ({ name, title, description, inputSchema, annotations }: AgentToolDescriptor) => ({ name, title, description, inputSchema, annotations })
    expect(setUp().tools.map(described)).toEqual(MCP_TOOLS.map(described))
  })

  it('have names the platform accepts', () => {
    for (const { name, description } of LIBRARY_TOOL_DESCRIPTORS) {
      expect(name).toMatch(/^[A-Za-z0-9_.-]{1,128}$/)
      expect(description.length).toBeGreaterThan(0)
    }
  })

  it('check an exercise without a round trip, and add one to the library the app shows', async () => {
    const { call, deps } = setUp()
    expect(await call('validate_exercise', { exercise })).toEqual({ status: 'ok' })
    expect(await call('validate_exercise', { exercise: { ...exercise, notes: [] } })).toMatchObject({ status: 'invalid' })
    const created = await call('create_exercise', { exercise })
    expect(created).toMatchObject({ status: 'ok', exercise: { title: exercise.title } })
    expect(deps.refresh).toHaveBeenCalledWith('exercises')
    expect(await call('list_exercises')).toMatchObject({ status: 'ok', exercises: [{ title: exercise.title }] })
  })

  it('answer a bad exercise with its problems and leave the app\'s lists alone', async () => {
    const { call, deps } = setUp()
    expect(await call('create_exercise', { exercise: { title: 'No notes' } })).toMatchObject({ status: 'invalid' })
    expect(deps.refresh).not.toHaveBeenCalled()
  })

  it('list the built-in pack without tabs', async () => {
    const listed = await setUp().call('list_builtin_exercises')
    expect(listed.status).toBe('ok')
    expect((listed.exercises as Record<string, unknown>[])[0]).not.toHaveProperty('notes')
  })

  it('create a routine without asking, since nothing is lost', async () => {
    const { call, deps } = setUp()
    expect(await call('create_routine', { routine: warmUp })).toMatchObject({ status: 'ok', routine: { name: 'Warm-up' } })
    expect(deps.confirm).not.toHaveBeenCalled()
    expect(deps.refresh).toHaveBeenCalledWith('routines')
  })

  it('change and delete a routine only once the user allows it, naming the routine in the question', async () => {
    const [stored] = await seedTrpcTestRoutines([warmUp])
    const { call, deps } = setUp()
    expect(await call('update_routine', { routineId: stored.id, routine: { ...warmUp, name: 'Warm-up, longer' } })).toMatchObject({ status: 'ok', routine: { name: 'Warm-up, longer' } })
    expect(vi.mocked(deps.confirm).mock.lastCall?.[0].question).toContain('“Warm-up”')
    expect(await call('delete_routine', { routineId: stored.id })).toEqual({ status: 'ok', deleted: true })
    expect(vi.mocked(deps.confirm).mock.lastCall?.[0].question).toContain('“Warm-up, longer”')
    expect(await getTrpcTestRoutines()).toEqual([])
  })

  it('leave the routine as it was when the user refuses', async () => {
    const [stored] = await seedTrpcTestRoutines([warmUp])
    const { call, deps } = setUp({ confirm: vi.fn(async () => false) })
    expect(await call('update_routine', { routineId: stored.id, routine: { ...warmUp, name: 'Hijacked' } })).toMatchObject({ status: 'refused' })
    expect(await call('delete_routine', { routineId: stored.id })).toMatchObject({ status: 'refused' })
    expect(await getTrpcTestRoutines()).toMatchObject([{ name: 'Warm-up' }])
    expect(deps.refresh).not.toHaveBeenCalled()
  })

  it('do nothing when the routine became another while the user was deciding', async () => {
    const [stored] = await seedTrpcTestRoutines([warmUp])
    const { call, deps } = setUp()
    // The user says yes to deleting “Warm-up” — but in another tab it has meanwhile become their recital set.
    vi.mocked(deps.confirm).mockImplementationOnce(async () => {
      await deps.client.routines.update.mutate({ routineId: stored.id, routine: { ...warmUp, name: 'Recital set' } })
      return true
    })
    expect(await call('delete_routine', { routineId: stored.id })).toMatchObject({ status: 'changed' })
    expect(await getTrpcTestRoutines()).toMatchObject([{ name: 'Recital set' }])
  })

  it('show a long name, which an agent may have written, cut to a line', async () => {
    const [stored] = await seedTrpcTestRoutines([{ ...warmUp, name: `Warm-up ${'(safe to remove) '.repeat(4)}` }])
    const { call, deps } = setUp()
    await call('delete_routine', { routineId: stored.id })
    const { question } = vi.mocked(deps.confirm).mock.lastCall![0]
    expect(question).toMatch(/…”\?$/)
    expect(question.length).toBeLessThan(110)
  })

  it('do not trouble the user over a routine that is not there, or a call with no id', async () => {
    const { call, deps } = setUp()
    expect(await call('update_routine', { routineId: 'nope', routine: warmUp })).toEqual({ status: 'not_found' })
    expect(await call('delete_routine', { routineId: 'nope' })).toEqual({ status: 'ok', deleted: false })
    expect(await call('delete_routine', {})).toMatchObject({ status: 'invalid' })
    expect(await call('update_routine', null)).toMatchObject({ status: 'invalid' })
    expect(deps.confirm).not.toHaveBeenCalled()
  })

  it('tell arguments the server will not take, and a signed-out user, from a lost connection', async () => {
    const answering = (code: string, httpStatus: number) =>
      createTRPCClient<AppRouter>({
        links: [httpBatchLink({ url: '/trpc', fetch: async () => new Response(JSON.stringify([{ error: { message: code, code: -32600, data: { code, httpStatus } } }]), { status: httpStatus, headers: { 'content-type': 'application/json' } }) })],
      })
    expect(await setUp({ client: answering('BAD_REQUEST', 400) }).call('list_routines')).toMatchObject({ status: 'invalid' })
    expect(await setUp({ client: answering('UNAUTHORIZED', 401) }).call('list_routines')).toMatchObject({ status: 'error', message: expect.stringContaining('signed out') })
  })

  it('turn a failed request into an answer an agent can read', async () => {
    const offline = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/trpc', fetch: () => Promise.reject(new TypeError('Failed to fetch')) })] })
    expect(await setUp({ client: offline }).call('list_routines')).toMatchObject({ status: 'error' })
  })
})
