import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAgentConfirm } from './agentConfirm'

const request = { question: 'Delete “Warm-up”?', consequence: 'Gone for good.' }

afterEach(() => vi.useRealTimers())

describe('agentConfirm', () => {
  it('waits for the user, and is true only on Allow', async () => {
    const confirm = createAgentConfirm()
    const allowed = confirm.ask(request)
    const refused = confirm.ask({ ...request, question: 'Second?' })
    expect(confirm.getSnapshot()).toMatchObject(request)
    confirm.answer(confirm.getSnapshot()!.id, true)
    // The next request takes its turn.
    expect(confirm.getSnapshot()?.question).toBe('Second?')
    confirm.answer(confirm.getSnapshot()!.id, false)
    expect(await allowed).toBe(true)
    expect(await refused).toBe(false)
    expect(confirm.getSnapshot()).toBeNull()
  })

  it('tells the prompt when a request arrives and when it goes', async () => {
    const confirm = createAgentConfirm()
    const listener = vi.fn()
    confirm.subscribe(listener)
    const asked = confirm.ask(request)
    expect(listener).toHaveBeenCalledTimes(1)
    confirm.answer(confirm.getSnapshot()!.id, false)
    await asked
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('counts an unanswered request as refused', async () => {
    vi.useFakeTimers()
    const confirm = createAgentConfirm(1000)
    const asked = confirm.ask(request)
    vi.advanceTimersByTime(1000)
    expect(await asked).toBe(false)
    expect(confirm.getSnapshot()).toBeNull()
  })

  it('starts the clock when a question comes up, not while it waits behind another', async () => {
    vi.useFakeTimers()
    const confirm = createAgentConfirm(1000)
    const first = confirm.ask(request)
    const second = confirm.ask({ ...request, question: 'Second?' })
    vi.advanceTimersByTime(900)
    confirm.answer(confirm.getSnapshot()!.id, true)
    // The second has been asked for 900 ms but seen for none of them.
    vi.advanceTimersByTime(900)
    expect(confirm.getSnapshot()?.question).toBe('Second?')
    vi.advanceTimersByTime(100)
    expect(await first).toBe(true)
    expect(await second).toBe(false)
  })

  it('counts a call the agent gave up on as refused, and takes the question down', async () => {
    const confirm = createAgentConfirm()
    const gaveUp = new AbortController()
    const asked = confirm.ask(request, gaveUp.signal)
    gaveUp.abort()
    expect(await asked).toBe(false)
    expect(confirm.getSnapshot()).toBeNull()
    expect(await confirm.ask(request, gaveUp.signal)).toBe(false)
  })

  it('ignores an answer to a question that is no longer up', async () => {
    const confirm = createAgentConfirm()
    const asked = confirm.ask(request)
    const { id } = confirm.getSnapshot()!
    confirm.answer(id, false)
    confirm.answer(id, true)
    expect(await asked).toBe(false)
  })
})
