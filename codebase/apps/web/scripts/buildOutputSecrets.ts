/**
 * Detects server secrets that reached the build output (TASK-086, INS-023).
 *
 * `astro build` used to write a plaintext `CLERK_SECRET_KEY` into `dist/` two
 * ways: Astro loads `.env` in every mode and `@clerk/astro` reads
 * `import.meta.env[name]` dynamically, so Vite inlines the whole env object as
 * a literal; and `@astrojs/cloudflare` resolves `.env`/`.dev.vars` through
 * wrangler into `process.env`, which `@cloudflare/vite-plugin` re-emits as
 * `dist/server/.dev.vars`. Local secrets now live in `.env.development`, which
 * only dev mode loads. That fix sits in someone else's env-resolution order,
 * so this detector exists to notice if it stops working.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

/**
 * A Clerk secret key: the prefix plus a long key body. The length requirement
 * is what stops Clerk's own `startsWith('sk_test_')` guards, which ship inside
 * the vendored bundles, from matching.
 */
const secretKeyPattern = /sk_(?:test|live)_[A-Za-z0-9_-]{20,}/

/** Files whose bytes are not worth decoding as text. */
const binaryExtensions = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp3',
  '.otf',
  '.png',
  '.ttf',
  '.wasm',
  '.wav',
  '.webp',
  '.woff',
  '.woff2',
])

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      yield* walk(path)
    } else if (entry.isFile()) {
      yield path
    }
  }
}

function isLocalDevVarsFile(path: string) {
  const name = basename(path)
  return name === '.dev.vars' || name.startsWith('.dev.vars.')
}

/**
 * Returns the offending paths, relative to `distDir`, in walk order. Empty
 * means the output is publishable.
 */
export function findBuildOutputSecrets(distDir: string) {
  const offenders: string[] = []

  for (const path of walk(distDir)) {
    // A `.dev.vars` in the output is a verbatim copy of the local secrets file
    // whatever it happens to contain, so its presence is the finding.
    const leaked = isLocalDevVarsFile(path)
      ? true
      : !binaryExtensions.has(extname(path)) &&
        secretKeyPattern.test(readFileSync(path, 'utf8'))

    if (leaked) {
      offenders.push(relative(distDir, path))
    }
  }

  return offenders
}
