import { describe, expect, it } from 'vitest'
import { createPlayerAudio, midiToFrequency, renderPluck, type EngineAudioContext } from './engine'

interface Scheduled {
  kind: 'click' | 'pluck'
  start: number
  stopAt: number | 'now'
  frequency?: number
  midiBuffer?: number
}

export function fakeContext() {
  const scheduled: Scheduled[] = []
  const buffers: number[] = []
  const clock = { now: 0 }
  const context = {
    scheduled,
    buffers,
    clock,
    closed: false,
    state: 'running' as AudioContextState,
    sampleRate: 8000,
    destination: {} as AudioDestinationNode,
    get currentTime() {
      return clock.now
    },
    async resume() {
      context.state = 'running'
    },
    async close() {
      context.closed = true
    },
    createGain: () =>
      ({
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
          linearRampToValueAtTime() {},
        },
        connect() {},
      }) as unknown as GainNode,
    createOscillator: () => {
      const entry: Scheduled = { kind: 'click', start: 0, stopAt: 0 }
      return {
        type: 'sine',
        frequency: {
          setValueAtTime(value: number) {
            entry.frequency = value
          },
        },
        connect() {},
        start(time: number) {
          entry.start = time
          scheduled.push(entry)
        },
        stop(time?: number) {
          entry.stopAt = time === undefined ? 'now' : time
        },
      } as unknown as OscillatorNode
    },
    createBuffer: (_channels: number, length: number) => {
      buffers.push(length)
      const data = new Float32Array(length)
      return { getChannelData: () => data, length } as unknown as AudioBuffer
    },
    createBufferSource: () => {
      const entry: Scheduled = { kind: 'pluck', start: 0, stopAt: 0 }
      return {
        buffer: null as AudioBuffer | null,
        connect() {},
        start(time: number) {
          entry.start = time
          scheduled.push(entry)
        },
        stop(time?: number) {
          entry.stopAt = time === undefined ? 'now' : time
        },
      } as unknown as AudioBufferSourceNode
    },
  }
  return context satisfies EngineAudioContext
}

describe('renderPluck', () => {
  it('rings at the pitch and decays', () => {
    const samples = new Float32Array(8000)
    renderPluck(samples, 100, 8000)
    const peak = (from: number, to: number) =>
      Math.max(...Array.from(samples.subarray(from, to)).map(Math.abs))
    expect(peak(0, 400)).toBeGreaterThan(0.1)
    expect(peak(7600, 8000)).toBeLessThan(peak(0, 400) / 4)
    // The delay line is 80 samples at 100 Hz: the tail is periodic in it.
    expect(samples[6000]).toBeCloseTo(samples[6080], 2)
  })

  it('tunes A4 to 440', () => {
    expect(midiToFrequency(69)).toBe(440)
    expect(midiToFrequency(57)).toBe(220)
  })
})

describe('createPlayerAudio', () => {
  it('schedules clicks with an accent and plucks from a cached buffer per pitch', () => {
    const ctx = fakeContext()
    const audio = createPlayerAudio({ createContext: () => ctx })

    audio.click(1, true)
    audio.click(1.5, false)
    audio.pluck(1, 60, 0.5, 0.5)
    audio.pluck(1.5, 60, 0.5, 0.5)
    audio.pluck(2, 62, 0.25, 0.5)

    expect(ctx.scheduled.map((entry) => entry.frequency)).toEqual([1200, 880, undefined, undefined, undefined])
    expect(ctx.scheduled.map((entry) => entry.start)).toEqual([1, 1.5, 1, 1.5, 2])
    expect(ctx.scheduled[2].stopAt).toBeCloseTo(1.58)
    expect(ctx.buffers).toHaveLength(2)
  })

  it('cancels only what starts from a time, and silences everything on demand', () => {
    const ctx = fakeContext()
    const audio = createPlayerAudio({ createContext: () => ctx })
    audio.click(1, true)
    audio.pluck(2, 60, 1, 0.5)
    audio.click(3, false)

    audio.cancelFrom(2)
    expect(ctx.scheduled.map((entry) => entry.stopAt)).toEqual([1.07, 'now', 'now'])

    audio.click(4, true)
    audio.silence()
    expect(ctx.scheduled[3].stopAt).toBe('now')
  })

  it('exposes the audio clock and closes the context on dispose', async () => {
    const ctx = fakeContext()
    const audio = createPlayerAudio({ createContext: () => ctx })
    ctx.clock.now = 3
    expect(audio.now).toBe(3)
    ctx.state = 'suspended'
    expect(audio.state).toBe('suspended')
    await audio.resume()
    expect(audio.state).toBe('running')

    audio.dispose()
    expect(ctx.closed).toBe(true)
    expect(() => audio.click(0, true)).toThrow('Player audio was disposed')
  })
})
