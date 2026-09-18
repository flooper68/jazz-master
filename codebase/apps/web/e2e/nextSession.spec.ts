import { expect, listStoredRuns, test } from './fixtures'

/**
 * The next session, in a real browser: the home card, one Play, the four
 * answers, and the agent tool answering with the same slots the page shows.
 * Every test here starts as a fresh user, so the plan begins as all-new.
 */

/** The card's slots as the user reads them: "<title><reason>". */
async function slots(page: import('@playwright/test').Page): Promise<string[]> {
  const card = page.getByRole('region', { name: 'Next session' })
  await expect(card.getByRole('listitem').first()).toBeVisible()
  return (await card.getByRole('listitem').allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim())
}

test('home offers a next session with a reason per slot, and one Play starts it', async ({ page }) => {
  await page.goto('/app/')
  const card = page.getByRole('region', { name: 'Next session' })
  await expect(card.getByRole('heading', { level: 2, name: 'Next session' })).toBeVisible()

  const first = await slots(page)
  expect(first).toHaveLength(5)
  // Nothing played yet, so every slot says so — and none is left without a reason.
  for (const slot of first) expect(slot).toContain('New — not played yet')

  // Looking twice does not change it: a reload plans the same session.
  await page.reload()
  expect(await slots(page)).toEqual(first)

  // The agent tool answers with the same slots the page shows.
  const answer = await page.evaluate(async () => {
    const response = await fetch('/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_next_session', arguments: {} } }),
    })
    return (await response.json()) as { result: { structuredContent: { status: string; slots: { title: string; reason: string }[] } } }
  })
  expect(answer.result.structuredContent.status).toBe('ok')
  expect(answer.result.structuredContent.slots.map((slot) => `${slot.title} ${slot.reason}`)).toEqual(first)

  // One Play starts the session the card described.
  await card.getByRole('button', { name: 'Play' }).click()
  await expect(page).toHaveURL(/\/app\/session\?/)
  await expect(page.getByText('Next session · 1 of 5')).toBeVisible()
})

test('a session is answered on four buttons, and the plan takes the answer', async ({ page }) => {
  await page.goto('/app/session?x=scales-major-open-c@48')
  // The written tempo is 60; the plan asked for 48, and the player starts there.
  await expect(page.getByRole('spinbutton', { name: /tempo/i })).toHaveValue('48')

  await page.getByRole('button', { name: /^Play C major/ }).click()
  await page.getByRole('button', { name: /^Finish / }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Next session complete' })).toBeVisible()

  // Anki's four, hardest first, with nothing chosen for the player.
  const answers = page.getByRole('group', { name: /^How did it go\?/ }).getByRole('button')
  await expect(answers).toHaveText(['Again', 'Hard', 'Good', 'Easy'])
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('runs.save') && (response.request().postData() ?? '').includes('"difficulty":"again"'),
    ),
    page.getByRole('button', { name: /^Again for /, exact: false }).first().click(),
  ])

  const runs = await listStoredRuns(page)
  expect(runs).toHaveLength(1)
  expect(runs[0]).toMatchObject({ exerciseId: 'scales-major-open-c', difficulty: 'again' })

  // Back home the plan has read the answer: the exercise is no longer new.
  await page.getByRole('link', { name: 'Home' }).first().click()
  const card = page.getByRole('region', { name: 'Next session' })
  await expect(card.getByRole('listitem').first()).toBeVisible()
  await expect(card.getByRole('listitem').filter({ hasText: 'C major — open position' }).filter({ hasText: 'New — not played yet' })).toHaveCount(0)
})
