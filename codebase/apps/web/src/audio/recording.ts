import { secondsPerBeat } from './timeline'

export const RECORDING_COUNT_IN_BEATS = 4

export type RecordingStatus =
  | 'idle'
  | 'requesting-permission'
  | 'counting-in'
  | 'recording'
  | 'recorded'
  | 'permission-denied'
  | 'unsupported'
  | 'error'

export interface RecordedTake {
  url: string
  mimeType: string
  durationSeconds: number
  sampleRate: number
}

export interface RecordingState {
  status: RecordingStatus
  level: number
  countInBeat: number | null
  take: RecordedTake | null
  error: string | null
}

export type RecordingAction =
  | { type: 'request-permission' }
  | { type: 'unsupported'; message: string }
  | { type: 'permission-denied'; message: string }
  | { type: 'count-in-started' }
  | { type: 'count-in-beat'; beat: number }
  | { type: 'recording-started' }
  | { type: 'level-changed'; level: number }
  | { type: 'recorded'; take: RecordedTake }
  | { type: 'failed'; message: string }
  | { type: 'reset' }

export const initialRecordingState: RecordingState = {
  status: 'idle',
  level: 0,
  countInBeat: null,
  take: null,
  error: null,
}

export function recordingReducer(
  state: RecordingState,
  action: RecordingAction,
): RecordingState {
  switch (action.type) {
    case 'request-permission':
      return {
        ...initialRecordingState,
        status: 'requesting-permission',
      }
    case 'unsupported':
      return {
        ...initialRecordingState,
        status: 'unsupported',
        error: action.message,
      }
    case 'permission-denied':
      return {
        ...initialRecordingState,
        status: 'permission-denied',
        error: action.message,
      }
    case 'count-in-started':
      return {
        ...state,
        status: 'counting-in',
        countInBeat: 1,
        take: null,
        error: null,
      }
    case 'count-in-beat':
      return {
        ...state,
        countInBeat: action.beat,
      }
    case 'recording-started':
      return {
        ...state,
        status: 'recording',
        countInBeat: null,
        take: null,
        error: null,
      }
    case 'level-changed':
      return {
        ...state,
        level: clampLevel(action.level),
      }
    case 'recorded':
      return {
        ...state,
        status: 'recorded',
        level: 0,
        countInBeat: null,
        take: action.take,
        error: null,
      }
    case 'failed':
      return {
        ...state,
        status: 'error',
        level: 0,
        countInBeat: null,
        error: action.message,
      }
    case 'reset':
      return initialRecordingState
  }
}

export function getRecordingAudioConstraints(): MediaStreamConstraints {
  return {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  }
}

export function getRecordingMimeType(
  mediaRecorder: Pick<typeof MediaRecorder, 'isTypeSupported'>,
): string {
  if (mediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus'
  }
  if (mediaRecorder.isTypeSupported('audio/mp4')) {
    return 'audio/mp4'
  }
  return ''
}

export function getCountInDurationMs(
  tempoBpm: number,
  beats = RECORDING_COUNT_IN_BEATS,
): number {
  return secondsPerBeat(tempoBpm) * beats * 1000
}

export function isPermissionDeniedError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
  )
}

export function createInputLevelMeter(
  audioContext: AudioContext,
  stream: MediaStream,
  onLevel: (level: number) => void,
): { stop: () => void } {
  const source = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 512
  source.connect(analyser)

  const data = new Uint8Array(analyser.fftSize)
  let animationFrameId: number | null = null
  let stopped = false

  const tick = () => {
    if (stopped) return
    analyser.getByteTimeDomainData(data)
    onLevel(calculateRmsLevel(data))
    animationFrameId = window.requestAnimationFrame(tick)
  }
  tick()

  return {
    stop: () => {
      stopped = true
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
      source.disconnect()
      analyser.disconnect()
    },
  }
}

export function scheduleCountInClicks(
  audioContext: AudioContext,
  tempoBpm: number,
  beats = RECORDING_COUNT_IN_BEATS,
): number {
  const beatSeconds = secondsPerBeat(tempoBpm)
  const firstClickTime = audioContext.currentTime + 0.05
  for (let beat = 0; beat < beats; beat += 1) {
    scheduleClick(audioContext, firstClickTime + beat * beatSeconds, beat === 0)
  }
  return firstClickTime + beats * beatSeconds
}

function calculateRmsLevel(data: Uint8Array): number {
  let sum = 0
  for (const sample of data) {
    const centered = (sample - 128) / 128
    sum += centered * centered
  }
  return clampLevel(Math.sqrt(sum / data.length))
}

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 0
  return Math.min(Math.max(level, 0), 1)
}

function scheduleClick(
  context: AudioContext,
  time: number,
  accent: boolean,
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'square'
  oscillator.frequency.setValueAtTime(accent ? 1200 : 880, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(accent ? 0.24 : 0.16, time + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(time)
  oscillator.stop(time + 0.07)
}
