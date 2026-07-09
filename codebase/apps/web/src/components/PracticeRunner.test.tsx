import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PracticeSession } from '../appData/session'
import { resolveExercise, type Lesson } from '../content'
import type { ExpectedNote, TolerancePreset } from '../scoring'
import { getNotationDisplayMode } from '../storage/notationPreferences'
import { getPlayAlongTempo } from '../storage/playAlongTempos'
import { getScoreTolerance } from '../storage/scoringPreferences'
import { PracticeRunner } from './PracticeRunner'

type User = ReturnType<typeof userEvent.setup>

const audioMock = vi.hoisted(() => {
  const engine = {
    playResolvedExercise: vi.fn(),
    setTempoBpm: vi.fn(),
    setVolumes: vi.fn(),
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

const scoringMock = vi.hoisted(() => ({
  analyzeTake: vi.fn(),
  scoreTake: vi.fn(),
}))

vi.mock('../scoring', () => scoringMock)

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
  decodeAudioData = vi.fn().mockResolvedValue({
    numberOfChannels: 1,
    length: 4,
    sampleRate: 48_000,
    getChannelData: () => new Float32Array([0, 0.5, 0, -0.5]),
  })
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

function renderRunner(
  onExit = vi.fn(),
  runnerLesson = lesson,
  onSessionChange: (session: PracticeSession) => void = vi.fn(),
) {
  render(
    <PracticeRunner
      lesson={runnerLesson}
      sessionId="session-1"
      startedAt={Date.now()}
      onSessionChange={onSessionChange}
      onExit={onExit}
    />,
  )
  return onExit
}

async function finishAndGrade(
  user: User,
  exerciseTitle: string,
  grade: 'Got it' | 'Shaky' | 'Missed' = 'Got it',
): Promise<void> {
  await user.click(
    screen.getByRole('button', {
      name: `Play play-along for ${exerciseTitle}`,
    }),
  )
  const next = screen.getByRole('button', {
    name: `End playthrough and grade ${exerciseTitle}`,
  })
  await waitFor(() => expect(next).toBeEnabled())
  await user.click(next)
  const dialog = screen.getByRole('dialog', { name: `Grade ${exerciseTitle}` })
  await user.click(within(dialog).getByRole('button', { name: grade }))
}

async function completeExercise(user: User, exerciseTitle: string): Promise<void> {
  await user.click(
    screen.getByRole('button', {
      name: `Play play-along for ${exerciseTitle}`,
    }),
  )
  const next = screen.getByRole('button', {
    name: `End playthrough and grade ${exerciseTitle}`,
  })
  await waitFor(() => expect(next).toBeEnabled())
  await user.click(next)
}

beforeEach(() => {
  vi.useRealTimers()
  localStorage.clear()
  audioMock.moduleLoaded.mockClear()
  audioMock.createPlayAlongEngine.mockClear()
  audioMock.engine.playResolvedExercise.mockReset()
  audioMock.engine.playResolvedExercise.mockResolvedValue(undefined)
  audioMock.engine.setTempoBpm.mockClear()
  audioMock.engine.setVolumes.mockClear()
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
  scoringMock.analyzeTake.mockReset()
  scoringMock.analyzeTake.mockReturnValue([
    {
      onsetSeconds: 0,
      durationSeconds: 0.4,
      frequencyHz: 261.63,
      midi: 60,
      pitchClass: 0,
      centsFromNearestSemitone: 4,
      clarity: 0.95,
    },
  ])
  scoringMock.scoreTake.mockReset()
  scoringMock.scoreTake.mockImplementation(
    (_events: unknown, expected: ExpectedNote[], tolerance: TolerancePreset) => ({
      score: 92,
      components: { pitch: 100, timing: 83, completeness: 100 },
      perNote: expected.slice(0, 3).map((note, index) => ({
        expected: note,
        event: {
          onsetSeconds: note.onsetSeconds + (index === 1 ? 0.12 : 0),
          durationSeconds: 0.4,
          frequencyHz: 261.63,
          midi: 60,
          pitchClass: 0,
          centsFromNearestSemitone: 4,
          clarity: 0.95,
        },
        verdict: index === 1 ? 'late' : 'correct',
        timingOffsetSeconds: index === 1 ? 0.12 : 0,
        pitchClassMatched: true,
        pitchCents: 4,
        timingCredit: index === 1 ? 0.5 : 1,
        pitchCredit: 1,
      })),
      extras: [],
      tolerance,
    }),
  )
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
    await finishAndGrade(user, 'C major — open position', 'Got it')
    expect(
      screen.queryByRole('img', { name: /staff and tablature/ }),
    ).toBeNull()
  })

  it('switches and persists the notation display mode', async () => {
    const user = userEvent.setup()
    renderRunner()

    await user.click(
      screen.getByRole('button', {
        name: 'Show staff notation for C major — open position',
      }),
    )

    expect(getNotationDisplayMode()).toBe('staff')
    expect(
      screen.getByRole('img', {
        name: 'C major — open position — staff notation',
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Show tablature for C major — open position',
      }),
    )

    expect(getNotationDisplayMode()).toBe('tab')
    expect(
      screen.getByRole('img', {
        name: 'C major — open position — tablature',
      }),
    ).toBeInTheDocument()
  })

  it('makes the score viewport keyboard focusable', async () => {
    const user = userEvent.setup()
    renderRunner()

    const viewport = screen.getByLabelText('C major — open position score viewport')
    await user.click(viewport)
    expect(viewport).toHaveFocus()
  })

  it('opens score focus mode with display controls and exits on Escape', async () => {
    const user = userEvent.setup()
    renderRunner()

    const openFocusButton = screen.getByRole('button', {
      name: 'Open focus mode for C major — open position score',
    })
    await user.click(openFocusButton)

    const dialog = screen.getByRole('dialog', {
      name: 'C major — open position score focus mode',
    })
    expect(
      within(dialog).getByRole('img', {
        name: 'C major — open position focus — staff and tablature',
      }),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Exit focus' })).toHaveFocus()

    within(dialog)
      .getByRole('button', {
        name: 'Show staff and tablature for C major — open position',
      })
      .focus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(
      within(dialog).getByLabelText('C major — open position focus score viewport'),
    ).toHaveFocus()

    await user.click(
      within(dialog).getByRole('button', {
        name: 'Show staff notation for C major — open position',
      }),
    )
    expect(
      within(dialog).getByRole('img', {
        name: 'C major — open position focus — staff notation',
      }),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(openFocusButton).toHaveFocus()
  })

  it('does not expose grade choices before the playthrough ends', async () => {
    const user = userEvent.setup()
    renderRunner()

    await user.click(
      screen.getByRole('button', {
        name: 'Open focus mode for C major — open position score',
      }),
    )
    const focusDialog = screen.getByRole('dialog', {
      name: 'C major — open position score focus mode',
    })
    expect(
      within(focusDialog).queryByRole('button', { name: 'Got it' }),
    ).toBeNull()

    await user.keyboard('{Escape}')
    await completeExercise(user, 'C major — open position')

    const gradeDialog = screen.getByRole('dialog', {
      name: 'Grade C major — open position',
    })
    expect(
      within(gradeDialog).getByRole('button', { name: 'Got it' }),
    ).toHaveFocus()

    await user.click(
      within(gradeDialog).getByRole('button', { name: 'Got it' }),
    )

    expect(screen.getByText('Exercise 2 of 2')).toBeInTheDocument()
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
    expect(audioMock.createPlayAlongEngine).toHaveBeenCalledTimes(1)
    expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledWith({
      positions: resolveExercise(lesson.exercises[0]).positions,
      tempoBpm: 60,
      loop: true,
      click: true,
      countInBeats: 4,
      guitarVolume: 0.8,
      clickVolume: 0.8,
    })
    expect(
      screen.getByRole('button', {
        name: 'Stop play-along for C major — open position',
      }),
    ).toBeInTheDocument()
  })

  it('starts minute countdowns only after playback starts and prompts on expiry', async () => {
    vi.useFakeTimers()
    renderRunner()

    expect(screen.getByText('1:00')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByText('1:00')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Begin C major — open position' }),
    )
    expect(
      screen.getByRole('button', {
        name: 'End playthrough and grade C major — open position',
      }),
    ).toBeEnabled()

    act(() => vi.advanceTimersByTime(1_000))
    expect(screen.getByText('0:59')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(59_000))
    expect(
      screen.getByRole('dialog', { name: 'Grade C major — open position' }),
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

  it('persists and restores a tempo above the authored exercise tempo', async () => {
    const user = userEvent.setup()
    renderRunner()

    const tempoSlider = screen.getByRole('slider', {
      name: 'Tempo for C major — open position',
    })
    expect(tempoSlider).toHaveAttribute('max', '200')

    fireEvent.change(tempoSlider, { target: { value: '200' } })

    expect(getPlayAlongTempo('fx-1', 60)).toBe(200)
    expect(screen.getAllByText('200 BPM').length).toBeGreaterThan(0)

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )

    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledWith(
        expect.objectContaining({ tempoBpm: 200 }),
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

  it('exposes guitar and click volume controls and updates active playback', async () => {
    const user = userEvent.setup()
    renderRunner()

    expect(screen.getByRole('slider', { name: 'Guitar volume' })).toHaveValue(
      '80',
    )
    expect(screen.getByRole('slider', { name: 'Click volume' })).toHaveValue('80')

    await user.click(
      screen.getByRole('button', {
        name: 'Play play-along for C major — open position',
      }),
    )
    await waitFor(() => {
      expect(audioMock.engine.playResolvedExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          guitarVolume: 0.8,
          clickVolume: 0.8,
        }),
      )
    })

    fireEvent.change(screen.getByRole('slider', { name: 'Guitar volume' }), {
      target: { value: '35' },
    })
    fireEvent.change(screen.getByRole('slider', { name: 'Click volume' }), {
      target: { value: '20' },
    })

    expect(audioMock.engine.setVolumes).toHaveBeenCalledWith({ guitar: 0.35 })
    expect(audioMock.engine.setVolumes).toHaveBeenCalledWith({ click: 0.2 })
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
    const onSessionChange = vi.fn()
    const fastLesson: Lesson = {
      ...lesson,
      exercises: [
        { ...lesson.exercises[0], tempoBpm: 200 },
        lesson.exercises[1],
      ],
    }
    renderRunner(vi.fn(), fastLesson, onSessionChange)

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
      await screen.findByRole(
        'button',
        { name: 'Stop recording C major — open position' },
        { timeout: 2_500 },
      ),
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
    expect(onSessionChange).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'End playthrough and grade C major — open position',
      }),
    )
    await user.click(
      within(
        screen.getByRole('dialog', { name: 'Grade C major — open position' }),
      ).getByRole('button', { name: 'Got it' }),
    )

    expect(screen.queryByLabelText('Recorded take replay')).toBeNull()
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:recorded-take')
  })

  it('scores a recorded take and persists the score with the graded session', async () => {
    const user = userEvent.setup()
    const onSessionChange = vi.fn()
    const fastLesson: Lesson = {
      ...lesson,
      exercises: [
        { ...lesson.exercises[0], tempoBpm: 200 },
        lesson.exercises[1],
      ],
    }
    renderRunner(vi.fn(), fastLesson, onSessionChange)

    await user.click(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    )
    await user.click(
      await screen.findByRole(
        'button',
        { name: 'Stop recording C major — open position' },
        { timeout: 2_500 },
      ),
    )

    expect(await screen.findByText('Machine score')).toBeInTheDocument()
    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getAllByText('On time')).toHaveLength(2)
    expect(screen.getByText('Late')).toBeInTheDocument()
    expect(scoringMock.scoreTake).toHaveBeenCalledWith(
      expect.any(Array),
      expect.arrayContaining([
        expect.objectContaining({ id: 'fx-1-0', note: 'E', onsetSeconds: 0 }),
      ]),
      'standard',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'End playthrough and grade C major — open position',
      }),
    )
    await user.click(
      within(
        screen.getByRole('dialog', { name: 'Grade C major — open position' }),
      ).getByRole('button', { name: 'Got it' }),
    )

    await waitFor(() => {
      expect(onSessionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'session-1',
          score: 92,
          results: [
            {
              exerciseId: 'fx-1',
              grade: 'got-it',
              score: {
                score: 92,
                tolerance: 'standard',
                components: { pitch: 100, timing: 83, completeness: 100 },
                perNote: expect.arrayContaining([
                  expect.objectContaining({
                    expectedId: 'fx-1-0',
                    expectedNote: 'E',
                    verdict: 'correct',
                  }),
                ]),
                extras: 0,
                analyzedAt: expect.any(String),
              },
            },
          ],
        }),
      )
    })
  })

  it('persists the selected scoring tolerance preference', async () => {
    const user = userEvent.setup()
    renderRunner()

    await user.selectOptions(
      screen.getByLabelText('Scoring tolerance'),
      'strict',
    )

    expect(getScoreTolerance()).toBe('strict')
  })

  it('does not persist a punitive score when the take is unclear', async () => {
    const user = userEvent.setup()
    const onSessionChange = vi.fn()
    scoringMock.analyzeTake.mockReturnValueOnce([])
    const fastLesson: Lesson = {
      ...lesson,
      exercises: [
        { ...lesson.exercises[0], tempoBpm: 200 },
        lesson.exercises[1],
      ],
    }
    renderRunner(vi.fn(), fastLesson, onSessionChange)

    await user.click(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    )
    await user.click(
      await screen.findByRole(
        'button',
        { name: 'Stop recording C major — open position' },
        { timeout: 2_500 },
      ),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't hear enough clear notes",
    )
    expect(scoringMock.scoreTake).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'End playthrough and grade C major — open position',
      }),
    )
    await user.click(
      within(
        screen.getByRole('dialog', { name: 'Grade C major — open position' }),
      ).getByRole('button', { name: 'Shaky' }),
    )

    await waitFor(() => {
      expect(onSessionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'session-1',
          results: [{ exerciseId: 'fx-1', grade: 'shaky' }],
        }),
      )
    })
    const saved = onSessionChange.mock.lastCall?.[0]
    expect(saved?.score).toBeUndefined()
    expect(saved?.results[0].score).toBeUndefined()
  })

  it('stops active recording capture when Next opens grading', async () => {
    const user = userEvent.setup()
    const fastLesson: Lesson = {
      ...lesson,
      exercises: [
        { ...lesson.exercises[0], tempoBpm: 200 },
        lesson.exercises[1],
      ],
    }
    renderRunner(vi.fn(), fastLesson)

    await user.click(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    )
    expect(
      await screen.findByRole(
        'button',
        { name: 'Stop recording C major — open position' },
        { timeout: 2_500 },
      ),
    ).toBeInTheDocument()
    expect(mediaRecorderInstances[0].state).toBe('recording')

    await user.click(
      screen.getByRole('button', {
        name: 'End playthrough and grade C major — open position',
      }),
    )

    expect(mediaRecorderInstances[0].state).toBe('inactive')
    expect(trackStopMock).toHaveBeenCalled()
    expect(screen.queryByLabelText('Recorded take replay')).toBeNull()
    expect(
      screen.getByRole('dialog', { name: 'Grade C major — open position' }),
    ).toBeInTheDocument()
  })

  it('recovers when MediaRecorder cannot start after count-in', async () => {
    const user = userEvent.setup()
    mediaRecorderStartError = new Error('Recorder refused to start')
    const fastLesson: Lesson = {
      ...lesson,
      exercises: [
        { ...lesson.exercises[0], tempoBpm: 200 },
        lesson.exercises[1],
      ],
    }
    renderRunner(vi.fn(), fastLesson)

    await user.click(
      screen.getByRole('button', {
        name: 'Record take for C major — open position',
      }),
    )

    expect(
      await screen.findByRole('alert', undefined, { timeout: 2_500 }),
    ).toHaveTextContent('Recorder refused to start')
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
    await user.click(
      screen.getByRole('button', {
        name: 'End playthrough and grade C major — open position',
      }),
    )

    expect(audioMock.engine.stop).toHaveBeenCalled()
    await user.click(
      within(
        screen.getByRole('dialog', { name: 'Grade C major — open position' }),
      ).getByRole('button', { name: 'Got it' }),
    )
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
    const onSessionChange = vi.fn()
    const onExit = renderRunner(vi.fn(), lesson, onSessionChange)

    expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('C major — open position')).toBeInTheDocument()
    expect(screen.getAllByText('60 BPM').length).toBeGreaterThan(0)
    expect(screen.getByText('1:00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'End playthrough and grade C major — open position',
      }),
    ).toBeDisabled()

    await finishAndGrade(user, 'C major — open position', 'Got it')
    expect(screen.getByText('Exercise 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('G7 arpeggio — open position')).toBeInTheDocument()
    expect(screen.getByText('8 repetitions')).toBeInTheDocument()

    await finishAndGrade(user, 'G7 arpeggio — open position', 'Shaky')
    expect(
      screen.getByRole('heading', { name: 'Lesson complete — Fixture lesson' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Got it')).toBeInTheDocument()
    expect(screen.getByText('Shaky')).toBeInTheDocument()

    await waitFor(() => {
      expect(onSessionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'session-1',
          lessonId: 'fixture-lesson',
          completed: true,
          results: [
            { exerciseId: 'fx-1', grade: 'got-it' },
            { exerciseId: 'fx-2', grade: 'shaky' },
          ],
        }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('persists a partial session marked incomplete when abandoned mid-lesson', async () => {
    const user = userEvent.setup()
    const onSessionChange = vi.fn()
    const onExit = renderRunner(vi.fn(), lesson, onSessionChange)

    await finishAndGrade(user, 'C major — open position', 'Missed')
    await user.click(screen.getByRole('button', { name: 'End lesson' }))

    expect(onExit).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(onSessionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'session-1',
          lessonId: 'fixture-lesson',
          completed: false,
          results: [{ exerciseId: 'fx-1', grade: 'missed' }],
        }),
      )
    })
  })

  it('persists nothing until an exercise is graded', async () => {
    const user = userEvent.setup()
    const onSessionChange = vi.fn()
    const onExit = renderRunner(vi.fn(), lesson, onSessionChange)
    await user.click(screen.getByRole('button', { name: 'End lesson' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onSessionChange).not.toHaveBeenCalled()
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

    await finishAndGrade(user, 'C major — open position', 'Got it')

    await finishAndGrade(user, 'G7 arpeggio — open position', 'Shaky')
    expect(
      screen.getByRole('heading', { name: 'Lesson complete — Fixture lesson' }),
    ).toHaveFocus()
  })
})
