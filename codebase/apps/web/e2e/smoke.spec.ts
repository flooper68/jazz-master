import { expect, finishCurrentExercise, listStoredRuns, test } from './fixtures'

const FIRST_EXERCISE = 'C major — open position'

test('landing page renders and links to app-hosted auth', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Build jazz guitar habits that survive the gig.',
      level: 1,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Start practicing' }).first(),
  ).toHaveAttribute('href', '/sign-up')
  await expect(
    page.getByRole('link', { name: 'Sign in' }).first(),
  ).toHaveAttribute('href', '/sign-in')
})

test('Clerk nested auth states stay on app-hosted routes', async ({ page }) => {
  await page.goto('/sign-in/factor-one')
  await expect(
    page.getByRole('heading', {
      name: 'Return to your practice room.',
      level: 1,
    }),
  ).toBeVisible()
  await expect(page.getByText('404: Not found')).toHaveCount(0)

  await page.goto('/sign-up/verify-email-address')
  await expect(
    page.getByRole('heading', {
      name: "Make today's rep easy to return to.",
      level: 1,
    }),
  ).toBeVisible()
  await expect(page.getByText('404: Not found')).toHaveCount(0)
})

test('happy path: pick an exercise, play it, rate it, and the run is stored', async ({
  page,
}) => {
  await page.goto('/app')
  await expect(
    page.getByRole('heading', { name: 'Exercises', level: 1 }),
  ).toBeVisible()

  await page.getByRole('link', { name: `Start ${FIRST_EXERCISE}` }).click()
  await expect(page).toHaveURL(/\/app\/exercises\/scales-major-open-c$/)
  const heading = page.getByRole('heading', {
    name: new RegExp(`^${FIRST_EXERCISE}`),
    level: 1,
  })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  await expect(
    page.getByRole('img', { name: /^C major — open position score, \d+ notes$/ }),
  ).toBeVisible()

  await finishCurrentExercise(page)
  const summary = page.getByRole('heading', { name: 'Exercise complete', level: 1 })
  await expect(summary).toBeFocused()
  await expect(page.getByText(FIRST_EXERCISE)).toBeVisible()

  await expect(page.getByRole('button', { name: '7 out of 10' })).toBeDisabled()
  await Promise.all([
    // Two saves are in play — the run arriving, then its rating; wait for the rated one.
    page.waitForResponse(
      (response) =>
        response.url().includes('runs.save') &&
        (response.request().postData() ?? '').includes('"rating":6'),
    ),
    page.getByRole('button', { name: '6 out of 10' }).click(),
  ])
  await expect(page.getByRole('alert')).toHaveCount(0)

  await page.getByRole('button', { name: 'Back to exercises' }).click()
  await expect(
    page.getByRole('heading', { name: 'Exercises', level: 1 }),
  ).toBeVisible()

  const runs = await listStoredRuns(page)
  expect(runs).toHaveLength(1)
  expect(runs[0]).toMatchObject({
    exerciseId: 'scales-major-open-c',
    completed: false,
    rating: 6,
  })
})

test('a run left from the stage is not stored', async ({ page }) => {
  await page.goto('/app/exercises/scales-major-open-c')
  await page.getByRole('button', { name: /^Play / }).click()
  await page.getByRole('button', { name: 'Back to exercises' }).click()
  await expect(
    page.getByRole('heading', { name: 'Exercises', level: 1 }),
  ).toBeVisible()
  expect(await listStoredRuns(page)).toEqual([])
})

test('Play starts the timer, the click, and the cursor; Play again starts over', async ({ page }) => {
  await page.goto('/app/exercises/scales-major-open-c')

  await expect(page.getByText('2:00')).toBeVisible()
  await page.waitForTimeout(1_500)
  await expect(page.getByText('2:00')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Click' })).toBeChecked()

  await page.getByRole('button', { name: /^Play / }).click()
  await expect(page.getByText(/1:5\d/)).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  // The cursor is on the tab and moves with the clock (after the count-in).
  const cursor = page.locator('[data-note][data-current]')
  await expect(cursor).toHaveCount(1)
  const noteAtFirstLook = (await cursor.getAttribute('data-note'))!
  await expect(cursor).not.toHaveAttribute('data-note', noteAtFirstLook, {
    timeout: 8_000,
  })

  await page.getByRole('button', { name: /^Finish / }).click()
  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(
    page.getByRole('heading', { name: new RegExp(`^${FIRST_EXERCISE}`), level: 1 }),
  ).toBeFocused()
  await expect(page.getByText('2:00')).toBeVisible()
})
