import {
  completeOnboarding,
  expect,
  gradeThroughLesson,
  skipOnboarding,
  test,
} from './fixtures'

// Each test gets a fresh test-auth user, so every /app visit starts at the
// first-run onboarding gate without needing real Clerk credentials.

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

test('happy path: onboard, run a planned lesson, see it in history and on the dashboard', async ({
  page,
}) => {
  await page.goto('/app/practice')
  await completeOnboarding(page)
  await expect(
    page.getByRole('heading', { name: 'Practice', level: 1 }),
  ).toBeVisible()

  // Start the first item of today's plan and remember which lesson it is.
  const startPlanned = page
    .getByRole('button', { name: /^Start planned lesson / })
    .first()
  const lessonTitle = (await startPlanned.getAttribute('aria-label'))!.replace(
    'Start planned lesson ',
    '',
  )
  await startPlanned.click()
  const runnerHeading = page.getByRole('heading', {
    name: lessonTitle,
    level: 2,
  })
  await expect(runnerHeading).toBeVisible()
  await expect(runnerHeading).toBeFocused()
  const notationScore = page.getByRole('img', {
    name: /staff and tablature/i,
  }).first()
  await expect(notationScore).toBeVisible()
  await expect
    .poll(
      async () => notationScore.locator('svg text').count(),
      { message: 'notation score glyphs rendered' },
    )
    .toBeGreaterThan(0)

  await gradeThroughLesson(page)
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(
    page.getByRole('button', { name: 'Start Major scale I — open position' }),
  ).toBeVisible()

  // The completed session shows up in history, not marked incomplete.
  await page.goto('/app/history')
  await expect(page.getByRole('heading', { name: lessonTitle })).toBeVisible()
  await expect(page.getByText('Incomplete')).not.toBeVisible()

  // And the dashboard reflects it: streak started, area progress updated.
  await page.goto('/app')
  await expect(page.getByText('1 day', { exact: true })).toBeVisible()
  await expect(page.getByText('1 of 5 lessons completed')).toBeVisible()
})

test('runner Play starts timing before Next opens grading', async ({ page }) => {
  await page.goto('/app/practice')
  await skipOnboarding(page)
  await page
    .getByRole('button', { name: 'Start Major scale I — open position' })
    .click()

  await expect(page.getByText('2:00')).toBeVisible()
  await page.waitForTimeout(1_500)
  await expect(page.getByText('2:00')).toBeVisible()

  await page.getByRole('button', { name: /^Play play-along for / }).click()
  await expect(
    page.getByRole('button', { name: /^Stop play-along for / }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(
    page.getByRole('button', { name: /^End playthrough and grade / }),
  ).toBeEnabled()
  await expect(page.getByText(/1:\d\d/)).toBeVisible()

  await page.getByRole('button', { name: /^End playthrough and grade / }).click()
  const gradeDialog = page.getByRole('dialog', { name: /^Grade / })
  await expect(gradeDialog).toBeVisible()
  await expect(gradeDialog.getByRole('button', { name: 'Got it' })).toBeFocused()
})

test('starting a lesson from the lesson list focuses the runner heading', async ({
  page,
}) => {
  await page.goto('/app/practice')
  await skipOnboarding(page)
  const startLesson = page.getByRole('button', {
    name: 'Start Major scale I — open position',
  })
  const lessonTitle = (await startLesson.getAttribute('aria-label'))!.replace(
    'Start ',
    '',
  )

  await startLesson.click()

  const runnerHeading = page.getByRole('heading', {
    name: lessonTitle,
    level: 2,
  })
  await expect(runnerHeading).toBeVisible()
  await expect(runnerHeading).toBeFocused()
})

test('persistence: profile, preferences, plan, and sessions survive browser storage clearing', async ({
  page,
}) => {
  await page.goto('/app/practice')
  await skipOnboarding(page)
  const startPlanned = page
    .getByRole('button', { name: /^Start planned lesson / })
    .first()
  const lessonTitle = (await startPlanned.getAttribute('aria-label'))!.replace(
    'Start planned lesson ',
    '',
  )
  await startPlanned.click()

  const beginButton = page.getByRole('button', { name: /^Begin / })
  const exerciseTitle = (await beginButton.getAttribute('aria-label'))!.replace(
    'Begin ',
    '',
  )

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('preferences.setNotationDisplayMode'),
    ),
    page
      .getByRole('button', {
        name: `Show staff notation for ${exerciseTitle}`,
      })
      .click(),
  ])
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('preferences.setScoringTolerance'),
    ),
    page.getByLabel('Scoring tolerance').selectOption('strict'),
  ])
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('preferences.setPlayAlongTempo'),
    ),
    page
      .getByRole('slider', { name: `Tempo for ${exerciseTitle}` })
      .fill('72'),
  ])

  // One graded exercise is enough — the runner upserts the session per grade.
  await beginButton.click()
  await page.getByRole('button', { name: /^End playthrough and grade / }).click()
  const gradeDialog = page.getByRole('dialog', { name: /^Grade / })
  await expect(gradeDialog).toBeVisible()
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('sessions.upsert'),
    ),
    gradeDialog.getByRole('button', { name: 'Got it' }).click(),
  ])
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()

  // Profile persisted: the onboarding gate stays open.
  await expect(page.getByRole('button', { name: 'Skip for now' })).not.toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Practice', level: 1 }),
  ).toBeVisible()

  // Plan persisted: same first item as before the reload.
  await expect(
    page.getByRole('button', { name: `Start planned lesson ${lessonTitle}` }),
  ).toBeVisible()

  // Account-scoped preferences return after all browser storage is cleared.
  await page.getByRole('button', { name: `Start ${lessonTitle}` }).click()
  await expect(
    page.getByRole('button', {
      name: `Show staff notation for ${exerciseTitle}`,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Scoring tolerance')).toHaveValue('strict')
  await expect(
    page.getByRole('slider', { name: `Tempo for ${exerciseTitle}` }),
  ).toHaveValue('72')

  // Session record persisted, marked incomplete (the run was abandoned mid-flow).
  await page.goto('/app/history')
  await expect(page.getByRole('heading', { name: lessonTitle })).toBeVisible()
  await expect(page.getByText('Incomplete')).toBeVisible()

  await page.goto('/app/profile')
  await expect(page.getByRole('heading', { name: 'Data sync' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Export backup' }),
  ).toHaveCount(0)
  await expect(page.getByLabel('Import backup')).toHaveCount(0)
})
