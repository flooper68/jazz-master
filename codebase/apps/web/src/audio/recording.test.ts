import { describe, expect, it, vi } from 'vitest'
import {
  RECORDING_COUNT_IN_BEATS,
  getCountInDurationMs,
  getRecordingAudioConstraints,
  getRecordingMimeType,
  initialRecordingState,
  recordingReducer,
  scheduleCountInClicks,
} from './recording'

describe('recording capture helpers', () => {
  it('requests raw-ish microphone audio for music capture', () => {
    expect(getRecordingAudioConstraints()).toEqual({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
  })

  it('prefers Opus and falls back to Safari-compatible mp4', () => {
    expect(
      getRecordingMimeType({
        isTypeSupported: (mimeType) => mimeType === 'audio/webm;codecs=opus',
      }),
    ).toBe('audio/webm;codecs=opus')

    expect(
      getRecordingMimeType({
        isTypeSupported: (mimeType) => mimeType === 'audio/mp4',
      }),
    ).toBe('audio/mp4')

    expect(getRecordingMimeType({ isTypeSupported: () => false })).toBe('')
  })

  it('derives a four-beat count-in duration from tempo', () => {
    expect(getCountInDurationMs(120)).toBe(2000)
    expect(getCountInDurationMs(60, 2)).toBe(2000)
    expect(RECORDING_COUNT_IN_BEATS).toBe(4)
  })

  it('keeps recording status transitions explicit', () => {
    const requesting = recordingReducer(initialRecordingState, {
      type: 'request-permission',
    })
    expect(requesting).toMatchObject({
      status: 'requesting-permission',
      take: null,
      error: null,
    })

    const countingIn = recordingReducer(requesting, {
      type: 'count-in-started',
    })
    expect(countingIn).toMatchObject({
      status: 'counting-in',
      countInBeat: 1,
    })

    const recording = recordingReducer(countingIn, {
      type: 'recording-started',
    })
    expect(recording).toMatchObject({
      status: 'recording',
      countInBeat: null,
    })

    const recorded = recordingReducer(recording, {
      type: 'recorded',
      take: {
        url: 'blob:take',
        mimeType: 'audio/webm;codecs=opus',
        durationSeconds: 3,
        sampleRate: 48_000,
      },
    })
    expect(recorded).toMatchObject({
      status: 'recorded',
      level: 0,
      take: { url: 'blob:take' },
    })
  })

  it('records recoverable permission-denied and unsupported states', () => {
    expect(
      recordingReducer(initialRecordingState, {
        type: 'permission-denied',
        message: 'Microphone access was blocked.',
      }),
    ).toMatchObject({
      status: 'permission-denied',
      error: 'Microphone access was blocked.',
    })

    expect(
      recordingReducer(initialRecordingState, {
        type: 'unsupported',
        message: 'Recording is not available in this browser.',
      }),
    ).toMatchObject({
      status: 'unsupported',
      error: 'Recording is not available in this browser.',
    })
  })

  it('schedules metronome clicks before the take starts', () => {
    const starts: number[] = []
    const stops: number[] = []
    const frequencySet = vi.fn()
    const gainSet = vi.fn()
    const gainRamp = vi.fn()
    const context = {
      currentTime: 10,
      destination: {},
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime: frequencySet },
        connect: vi.fn(),
        start: (time: number) => starts.push(time),
        stop: (time: number) => stops.push(time),
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: gainSet,
          exponentialRampToValueAtTime: gainRamp,
        },
        connect: vi.fn(),
      }),
    } as unknown as AudioContext

    const takeStartTime = scheduleCountInClicks(context, 120)

    expect(starts).toEqual([10.05, 10.55, 11.05, 11.55])
    expect(stops).toEqual([
      10.120000000000001,
      10.620000000000001,
      11.120000000000001,
      11.620000000000001,
    ])
    expect(takeStartTime).toBe(12.05)
    expect(frequencySet).toHaveBeenNthCalledWith(1, 1200, 10.05)
    expect(frequencySet).toHaveBeenNthCalledWith(2, 880, 10.55)
  })
})
