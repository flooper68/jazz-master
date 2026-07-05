import { defineConfig } from 'vitest/config'

// Each workspace is its own Vitest project: apps/web brings its vite.config.ts
// (jsdom + Testing Library setup), packages run with defaults (node environment).
export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/*'],
  },
})
