import type { PositionedNote } from '@jazz-master/theory'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPlayAlongEngine } from './engine'

const smplrMock = vi.hoisted(() => {
  const samplerStart = vi.fn()
  const samplerStop = vi.fn()
  const samplerDispose = vi.fn()
  return {
    samplerStart,
    samplerStop,
    samplerDispose,
    Sampler: vi.fn(() => ({
      ready: Promise.resolve(),
      start: samplerStart,
      stop: samplerStop,
      dispose: samplerDispose,
    })),
    CacheStorage: vi.fn((name: string) => ({ kind: 'cache', name })),
    HttpStorage: { kind: 'http' },
  }
})

vi.mock('smplr', () => ({
  Sampler: smplrMock.Sampler,
  CacheStorage: smplrMock.CacheStorage,
  HttpStorage: smplrMock.HttpStorage,
}))

const clickRampMock = vi.fn()

class MockAudioContext {
  currentTime = 0
  destination = {}

  createOscillator = vi.fn(() => ({
    type: 'square',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }))

  createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: clickRampMock,
    },
    connect: vi.fn(),
  }))
}

const middleC: PositionedNote = {
  string: 5,
  fret: 3,
  note: { letter: 'C', accidental: 0 },
  degree: 1,
}

afterEach(() => {
  vi.useRealTimers()
  smplrMock.samplerStart.mockClear()
  smplrMock.samplerStop.mockClear()
  smplrMock.samplerDispose.mockClear()
  smplrMock.Sampler.mockClear()
  smplrMock.CacheStorage.mockClear()
  clickRampMock.mockClear()
})

describe('createPlayAlongEngine', () => {
  it('uses updated volumes for future scheduled guitar notes and clicks', async () => {
    vi.useFakeTimers()
    const audioContext = new MockAudioContext()
    const engine = createPlayAlongEngine({
      audioContext: audioContext as unknown as AudioContext,
      lookaheadSeconds: 0,
      tickMs: 10,
    })

    await engine.playResolvedExercise({
      positions: [middleC],
      tempoBpm: 60,
      loop: false,
      countInBeats: 0,
      guitarVolume: 1,
      clickVolume: 1,
    })

    expect(smplrMock.samplerStart).not.toHaveBeenCalled()

    engine.setVolumes({ guitar: 0.25, click: 0.5 })
    audioContext.currentTime = 0.05
    vi.advanceTimersByTime(10)

    expect(smplrMock.samplerStart).toHaveBeenCalledWith(
      expect.objectContaining({
        note: 48,
        velocity: 24,
      }),
    )
    expect(clickRampMock).toHaveBeenCalledWith(0.12, 0.055)

    engine.dispose()
  })
})
