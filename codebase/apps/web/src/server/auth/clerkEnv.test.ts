import { describe, expect, it } from 'vitest'
import {
  assertClerkRuntimeEnv,
  getMissingClerkRuntimeEnv,
} from './clerkEnv'

describe('Clerk runtime env', () => {
  it('reports both required keys when auth is not configured', () => {
    expect(getMissingClerkRuntimeEnv({})).toEqual([
      'PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
    ])
  })

  it('accepts keys from Cloudflare runtime env', () => {
    expect(
      getMissingClerkRuntimeEnv({
        cloudflareEnv: {
          PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
          CLERK_SECRET_KEY: 'sk_test_123',
        },
      }),
    ).toEqual([])
  })

  it('throws a clear app-specific error when keys are missing', () => {
    expect(() => assertClerkRuntimeEnv({})).toThrow(
      'Jazz Master Clerk auth is not configured. Set PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY before starting the web app.',
    )
  })
})
