import { describe, expect, it } from 'vitest'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { createPreview } from './preview'

function exercise(id: string, notes: Exercise['notes'] = [
  { string: 5, fret: 3, beats: 1 },
  { string: 4, fret: 0, beats: 1 },
]): Exercise {
  return { id, title: id, area: 'scales', level: 1, tempoBpm: 60, duration: { kind: 'repetitions', count: 4 }, notes }
}

function harness(audioAvailable = true) {
  const clock = { now: 0 }
  const log: string[] = []
  const ticks = new Map<number, () => void>()
  let timers = 0
  let engines = 0
  const createAudio = (): PlayerAudio => {
    if (!audioAvailable) throw new Error('no audio')
    engines += 1
    return engine
  }
  const engine: PlayerAudio = {
    get now() {
      return clock.now
    },
    state: 'running',
    async resume() {},
    click: () => log.push('click'),
    pluck: (time, midi) => log.push(`note ${time.toFixed(2)} m${midi}`),
    silence: () => log.push('silence'),
    cancelFrom: () => {},
    setVoice: (voice) => log.push(`guitar ${voice}`),
    prime: () => {},
    dispose: () => log.push('dispose'),
  }
  const preview = createPreview({
    createAudio,
    now: () => clock.now * 1000,
    setInterval: ((fn: () => void) => {
      timers += 1
      ticks.set(timers, fn)
      return timers as unknown as ReturnType<typeof setInterval>
    }) as typeof setInterval,
    clearInterval: ((id: number) => ticks.delete(id)) as typeof clearInterval,
  })
  const heard: Array<string | null> = []
  preview.subscribe(() => heard.push(preview.getPlayingId()))
  function advance(seconds: number, step = 0.025) {
    const target = clock.now + seconds
    while (clock.now < target - 1e-9) {
      clock.now = Math.min(clock.now + step, target)
      for (const tick of [...ticks.values()]) tick()
    }
  }
  return { preview, log, heard, advance, engines: () => engines }
}

describe('createPreview', () => {
  it('plays the line once on the chosen guitar — no count-in, no click — and then falls silent', () => {
    const { preview, log, heard, advance } = harness()
    preview.toggle(exercise('a'), 'nylon')
    expect(preview.getPlayingId()).toBe('a')
    advance(3)
    expect(log).toEqual(['guitar nylon', 'note 0.05 m48', 'note 1.05 m50'])
    expect(preview.getPlayingId()).toBeNull()
    expect(heard).toEqual(['a', null])
  })

  it('stops when the same exercise is pressed again', () => {
    const { preview, log, advance } = harness()
    preview.toggle(exercise('a'), 'nylon')
    advance(0.5)
    preview.toggle(exercise('a'), 'nylon')
    expect(preview.getPlayingId()).toBeNull()
    advance(3)
    expect(log).toEqual(['guitar nylon', 'note 0.05 m48', 'silence', 'silence'])
  })

  it('lets only one exercise sound: starting another stops the first', () => {
    const { preview, log, heard, advance } = harness()
    preview.toggle(exercise('a'), 'nylon')
    advance(0.5)
    preview.toggle(exercise('b'), 'nylon')
    expect(preview.getPlayingId()).toBe('b')
    advance(3)
    // The first never reaches its second note.
    expect(log.filter((entry) => entry.startsWith('note'))).toEqual(['note 0.05 m48', 'note 0.55 m48', 'note 1.55 m50'])
    expect(heard).toEqual(['a', null, 'b', null])
  })

  it('can be pressed again once the line has ended, on the same engine, its samples still loaded', () => {
    const { preview, log, advance, engines } = harness()
    preview.toggle(exercise('a'), 'nylon')
    advance(3)
    // The last note is left to ring out: nothing is silenced when the line ends.
    expect(log).not.toContain('silence')
    preview.toggle(exercise('a'), 'nylon')
    expect(preview.getPlayingId()).toBe('a')
    expect(engines()).toBe(1)
    expect(log).not.toContain('dispose')
  })

  it('still runs its course, silently, where there is no audio', () => {
    const { preview, heard, advance } = harness(false)
    preview.toggle(exercise('a'), 'nylon')
    expect(preview.getPlayingId()).toBe('a')
    advance(3)
    expect(heard).toEqual(['a', null])
  })

  it('ignores an exercise with nothing to play', () => {
    const { preview, heard } = harness()
    preview.toggle(exercise('empty', []), 'nylon')
    expect(preview.getPlayingId()).toBeNull()
    expect(heard).toEqual([])
  })

  it('lets the audio go when disposed, and starts afresh if pressed again', () => {
    const { preview, log, advance, engines } = harness()
    preview.toggle(exercise('a'), 'nylon')
    advance(0.5)
    preview.dispose()
    expect(preview.getPlayingId()).toBeNull()
    expect(log.at(-1)).toBe('dispose')
    advance(3)
    expect(log.filter((entry) => entry.startsWith('note'))).toHaveLength(1)
    preview.toggle(exercise('a'), 'nylon')
    expect(engines()).toBe(2)
  })
})
