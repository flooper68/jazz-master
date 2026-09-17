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

/** Play the exercise on the stage and end it with Finish. */
export async function finishCurrentExercise(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Play / }).click()
  await page.getByRole('button', { name: /^Finish / }).click()
}
