import { TRPCError } from '@trpc/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createConsoleStructuredLogger,
  createRequestLogMetadata,
  logDatabaseSmoke,
  logTrpcRequest,
  statusFromTrpcError,
  toSafeLogRecord,
} from './logger'

describe('structured server logging', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits JSON-serializable records', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createConsoleStructuredLogger()

    logger.emit('info', {
      event: 'trpc.request.completed',
      outcome: 'ok',
      route: '/trpc',
      status: 200,
      durationMs: 12,
      requestId: 'req_test',
    })

    expect(info).toHaveBeenCalledOnce()
    expect(JSON.parse(info.mock.calls[0]?.[0] ?? '')).toEqual({
      event: 'trpc.request.completed',
      outcome: 'ok',
      route: '/trpc',
      status: 200,
      durationMs: 12,
      requestId: 'req_test',
    })
  })

  it('drops or redacts sensitive fields and values', () => {
    const record = toSafeLogRecord({
      event: 'trpc.request.completed',
      clerkUserId: 'user_123',
      cookie: 'jm=secret',
      authorization: 'Bearer abc.def.ghi',
      databaseUrl: 'postgresql://jazz_master:secret@host/db',
      requestBody: { profile: 'raw body' },
      nested: {
        connectionString: 'postgres://u:p@host/db',
        message:
          'failed for user_abc123 with Bearer abc.def and postgresql://u:p@host/db',
      },
    })

    expect(record).toEqual({
      event: 'trpc.request.completed',
      nested: {
        message:
          'failed for [redacted-clerk-user-id] with Bearer [redacted-token] and [redacted-database-url]',
      },
    })
  })

  it('extracts only safe request metadata', () => {
    const request = new Request('https://example.test/trpc/users.ensure', {
      headers: {
        authorization: 'Bearer abc.def.ghi',
        cookie: 'jm=secret',
        'cf-ray': 'abc123-CDG',
      },
      body: 'raw request body',
      method: 'POST',
    })

    expect(createRequestLogMetadata(request, { requestId: 'req_test' })).toEqual(
      {
        requestId: 'req_test',
        cfRay: 'abc123-CDG',
      },
    )
  })

  it('logs failed protected tRPC procedures without Clerk identifiers', () => {
    const error = new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required for user_123',
    })
    const events: Array<Record<string, unknown>> = []

    logTrpcRequest({
      logger: { emit: (_level, event) => events.push(toSafeLogRecord(event)) },
      metadata: { requestId: 'req_test', cfRay: 'ray_test' },
      paths: ['users.ensure'],
      type: 'query',
      outcome: 'error',
      status: statusFromTrpcError(error),
      durationMs: 8,
      errorCode: error.code,
    })

    expect(events).toEqual([
      {
        event: 'trpc.request.completed',
        outcome: 'error',
        procedure: 'users.ensure',
        route: '/trpc',
        type: 'query',
        status: 401,
        durationMs: 8,
        errorCode: 'UNAUTHORIZED',
        requestId: 'req_test',
        cfRay: 'ray_test',
      },
    ])
    expect(JSON.stringify(events)).not.toContain('user_123')
  })

  it('distinguishes unconfigured and query-failed database smoke logs', () => {
    const events: Array<Record<string, unknown>> = []
    const logger = {
      emit(_level: 'info' | 'warn' | 'error', event: Record<string, unknown>) {
        events.push(toSafeLogRecord(event))
      },
    }

    logDatabaseSmoke(logger, { requestId: 'req_test' }, {
      outcome: 'unconfigured',
      status: 200,
      errorKind: 'unconfigured_runtime',
    })
    logDatabaseSmoke(logger, { requestId: 'req_test' }, {
      outcome: 'error',
      status: 503,
      errorKind: 'query_or_connectivity_failure',
      error: new Error('connection failed postgresql://u:p@host/db'),
    })

    expect(events).toEqual([
      {
        event: 'db.smoke.completed',
        procedure: 'dbSmoke',
        route: '/trpc/dbSmoke',
        requestId: 'req_test',
        outcome: 'unconfigured',
        status: 200,
        errorKind: 'unconfigured_runtime',
      },
      {
        event: 'db.smoke.completed',
        procedure: 'dbSmoke',
        route: '/trpc/dbSmoke',
        requestId: 'req_test',
        outcome: 'error',
        status: 503,
        errorKind: 'query_or_connectivity_failure',
        error: {
          name: 'Error',
          message: 'connection failed [redacted-database-url]',
        },
      },
    ])
  })
})
