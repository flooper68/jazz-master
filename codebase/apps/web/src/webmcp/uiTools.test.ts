import { describe, expect, it, vi } from 'vitest'
import type { Routine } from '../appData/routine'
import { EXERCISES } from '../content'
import type { PlayerState } from './playerTools'
import { uiPageTools, type UiToolDeps } from './uiTools'

const routine: Routine = { id: 'r1', name: 'Warm-up', items: [{ exerciseId: EXERCISES[0].id }, { exerciseId: 'user-gone' }, { exerciseId: EXERCISES[1].id }] }

function setUp(overrides: Partial<UiToolDeps> = {}) {
  const deps: UiToolDeps = {
    location: () => ({ path: '/routines', search: {} }),
    go: vi.fn(async () => {}),
    exercises: async () => EXERCISES,
    routines: async () => [routine],
    player: () => null,
    confirm: vi.fn(async () => true),
    ...overrides,
  }
  const tools = uiPageTools(deps)
  return { deps, call: (name: string, args: unknown = {}) => tools.find((tool) => tool.name === name)!.execute(args, {}) }
}

describe('the app tools', () => {
  it('say where the user is, and that no player is up', async () => {
    expect(await setUp().call('get_current_view')).toMatchObject({ status: 'ok', page: 'routines', path: '/routines', player: null, pages: ['home', 'exercises', 'routines', 'new_routine', 'history'] })
    const onStage = setUp({ location: () => ({ path: '/session', search: { x: 'a,b', r: 'r1' } }) })
    expect(await onStage.call('get_current_view')).toMatchObject({ page: 'session', search: { x: 'a,b', r: 'r1' } })
    expect(await setUp({ location: () => ({ path: '/exercises/abc', search: {} }) }).call('get_current_view')).toMatchObject({ page: 'exercise' })
    expect(await setUp({ location: () => ({ path: '/routines/r1/edit', search: {} }) }).call('get_current_view')).toMatchObject({ page: 'edit_routine' })
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

  it('start a routine as its Start button does, skipping an exercise deleted since', async () => {
    const { call, deps } = setUp()
    const playable = [EXERCISES[0].id, EXERCISES[1].id]
    expect(await call('start_routine', { routineId: 'r1' })).toEqual({ status: 'ok', routine: { id: 'r1', name: 'Warm-up' }, exerciseIds: playable })
    expect(deps.go).toHaveBeenCalledWith({ session: { x: playable.join(','), r: 'r1' } })
  })

  it('ask the user before leaving a half-made routine or a run in full flow, and stay put on a no', async () => {
    const playing = { playing: true } as PlayerState
    for (const where of [{ location: () => ({ path: '/routines/new', search: {} }) }, { location: () => ({ path: '/routines/r1/edit', search: {} }) }, { player: () => playing }]) {
      const refusing = setUp({ ...where, confirm: vi.fn(async () => false) })
      expect(await refusing.call('navigate', { page: 'home' })).toMatchObject({ status: 'refused' })
      expect(await refusing.call('open_exercise', { exerciseId: EXERCISES[0].id })).toMatchObject({ status: 'refused' })
      expect(await refusing.call('start_routine', { routineId: 'r1' })).toMatchObject({ status: 'refused' })
      expect(refusing.deps.go).not.toHaveBeenCalled()

      const allowing = setUp(where)
      expect(await allowing.call('navigate', { page: 'home' })).toEqual({ status: 'ok', page: 'home' })
      expect(allowing.deps.confirm).toHaveBeenCalledOnce()
    }
  })

  it('do not ask when nothing would be lost, or when the call was wrong anyway', async () => {
    const { call, deps } = setUp({ player: () => ({ playing: false }) as PlayerState })
    await call('navigate', { page: 'home' })
    const editing = setUp({ location: () => ({ path: '/routines/new', search: {} }) })
    await editing.call('open_exercise', { exerciseId: 'nope' })
    expect(deps.confirm).not.toHaveBeenCalled()
    expect(editing.deps.confirm).not.toHaveBeenCalled()
  })

  it('report the player that is on the page', async () => {
    const onStage = { exerciseId: EXERCISES[0].id, playing: false } as PlayerState
    expect(await setUp({ player: () => onStage }).call('get_current_view')).toMatchObject({ player: { exerciseId: EXERCISES[0].id } })
  })

  it('say why a routine cannot be started', async () => {
    expect((await setUp().call('start_routine', { routineId: 'nope' })).status).toBe('not_found')
    expect((await setUp({ routines: async () => null }).call('start_routine', { routineId: 'r1' })).status).toBe('error')
    expect((await setUp({ exercises: async () => [] }).call('start_routine', { routineId: 'r1' })).status).toBe('empty')
    expect((await setUp().call('start_routine', {})).status).toBe('invalid')
  })
})
