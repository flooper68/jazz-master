// Request context for tRPC procedures. Deliberately empty for now: no
// database, no auth, no session (TASK-023 scope guard). TASK-025 adds the
// Hyperdrive client here when a feature needs server persistence.
export function createContext() {
  return {}
}

export type Context = Awaited<ReturnType<typeof createContext>>
