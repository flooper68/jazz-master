import { expect, listStoredRuns, test } from './fixtures'

/**
 * The next session, in a real browser: the home card, one Play, the four
 * answers, and the agent tool answering with the same slots the page shows.
 * Every test here starts as a fresh user, so the plan begins as all-new.
 */

/** The plan as the user reads it, behind What's in it: "<title> <reason>" per slot. */
async function slots(page: import('@playwright/test').Page): Promise<string[]> {
  const card = page.getByRole('region', { name: 'Next session' })
  await expect(card.getByRole('button', { name: /^What/ })).toBeVisible()
  await card.getByRole('button', { name: /^What/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Next session' })
  await expect(dialog.getByRole('listitem').first()).toBeVisible()
  const read = await dialog.getByRole('listitem').allInnerTexts()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
  return read.map((text) => text.replace(/\s+/g, ' ').trim())
}

test('home offers a next session with a reason per slot, and one Play starts it', async ({ page }) => {
  await page.goto('/app/')
  const card = page.getByRole('region', { name: 'Next session' })
  await expect(card.getByRole('heading', { level: 2, name: 'Next session' })).toBeVisible()

  // The card is the answer and a Play; the plan itself is a press away.
  await expect(card.getByText(/exercises, put together from what you have played\.$/)).toBeVisible()
  await expect(card.getByRole('listitem')).toHaveCount(0)
  // And it says how long it will take, because the length is what was asked for.
  await expect(card.getByText(/^About /)).toBeVisible()

  const first = await slots(page)
  expect(first.length).toBeGreaterThan(1)
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
  // The dialog says more about each exercise than the tool does, so compare what they share.
  for (const [index, slot] of answer.result.structuredContent.slots.entries()) {
    expect(first[index]).toContain(slot.title)
    expect(first[index]).toContain(slot.reason)
  }
  expect(answer.result.structuredContent.slots).toHaveLength(first.length)

  // One Play starts the session the card described.
  await card.getByRole('button', { name: 'Play' }).click()
  await expect(page).toHaveURL(/\/app\/session\?/)
  await expect(page.getByText(`Next session · 1 of ${first.length}`)).toBeVisible()
})

test('the session is planned to the length the user picked, and it is remembered', async ({ page }) => {
  await page.goto('/app/')
  const card = page.getByRole('region', { name: 'Next session' })
  await expect(card.getByRole('radio', { name: '20 min' })).toBeChecked()

  // The radio itself is screen-reader-only; its label is what a user presses.
  await card.getByText('10 min', { exact: true }).click()
  await expect(card.getByRole('radio', { name: '10 min' })).toBeChecked()
  const short = await slots(page)
  await card.getByText('60 min', { exact: true }).click()
  const long = await slots(page)
  expect(long.length).toBeGreaterThan(short.length)

  // The choice outlives the page: a reload plans to it rather than the default.
  await page.reload()
  await expect(card.getByRole('radio', { name: '60 min' })).toBeChecked()
  expect(await slots(page)).toEqual(long)
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
  await card.getByRole('button', { name: /^What/ }).click()
  const plan = page.getByRole('dialog', { name: 'Next session' })
  await expect(plan.getByRole('listitem').first()).toBeVisible()
  await expect(plan.getByRole('listitem').filter({ hasText: 'C major — open position' }).filter({ hasText: 'New — not played yet' })).toHaveCount(0)
})

test('an exercise the player loved ends the next session, and the note survives the sitting', async ({ page }) => {
  await page.goto('/app/session?x=scales-major-open-c')
  await page.getByRole('button', { name: /^Play C major/ }).click()
  await page.getByRole('button', { name: /^Finish / }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Next session complete' })).toBeVisible()

  // How it went and how it felt are two separate questions on the summary.
  const feel = page.getByRole('group', { name: /^How did it feel\?/ })
  await expect(feel.getByRole('button')).toHaveText(['Dragged', 'Fine', 'Loved it'])
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('runs.save') && (response.request().postData() ?? '').includes('"feel":"loved"'),
    ),
    feel.getByRole('button', { name: /^Loved it/ }).click(),
  ])

  // A sentence about the whole sitting, written away when the box is left.
  const note = page.getByLabel(/^Anything worth remembering\?/)
  await note.fill('The ii–V finally sat in the pocket.')
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('notes.save')),
    note.blur(),
  ])

  // Back home, the plan ends on the thing the player loved.
  await page.getByRole('link', { name: 'Home' }).first().click()
  const card = page.getByRole('region', { name: 'Next session' })
  await card.getByRole('button', { name: /^What/ }).click()
  const plan = page.getByRole('dialog', { name: 'Next session' })
  await expect(plan.getByRole('listitem').first()).toBeVisible()
  const slots = plan.getByRole('listitem')
  await expect(slots.last()).toContainText('C major — open position')
  await expect(slots.last()).toContainText('one you love')
})
