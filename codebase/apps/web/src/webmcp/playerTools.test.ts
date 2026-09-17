import { describe, expect, it, vi } from 'vitest'
import { createModelContextShim } from './devModelContext'
import { activePlayerState, offerPlayer, playerPageTools, type PlayerControls, type PlayerState } from './playerTools'

function player(overrides: Partial<PlayerState> = {}): PlayerControls & { now: PlayerState } {
  const controls = {
    now: {
      exerciseId: 'scales-major-open-c', title: 'C major', playing: false, waitingForSound: false, tempoBpm: 80,
      exerciseTempoBpm: 80, bar: 1, beat: 1, passesDone: 0, finished: false, soundAvailable: true, ...overrides,
    } as PlayerState,
    state: () => controls.now,
    play: vi.fn(() => { controls.now = { ...controls.now, playing: true } }),
    pause: vi.fn(() => { controls.now = { ...controls.now, playing: false } }),
    stop: vi.fn(() => { controls.now = { ...controls.now, playing: false, bar: 1, beat: 1 } }),
    setTempo: vi.fn((bpm: number) => { controls.now = { ...controls.now, tempoBpm: bpm } }),
  }
  return controls
}

const noWait = () => Promise.resolve()
const call = (controls: PlayerControls, name: string, args: unknown = {}) =>
  playerPageTools(controls, noWait).find((tool) => tool.name === name)!.execute(args, {})

describe('the player tools', () => {
  it('exist only while a player is on the page', async () => {
    const shim = createModelContextShim()
    expect(activePlayerState()).toBeNull()
    const withdraw = offerPlayer(player(), shim)
    expect((await shim.getTools()).map(({ name }) => name)).toEqual(['get_player_state', 'player_play', 'player_pause', 'player_stop', 'player_set_tempo'])
    expect(activePlayerState()?.exerciseId).toBe('scales-major-open-c')
    withdraw()
    expect(await shim.getTools()).toEqual([])
    expect(activePlayerState()).toBeNull()
  })

  it('play, pause and stop press the player\'s own controls and report what it is doing', async () => {
    const controls = player()
    expect(await call(controls, 'player_play')).toMatchObject({ status: 'ok', player: { playing: true } })
    expect(await call(controls, 'player_pause')).toMatchObject({ status: 'ok', player: { playing: false } })
    expect(await call(controls, 'player_stop')).toMatchObject({ status: 'ok', player: { bar: 1, beat: 1 } })
    expect(controls.play).toHaveBeenCalledOnce()
    expect(controls.pause).toHaveBeenCalledOnce()
    expect(controls.stop).toHaveBeenCalledOnce()
  })

  it('says so when the browser holds the sound back until the user clicks', async () => {
    const controls = player()
    controls.play = vi.fn(() => { controls.now = { ...controls.now, playing: true, waitingForSound: true } })
    const answer = await call(controls, 'player_play')
    expect(answer.status).toBe('waiting_for_user')
    expect(answer.message).toMatch(/click anywhere/)
  })

  it('gives the sound a moment to start before saying the browser holds it back', async () => {
    const controls = player()
    controls.play = vi.fn(() => { controls.now = { ...controls.now, playing: true, waitingForSound: true } })
    let waits = 0
    const slowStart = async () => {
      waits += 1
      if (waits === 3) controls.now = { ...controls.now, waitingForSound: false }
    }
    const answer = await playerPageTools(controls, slowStart).find((tool) => tool.name === 'player_play')!.execute({}, {})
    expect(answer).toMatchObject({ status: 'ok', player: { playing: true, waitingForSound: false } })
    expect(waits).toBe(3)
  })

  it('sets a tempo within the player\'s range and refuses anything else', async () => {
    const controls = player()
    expect(await call(controls, 'player_set_tempo', { bpm: 120 })).toMatchObject({ status: 'ok', player: { tempoBpm: 120, exerciseTempoBpm: 80 } })
    for (const bad of [{ bpm: 5 }, { bpm: 1000 }, { bpm: 'fast' }, { bpm: 90, extra: 1 }, {}, null]) {
      expect((await call(controls, 'player_set_tempo', bad)).status).toBe('invalid')
    }
    expect(controls.setTempo).toHaveBeenCalledOnce()
  })
})
