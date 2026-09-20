import { describe, expect, it, vi } from 'vitest'
import { EXERCISES } from '../content'
import type { PlayerState } from './playerTools'
import { uiPageTools, type UiToolDeps } from './uiTools'

function setUp(overrides: Partial<UiToolDeps> = {}) {
  const deps: UiToolDeps = {
    location: () => ({ path: '/exercises', search: {} }),
    go: vi.fn(async () => {}),
    exercises: async () => EXERCISES,
    player: () => null,
    confirm: vi.fn(async () => true),
    ...overrides,
  }
  const tools = uiPageTools(deps)
  return { deps, call: (name: string, args: unknown = {}) => tools.find((tool) => tool.name === name)!.execute(args, {}) }
}

describe('the app tools', () => {
  it('say where the user is, and that no player is up', async () => {
    expect(await setUp().call('get_current_view')).toMatchObject({ status: 'ok', page: 'exercises', path: '/exercises', player: null, pages: ['home', 'teacher', 'exercises', 'history'] })
    const onStage = setUp({ location: () => ({ path: '/session', search: { x: 'a,b' } }) })
    expect(await onStage.call('get_current_view')).toMatchObject({ page: 'session', search: { x: 'a,b' } })
    expect(await setUp({ location: () => ({ path: '/exercises/abc', search: {} }) }).call('get_current_view')).toMatchObject({ page: 'exercise' })
    expect(await setUp({ location: () => ({ path: '/nowhere', search: {} }) }).call('get_current_view')).toMatchObject({ page: 'unknown' })
  })

  it('go to a named page and nowhere else', async () => {
    const { call, deps } = setUp()
    expect(await call('navigate', { page: 'history' })).toEqual({ status: 'ok', page: 'history' })
    expect(deps.go).toHaveBeenCalledWith({ page: 'history' })
    for (const bad of [{ page: 'https://evil.example' }, { page: '/app/../mcp' }, { page: 'home', to: '/mcp' }, {}, null]) {
      expect((await call('navigate', bad)).status).toBe('invalid')
    }
    expect(deps.go).toHaveBeenCalledOnce()
  })

  it('open an exercise that exists, and only that', async () => {
    const { call, deps } = setUp()
    expect(await call('open_exercise', { exerciseId: EXERCISES[0].id })).toEqual({ status: 'ok', exercise: { id: EXERCISES[0].id, title: EXERCISES[0].title } })
    expect(deps.go).toHaveBeenCalledWith({ exerciseId: EXERCISES[0].id })
    expect((await call('open_exercise', { exerciseId: 'nope' })).status).toBe('not_found')
    expect((await call('open_exercise', {})).status).toBe('invalid')
    expect(deps.go).toHaveBeenCalledOnce()
  })

  it('practise one exercise as a session of one, as its Play button does', async () => {
    const { call, deps } = setUp()
    expect(await call('start_exercise', { exerciseId: EXERCISES[0].id })).toEqual({ status: 'ok', exercise: { id: EXERCISES[0].id, title: EXERCISES[0].title } })
    expect(deps.go).toHaveBeenCalledWith({ session: { x: EXERCISES[0].id } })
    expect((await call('start_exercise', { exerciseId: 'nope' })).status).toBe('not_found')
    expect((await call('start_exercise', {})).status).toBe('invalid')
  })

  it('ask the user before leaving a run in full flow, and stay put on a no', async () => {
    const playing = { playing: true } as PlayerState
    const refusing = setUp({ player: () => playing, confirm: vi.fn(async () => false) })
    expect(await refusing.call('navigate', { page: 'home' })).toMatchObject({ status: 'refused' })
    expect(await refusing.call('open_exercise', { exerciseId: EXERCISES[0].id })).toMatchObject({ status: 'refused' })
    expect(await refusing.call('start_exercise', { exerciseId: EXERCISES[0].id })).toMatchObject({ status: 'refused' })
    expect(refusing.deps.go).not.toHaveBeenCalled()

    const allowing = setUp({ player: () => playing })
    expect(await allowing.call('navigate', { page: 'home' })).toEqual({ status: 'ok', page: 'home' })
    expect(allowing.deps.confirm).toHaveBeenCalledOnce()
  })

  it('do not ask when nothing would be lost, or when the call was wrong anyway', async () => {
    const { call, deps } = setUp({ player: () => ({ playing: false }) as PlayerState })
    await call('navigate', { page: 'home' })
    const paused = setUp({ player: () => ({ playing: false }) as PlayerState })
    await paused.call('open_exercise', { exerciseId: 'nope' })
    expect(deps.confirm).not.toHaveBeenCalled()
    expect(paused.deps.confirm).not.toHaveBeenCalled()
  })

  it('report the player that is on the page', async () => {
    const onStage = { exerciseId: EXERCISES[0].id, playing: false } as PlayerState
    expect(await setUp({ player: () => onStage }).call('get_current_view')).toMatchObject({ player: { exerciseId: EXERCISES[0].id } })
  })
})
