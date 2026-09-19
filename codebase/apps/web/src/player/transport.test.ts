import { describe, expect, it } from 'vitest'
import type { PlayerAudio } from '../audio/engine'
import { sampleUrl } from '../audio/voices'
import type { TabNote } from '../content'
import { clampTempo, createTransport, type TransportOptions } from './transport'

const notes: TabNote[] = [
  { string: 5, fret: 3, beats: 1 },
  { string: 4, fret: 0, beats: 1 },
  { string: 4, fret: 2, beats: 1 },
  { string: 4, fret: 3, beats: 1 },
]

function harness(overrides: Partial<TransportOptions> = {}, audioAvailable = true) {
  const clock = { now: 0 }
  const log: string[] = []
  const ticks: Array<() => void> = []
  let state: AudioContextState = 'running'
  const audio: PlayerAudio = {
    get now() {
      return clock.now
    },
    get state() {
      return state
    },
    async resume() {
      state = 'running'
    },
    click(time, accent) {
      log.push(`click ${time.toFixed(2)}${accent ? '!' : ''}`)
    },
    pluck(time, midi, seconds) {
      log.push(`note ${time.toFixed(2)} m${midi} ${seconds.toFixed(2)}s`)
    },
    silence() {
      log.push('silence')
    },
    cancelFrom(time) {
      log.push(`cancel ${time.toFixed(2)}`)
    },
    setVoice(voice) {
      log.push(`guitar ${voice}`)
    },
    prime(midis) {
      log.push(`prime ${midis.join(',')}`)
    },
    dispose() {
      log.push('dispose')
    },
  }
  const transport = createTransport({
    notes,
    beatsPerBar: 4,
    tempoBpm: 60,
    createAudio: () => {
      if (!audioAvailable) throw new Error('no audio')
      return audio
    },
    now: () => clock.now * 1000,
    setInterval: ((fn: () => void) => {
      ticks.push(fn)
      return ticks.length as unknown as ReturnType<typeof setInterval>
    }) as typeof setInterval,
    clearInterval: (() => {
      ticks.length = 0
    }) as typeof clearInterval,
    lookaheadSeconds: 0.1,
    ...overrides,
  })
  const changes: string[] = []
  transport.subscribe(() => {
    const { status, pass, finished, tempoBpm } = transport.getSnapshot()
    changes.push(`${status} p${pass}${finished ? ' done' : ''} ${tempoBpm}`)
  })
  /** Advance the clock in small steps, running the scheduler like the interval would. */
  function advance(seconds: number, step = 0.025) {
    const target = clock.now + seconds
    while (clock.now < target - 1e-9) {
      clock.now = Math.min(clock.now + step, target)
      for (const tick of [...ticks]) tick()
    }
  }
  return { transport, clock, log, changes, advance, setAudioState: (s: AudioContextState) => (state = s) }
}

describe('createTransport', () => {
  it('starts stopped at the beginning with the exercise settings', () => {
    const { transport } = harness({ repeat: 3 })
    expect(transport.getSnapshot()).toMatchObject({
      status: 'stopped',
      tempoBpm: 60,
      repeat: 3,
      loop: null,
      pass: 0,
      finished: false,
      totalBeats: 4,
      audioUnavailable: false,
    })
    expect(transport.position()).toMatchObject({ phase: 'idle', beat: 0, pass: 0, tempoBpm: 60 })
  })

  it('counts in, then schedules clicks and moves the cursor on the audio clock', () => {
    const { transport, log, advance } = harness()
    transport.setCountIn(true)
    transport.play()
    expect(transport.getSnapshot().status).toBe('playing')
    expect(transport.position()).toMatchObject({ phase: 'count-in', beat: 0 })
    expect(transport.position().countInBeatsLeft).toBeCloseTo(4, 1)

    advance(4.1)
    expect(transport.position()).toMatchObject({ phase: 'playing', pass: 0 })
    expect(transport.position().beat).toBeCloseTo(0.05, 1)
    // Four count-in clicks then the first beat of the pass, on time.
    const clicks = log.filter((entry) => entry.startsWith('click'))
    expect(clicks.slice(0, 5)).toEqual(['click 0.05!', 'click 1.05', 'click 2.05', 'click 3.05', 'click 4.05!'])

    advance(2)
    expect(transport.position().beat).toBeCloseTo(2, 1)
    expect(log).not.toContain('silence')
  })

  it('plays the line along only when the voice is on, and the click only when it is on', () => {
    const { transport, log, advance } = harness()
    transport.setCountIn(false)
    transport.setVoice(true)
    transport.setClick(false)
    transport.play()
    advance(2.5)
    expect(log.filter((entry) => entry.startsWith('click'))).toEqual([])
    expect(log.filter((entry) => entry.startsWith('note')).slice(0, 3)).toEqual([
      'note 0.05 m48 1.00s',
      'note 1.05 m50 1.00s',
      'note 2.05 m52 1.00s',
    ])
  })

  it('strums a chord, bass first, a few milliseconds a string, and primes every pitch of it', () => {
    const chord: TabNote[] = [{ string: 5, fret: 3, beats: 4, above: [{ string: 4, fret: 2 }, { string: 3, fret: 0 }] }]
    const { transport, log, advance } = harness({ notes: chord })
    transport.setCountIn(false)
    transport.setClick(false)
    transport.setVoice(true)
    transport.play()
    advance(0.5)
    expect(log.filter((entry) => entry.startsWith('prime')).at(-1)).toBe('prime 48,52,55')
    expect(log.filter((entry) => entry.startsWith('note'))).toEqual([
      'note 0.05 m48 4.00s',
      'note 0.06 m52 4.00s',
      'note 0.07 m55 4.00s',
    ])
  })

  it('pauses where it is, silences, and resumes from there without a count-in', () => {
    const { transport, log, advance } = harness()
    transport.setCountIn(false)
    transport.play()
    advance(1.55)
    transport.pause()
    expect(transport.getSnapshot().status).toBe('stopped')
    expect(log.at(-1)).toBe('silence')
    expect(transport.position()).toMatchObject({ phase: 'idle' })
    expect(transport.position().beat).toBeCloseTo(1.5, 1)

    transport.setCountIn(true)
    log.length = 0
    transport.play()
    advance(0.6)
    expect(transport.position().phase).toBe('count-in')
    advance(3.5)
    expect(transport.position().beat).toBeCloseTo(1.5, 1)
  })

  it('loops a region, counts passes and finishes at the repeat target', () => {
    const { transport, changes, advance } = harness()
    transport.setCountIn(false)
    transport.setLoop({ startBeat: 1, endBeat: 3 })
    transport.setRepeat(2)
    expect(transport.position().beat).toBe(1)

    transport.play()
    advance(1.5)
    expect(transport.position()).toMatchObject({ pass: 0 })
    expect(transport.position().beat).toBeCloseTo(2.45, 1)
    advance(1)
    expect(transport.position()).toMatchObject({ pass: 1 })
    expect(transport.position().beat).toBeCloseTo(1.45, 1)
    advance(1.6)
    expect(transport.getSnapshot()).toMatchObject({ status: 'stopped', finished: true, pass: 2 })
    expect(transport.position()).toMatchObject({ phase: 'idle', beat: 1, pass: 2 })
    expect(changes.at(-1)).toBe('stopped p2 done 60')

    // Playing again starts the count over.
    transport.play()
    expect(transport.getSnapshot()).toMatchObject({ status: 'playing', finished: false, pass: 0 })
  })

  it('climbs the tempo ladder pass by pass', () => {
    const { transport, advance } = harness()
    transport.setCountIn(false)
    transport.setLadder({ stepBpm: 60, everyPasses: 1, toBpm: 180 })
    transport.play()
    advance(4.1)
    expect(transport.position()).toMatchObject({ pass: 1, tempoBpm: 120 })
    advance(2)
    expect(transport.position()).toMatchObject({ pass: 2, tempoBpm: 180 })
    advance(1.34)
    expect(transport.position()).toMatchObject({ pass: 3, tempoBpm: 180 })
  })

  it('seeks while stopped and while playing, snapping into the region', () => {
    const { transport, log, advance } = harness()
    transport.setCountIn(false)
    transport.seek(2.5)
    expect(transport.position().beat).toBe(2.5)
    transport.seek(9)
    expect(transport.position().beat).toBeLessThan(4)
    transport.seek(-1)
    expect(transport.position().beat).toBe(0)

    transport.play()
    advance(1)
    transport.seek(3)
    expect(log).toContain('cancel 1.00')
    advance(0.5)
    expect(transport.position().beat).toBeCloseTo(3.5, 1)
    expect(transport.getSnapshot().status).toBe('playing')
  })

  it('applies a tempo change mid-play from the current position', () => {
    const { transport, advance } = harness()
    transport.setCountIn(false)
    transport.play()
    advance(1.05)
    transport.setTempo(120)
    expect(transport.getSnapshot().tempoBpm).toBe(120)
    advance(1)
    expect(transport.position().beat).toBeCloseTo(3, 1)
    expect(transport.position().tempoBpm).toBe(120)
    transport.setTempo(1000)
    expect(transport.getSnapshot().tempoBpm).toBe(400)
  })

  it('stop rewinds to the region start and forgets passes', () => {
    const { transport, advance } = harness()
    transport.setCountIn(false)
    transport.play()
    advance(5)
    expect(transport.position().pass).toBe(1)
    transport.stop()
    expect(transport.getSnapshot()).toMatchObject({ status: 'stopped', pass: 0, finished: false })
    expect(transport.position()).toMatchObject({ beat: 0, phase: 'idle' })
  })

  it('anchors the run only once a suspended context is running', async () => {
    const { transport, log, advance, setAudioState } = harness()
    setAudioState('suspended')
    transport.setCountIn(false)
    transport.play()
    expect(transport.getSnapshot().status).toBe('playing')
    expect(log).toEqual(['guitar jazz-sampled'])
    await Promise.resolve()
    await Promise.resolve()
    advance(0.1)
    expect(log[1]).toBe('click 0.05!')
  })

  it('runs the cursor on the wall clock when audio cannot start', () => {
    const { transport, advance } = harness({}, false)
    transport.setCountIn(false)
    transport.play()
    expect(transport.getSnapshot()).toMatchObject({ status: 'playing', audioUnavailable: true })
    advance(2)
    expect(transport.position().beat).toBeCloseTo(1.95, 1)
  })

  it('clears a loop that spans everything and normalizes a reversed one', () => {
    const { transport } = harness()
    transport.setLoop({ startBeat: 0, endBeat: 4 })
    expect(transport.getSnapshot().loop).toBeNull()
    transport.setLoop({ startBeat: 3, endBeat: 1 })
    expect(transport.getSnapshot().loop).toEqual({ startBeat: 1, endBeat: 3 })
    transport.setLoop({ startBeat: 2, endBeat: 2 })
    expect(transport.getSnapshot().loop).toBeNull()
  })

  it('disposes the audio and ignores later play calls', () => {
    const { transport, log } = harness()
    transport.play()
    expect(transport.disposed).toBe(false)
    transport.dispose()
    expect(log.at(-1)).toBe('dispose')
    expect(transport.disposed).toBe(true)
    transport.play()
    expect(transport.getSnapshot().status).toBe('stopped')
  })

  it('plays the line in the transposed key, from the next note scheduled, and primes those pitches', () => {
    const { transport, log, advance } = harness()
    transport.setCountIn(false)
    transport.setVoice(true)
    transport.setClick(false)
    transport.setTranspose(2)
    transport.play()
    expect(log).toContain('prime 50,52,54,55')
    advance(1.5)
    transport.setTranspose(-1)
    expect(log).toContain('prime 47,49,51,52')
    advance(1)
    expect(log.filter((entry) => entry.startsWith('note')).slice(0, 3)).toEqual([
      'note 0.05 m50 1.00s',
      'note 1.05 m52 1.00s',
      'note 2.05 m51 1.00s',
    ])
  })

  it('tells the audio which guitar to use and primes its pitches when the voice is on', () => {
    const { transport, log } = harness()
    expect(transport.getSnapshot().guitar).toBe('jazz-sampled')
    transport.play()
    expect(log[0]).toBe('guitar jazz-sampled')
    expect(log.filter((entry) => entry.startsWith('prime'))).toEqual([])
    transport.setVoice(true)
    expect(log).toContain('prime 48,50,52,53')
    transport.setGuitar('nylon')
    expect(transport.getSnapshot().guitar).toBe('nylon')
    expect(log.slice(-2)).toEqual(['guitar nylon', 'prime 48,50,52,53'])
  })

  it('warms the guitar\u2019s recordings before Play builds an audio context', async () => {
    const warmed: string[] = []
    const { transport } = harness({ warmSample: (url) => warmed.push(url) })

    // Mounting applies the saved settings one after another; only the guitar
    // finally chosen is worth pulling down.
    transport.setVoice(true)
    transport.setGuitar('nylon-sampled')
    await Promise.resolve()

    expect(warmed).toHaveLength(4)
    expect(warmed.every((url) => url.includes('acoustic_guitar_nylon-mp3'))).toBe(true)
    expect(warmed).toContain(sampleUrl('acoustic_guitar_nylon', 48))

    // Already warm: settling on the same guitar again asks for nothing more.
    transport.setGuitar('nylon-sampled')
    await Promise.resolve()
    expect(warmed).toHaveLength(4)
  })

  it('leaves a synthesized guitar alone \u2014 it has nothing to download', async () => {
    const warmed: string[] = []
    const { transport } = harness({ warmSample: (url) => warmed.push(url) })
    transport.setVoice(true)
    transport.setGuitar('nylon')
    await Promise.resolve()
    expect(warmed).toEqual([])
  })

  it('stops warming once Play has built the audio context', async () => {
    const warmed: string[] = []
    const { transport, log } = harness({ warmSample: (url) => warmed.push(url) })
    transport.setVoice(true)
    transport.play()
    warmed.length = 0
    transport.setGuitar('steel-sampled')
    await Promise.resolve()
    // The engine owns the loading now, and it decodes as well as fetches.
    expect(warmed).toEqual([])
    expect(log).toContain('prime 48,50,52,53')
  })

  it('clamps tempos to the playable range', () => {
    expect(clampTempo(0)).toBe(20)
    expect(clampTempo(72.4)).toBe(72)
    expect(clampTempo(Number.NaN)).toBe(20)
  })
})
