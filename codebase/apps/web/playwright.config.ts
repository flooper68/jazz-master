import { defineConfig, devices } from '@playwright/test'

// E2E smoke suite (TASK-035). Runs against the Astro dev server — deliberately
// a separate `check:e2e` gate, not part of `bun run check` (owner decision,
// NOTE-005). Keep this a minimal smoke pass: real-browser flows that jsdom
// cannot prove, not a browser port of the unit tests.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    // Astro 7 daemonizes `astro dev` when it detects an agentic environment,
    // making the launcher exit — which Playwright treats as a dead webServer.
    // This env var suppresses that detection so the server stays foreground.
    env: { ...process.env, ASTRO_DEV_BACKGROUND: '1' },
  },
})
