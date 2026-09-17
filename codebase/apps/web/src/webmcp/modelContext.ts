import type { AgentToolDescriptor } from '../agentTools/descriptors'

/**
 * WebMCP: the page offers tools to an AI agent running in the user's own
 * browser. This is the only file that knows the platform API, because the API
 * is still moving — it lives on `document.modelContext` since Chrome 150 and
 * on `navigator.modelContext` before that, behind an origin trial or a flag.
 * Where the browser has neither, nothing is registered and the app is exactly
 * what it was.
 */

/** What a tool answers with: a plain object an agent can read, always carrying a `status`. */
export type PageToolAnswer = Record<string, unknown> & { status: string }

export interface PageTool extends AgentToolDescriptor {
  execute(args: unknown, options: { signal?: AbortSignal }): Promise<PageToolAnswer>
}

export interface PlatformTool extends AgentToolDescriptor {
  execute(args: unknown, options?: { signal?: AbortSignal }): Promise<unknown>
}

/** The part of the platform's ModelContext this app uses, across the drafts that have shipped. */
export interface ModelContextLike {
  registerTool(tool: PlatformTool, options?: { signal?: AbortSignal }): Promise<void> | void
  /** Drafts before the AbortSignal option took tools back by name. */
  unregisterTool?(name: string): void
}

type WithModelContext = { modelContext?: ModelContextLike }

/** The browser's model context, or null where WebMCP does not exist. */
export function pageModelContext(): ModelContextLike | null {
  if (typeof document === 'undefined') return null
  return (document as Document & WithModelContext).modelContext ?? (navigator as Navigator & WithModelContext).modelContext ?? null
}

/** A refused tool is no fault of the user's, so it is said only where a developer is looking. */
function refused(name: string, reason: unknown): void {
  if (import.meta.env.DEV) console.warn(`WebMCP: the browser refused the tool "${name}"`, reason)
}

/**
 * Offer tools for as long as the caller wants them; the function returned
 * takes them back. A registration the browser refuses — a name already
 * taken, a permissions policy — costs the agent that tool and the user nothing.
 */
export function registerPageTools(tools: readonly PageTool[], modelContext: ModelContextLike | null = pageModelContext()): () => void {
  if (!modelContext || tools.length === 0) return () => {}
  const withdrawn = new AbortController()
  for (const { execute, ...descriptor } of tools) {
    const tool: PlatformTool = { ...descriptor, execute: (args, options) => execute(args, { signal: options?.signal }) }
    try {
      void Promise.resolve(modelContext.registerTool(tool, { signal: withdrawn.signal })).catch((reason: unknown) => {
        // Taking a tool back before the browser has finished registering it rejects too; that one is our own doing.
        if (!withdrawn.signal.aborted) refused(tool.name, reason)
      })
    } catch (reason) {
      // An older draft throws where the newer one rejects.
      refused(tool.name, reason)
    }
  }
  return () => {
    withdrawn.abort()
    for (const { name } of tools) {
      try {
        modelContext.unregisterTool?.(name)
      } catch {
        // Already gone with the signal.
      }
    }
  }
}
