import { expect, listStoredRuns, test } from './fixtures'

test('a routine made in the app is stored, played in its order, and offered as what to play next', async ({ page }) => {
  await page.goto('/app/routines')
  // A new user starts with the starter routines.
  await expect(page.getByRole('listitem', { name: 'Open-position warm-up' })).toBeVisible()

  await page.getByRole('link', { name: 'New routine' }).click()
  await expect(page).toHaveURL(/\/app\/routines\/new$/)
  const editor = page.getByRole('form', { name: 'New routine' })
  await editor.getByLabel('Name').fill('E2E warm-up')
  await editor.getByLabel('Exercise to add').selectOption({ label: 'Gm7 – C7 – Fmaj7 — a bebop line' })
  await editor.getByRole('button', { name: 'Add' }).click()
  await editor.getByLabel('Exercise to add').selectOption({ label: 'C major — open position' })
  await editor.getByRole('button', { name: 'Add' }).click()
  await editor.getByRole('button', { name: 'Create routine' }).click()
  await expect(page.getByRole('listitem', { name: 'E2E warm-up' })).toBeVisible()

  // It survives a reload: it is in the database, not in the page.
  await page.reload()
  await expect(page.getByRole('listitem', { name: 'E2E warm-up' })).toBeVisible()

  // It can be named as what to play instead of the next session.
  await page.getByRole('button', { name: 'What to play next' }).click()
  await page.getByRole('dialog', { name: 'What to play next' }).getByRole('radio', { name: /^E2E warm-up/ }).check()
  await page.getByRole('button', { name: /^Play E2E warm-up: 2 exercises/ }).click()

  // The routine's order, not easier-first: the line comes before the scale.
  await expect(page.getByText('E2E warm-up · 1 of 2')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /^Gm7 – C7 – Fmaj7 — a bebop line/ })).toBeVisible()
  await page.getByRole('button', { name: /^Play Gm7/ }).click()
  await page.getByRole('button', { name: /^Finish / }).click()
  await expect(page.getByText('E2E warm-up · 2 of 2')).toBeVisible()
  await page.getByRole('button', { name: /^Play C major/ }).click()
  await page.getByRole('button', { name: /^Finish / }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'E2E warm-up complete' })).toBeVisible()

  // Both runs are saved through one serialized queue; wait for the store, not for a response.
  await expect
    .poll(async () => (await listStoredRuns(page)).map((run) => run.exerciseId).sort())
    .toEqual(['lines-ii-v-i-f-line', 'scales-major-open-c'])
})
