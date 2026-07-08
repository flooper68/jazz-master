import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveExercise, type Lesson } from '../content'
import { getPlayAlongTempo } from '../storage/playAlongTempos'
import { sessionsStore } from '../storage/sessions'
import { PracticeRunner } from './PracticeRunner'

const audioMock = vi.hoisted(() => {
  const engine = {
    playResolvedExercise: vi.fn(),
    setTempoBpm: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  }
  return {
    engine,
    createPlayAlongEngine: vi.fn(() => engine),
    moduleLoaded: vi.fn(),
  }
})

vi.mock('../audio', () => {
  audioMock.moduleLoaded()
  return { createPlayAlongEngine: audioMock.createPlayAlongEngine }
})

let mediaRecorderInstances: MockMediaRecorder[] = []
const trackStopMock = vi.fn()
const getUserMediaMock = vi.fn()
const createObjectUrlMock = vi.fn()
const revokeObjectUrlMock = vi.fn()
const audioContextConstructedMock = vi.fn()
let mediaRecorderStartError: Error | null = null

class MockMediaRecorder {
  static isTypeSupported = vi.fn((mimeType: string) =>
    ['audio/webm;codecs=opus', 'audio/mp4'].includes(mimeType),
  )

  state: RecordingState = 'inactive'
  readonly mimeType: string
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? ''
    mediaRecorderInstances.push(this)
  }

  start(): void {
    if (mediaRecorderStartError) throw mediaRecorderStartError
    this.state = 'recording'
  }

  stop(): void {
    if (this.state !== 'recording') return
    this.state = 'inactive'
    const data = new Blob(['take'], {
      type: this.mimeType || 'audio/webm',
    })
    this.ondataavailable?.({ data } as BlobEvent)
    this.onstop?.()
  }
}

class MockAudioContext {
  currentTime = 0
  sampleRate = 48_000
  state: AudioContextState = 'running'
  destination = {}

  constructor() {
    audioContextConstructedMock()
  }

  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockResolvedValue(undefined)
  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }))
  createAnalyser = vi.fn(() => ({
    fftSize: 512,
    getByteTimeDomainData: (data: Uint8Array) => data.fill(160),
    disconnect: vi.fn(),
  }))
  createOscillator = vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }))
  createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }))
}

const lesson: Lesson = {
  id: 'fixture-lesson',
  title: 'Fixture lesson',
  area: 'scales',
  level: 1,
  prerequisites: [],
  estimatedMinutes: 2,
  exercises: [
    {
      id: 'fx-1',
      title: 'C major — open position',
      material: { kind: 'scale', root: 'C', scale: 'ionian' },
      window: { min: 0, max: 4 },
      tempoBpm: 60,
      duration: { kind: 'minutes', minutes: 1 },
      display: ['fretboard', 'notation'],
    },
    {
      id: 'fx-2',
      title: 'G7 arpeggio — open position',
      material: { kind: 'arpeggio', root: 'G', quality: '7' },
      window: { min: 0, max: 4 },
      tempoBpm: 60,
      duration: { kind: 'repetitions', count: 8 },
      display: ['fretboard'],
    },
  ],
}

function renderRunner(onExit = vi.fn(), runnerLesson = lesson) {
  render(
    <PracticeRunner
      lesson={runnerLesson}
      sessionId="session-1"
      startedAt={Date.now()}
      onExit={onExit}
    />,
  )
  return onExit
}

beforeEach(() => {
  vi.useRealTimers()
  localStorage.clear()
  audioMock.moduleLoaded.mockClear()
  audioMock.createPlayAlongEngine.mockClear()
  audioMock.engine.playResolvedExercise.mockReset()
  audioMock.engine.playResolvedExercise.mockResolvedValue(undefined)
  audioMock.engine.setTempoBpm.mockClear()
  audioMock.engine.stop.mockClear()
  audioMock.engine.dispose.mockClear()
  mediaRecorderInstances = []
  mediaRecorderStartError = null
  audioContextConstructedMock.mockClear()
  trackStopMock.mockClear()
  getUserMediaMock.mockReset()
  getUserMediaMock.mockResolvedValue({
    getTracks: () => [{ stop: trackStopMock }],
  } as unknown as MediaStream)
  createObjectUrlMock.mockReset()
  createObjectUrlMock.mockReturnValue('blob:recorded-take')
  revokeObjectUrlMock.mockClear()
  MockMediaRecorder.isTypeSupported.mockClear()
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: getUserMediaMock },
  })
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    value: MockAudioContext,
  })
  Object.defineProperty(window, 'MediaRecorder', {
    configurable: true,
    value: MockMediaRecorder,
  })
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: vi.fn(() => 1),
  })
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  })
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectUrlMock,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectUrlMock,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PracticeRunner', () => {
  it('renders the exercise on the fretboard at its resolved positions', () => {
    renderRunner()
    const svg = screen.getByRole('img', {
      name: 'C major — open position on the fretboard, frets 0 to 4',
    })
    const expected = resolveExercise(lesson.exercises[0]).positions
    expect(svg.querySelectorAll('g[data-string]')).toHaveLength(expected.length)
    // The root C of the C major scale sits on string 5 fret 3 in this window.
    const root = svg.querySelector('g[data-string="5"][data-fret="3"]')
    expect(root).toHaveAttribute('data-role', 'root')
    expect(root!.querySelector('text')).toHaveTextContent('C')
  })

  it('shows notation for an exercise with the hint and none for one without', async () => {
    const user = userEvent.setup()
    renderRunner()

    // fx-1 opts in: the score container appears with its summary label.
    expect(
      screen.getByRole('img', {
        name: 'C major — open position — staff and tablature',
      }),
    ).toBeInTheDocument()

    // fx-2 has no 'notation' hint: only the fretboard image remains.
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(
      screen.queryByRole('img', { name: /staff and tablature/ }),
    ).toBeNull()
  })

  it('lazy-loads play-along audio on first play and starts with defaults', async () => {
    const user = userEvent.setup()
    renderRunner()

    expect(audioMock.moduleLoaded).not.toHaveBeenCalled()
    expect(audioMock.createPlayAlongEngine).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )

    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledTimes(1)
    })
    expect(audioMock.moduleLoaded).toHaveBeenCalledTimes(1)
    expect(audioMock.createPlayAlongEngine).toHaveBeenCalledTimes(1)
    expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledWith({
      positions: resolveExercise(lesson.exercises[0]).positions,
      tempoBpm: 60,
      loop: true,
      click: true,
      countInBeats: 4,
    })
    expect(
      screen.getByRole('button', {
        name: 'Stop play-along for C major — open position',
      }),
    ).toBeInTheDocument()
  })

  it('shows loading and error states for failed playback', async () => {
    const user = userEvent.setup()
    let rejectStart!: (error: Error) => void
    audioMock.engine.playResolvedExercise.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectStart = reject
      }),
    )
    renderRunner()

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )
    expect(
      screen.getByRole('button', {
        name: 'Loading play-along for C major — open position',
      }),
    ).toBeDisabled()

    rejectStart(new Error('Audio unavailable'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Audio unavailable',
    )
  })

  it('persists a slower tempo and uses it for playback', async () => {
    const user = userEvent.setup()
    renderRunner()

    fireEvent.change(
      screen.getByRole('slider', {
        name: 'Tempo for C major — open position',
      }),
      { target: { value: '48' } },
    )

    expect(getPlayAlongTempo('fx-1', 60)).toBe(48)
    expect(screen.getAllByText('48 BPM').length).toBeGreaterThan(0)

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )

    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledWith(
        expect.objectContaining({ tempoBpm: 48 }),
      )
    })
  })

  it('updates active playback tempo when the slider changes', async () => {
    const user = userEvent.setup()
    renderRunner()

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )
    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledTimes(1)
    })

    fireEvent.change(
      screen.getByRole('slider', {
        name: 'Tempo for C major — open position',
      }),
      { target: { value: '52' } },
    )

    expect(audioMock.engine.setTempoBpm).toHaveBeenCalledWith(52)
  })

  it('passes loop and click state to playback', async () => {
    const user = userEvent.setup()
    renderRunner()

    await user.click(screen.getByRole('checkbox', { name: 'Loop' }))
    await user.click(
      screen.getByRole('checkbox', { name: 'Click + count-in' }),
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )

    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          loop: false,
          click: false,
          countInBeats: 0,
        }),
      )
    })
  })

  it('records a take after a metronome count-in and replays it in-session', async () => {
    const user = userEvent.setup()
    const fastLesson: Lesson = {
      ...lesson,
      exercises: [
        { ...lesson.exercises[0], tempoBpm: 600 },
        lesson.exercises[1],
      ],
    }
    renderRunner(vi.fn(), fastLesson)

    await user.click(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    )

    expect(getUserMediaMock).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    expect(audioContextConstructedMock).toHaveBeenCalled()
    expect(
      audioContextConstructedMock.mock.invocationCallOrder[0],
    ).toBeLessThan(getUserMediaMock.mock.invocationCallOrder[0])
    expect(await screen.findByText('Count-in beat 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Input level' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    )

    expect(
      await screen.findByRole('button', {
        name: 'Stop recording C major — open position',
      }),
    ).toBeInTheDocument()
    expect(mediaRecorderInstances).toHaveLength(1)
    expect(mediaRecorderInstances[0].state).toBe('recording')

    await user.click(
      screen.getByRole('button', {
        name: 'Stop recording C major — open position',
      }),
    )

    expect(await screen.findByLabelText('Recorded take replay')).toHaveAttribute(
      'src',
      'blob:recorded-take',
    )
    expect(screen.getByText(/Take captured/)).toBeInTheDocument()
    expect(trackStopMock).toHaveBeenCalled()
    expect(sessionsStore.get()).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Got it' }))

    expect(screen.queryByLabelText('Recorded take replay')).toBeNull()
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:recorded-take')
  })

  it('recovers when MediaRecorder cannot start after count-in', async () => {
    const user = userEvent.setup()
    mediaRecorderStartError = new Error('Recorder refused to start')
    const fastLesson: Lesson = {
      ...lesson,
      exercises: [
        { ...lesson.exercises[0], tempoBpm: 600 },
        lesson.exercises[1],
      ],
    }
    renderRunner(vi.fn(), fastLesson)

    await user.click(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Recorder refused to start',
    )
    expect(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    ).toBeEnabled()
    expect(trackStopMock).toHaveBeenCalled()
  })

  it('shows a recoverable microphone denial state', async () => {
    const user = userEvent.setup()
    getUserMediaMock.mockRejectedValueOnce(
      new DOMException('denied', 'NotAllowedError'),
    )
    renderRunner()

    await user.click(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Microphone access was blocked',
    )
    expect(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    ).toBeEnabled()
  })

  it('stops playback when advancing or ending a lesson', async () => {
    const user = userEvent.setup()
    const onExit = renderRunner()

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )
    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledTimes(1)
    })
    await user.click(screen.getByRole('button', { name: 'Got it' }))

    expect(audioMock.engine.dispose).toHaveBeenCalledTimes(1)

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for G7 arpeggio — open position',
      }),
    )
    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledTimes(2)
    })
    await user.click(screen.getByRole('button', { name: 'End lesson' }))

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(audioMock.engine.dispose).toHaveBeenCalledTimes(2)
  })

  it('runs the happy path: grade both exercises, see the summary, persist a completed session', async () => {
    const user = userEvent.setup()
    const onExit = renderRunner()

    expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('C major — open position')).toBeInTheDocument()
    expect(screen.getAllByText('60 BPM').length).toBeGreaterThan(0)
    expect(screen.getByText('1:00')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByText('Exercise 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('G7 arpeggio — open position')).toBeInTheDocument()
    expect(screen.getByText('8 repetitions')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Shaky' }))
    expect(
      screen.getByRole('heading', { name: 'Lesson complete — Fixture lesson' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Got it')).toBeInTheDocument()
    expect(screen.getByText('Shaky')).toBeInTheDocument()

    expect(sessionsStore.get()).toMatchObject([
      {
        id: 'session-1',
        lessonId: 'fixture-lesson',
        completed: true,
        results: [
          { exerciseId: 'fx-1', grade: 'got-it' },
          { exerciseId: 'fx-2', grade: 'shaky' },
        ],
      },
    ])

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('persists a partial session marked incomplete when abandoned mid-lesson', async () => {
    const user = userEvent.setup()
    const onExit = renderRunner()

    await user.click(screen.getByRole('button', { name: 'Missed' }))
    await user.click(screen.getByRole('button', { name: 'End lesson' }))

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(sessionsStore.get()).toMatchObject([
      {
        id: 'session-1',
        lessonId: 'fixture-lesson',
        completed: false,
        results: [{ exerciseId: 'fx-1', grade: 'missed' }],
      },
    ])
  })

  it('persists nothing until an exercise is graded', async () => {
    const user = userEvent.setup()
    const onExit = renderRunner()
    await user.click(screen.getByRole('button', { name: 'End lesson' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(sessionsStore.get()).toEqual([])
  })

  it('moves focus to the lesson heading when the runner appears', () => {
    renderRunner()
    expect(
      screen.getByRole('heading', { name: 'Fixture lesson' }),
    ).toHaveFocus()
  })

  it('moves focus to the summary heading when the last grade swaps in the summary', async () => {
    const user = userEvent.setup()
    renderRunner()

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    // Mid-lesson advance is not a view swap — focus stays on the grade button.
    expect(screen.getByRole('button', { name: 'Got it' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Shaky' }))
    expect(
      screen.getByRole('heading', { name: 'Lesson complete — Fixture lesson' }),
    ).toHaveFocus()
  })
})
