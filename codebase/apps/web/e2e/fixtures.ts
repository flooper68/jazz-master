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
const SILENT_WAV = createSilentWav()

export const test = base.extend<{
  cleanConsole: void
  sampleAudio: void
  testAuth: void
}>({
  testAuth: [
    async ({ page }, use) => {
      await page.setExtraHTTPHeaders({
        [playwrightTestAuthHeader]: `user_e2e_${randomUUID()}`,
      })
      await use()
    },
    { auto: true },
  ],
  sampleAudio: [
    async ({ page }, use) => {
      await page.route('https://gleitz.github.io/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'audio/wav',
          body: SILENT_WAV,
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

/** First-run gate: every /app path shows the onboarding wizard until a profile exists. */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Skip for now' }).click()
}

/**
 * Grade every exercise "Got it" until the summary appears. The cap only guards
 * against an infinite loop if the runner stops advancing.
 */
export async function gradeThroughLesson(page: Page): Promise<void> {
  const summaryHeading = page.getByRole('heading', { name: /^Lesson complete/ })
  for (let i = 0; i < 20; i++) {
    // Wait until the runner settles into one of its two states before acting.
    await expect(
      summaryHeading.or(page.getByRole('button', { name: /^Begin / })).first(),
    ).toBeVisible()
    if (await summaryHeading.isVisible()) break
    await page.getByRole('button', { name: /^Begin / }).click()
    await page.getByRole('button', { name: /^End playthrough and grade / }).click()
    const gradeDialog = page.getByRole('dialog', { name: /^Grade / })
    await expect(gradeDialog).toBeVisible()
    await gradeDialog.getByRole('button', { name: 'Got it' }).click()
  }
  await expect(summaryHeading).toBeVisible()
}

function createSilentWav(): Buffer {
  const sampleRate = 8_000
  const durationSeconds = 0.1
  const channelCount = 1
  const bitsPerSample = 16
  const sampleCount = Math.floor(sampleRate * durationSeconds)
  const dataByteLength = sampleCount * channelCount * (bitsPerSample / 8)
  const buffer = Buffer.alloc(44 + dataByteLength)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataByteLength, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channelCount, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channelCount * (bitsPerSample / 8), 28)
  buffer.writeUInt16LE(channelCount * (bitsPerSample / 8), 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataByteLength, 40)

  return buffer
}
