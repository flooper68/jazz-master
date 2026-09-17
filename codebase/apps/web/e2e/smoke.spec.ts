import {
  expect,
  finishCurrentExercise,
  listStoredSessions,
  playThroughLesson,
  test,
} from './fixtures'

const FIRST_LESSON = 'Major scale I — open position'

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

test('happy path: pick a lesson, play it through, and the session is stored', async ({
  page,
}) => {
  await page.goto('/app')
  await expect(
    page.getByRole('heading', { name: 'Lessons', level: 1 }),
  ).toBeVisible()

  await page.getByRole('link', { name: `Start ${FIRST_LESSON}` }).click()
  await expect(page).toHaveURL(/\/app\/lessons\/scales-major-open$/)
  const heading = page.getByRole('heading', { name: FIRST_LESSON, level: 1 })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  await expect(
    page.getByRole('img', { name: /^C major — open position score, \d+ notes$/ }),
  ).toBeVisible()

  await playThroughLesson(page)
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(
    page.getByRole('heading', { name: 'Lessons', level: 1 }),
  ).toBeVisible()

  const sessions = await listStoredSessions(page)
  expect(sessions).toHaveLength(1)
  expect(sessions[0]).toMatchObject({
    lessonId: 'scales-major-open',
    completed: true,
    exercisesCompleted: 3,
  })
})

test('Play starts the timer, the click, and the cursor; Next advances', async ({ page }) => {
  await page.goto('/app/lessons/scales-major-open')

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

  await page.getByRole('button', { name: /^Next: finish / }).click()
  await expect(page.getByText('Exercise 2 of 3')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'G major — open position', level: 2 }),
  ).toBeFocused()
})

test('an abandoned run is stored incomplete and survives a reload', async ({
  page,
}) => {
  await page.goto('/app/lessons/scales-major-open')

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('sessions.upsert'),
    ),
    finishCurrentExercise(page),
  ])
  await expect(page.getByText('Exercise 2 of 3')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Exercise 1 of 3')).toBeVisible()

  const sessions = await listStoredSessions(page)
  expect(sessions).toHaveLength(1)
  expect(sessions[0]).toMatchObject({
    lessonId: 'scales-major-open',
    completed: false,
    exercisesCompleted: 1,
  })
})
