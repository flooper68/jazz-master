import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findBuildOutputSecrets } from './buildOutputSecrets.ts'

describe('findBuildOutputSecrets', () => {
  let distDir: string

  beforeEach(() => {
    distDir = mkdtempSync(join(tmpdir(), 'jazz-master-dist-'))
    mkdirSync(join(distDir, 'server'), { recursive: true })
  })

  afterEach(() => {
    rmSync(distDir, { recursive: true, force: true })
  })

  function write(relativePath: string, contents: string) {
    writeFileSync(join(distDir, relativePath), contents)
  }

  it('reports nothing for output that carries no secrets', () => {
    write('server/entry.mjs', 'export const greeting = "hello"\n')

    expect(findBuildOutputSecrets(distDir)).toEqual([])
  })

  it('finds an inlined Clerk secret key', () => {
    write(
      'server/middleware.mjs',
      'const env = { CLERK_SECRET_KEY: "sk_test_7gpciRsXFI54qRsqwxioGNFl4tAw5wFQ" }\n',
    )

    expect(findBuildOutputSecrets(distDir)).toEqual(['server/middleware.mjs'])
  })

  it('finds a live secret key, and one containing base64url punctuation', () => {
    write('server/live.mjs', 'sk_live_AbC-dEf_GhIjKlMnOpQrStUvWxYz012345\n')

    expect(findBuildOutputSecrets(distDir)).toEqual(['server/live.mjs'])
  })

  it('ignores the prefix comparisons Clerk ships in its own bundles', () => {
    write(
      'server/clerk.mjs',
      'function isDev(key) { return key.startsWith("sk_test_") }\n',
    )

    expect(findBuildOutputSecrets(distDir)).toEqual([])
  })

  it('reports a .dev.vars in the output whatever it contains', () => {
    write('server/.dev.vars', 'SOME_URL=/sign-in\n')

    expect(findBuildOutputSecrets(distDir)).toEqual(['server/.dev.vars'])
  })

  it('scans source maps, which are uploaded with the Worker', () => {
    write('server/entry.mjs.map', '{"sourcesContent":["sk_test_' + 'a'.repeat(30) + '"]}')

    expect(findBuildOutputSecrets(distDir)).toEqual(['server/entry.mjs.map'])
  })
})
