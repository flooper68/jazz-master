import { expect, test as base, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { playwrightTestAuthHeader } from '../src/server/auth/appRouteAuth'

/**
 * Shared test base: every spec automatically asserts that the paths it covered
 * produced no console errors and no failed network requests (TASK-035
 * acceptance criterion), so individual specs stay about user flows.
 */

// Dev-server noise that is not a product defect. Vite ping failures can appear
// when the HMR websocket races a page.goto; nothing in the app itself fails.
const IGNORED_REQUEST_FAILURES = ['net::ERR_ABORTED']

export const test = base.extend<{
  cleanConsole: void
  testAuth: void
}>({
  // Each test gets a fresh test-auth user, so every /app visit starts with an
  // empty practice history without needing real Clerk credentials. The header
  // is added only to same-origin requests: on cross-origin fetches (Google
  // Fonts, Clerk's CDN) a custom header forces a CORS preflight that fails.
  testAuth: [
    async ({ page, baseURL }, use) => {
      const userId = `user_e2e_${randomUUID()}`
      const origin = baseURL ? new URL(baseURL).origin : null
      await page.route('**/*', async (route) => {
        const request = route.request()
        if (origin && new URL(request.url()).origin !== origin) {
          await route.continue()
          return
        }
        await route.continue({
          headers: { ...request.headers(), [playwrightTestAuthHeader]: userId },
        })
      })
      await use()
    },
    { auto: true },
  ],
  cleanConsole: [
    async ({ page, baseURL }, use) => {
      const consoleErrors: string[] = []
      const failedRequests: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text())
        }
      })
      page.on('pageerror', (error) => {
        consoleErrors.push(`pageerror: ${error.message}`)
      })
      page.on('requestfailed', (request) => {
        const failure = request.failure()?.errorText ?? 'unknown failure'
        if (IGNORED_REQUEST_FAILURES.includes(failure)) return
        failedRequests.push(`${request.url()} — ${failure}`)
      })
      page.on('response', (response) => {
        // Only app-served responses: a 4xx/5xx from our origin (broken route,
        // missing asset) is a defect; third-party probes are not ours to gate.
        const appServed =
          !baseURL || new URL(response.url()).origin === new URL(baseURL).origin
        if (appServed && response.status() >= 400) {
          failedRequests.push(`${response.url()} — HTTP ${response.status()}`)
        }
      })
      await use()
      expect(consoleErrors, 'no console errors on covered paths').toEqual([])
      expect(failedRequests, 'no failed requests on covered paths').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
export type { Page }

/** Begin, finish, and grade the current exercise "Got it". */
export async function gradeCurrentExercise(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Play / }).click()
  await page.getByRole('button', { name: /^Next: finish / }).click()
  const grade = page.getByRole('group', { name: /^Grade / })
  await expect(grade).toBeVisible()
  await grade.getByRole('button', { name: 'Got it' }).click()
}

/**
 * Grade every exercise "Got it" until the summary appears. The cap only guards
 * against an infinite loop if the player stops advancing.
 */
export async function gradeThroughLesson(page: Page): Promise<void> {
  const summaryHeading = page.getByRole('heading', { name: /^Lesson complete/ })
  for (let i = 0; i < 20; i++) {
    // Wait until the player settles into one of its two states before acting.
    await expect(
      summaryHeading.or(page.getByRole('button', { name: /^Play / })).first(),
    ).toBeVisible()
    if (await summaryHeading.isVisible()) break
    await gradeCurrentExercise(page)
  }
  await expect(summaryHeading).toBeVisible()
}

interface StoredSession {
  id: string
  lessonId: string
  completed: boolean
  results: Array<{ exerciseId: string; grade: string }>
}

/** The signed-in user's persisted sessions, read over the same tRPC wire the app uses. */
export async function listStoredSessions(page: Page): Promise<StoredSession[]> {
  const body = await page.evaluate(async () => {
    const response = await fetch('/trpc/sessions.list')
    return (await response.json()) as {
      result: { data: { status: string; sessions?: StoredSession[] } }
    }
  })
  expect(body.result.data.status).toBe('ok')
  return body.result.data.sessions ?? []
}
