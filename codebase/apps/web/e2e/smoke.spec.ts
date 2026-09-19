import { expect, finishCurrentExercise, listStoredRuns, test } from './fixtures'

const FIRST_EXERCISE = 'C major — open position'

test('landing page renders, offers the beta waitlist and links to app-hosted sign-in', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Practice smart.', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join the beta' }).first()).toHaveAttribute('href', '#beta')
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toHaveAttribute('href', '/sign-in')
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Join the beta' })).toBeVisible()
})

test('Clerk nested auth states stay on app-hosted routes', async ({ page }) => {
  await page.goto('/sign-in/factor-one')
  await expect(
    page.getByRole('heading', {
      name: 'Welcome back. Your next step is waiting.',
      level: 1,
    }),
  ).toBeVisible()
  await expect(page.getByText('404: Not found')).toHaveCount(0)

  await page.goto('/sign-up/verify-email-address')
  await expect(
    page.getByRole('heading', {
      name: 'Describe your goal. Then just play.',
      level: 1,
    }),
  ).toBeVisible()
  await expect(page.getByText('404: Not found')).toHaveCount(0)
})

test('happy path: pick an exercise, play it, rate it, and the run is stored', async ({
  page,
}) => {
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible()
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Exercises' }).click()
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
  // The summary is a dialog over the stage — which stays behind it, title and all.
  const summary = page.getByRole('dialog')
  await expect(summary).toBeFocused()
  await expect(summary.getByRole('heading', { name: 'Exercise complete', level: 2 })).toBeVisible()
  await expect(summary.getByText(FIRST_EXERCISE)).toBeVisible()

  for (const answer of ['Again', 'Hard', 'Good', 'Easy']) {
    await expect(summary.getByRole('button', { name: answer, exact: true })).toHaveAttribute('aria-pressed', 'false')
  }
  await Promise.all([
    // Two saves are in play — the run arriving, then its answer; wait for the answered one.
    page.waitForResponse(
      (response) =>
        response.url().includes('runs.save') &&
        (response.request().postData() ?? '').includes('"difficulty":"good"'),
    ),
    summary.getByRole('button', { name: 'Good', exact: true }).click(),
  ])
  await expect(page.getByRole('alert')).toHaveCount(0)

  // Done goes back to wherever the player came from — the list, in this case.
  await summary.getByRole('button', { name: 'Done' }).click()
  await expect(
    page.getByRole('heading', { name: 'Exercises', level: 1 }),
  ).toBeVisible()

  const runs = await listStoredRuns(page)
  expect(runs).toHaveLength(1)
  expect(runs[0]).toMatchObject({
    exerciseId: 'scales-major-open-c',
    completed: false,
    difficulty: 'good',
  })
})

test('a run left from the stage is not stored', async ({ page }) => {
  await page.goto('/app/exercises/scales-major-open-c')
  await page.getByRole('button', { name: /^Play C major/ }).click()
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Exercises' }).click()
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
  // The sound settings live behind Advanced now, in a dialog over the stage.
  await page.getByRole('button', { name: 'Advanced' }).click()
  await expect(page.getByRole('checkbox', { name: 'Click' })).toBeChecked()
  await page.getByRole('button', { name: 'Close advanced' }).click()
  await expect(page.getByRole('dialog', { name: 'Advanced' })).toHaveCount(0)

  await page.getByRole('button', { name: /^Play C major/ }).click()
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
