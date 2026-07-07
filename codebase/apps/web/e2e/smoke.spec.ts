import { expect, gradeThroughLesson, skipOnboarding, test } from './fixtures'

// Each test gets a fresh browser context (no stored profile), so every /app
// visit starts at the first-run onboarding gate.

test('landing page renders and links into the practice app', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Jazz Master', level: 1 }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Open the practice app' }).click()
  await expect(
    page.getByRole('heading', { name: 'How comfortable are you?' }),
  ).toBeVisible()
})

test('happy path: onboard, run a planned lesson, see it in history and on the dashboard', async ({
  page,
}) => {
  await page.goto('/app/practice')
  await skipOnboarding(page)
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
  await expect(
    page.getByRole('heading', { name: lessonTitle, level: 2 }),
  ).toBeVisible()

  await gradeThroughLesson(page)
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(
    page.getByRole('heading', { name: 'Practice', level: 1 }),
  ).toBeVisible()

  // The completed session shows up in history, not marked incomplete.
  await page.goto('/app/history')
  await expect(page.getByRole('heading', { name: lessonTitle })).toBeVisible()
  await expect(page.getByText('Incomplete')).not.toBeVisible()

  // And the dashboard reflects it: plan item done, streak started.
  await page.goto('/app')
  await expect(page.getByText('Done today').first()).toBeVisible()
  await expect(page.getByText('1 day', { exact: true })).toBeVisible()
})

test('persistence: profile, plan, and session records survive a reload mid-flow', async ({
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

  // One graded exercise is enough — the runner upserts the session per grade.
  await page.getByRole('button', { name: 'Got it' }).click()
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

  // Session record persisted, marked incomplete (the run was abandoned mid-flow).
  await page.goto('/app/history')
  await expect(page.getByRole('heading', { name: lessonTitle })).toBeVisible()
  await expect(page.getByText('Incomplete')).toBeVisible()
})
