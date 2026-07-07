import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// Vitest project config for this workspace (the codebase-root vitest.config.ts
// globs apps/*). The app itself builds through Astro (astro.config.mjs); this
// file only gives tests the JSX transform, jsdom, and Testing Library setup.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright owns e2e/*.spec.ts (run via `bun run check:e2e`), so Vitest
    // must not collect them.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
