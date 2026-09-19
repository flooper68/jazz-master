import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { libraryPageTools } from '../../webmcp/libraryTools'
import {
  TEST_CLERK_USER_ID,
  resetTrpcTestData,
  seedTrpcTestGoal,
  seedTrpcTestLibrary,
  seedTrpcTestRuns,
  setTrpcTestRunsRepositoryAvailable,
  trpcTestFetch,
  trpcTestStores,
} from '../../test/trpcTestFetch'
import type { AppRouter } from '../trpc/router'
import { MCP_TOOLS, type McpToolContext } from './tools'

/**
 * The tools as an MCP *client* gets them — the door a token-holding agent comes
 * through, as opposed to WebMCP's door inside the signed-in page.
 *
 * The plan these answer with used to be worked out from the runs alone: the
 * server call site left out the goals and priorities the browser's call site
 * passed, so a path set over MCP steered nothing and a muted exercise was still
 * offered (JM-11). These tests hold the server door to what the page does, and
 * the last one holds both doors to a single answer.
 */

/** The server's context over the same in-memory stores the tRPC harness serves. */
function context(): McpToolContext {
  return { clerkUserId: TEST_CLERK_USER_ID, ...trpcTestStores() }
}

/** Call a server tool and hand back the whole result, `isError` included. */
async function callRaw(name: string, args: unknown = {}) {
  const tool = MCP_TOOLS.find((candidate) => candidate.name === name)
  if (!tool) throw new Error(`no such tool: ${name}`)
  return tool.call(args, context())
}

/** Call a server tool and hand back its structured answer. */
async function call(name: string, args: unknown = {}) {
  return (await callRaw(name, args)).structuredContent
}

/** The same tool as the browser's agent would call it, over the same stores. */
function pageCall(name: string, args: unknown = {}) {
  const tools = libraryPageTools({
    client: createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/trpc', fetch: trpcTestFetch })] }),
    refresh: vi.fn(async () => {}),
    confirm: vi.fn(async () => true),
  })
  return tools.find((tool) => tool.name === name)!.execute(args, {})
}

type Slots = { status: string; slots: { exerciseId: string; tempoBpm: number; targetTempoBpm: number }[] }

/** A run yesterday, so the exercise has a history to be scheduled from. */
function ranYesterday(exerciseId: string, tempoBpm: number, nth = 1) {
  const yesterday = new Date(Date.now() - 86_400_000)
  yesterday.setHours(10, 0, 0, 0)
  return {
    // Runs are keyed by id, so each seeded run needs its own.
    id: `${String(nth).repeat(8)}-1111-4111-8111-111111111111`,
    exerciseId,
    startedAt: yesterday.toISOString(),
    durationSeconds: 120,
    tempoBpm,
    passes: 4,
    completed: true,
    difficulty: 'good' as const,
    feel: null,
    sessionId: null,
  }
}

beforeEach(() => resetTrpcTestData())

describe('what the MCP server offers to practise', () => {
  it('walks the path: the open stage is offered, the one behind it is not', async () => {
    await seedTrpcTestGoal({
      title: 'Play a blues in F',
      status: 'active',
      weight: 1,
      stages: [
        { title: 'The shapes', items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 90 }] },
        { title: 'The line', items: [{ exerciseId: 'lines-ii-v-i-f-line', targetTempoBpm: 120 }] },
      ],
    })

    const offered = ((await call('get_next_session')) as Slots).slots.map((slot) => slot.exerciseId)
    // Nothing is played yet, so only the first stage is open.
    expect(offered).toContain('scales-major-open-c')
    expect(offered).not.toContain('lines-ii-v-i-f-line')
  })

  it('judges a slot against the tempo its path asks for, not the one it is written at', async () => {
    await seedTrpcTestGoal({
      title: 'Fast',
      status: 'active',
      weight: 1,
      stages: [{ items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 200 }] }],
    })

    const slot = ((await call('get_next_session')) as Slots).slots.find(
      (candidate) => candidate.exerciseId === 'scales-major-open-c',
    )
    // The pack writes this one at 60; the path wants it at 200, and that is
    // what the answer must report as the target.
    expect(slot?.targetTempoBpm).toBe(200)
  })

  it('never offers an exercise the user muted', async () => {
    seedTrpcTestRuns([ranYesterday('scales-major-open-c', 60)])
    // Due today, so it would certainly be offered were it not muted.
    const before = ((await call('get_next_session')) as Slots).slots.map((slot) => slot.exerciseId)
    expect(before).toContain('scales-major-open-c')

    expect(await call('set_priority', { exerciseId: 'scales-major-open-c', priority: 'muted' })).toMatchObject({
      status: 'ok',
    })

    const after = ((await call('get_next_session')) as Slots).slots.map((slot) => slot.exerciseId)
    expect(after).not.toContain('scales-major-open-c')
  })

  it('says so when there is no run database, and says it as an error', async () => {
    setTrpcTestRunsRepositoryAvailable(false)
    const answer = await callRaw('get_next_session')
    expect(answer.isError).toBe(true)
    expect(answer.structuredContent).toEqual({ status: 'unconfigured' })
  })

  it('answers exactly what the browser\'s own tools answer', async () => {
    // Something of the user's own in the catalogue, and something muted, so the
    // two doors are pinned on more than the pack alone.
    const [mine] = await seedTrpcTestLibrary([
      {
        title: 'My own lick',
        area: 'lines',
        level: 1,
        tempoBpm: 88,
        duration: { kind: 'repetitions', count: 2 },
        notes: [{ string: 3, fret: 2, beats: 1 }, { string: 2, fret: 1, beats: 1 }],
      },
    ])
    seedTrpcTestRuns([ranYesterday('scales-major-open-c', 60), ranYesterday(mine.id, 88, 2)])
    await seedTrpcTestGoal({
      title: 'Play a blues in F',
      status: 'active',
      weight: 1,
      stages: [{ items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 120 }] }],
    })
    await call('set_priority', { exerciseId: 'technique-spider-1234', priority: 'muted' })

    // One user, one moment, two doors: the answers have to be the same object.
    // This is the guard the original defect got past — the two call sites had
    // drifted apart and nothing compared them.
    expect(await call('get_next_session')).toEqual(await pageCall('get_next_session'))
  })
})
