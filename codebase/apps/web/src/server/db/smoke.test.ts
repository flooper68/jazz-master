import { describe, expect, it } from 'vitest'
import {
  createDatabaseSmokeClient,
  resolveDatabaseSmokeConnectionString,
} from './smoke'

describe('resolveDatabaseSmokeConnectionString', () => {
  it('prefers the Hyperdrive connection string over DATABASE_URL', () => {
    const result = resolveDatabaseSmokeConnectionString({
      databaseUrl: 'postgresql://local.example/jazz_master',
      hyperdrive: {
        connectionString: 'postgresql://hyperdrive.example/jazz_master',
      },
    })

    expect(result).toBe('postgresql://hyperdrive.example/jazz_master')
  })

  it('falls back to DATABASE_URL when Hyperdrive is absent', () => {
    const result = resolveDatabaseSmokeConnectionString({
      databaseUrl: ' postgresql://local.example/jazz_master ',
      hyperdrive: null,
    })

    expect(result).toBe('postgresql://local.example/jazz_master')
  })

  it('returns null when no usable connection string is present', () => {
    expect(
      resolveDatabaseSmokeConnectionString({
        databaseUrl: ' ',
        hyperdrive: { connectionString: '' },
      }),
    ).toBeNull()
  })
})

describe('createDatabaseSmokeClient', () => {
  it('returns no client when no connection string is configured', () => {
    expect(
      createDatabaseSmokeClient({
        databaseUrl: '',
        hyperdrive: null,
      }),
    ).toBeNull()
  })

  it('creates a client when Hyperdrive supplies a connection string', () => {
    expect(
      createDatabaseSmokeClient({
        databaseUrl: '',
        hyperdrive: {
          connectionString: 'postgresql://hyperdrive.example/jazz_master',
        },
      }),
    ).not.toBeNull()
  })
})
