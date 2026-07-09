import { TRPCError } from '@trpc/server'
import { getHTTPStatusCodeFromError } from '@trpc/server/http'

type LogLevel = 'info' | 'warn' | 'error'

export type LogOutcome = 'ok' | 'error' | 'unconfigured'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export interface RequestLogMetadata {
  requestId: string
  cfRay?: string
}

export interface StructuredLogger {
  emit(level: LogLevel, event: Record<string, unknown>): void
}

export interface TrpcRequestLogOptions {
  logger: StructuredLogger
  metadata: RequestLogMetadata
  paths: readonly string[]
  type: string
  outcome: Exclude<LogOutcome, 'unconfigured'>
  status: number
  durationMs: number
  errorCode?: string
}

const sensitiveFieldPattern =
  /authorization|cookie|token|secret|password|database[_-]?url|connection[_-]?string|clerk[_-]?user[_-]?id|user[_-]?id|request[_-]?body|response[_-]?body|body|sql/i

export function createConsoleStructuredLogger(): StructuredLogger {
  return {
    emit(level, event) {
      console[level](JSON.stringify(toSafeLogRecord(event)))
    },
  }
}

export function createNoopStructuredLogger(): StructuredLogger {
  return {
    emit() {},
  }
}

export function createRequestLogMetadata(
  request: Request,
  options: { requestId?: string } = {},
): RequestLogMetadata {
  const cfRay = request.headers.get('cf-ray') ?? undefined

  return {
    requestId: options.requestId ?? generateRequestId(),
    ...(cfRay ? { cfRay } : {}),
  }
}

export function logTrpcRequest({
  logger,
  metadata,
  paths,
  type,
  outcome,
  status,
  durationMs,
  errorCode,
}: TrpcRequestLogOptions): void {
  logger.emit(outcome === 'ok' ? 'info' : 'error', {
    event: 'trpc.request.completed',
    outcome,
    procedure: paths.join(',') || undefined,
    route: '/trpc',
    type,
    status,
    durationMs,
    errorCode,
    ...metadata,
  })
}

export function logDatabaseSmoke(
  logger: StructuredLogger,
  metadata: RequestLogMetadata | null,
  event: {
    outcome: LogOutcome
    status: number
    errorKind?: 'unconfigured_runtime' | 'query_or_connectivity_failure'
    error?: unknown
  },
): void {
  logger.emit(event.outcome === 'ok' ? 'info' : 'error', {
    event: 'db.smoke.completed',
    procedure: 'dbSmoke',
    route: '/trpc/dbSmoke',
    ...metadata,
    ...event,
  })
}

export function statusFromTrpcError(error: TRPCError | undefined): number {
  return error ? getHTTPStatusCodeFromError(error) : 200
}

export function toSafeLogRecord(event: Record<string, unknown>): {
  [key: string]: JsonValue
} {
  const record: { [key: string]: JsonValue } = {}

  for (const [key, value] of Object.entries(event)) {
    if (value === undefined || sensitiveFieldPattern.test(key)) continue
    record[key] = sanitizeLogValue(value)
  }

  return record
}

function sanitizeLogValue(value: unknown): JsonValue {
  if (value === null) return null

  if (typeof value === 'string') {
    return redactSensitiveString(value)
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (value instanceof Error) {
    return {
      name: redactSensitiveString(value.name),
      message: redactSensitiveString(value.message),
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item))
  }

  if (typeof value === 'object') {
    const nested: { [key: string]: JsonValue } = {}

    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue === undefined || sensitiveFieldPattern.test(key)) continue
      nested[key] = sanitizeLogValue(nestedValue)
    }

    return nested
  }

  return String(value)
}

function redactSensitiveString(value: string): string {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[redacted-database-url]')
    .replace(/\buser_[A-Za-z0-9_-]+\b/g, '[redacted-clerk-user-id]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, 'Bearer [redacted-token]')
}

function generateRequestId(): string {
  const randomUUID = globalThis.crypto?.randomUUID

  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto)
  }

  return `req_${Date.now().toString(36)}`
}
