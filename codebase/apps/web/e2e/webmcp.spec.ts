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

test('an agent in the browser makes a routine, starts it, plays it, and deletes it with the user\'s leave', async ({ page }) => {
  await page.goto('/app/routines')
  await expect(page.getByRole('heading', { level: 1, name: 'Routines' })).toBeVisible()
  await expect.poll(() => toolNames(page)).toContain('create_routine')
  expect(await toolNames(page)).not.toContain('player_play')

  // Made by the agent, it turns up on the page the user is looking at — no reload.
  const made = await callTool(page, 'create_routine', {
    routine: { name: 'E2E — from the assistant', items: [{ exerciseId: 'scales-major-open-c' }] },
  })
  expect(made.status).toBe('ok')
  const routineId = (made.routine as { id: string }).id
  await expect(page.getByRole('listitem', { name: 'E2E — from the assistant' })).toBeVisible()

  // Started by the agent: the session comes up, and with it the player's tools.
  expect((await callTool(page, 'start_routine', { routineId })).status).toBe('ok')
  await expect(page).toHaveURL(/\/app\/session\?/)
  await expect(page.getByRole('button', { name: /^Play .+ — / })).toBeVisible()
  await expect.poll(() => toolNames(page)).toContain('player_play')

  expect((await callTool(page, 'player_set_tempo', { bpm: 96 })).status).toBe('ok')
  const played = await callTool(page, 'player_play')
  // A browser may hold the sound until the user's first click; the tool says which it was.
  expect(['ok', 'waiting_for_user']).toContain(played.status)
  await expect(page.getByRole('button', { name: /^Pause/ })).toBeVisible()
  expect(await callTool(page, 'player_stop')).toMatchObject({ status: 'ok', player: { playing: false, tempoBpm: 96 } })

  // Deleting waits for the user: refused first, then allowed.
  expect((await callTool(page, 'navigate', { page: 'routines' })).status).toBe('ok')
  await expect(page.getByRole('listitem', { name: 'E2E — from the assistant' })).toBeVisible()
  await expect.poll(() => toolNames(page)).not.toContain('player_play')

  const refused = callTool(page, 'delete_routine', { routineId })
  await page.getByRole('alertdialog').getByRole('button', { name: 'Refuse' }).click()
  expect((await refused).status).toBe('refused')
  await expect(page.getByRole('listitem', { name: 'E2E — from the assistant' })).toBeVisible()

  const allowed = callTool(page, 'delete_routine', { routineId })
  await page.getByRole('alertdialog').getByRole('button', { name: 'Allow' }).click()
  expect(await allowed).toEqual({ status: 'ok', deleted: true })
  await expect(page.getByRole('listitem', { name: 'E2E — from the assistant' })).toHaveCount(0)
})
