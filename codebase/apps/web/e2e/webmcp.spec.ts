import { expect, test, type Page } from './fixtures'

/**
 * WebMCP: an AI agent in the user's own browser works the app through the
 * tools the page registers. A browser without the platform API gets a
 * stand-in of the same shape from the dev server, so this passes either way:
 * it makes the calls an agent's side makes (the ones Playwright's own WebMCP
 * support makes) — find the tool in getTools(), hand it to executeTool() with
 * its input as JSON text.
 */

interface AgentSide {
  getTools(): Promise<{ name: string }[]>
  executeTool(tool: { name: string }, inputJson: string): Promise<string>
}

async function toolNames(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const modelContext = (document as unknown as { modelContext?: AgentSide }).modelContext
    return modelContext ? (await modelContext.getTools()).map((tool) => tool.name) : []
  })
}

function callTool(page: Page, name: string, args: unknown = {}): Promise<Record<string, unknown>> {
  return page.evaluate(
    async ({ name, args }) => {
      const modelContext = (document as unknown as { modelContext: AgentSide }).modelContext
      const tool = (await modelContext.getTools()).find((candidate) => candidate.name === name)
      if (!tool) throw new Error(`The page offers no tool named ${name}`)
      return JSON.parse(await modelContext.executeTool(tool, JSON.stringify(args))) as Record<string, unknown>
    },
    { name, args },
  )
}

test('an agent in the browser starts an exercise, plays it, and mutes one with the user\'s leave', async ({ page }) => {
  await page.goto('/app/exercises')
  await expect(page.getByRole('heading', { level: 1, name: 'Exercises' })).toBeVisible()
  await expect.poll(() => toolNames(page)).toContain('start_exercise')
  expect(await toolNames(page)).not.toContain('player_play')

  // Started by the agent: the session comes up, and with it the player's tools.
  expect((await callTool(page, 'start_exercise', { exerciseId: 'scales-major-open-c' })).status).toBe('ok')
  await expect(page).toHaveURL(/\/app\/session\?/)
  await expect(page.getByRole('button', { name: /^Play .+ — / })).toBeVisible()
  await expect.poll(() => toolNames(page)).toContain('player_play')

  expect((await callTool(page, 'player_set_tempo', { bpm: 96 })).status).toBe('ok')
  const played = await callTool(page, 'player_play')
  // A browser may hold the sound until the user's first click; the tool says which it was.
  expect(['ok', 'waiting_for_user']).toContain(played.status)
  await expect(page.getByRole('button', { name: /^Pause/ })).toBeVisible()
  expect(await callTool(page, 'player_stop')).toMatchObject({ status: 'ok', player: { playing: false, tempoBpm: 96 } })

  // Muting waits for the user: refused first, then allowed.
  expect((await callTool(page, 'navigate', { page: 'exercises' })).status).toBe('ok')
  await expect.poll(() => toolNames(page)).not.toContain('player_play')

  const refused = callTool(page, 'set_priority', { exerciseId: 'scales-major-open-c', priority: 'muted' })
  await page.getByRole('alertdialog').getByRole('button', { name: 'Refuse' }).click()
  expect((await refused).status).toBe('refused')

  const allowed = callTool(page, 'set_priority', { exerciseId: 'scales-major-open-c', priority: 'muted' })
  await page.getByRole('alertdialog').getByRole('button', { name: 'Allow' }).click()
  expect((await allowed).status).toBe('ok')
})

test('an agent writes a goal with a path, and the practice runs it stage by stage', async ({ page }) => {
  await page.goto('/app/goals')
  await expect(page.getByRole('heading', { level: 1, name: 'Goals' })).toBeVisible()
  await expect.poll(() => toolNames(page)).toContain('set_goal')

  // The owner's own dogfood, done by the agent's side of the wire: a goal with
  // three stages, written the way Claude Code writes one over MCP.
  const made = await callTool(page, 'set_goal', {
    goal: {
      title: 'Play a blues in F',
      stages: [
        { title: 'The shapes', items: [{ exerciseId: 'scales-major-open-c', targetTempoBpm: 60 }] },
        { title: 'The line', items: [{ exerciseId: 'lines-ii-v-i-f-line', targetTempoBpm: 90 }] },
        { title: 'Together', items: [{ exerciseId: 'scales-major-open-g', targetTempoBpm: 90 }] },
      ],
    },
  })
  expect(made.status).toBe('ok')

  // Only the first stage is open, so only its items are offered.
  const listed = (await callTool(page, 'list_goals')) as { goals: { openStages: number[] }[] }
  expect(listed.goals[0].openStages).toEqual([0])
  const session = (await callTool(page, 'get_next_session')) as { slots: { exerciseId: string }[] }
  const offered = session.slots.map((slot) => slot.exerciseId)
  expect(offered).toContain('scales-major-open-c')
  expect(offered).not.toContain('lines-ii-v-i-f-line')

  // The page agrees with the tools about what is open.
  await page.reload()
  await expect(page.getByText('The shapes · 0%')).toBeVisible()
  await expect(page.getByText('The line · locked')).toBeVisible()

  // What the scheduler knows is offered whole, judged against the path's target.
  const state = (await callTool(page, 'get_exercise_state')) as {
    exercises: { exerciseId: string; targetTempoBpm: number; band: string }[]
  }
  const scale = state.exercises.find((item) => item.exerciseId === 'scales-major-open-c')
  expect(scale).toMatchObject({ band: 'new', targetTempoBpm: 60 })
})
