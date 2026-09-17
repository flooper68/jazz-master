import { describe, expect, it } from 'vitest'
import { createPlayerAudio, midiToFrequency, renderPluck, type EngineAudioContext } from './engine'
import { sampleUrl, VOICES, voiceById, type SynthVoice } from './voices'

interface Scheduled {
  kind: 'click' | 'pluck'
  start: number
  stopAt: number | 'now'
  frequency?: number
  bufferId?: number
  filters: string[]
}

export function fakeContext() {
  const scheduled: Scheduled[] = []
  const buffers: Array<{ id: number; length: number; decoded?: boolean }> = []
  const clock = { now: 0 }
  let nextBuffer = 1
  const makeBuffer = (length: number, decoded = false) => {
    const id = nextBuffer++
    buffers.push({ id, length, decoded })
    const data = new Float32Array(length)
    return { id, getChannelData: () => data, length } as unknown as AudioBuffer & { id: number }
  }
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
    createBiquadFilter: () => {
      const filter = {
        type: 'lowpass',
        frequency: { setValueAtTime() {} },
        Q: { setValueAtTime() {} },
        gain: { setValueAtTime() {} },
        connect(next: { type?: string }) {
          // Record the chain on the source that fed this filter.
          if (next.type) lastSource?.filters.push(next.type)
        },
      }
      return filter as unknown as BiquadFilterNode
    },
    createOscillator: () => {
      const entry: Scheduled = { kind: 'click', start: 0, stopAt: 0, filters: [] }
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
    createBuffer: (_channels: number, length: number) => makeBuffer(length),
    createBufferSource: () => {
      const entry: Scheduled = { kind: 'pluck', start: 0, stopAt: 0, filters: [] }
      lastSource = entry
      const node = {
        buffer: null as (AudioBuffer & { id?: number }) | null,
        connect(next: { type?: string }) {
          if (next.type) entry.filters.push(next.type)
        },
        start(time: number) {
          entry.start = time
          entry.bufferId = node.buffer?.id
          scheduled.push(entry)
        },
        stop(time?: number) {
          entry.stopAt = time === undefined ? 'now' : time
        },
      }
      return node as unknown as AudioBufferSourceNode
    },
    async decodeAudioData(data: ArrayBuffer) {
      return makeBuffer(data.byteLength, true)
    },
  }
  let lastSource: Scheduled | null = null
  return context satisfies EngineAudioContext
}

const nylon = voiceById('nylon') as SynthVoice

describe('renderPluck', () => {
  it('rings at the pitch and decays', () => {
    const samples = new Float32Array(8000)
    renderPluck(samples, 100, 8000, nylon)
    const peak = (from: number, to: number) =>
      Math.max(...Array.from(samples.subarray(from, to)).map(Math.abs))
    expect(peak(0, 400)).toBeGreaterThan(0.3)
    expect(peak(7600, 8000)).toBeLessThan(peak(0, 400) / 3)
    // The delay line is 80 samples at 100 Hz: the tail is periodic in it.
    expect(samples[6000]).toBeCloseTo(samples[6080], 2)
  })

  it('gives each voice a different string, fading over its own decay time', () => {
    const rms = (s: Float32Array, from: number, to: number) =>
      Math.sqrt(Array.from(s.subarray(from, to)).reduce((sum, x) => sum + x * x, 0) / (to - from))
    const render = (id: 'nylon' | 'steel' | 'jazz') => {
      const samples = new Float32Array(16000)
      renderPluck(samples, 200, 8000, voiceById(id) as SynthVoice)
      // How much of the first half-second is left after 1.5 s.
      return { samples, left: rms(samples, 12000, 16000) / rms(samples, 0, 4000) }
    }
    const nylonString = render('nylon')
    const steel = render('steel')
    const jazz = render('jazz')
    expect(nylonString.left).toBeLessThan(steel.left)
    expect(nylonString.left).toBeLessThan(jazz.left)
    expect(nylonString.left).toBeGreaterThan(0.0005)
    expect(Array.from(nylonString.samples.subarray(0, 50))).not.toEqual(Array.from(steel.samples.subarray(0, 50)))
  })

  it('fades every pitch over about the same time', () => {
    const rms = (s: Float32Array, from: number, to: number) =>
      Math.sqrt(Array.from(s.subarray(from, to)).reduce((sum, x) => sum + x * x, 0) / (to - from))
    const left = (frequency: number) => {
      const samples = new Float32Array(16000)
      renderPluck(samples, frequency, 8000, nylon)
      return rms(samples, 12000, 16000) / rms(samples, 0, 4000)
    }
    const ratio = left(110) / left(440)
    expect(ratio).toBeGreaterThan(0.4)
    expect(ratio).toBeLessThan(2.5)
  })

  it('tunes A4 to 440', () => {
    expect(midiToFrequency(69)).toBe(440)
    expect(midiToFrequency(57)).toBe(220)
  })
})

describe('voices', () => {
  it('names the soundfont recording of a pitch with flats', () => {
    expect(sampleUrl('acoustic_guitar_nylon', 60)).toMatch(/acoustic_guitar_nylon-mp3\/C4\.mp3$/)
    expect(sampleUrl('electric_guitar_jazz', 46)).toMatch(/Bb2\.mp3$/)
    expect(sampleUrl('x', 40)).toMatch(/E2\.mp3$/)
  })

  it('offers synthesized and sampled guitars, every sampled one with a synth fallback', () => {
    expect(VOICES.filter((v) => v.kind === 'synth')).toHaveLength(3)
    for (const voice of VOICES) {
      if (voice.kind === 'sampled') expect(voiceById(voice.fallback).kind).toBe('synth')
    }
  })
})

describe('createPlayerAudio', () => {
  it('schedules clicks with an accent and shapes synth plucks with tone and body, one buffer per pitch', () => {
    const ctx = fakeContext()
    const audio = createPlayerAudio({ createContext: () => ctx, voice: 'nylon' })

    audio.click(1, true)
    audio.click(1.5, false)
    audio.pluck(1, 60, 0.5, 0.5)
    audio.pluck(1.5, 60, 0.5, 0.5)
    audio.pluck(2, 62, 0.25, 0.5)

    expect(ctx.scheduled.map((entry) => entry.frequency)).toEqual([1200, 880, undefined, undefined, undefined])
    expect(ctx.scheduled.map((entry) => entry.start)).toEqual([1, 1.5, 1, 1.5, 2])
    expect(ctx.scheduled[2].stopAt).toBeCloseTo(1.59)
    expect(ctx.scheduled[2].filters).toEqual(['lowpass', 'peaking', 'peaking'])
    expect(ctx.buffers).toHaveLength(2)
    expect(ctx.scheduled[2].bufferId).toBe(ctx.scheduled[3].bufferId)
  })

  it('renders a fresh buffer per voice and pitch', () => {
    const ctx = fakeContext()
    const audio = createPlayerAudio({ createContext: () => ctx, voice: 'nylon' })
    audio.pluck(0, 60, 1, 1)
    audio.setVoice('steel')
    audio.pluck(1, 60, 1, 1)
    expect(ctx.buffers).toHaveLength(2)
    expect(ctx.scheduled[0].bufferId).not.toBe(ctx.scheduled[1].bufferId)
  })

  it('plays a sampled voice from fetched recordings, with the synth standing in until they load', async () => {
    const ctx = fakeContext()
    const fetched: string[] = []
    const audio = createPlayerAudio({
      createContext: () => ctx,
      voice: 'jazz-sampled',
      fetchSample: async (url) => {
        fetched.push(url)
        return new ArrayBuffer(16)
      },
    })

    audio.prime([60, 62, 60])
    expect(fetched).toEqual([sampleUrl('electric_guitar_jazz', 60), sampleUrl('electric_guitar_jazz', 62)])

    // Before the samples decode: the jazz synth plays, filtered like a model.
    audio.pluck(0, 60, 1, 1)
    expect(ctx.scheduled[0].filters).toContain('lowpass')
    await new Promise((resolve) => setTimeout(resolve, 0))

    audio.pluck(1, 60, 1, 1)
    expect(ctx.scheduled[1].filters).toEqual([])
    expect(ctx.buffers.find((b) => b.id === ctx.scheduled[1].bufferId)?.decoded).toBe(true)
    // A pitch never primed is fetched on first use.
    audio.pluck(2, 64, 1, 1)
    expect(fetched).toContain(sampleUrl('electric_guitar_jazz', 64))
    expect(fetched).toHaveLength(3)
  })

  it('keeps playing the synth when a sample cannot be fetched', async () => {
    const ctx = fakeContext()
    const audio = createPlayerAudio({
      createContext: () => ctx,
      voice: 'nylon-sampled',
      fetchSample: async () => {
        throw new Error('offline')
      },
    })
    audio.prime([60])
    await new Promise((resolve) => setTimeout(resolve, 0))
    audio.pluck(0, 60, 1, 1)
    expect(ctx.scheduled[0].filters).toContain('lowpass')
    expect(ctx.buffers.every((b) => !b.decoded)).toBe(true)
  })

  it('cancels only what starts from a time, and silences everything on demand', () => {
    const ctx = fakeContext()
    const audio = createPlayerAudio({ createContext: () => ctx, voice: 'nylon' })
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
