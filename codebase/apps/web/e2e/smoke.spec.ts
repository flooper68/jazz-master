import {
  expect,
  gradeCurrentExercise,
  gradeThroughLesson,
  listStoredSessions,
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
    page.getByRole('img', { name: /on the fretboard, frets 0 to 4$/ }),
  ).toBeVisible()

  await gradeThroughLesson(page)
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(
    page.getByRole('heading', { name: 'Lessons', level: 1 }),
  ).toBeVisible()

  const sessions = await listStoredSessions(page)
  expect(sessions).toHaveLength(1)
  expect(sessions[0]).toMatchObject({
    lessonId: 'scales-major-open',
    completed: true,
  })
  expect(sessions[0].results.map((result) => result.grade)).toEqual(
    Array(sessions[0].results.length).fill('got-it'),
  )
})

test('Begin starts the timer and the click; Next opens grading', async ({ page }) => {
  await page.goto('/app/lessons/scales-major-open')

  await expect(page.getByText('2:00')).toBeVisible()
  await page.waitForTimeout(1_500)
  await expect(page.getByText('2:00')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Click' })).toBeChecked()

  await page.getByRole('button', { name: /^Begin / }).click()
  await expect(page.getByText(/1:5\d/)).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)

  await page.getByRole('button', { name: /^Next: finish / }).click()
  const grade = page.getByRole('group', { name: /^Grade / })
  await expect(grade).toBeVisible()
  await expect(grade.getByRole('button', { name: 'Got it' })).toBeFocused()
})

test('an abandoned run is stored incomplete and survives a reload', async ({
  page,
}) => {
  await page.goto('/app/lessons/scales-major-open')

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('sessions.upsert'),
    ),
    gradeCurrentExercise(page),
  ])
  await expect(page.getByText('Exercise 2 of 3')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Exercise 1 of 3')).toBeVisible()

  const sessions = await listStoredSessions(page)
  expect(sessions).toHaveLength(1)
  expect(sessions[0]).toMatchObject({
    lessonId: 'scales-major-open',
    completed: false,
    results: [{ exerciseId: 'scales-major-open-c', grade: 'got-it' }],
  })
})
