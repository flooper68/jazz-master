import { afterEach, describe, expect, it, vi } from 'vitest'
import { createModelContextShim, installDevModelContext } from './devModelContext'
import { pageModelContext, registerPageTools, type ModelContextLike, type PageTool } from './modelContext'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }

function tool(name: string, execute: PageTool['execute'] = async () => ({ status: 'ok' })): PageTool {
  return { name, title: name, description: `Does ${name}.`, inputSchema: { type: 'object', properties: {} }, annotations: READ_ONLY, execute }
}

afterEach(() => {
  delete (document as { modelContext?: unknown }).modelContext
})

describe('registerPageTools', () => {
  it('does nothing, and says nothing, in a browser without WebMCP', () => {
    expect(pageModelContext()).toBeNull()
    expect(() => registerPageTools([tool('a')])()).not.toThrow()
  })

  it('offers the tools until they are taken back', async () => {
    const shim = createModelContextShim()
    const withdraw = registerPageTools([tool('a'), tool('b')], shim)
    expect((await shim.getTools()).map(({ name }) => name)).toEqual(['a', 'b'])
    withdraw()
    expect(await shim.getTools()).toEqual([])
  })

  it('takes tools back by name from a browser on the older draft', () => {
    const older: ModelContextLike = { registerTool: vi.fn(), unregisterTool: vi.fn() }
    registerPageTools([tool('a')], older)()
    expect(older.unregisterTool).toHaveBeenCalledWith('a')
  })

  it('shrugs off a registration the browser refuses, whether it throws or rejects', async () => {
    const throwing: ModelContextLike = { registerTool: () => { throw new DOMException('taken', 'InvalidStateError') } }
    const rejecting: ModelContextLike = { registerTool: () => Promise.reject(new DOMException('taken', 'InvalidStateError')) }
    expect(() => registerPageTools([tool('a')], throwing)).not.toThrow()
    expect(() => registerPageTools([tool('a')], rejecting)).not.toThrow()
    // A rejection left unhandled would fail the run.
    await Promise.resolve()
  })

  it('warns a developer of a refused tool, but not of one it took back itself mid-registration', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    registerPageTools([tool('a')], { registerTool: () => Promise.reject(new DOMException('taken', 'InvalidStateError')) })
    // Chrome rejects a registration that is aborted before it completes.
    const pending: ModelContextLike = { registerTool: (_tool, options) => new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))) }
    registerPageTools([tool('b')], pending)()
    await new Promise((resolve) => setTimeout(resolve))
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('"a"')
    warn.mockRestore()
  })

  it('lets the same tools be offered again after they were taken back, as StrictMode does', async () => {
    const shim = createModelContextShim()
    registerPageTools([tool('a')], shim)()
    registerPageTools([tool('a')], shim)
    expect((await shim.getTools()).map(({ name }) => name)).toEqual(['a'])
  })
})

describe('the development stand-in', () => {
  it('lists tools the way Chrome does: schema as JSON text, with the page they belong to', async () => {
    const shim = createModelContextShim()
    registerPageTools([tool('a')], shim)
    const [listed] = await shim.getTools()
    expect(listed).toMatchObject({ name: 'a', description: 'Does a.', annotations: READ_ONLY, origin: window.location.origin })
    expect(listed.window).toBe(window)
    expect(JSON.parse(listed.inputSchema)).toEqual({ type: 'object', properties: {} })
  })

  it('calls a tool with input as JSON text, as Chrome takes it, or as an object, as the draft says', async () => {
    const shim = createModelContextShim()
    const execute = vi.fn(async (args: unknown) => ({ status: 'ok', echoed: args }))
    registerPageTools([tool('echo', execute)], shim)
    expect(JSON.parse(await shim.executeTool({ name: 'echo' }, '{"n":1}'))).toEqual({ status: 'ok', echoed: { n: 1 } })
    expect(JSON.parse(await shim.executeTool({ name: 'echo' }, { n: 2 }))).toEqual({ status: 'ok', echoed: { n: 2 } })
    expect(JSON.parse(await shim.executeTool({ name: 'echo' }))).toEqual({ status: 'ok', echoed: {} })
  })

  it('hands a tool the signal of a call the agent may give up on', async () => {
    const shim = createModelContextShim()
    const execute = vi.fn<PageTool['execute']>(async () => ({ status: 'ok' }))
    registerPageTools([tool('slow', execute)], shim)
    const { signal } = new AbortController()
    await shim.executeTool({ name: 'slow' }, '{}', { signal })
    expect(execute).toHaveBeenCalledWith({}, { signal })
  })

  it('refuses a call to a tool that is not registered, and a second tool of the same name', async () => {
    const shim = createModelContextShim()
    await expect(shim.executeTool({ name: 'ghost' })).rejects.toThrow(/No tool named "ghost"/)
    await shim.registerTool(tool('a'))
    await expect(shim.registerTool(tool('a'))).rejects.toThrow(/already registered/)
  })

  it('is never installed over a model context the page already has', () => {
    const real: ModelContextLike = { registerTool: vi.fn() }
    Object.defineProperty(document, 'modelContext', { value: real, configurable: true })
    installDevModelContext()
    expect(pageModelContext()).toBe(real)
  })

  it('gives a browser without WebMCP a model context, once', () => {
    installDevModelContext()
    const installed = pageModelContext()
    expect(installed).not.toBeNull()
    installDevModelContext()
    expect(pageModelContext()).toBe(installed)
  })
})
