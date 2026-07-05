/**
 * Typed localStorage persistence layer (ADR-002, TASK-008).
 *
 * Every feature persists through a `Store<T>` created by `defineStore` — never
 * through `localStorage` directly. This module is the seam where a real
 * backend would replace the implementation without touching feature code.
 *
 * Values live under `jazz-master:<name>` wrapped in a `{ version, data }`
 * envelope so each store can evolve its schema via `migrate`.
 */

const NAMESPACE = 'jazz-master'

export interface StoreConfig<T> {
  /** Unique store name; becomes the localStorage key `jazz-master:<name>`. */
  name: string
  /** Current schema version, starting at 1. Bump when the shape of T changes. */
  version: number
  /** Factory (not a constant) so callers never share one mutable default. */
  defaultValue: () => T
  /**
   * Upgrade data persisted under an older version to the current shape.
   * Receives the raw persisted data — it may predate any of today's types.
   * Throwing (or omitting this while old data exists) falls back to the default.
   */
  migrate?: (persisted: unknown, fromVersion: number) => T
}

export interface Store<T> {
  readonly name: string
  /** Never throws: missing, corrupt, or unmigratable data yields the default. */
  get(): T
  /** Never throws: a failed write (quota, disabled storage) is logged and dropped. */
  set(value: T): void
  update(updater: (current: T) => T): void
  /** Remove the persisted value; subsequent `get` returns the default. */
  reset(): void
}

interface Envelope {
  version: number
  data: unknown
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    typeof (value as { version: unknown }).version === 'number'
  )
}

export function defineStore<T>(config: StoreConfig<T>): Store<T> {
  const key = `${NAMESPACE}:${config.name}`

  function write(value: T): void {
    const envelope: Envelope = { version: config.version, data: value }
    try {
      localStorage.setItem(key, JSON.stringify(envelope))
    } catch (error) {
      console.warn(`[storage] failed to write "${key}"`, error)
    }
  }

  function get(): T {
    let raw: string | null
    try {
      raw = localStorage.getItem(key)
    } catch (error) {
      console.warn(`[storage] failed to read "${key}"`, error)
      return config.defaultValue()
    }
    if (raw === null) return config.defaultValue()

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.warn(`[storage] corrupt JSON in "${key}" — using default`)
      return config.defaultValue()
    }
    if (!isEnvelope(parsed)) {
      console.warn(`[storage] malformed envelope in "${key}" — using default`)
      return config.defaultValue()
    }

    if (parsed.version === config.version) return parsed.data as T

    if (parsed.version < config.version && config.migrate) {
      try {
        const migrated = config.migrate(parsed.data, parsed.version)
        write(migrated)
        return migrated
      } catch (error) {
        console.warn(`[storage] migration of "${key}" from v${parsed.version} failed — using default`, error)
        return config.defaultValue()
      }
    }

    // Version from the future (rolled-back deploy) or old data with no migration.
    console.warn(
      `[storage] "${key}" has unusable version ${parsed.version} (current ${config.version}) — using default`,
    )
    return config.defaultValue()
  }

  return {
    name: config.name,
    get,
    set: write,
    update(updater) {
      write(updater(get()))
    },
    reset() {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`[storage] failed to reset "${key}"`, error)
      }
    },
  }
}
