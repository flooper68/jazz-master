import type { AgentToolDescriptor } from '../agentTools/descriptors'
import { pageModelContext, type ModelContextLike, type PlatformTool } from './modelContext'

/**
 * A stand-in with the platform's shape, for browsers that do not have WebMCP
 * yet: development and the e2e suite use it so the tools can be listed and
 * called. It copies what Chrome does (checked against Chrome 152 with
 * `--enable-features=WebMCPTesting`), which is also what Playwright's WebMCP
 * support reads: `getTools()` gives the input schema as JSON text and
 * `executeTool()` takes its input as JSON text. The draft says objects, so an
 * object is taken too. It lives apart from the adapter so that a production
 * build, which never installs it, does not carry it either.
 */

interface ShimRegisteredTool {
  name: string
  title: string
  description: string
  inputSchema: string
  annotations: AgentToolDescriptor['annotations']
  origin: string
  window: Window
}

/** The shim also answers the two calls an agent's side of the platform API makes. */
export interface ModelContextShim extends ModelContextLike {
  getTools(): Promise<ShimRegisteredTool[]>
  executeTool(tool: { name: string }, input?: unknown, options?: { signal?: AbortSignal }): Promise<string>
}

export function createModelContextShim(): ModelContextShim {
  const tools = new Map<string, PlatformTool>()
  return {
    async registerTool(tool, options) {
      if (options?.signal?.aborted) return
      if (tools.has(tool.name)) throw new DOMException(`A tool named "${tool.name}" is already registered`, 'InvalidStateError')
      tools.set(tool.name, tool)
      options?.signal?.addEventListener('abort', () => {
        if (tools.get(tool.name) === tool) tools.delete(tool.name)
      })
    },
    async getTools() {
      return [...tools.values()].map(({ name, title, description, inputSchema, annotations }) => ({
        name,
        title,
        description,
        inputSchema: JSON.stringify(inputSchema),
        annotations,
        origin: window.location.origin,
        window,
      }))
    },
    async executeTool({ name }, input, options) {
      const tool = tools.get(name)
      if (!tool) throw new DOMException(`No tool named "${name}" is registered`, 'NotFoundError')
      const args: unknown = typeof input === 'string' ? (input === '' ? {} : JSON.parse(input)) : (input ?? {})
      return JSON.stringify((await tool.execute(args, options)) ?? null)
    },
  }
}

/** Give a browser without WebMCP the stand-in; never over the real thing. Call it from development code only. */
export function installDevModelContext(): void {
  if (pageModelContext() || typeof document === 'undefined') return
  Object.defineProperty(document, 'modelContext', { value: createModelContextShim(), configurable: true })
}
