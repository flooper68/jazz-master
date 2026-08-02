/**
 * Build gate: fails `astro build` when a server secret reached `dist/`.
 * Detection lives in `buildOutputSecrets.ts`; this is the CLI around it.
 */
import { fileURLToPath } from 'node:url'
import { findBuildOutputSecrets } from './buildOutputSecrets.ts'

const distDir = fileURLToPath(new URL('../dist', import.meta.url))
const offenders = findBuildOutputSecrets(distDir)

if (offenders.length > 0) {
  console.error(
    `Server secrets leaked into the build output:\n${offenders
      .map((path) => `  dist/${path}`)
      .join('\n')}\n\n` +
      'Delete dist/ and rebuild. If it reproduces, the build is reading local\n' +
      'secrets again — local values belong in .env.development, never .env or\n' +
      '.dev.vars. See codebase/apps/web/README.md and TASK-086. Do not publish\n' +
      'this build.',
  )
  process.exit(1)
}
