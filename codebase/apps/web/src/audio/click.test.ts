import { describe, expect, it, vi } from 'vitest'
import { beatsDue, createClickTrack, type ClickAudioContext } from './click'

interface ScheduledBeat {
  frequency: number
  time: number
  silenced?: boolean
}

function fakeContext(): ClickAudioContext & {
  scheduled: ScheduledBeat[]
  clock: { now: number }
  closed: boolean
  setState(state: AudioContextState): void
} {
  const scheduled: ScheduledBeat[] = []
  const clock = { now: 0 }
  const context = {
    scheduled,
    clock,
    closed: false,
    state: 'running' as AudioContextState,
    setState(state: AudioContextState) {
      context.state = state
    },
    destination: {} as AudioDestinationNode,
    get currentTime() {
      return clock.now
    },
    async resume() {},
    async close() {
      context.closed = true
    },
    createGain: () =>
      ({
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      }) as unknown as GainNode,
    createOscillator: () => {
      const beat: ScheduledBeat = { frequency: 0, time: 0 }
      return {
        type: 'sine',
        frequency: {
          setValueAtTime(value: number) {
            beat.frequency = value
          },
        },
        connect() {},
        start(time: number) {
          beat.time = time
          scheduled.push(beat)
        },
        stop(time?: number) {
          if (time === undefined) beat.silenced = true
        },
      } as unknown as OscillatorNode
    },
  }
  return context
}

describe('beatsDue', () => {
  it('lists the beats whose time falls before the horizon', () => {
    expect(beatsDue(120, 0, 1.2)).toEqual([0, 1, 2])
    expect(beatsDue(120, 3, 1.2)).toEqual([])
    expect(beatsDue(60, 2, 2.5)).toEqual([2])
    expect(() => beatsDue(0, 0, 1)).toThrow('Invalid tempo BPM: 0')
  })
})

describe('createClickTrack', () => {
  it('schedules beats ahead of the clock at the tempo, accenting the downbeat', () => {
    vi.useFakeTimers()
    const context = fakeContext()
    const track = createClickTrack({
      createContext: () => context,
      lookaheadSeconds: 1.1,
    })

    track.start(120)

    expect(track.playing).toBe(true)
    expect(context.scheduled.map((beat) => beat.time)).toEqual([
      0.05, 0.55, 1.05,
    ])
    expect(context.scheduled.map((beat) => beat.frequency)).toEqual([
      1200, 880, 880,
    ])

    context.clock.now = 1
    vi.advanceTimersByTime(25)
    expect(context.scheduled.map((beat) => beat.time)).toEqual([
      0.05, 0.55, 1.05, 1.55, 2.05,
    ])
    expect(context.scheduled[4].frequency).toBe(1200)

    track.stop()
    expect(track.playing).toBe(false)
    // Beats still inside the lookahead window are silenced, not left to fire.
    expect(context.scheduled.filter((beat) => beat.silenced)).toHaveLength(3)
    context.clock.now = 5
    vi.advanceTimersByTime(100)
    expect(context.scheduled).toHaveLength(5)
    vi.useRealTimers()
  })

  it('skips beats the clock has already passed instead of firing the backlog', () => {
    vi.useFakeTimers()
    const context = fakeContext()
    const track = createClickTrack({
      createContext: () => context,
      lookaheadSeconds: 0.1,
    })

    track.start(120)
    expect(context.scheduled.map((beat) => beat.time)).toEqual([0.05])

    // The tab was throttled: the audio clock ran on for three seconds.
    context.clock.now = 3.02
    vi.advanceTimersByTime(25)

    const late = context.scheduled.slice(1).map((beat) => beat.time)
    expect(late).toEqual([3.05])
    track.stop()
    vi.useRealTimers()
  })

  it('anchors the first beat only once a suspended context is running', async () => {
    vi.useFakeTimers()
    const context = fakeContext()
    context.setState('suspended')
    let resumed = () => {}
    context.resume = () =>
      new Promise<void>((resolve) => {
        resumed = () => {
          context.setState('running')
          resolve()
        }
      })
    const track = createClickTrack({ createContext: () => context })

    track.start(120)
    expect(context.scheduled).toEqual([])

    context.clock.now = 2
    resumed()
    await vi.advanceTimersByTimeAsync(0)
    expect(context.scheduled[0].time).toBeCloseTo(2.05)
    track.dispose()
    vi.useRealTimers()
  })

  it('rejects a non-positive tempo and closes the context on dispose', () => {
    const context = fakeContext()
    const track = createClickTrack({ createContext: () => context })

    expect(() => track.start(0)).toThrow('Invalid tempo BPM: 0')
    track.start(90)
    track.dispose()

    expect(track.playing).toBe(false)
    expect(context.closed).toBe(true)
    expect(() => track.start(90)).toThrow('Click track was disposed')
  })
})
