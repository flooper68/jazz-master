import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LIBRARY_TOOL_DESCRIPTORS, type AgentToolDescriptor } from '../agentTools/descriptors'
import { MCP_TOOLS } from '../server/mcp/tools'
import type { AppRouter } from '../server/trpc/router'
import { getTrpcTestRoutines, resetTrpcTestData, seedTrpcTestRoutines, seedTrpcTestRuns, trpcTestFetch } from '../test/trpcTestFetch'
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

  it('answers what to practise next, each slot with its tempo and its reason', async () => {
    const yesterday = new Date(Date.now() - 86_400_000)
    yesterday.setHours(10, 0, 0, 0)
    seedTrpcTestRuns([
      {
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
      },
    ])
    const { call } = setUp()
    const answer = (await call('get_next_session')) as { status: string; slots: { exerciseId: string; tempoBpm: number; reason: string }[] }
    expect(answer.status).toBe('ok')
    expect(answer.slots.length).toBeGreaterThan(1)
    // Yesterday's scale is due back, at its own tempo, and the answer says why.
    expect(answer.slots[0]).toEqual({
      exerciseId: 'scales-major-open-c',
      title: 'C major — open position',
      area: 'scales',
      tempoBpm: 60,
      targetTempoBpm: 60,
      reason: 'Due today · at its tempo, 60 BPM',
    })
    for (const slot of answer.slots) expect(slot.reason.length).toBeGreaterThan(0)
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

describe('goals and paths through the page’s own tools', () => {
  it('writes a path, reads it back with its stages, and keeps closed stages out of the plan', async () => {
    const { call } = setUp()
    const made = (await call('set_goal', {
      goal: {
        title: 'Play a blues in F',
        stages: [
          { title: 'The shapes', items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 90 }] },
          { title: 'The line', items: [{ exerciseId: 'lines-ii-v-i-f-line', targetTempoBpm: 120 }] },
        ],
      },
    })) as { status: string; goal: { id: string } }
    expect(made.status).toBe('ok')

    const listed = (await call('list_goals')) as {
      status: string
      goals: { id: string; title: string; openStages: number[] | null }[]
    }
    expect(listed.status).toBe('ok')
    expect(listed.goals).toHaveLength(1)
    // Nothing played yet, so only the first stage is open.
    expect(listed.goals[0].openStages).toEqual([0])

    // And the plan offers only what that stage holds.
    const session = (await call('get_next_session')) as unknown as { slots: { exerciseId: string }[] }
    const offered = session.slots.map((slot) => slot.exerciseId)
    expect(offered).toContain('scales-major-open-c')
    expect(offered).not.toContain('lines-ii-v-i-f-line')
  })

  it('judges an exercise against the tempo its path asks for', async () => {
    const { call } = setUp()
    await call('set_goal', {
      goal: { title: 'Fast', stages: [{ items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 200 }] }] },
    })
    const state = (await call('get_exercise_state')) as {
      status: string
      exercises: { exerciseId: string; targetTempoBpm: number }[]
    }
    expect(state.status).toBe('ok')
    // Written at 60; the path wants 200, and that is what it is judged against.
    expect(state.exercises.find((item) => item.exerciseId === 'scales-major-open-c')?.targetTempoBpm).toBe(200)
  })

  it('replaces a path without disturbing the goal it belongs to', async () => {
    const { call } = setUp()
    const made = (await call('set_goal', {
      goal: {
        title: 'Play a blues in F',
        weight: 3,
        stages: [{ items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 90 }] }],
      },
    })) as { status: string; goal: { id: string } }

    const changed = (await call('set_path', {
      goalId: made.goal.id,
      stages: [{ items: [{ exerciseId: 'lines-ii-v-i-f-line', targetTempoBpm: 130 }] }],
    })) as { status: string; goal: { title: string; weight: number; stages: { items: { exerciseId: string }[] }[] } }

    expect(changed.status).toBe('ok')
    expect(changed.goal.stages[0].items[0].exerciseId).toBe('lines-ii-v-i-f-line')
    // The rest of the goal is untouched.
    expect(changed.goal.title).toBe('Play a blues in F')
    expect(changed.goal.weight).toBe(3)
  })

  it('refuses a path naming an exercise that does not exist, and says which', async () => {
    const { call } = setUp()
    const refused = (await call('set_goal', {
      goal: { title: 'Nonsense', stages: [{ items: [{ exerciseId: 'no-such-thing', targetTempoBpm: 90 }] }] },
    })) as { status: string; problems: string[] }
    expect(refused.status).toBe('invalid')
    expect(refused.problems[0]).toContain('no-such-thing')
  })

  it('pins an exercise, and takes a muted one out of the practice', async () => {
    const { call } = setUp()
    expect(await call('set_priority', { exerciseId: 'scales-major-open-c', priority: 'pinned' })).toMatchObject({
      status: 'ok',
      priority: { exerciseId: 'scales-major-open-c', priority: 'pinned' },
    })

    // Muting takes it out of every session, so the user is asked first — and
    // the default seam answers yes.
    await call('set_priority', { exerciseId: 'lines-ii-v-i-f-line', priority: 'muted' })
    const session = (await call('get_next_session')) as unknown as { slots: { exerciseId: string }[] }
    expect(session.slots.map((slot) => slot.exerciseId)).not.toContain('lines-ii-v-i-f-line')
  })

  it('will not mute behind the user’s back', async () => {
    const { call, deps } = setUp({ confirm: vi.fn(async () => false) })
    expect(await call('set_priority', { exerciseId: 'scales-major-open-c', priority: 'muted' })).toMatchObject({
      status: 'refused',
    })
    expect(vi.mocked(deps.confirm).mock.lastCall?.[0].question).toContain('mute')
  })

  it('lists the runs a user has actually played, newest first and paged', async () => {
    const days = [2, 1, 0].map((daysAgo) => {
      const date = new Date(Date.now() - daysAgo * 86_400_000)
      date.setHours(10, 0, 0, 0)
      return date
    })
    seedTrpcTestRuns(
      days.map((date, index) => ({
        id: `1111111${index}-1111-4111-8111-111111111111`,
        exerciseId: 'scales-major-open-c',
        startedAt: date.toISOString(),
        durationSeconds: 120,
        tempoBpm: 60,
        passes: 4,
        completed: true,
        difficulty: 'good' as const,
        feel: null,
        sessionId: null,
      })),
    )
    const { call } = setUp()
    const listed = (await call('list_runs', { limit: 2 })) as unknown as { total: number; runs: { startedAt: string }[] }
    expect(listed.total).toBe(3)
    expect(listed.runs).toHaveLength(2)
    // Newest first.
    expect(new Date(listed.runs[0].startedAt).valueOf()).toBeGreaterThan(new Date(listed.runs[1].startedAt).valueOf())
  })
})
