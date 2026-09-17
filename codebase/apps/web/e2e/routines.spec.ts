import { expect, listStoredRuns, test } from './fixtures'

test('a routine made in the app is stored, played in its order, and offered to quick run', async ({ page }) => {
  await page.goto('/app/routines')
  // A new user starts with the starter routines.
  await expect(page.getByRole('listitem', { name: 'Open-position warm-up' })).toBeVisible()

  await page.getByRole('button', { name: 'New routine' }).click()
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

  // Quick run offers it as what to play.
  await page.getByRole('button', { name: 'Quick run settings' }).click()
  await page.getByRole('dialog', { name: 'Quick run settings' }).getByRole('radio', { name: /^E2E warm-up/ }).check()
  await page.getByRole('button', { name: /^Quick run: E2E warm-up, 2 exercises/ }).click()

  // The routine's order, not easier-first: the line comes before the scale.
  await expect(page.getByText('E2E warm-up · 1 of 2')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /^Gm7 – C7 – Fmaj7 — a bebop line/ })).toBeVisible()
  await page.getByRole('button', { name: /^Play / }).click()
  await page.getByRole('button', { name: /^Finish / }).click()
  await expect(page.getByText('E2E warm-up · 2 of 2')).toBeVisible()
  await page.getByRole('button', { name: /^Play / }).click()
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('runs.save')),
    page.getByRole('button', { name: /^Finish / }).click(),
  ])
  await expect(page.getByRole('heading', { level: 1, name: 'E2E warm-up complete' })).toBeVisible()

  const runs = await listStoredRuns(page)
  expect(runs.map((run) => run.exerciseId).sort()).toEqual(['lines-ii-v-i-f-line', 'scales-major-open-c'])
})
