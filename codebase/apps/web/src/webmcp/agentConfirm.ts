/**
 * An agent's tool call that would change or delete something of the user's
 * waits here until the user says yes or no on the page. The platform's drafts
 * have had and lost their own confirmation step, so the app keeps its own:
 * nothing destructive happens on an agent's word alone.
 */

export interface AgentRequest {
  id: number
  /** What the agent wants to do, as a question to the user: "Delete the routine “Warm-up”?" */
  question: string
  /** What saying yes means, in a sentence. */
  consequence: string
}

export interface AgentConfirm {
  subscribe(listener: () => void): () => void
  /** The request the user is looking at, or null. Later ones wait their turn. */
  getSnapshot(): AgentRequest | null
  /** Resolves true only when the user allows it; an abort, a timeout or a refusal is false. */
  ask(request: Omit<AgentRequest, 'id'>, signal?: AbortSignal): Promise<boolean>
  answer(id: number, allowed: boolean): void
}

/** How long a question may stand on the page unanswered before it counts as refused. */
const AGENT_REQUEST_TIMEOUT_MS = 60_000

export function createAgentConfirm(timeoutMs = AGENT_REQUEST_TIMEOUT_MS): AgentConfirm {
  const listeners = new Set<() => void>()
  let waiting: { request: AgentRequest; settle: (allowed: boolean) => void }[] = []
  let nextId = 1
  // The clock runs only for the question the user can see: one still waiting its turn has not been refused by anyone.
  let shown: { id: number; timer: ReturnType<typeof setTimeout> } | null = null

  function changed(): void {
    const head = waiting[0]?.request.id ?? null
    if (shown && shown.id !== head) {
      clearTimeout(shown.timer)
      shown = null
    }
    if (head !== null && !shown) shown = { id: head, timer: setTimeout(() => settle(head, false), timeoutMs) }
    for (const listener of listeners) listener()
  }

  function settle(id: number, allowed: boolean): void {
    const entry = waiting.find((candidate) => candidate.request.id === id)
    if (!entry) return
    waiting = waiting.filter((candidate) => candidate !== entry)
    entry.settle(allowed)
    changed()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => waiting[0]?.request ?? null,
    ask(request, signal) {
      if (signal?.aborted) return Promise.resolve(false)
      const id = nextId++
      return new Promise<boolean>((resolve) => {
        const onAbort = () => settle(id, false)
        signal?.addEventListener('abort', onAbort)
        waiting = [
          ...waiting,
          {
            request: { id, ...request },
            settle(allowed) {
              signal?.removeEventListener('abort', onAbort)
              resolve(allowed)
            },
          },
        ]
        changed()
      })
    },
    answer: settle,
  }
}

/** The page's one queue: the tools ask it, the prompt in the layout answers it. */
export const agentConfirm = createAgentConfirm()
