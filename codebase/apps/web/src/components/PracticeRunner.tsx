import { displayAccidentals, noteName } from '@jazz-master/theory'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from 'react'
import type { PlayAlongEngine } from '../audio'
import { createExercisePattern, secondsPerBeat } from '../audio/timeline'
import {
  RECORDING_COUNT_IN_BEATS,
  createInputLevelMeter,
  getCountInDurationMs,
  getRecordingAudioConstraints,
  getRecordingMimeType,
  initialRecordingState,
  isPermissionDeniedError,
  recordingReducer,
  scheduleCountInClicks,
  type RecordedTake,
} from '../audio/recording'
import { deriveRhythm, resolveExercise, type Exercise, type Lesson } from '../content'
import {
  analyzeTake,
  scoreTake,
  type ExpectedNote,
  type NoteScore,
  type ScoreComponents,
  type TakeScore,
} from '../scoring'
import {
  MAX_PLAY_ALONG_TEMPO_BPM,
  MIN_PLAY_ALONG_TEMPO_BPM,
  clampPlayAlongTempo,
  getPlayAlongTempo,
  savePlayAlongTempo,
} from '../storage/playAlongTempos'
import {
  NOTATION_DISPLAY_MODES,
  getNotationDisplayMode,
  saveNotationDisplayMode,
  type NotationDisplayMode,
} from '../storage/notationPreferences'
import {
  SCORE_TOLERANCE_PRESETS,
  getScoreTolerance,
  saveScoreTolerance,
} from '../storage/scoringPreferences'
import type {
  ExerciseGrade,
  ExerciseScore,
  ScoreTolerancePreset,
  ScoreVerdict,
} from '../storage/sessions'
import { Fretboard, type FretboardHighlight } from './Fretboard'
import { Notation } from './Notation'
import { NOTATION_DISPLAY_LABELS } from './notationDisplay'
import { usePracticeRunner } from './usePracticeRunner'
import { useViewFocus } from './useViewFocus'

const GRADE_LABELS: Record<ExerciseGrade, string> = {
  'got-it': 'Got it',
  shaky: 'Shaky',
  missed: 'Missed',
}

const GRADE_ORDER: readonly ExerciseGrade[] = ['got-it', 'shaky', 'missed']
const DEFAULT_GUITAR_VOLUME = 80
const DEFAULT_CLICK_VOLUME = 80

type PlaybackStatus = 'idle' | 'loading' | 'playing'
type PlaythroughStatus = 'not-started' | 'active' | 'complete'
type ScoreAnalysisState =
  | { status: 'idle'; score: null; message: null }
  | { status: 'analyzing'; score: null; message: null }
  | { status: 'scored'; score: ExerciseScore; message: null }
  | { status: 'unclear'; score: null; message: string }
  | { status: 'failed'; score: null; message: string }

const initialScoreAnalysisState: ScoreAnalysisState = {
  status: 'idle',
  score: null,
  message: null,
}

const SCORE_VERDICT_LABELS: Record<ScoreVerdict, string> = {
  correct: 'On time',
  early: 'Early',
  late: 'Late',
  'wrong-pitch': 'Wrong note',
  missed: 'Missed',
}

const SCORE_TOLERANCE_LABELS: Record<ScoreTolerancePreset, string> = {
  lenient: 'Lenient',
  standard: 'Standard',
  strict: 'Strict',
}

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
    MediaRecorder?: typeof MediaRecorder
  }

interface PracticeRunnerProps {
  lesson: Lesson
  /** Session identity is owned by the Start handler, not this component. */
  sessionId: string
  startedAt: number
  onExit: () => void
}

export function PracticeRunner({
  lesson,
  sessionId,
  startedAt,
  onExit,
}: PracticeRunnerProps) {
  const { state, beginExercise, completeExercise, grade } = usePracticeRunner({
    lesson,
    sessionId,
    startedAt,
  })
  const [exiting, setExiting] = useState(false)
  // ISSUE-002: the runner appearing (Start) and the summary replacing it (last
  // grade) are same-route view swaps; move focus to the incoming heading.
  const headingRef = useViewFocus<HTMLHeadingElement>(
    state.finished ? 'summary' : 'exercises',
    { focusOnMount: true },
  )

  function exitRunner(): void {
    setExiting(true)
    onExit()
  }

  if (exiting) return null

  if (state.finished) {
    const gradeByExercise = new Map(
      state.results.map((result) => [result.exerciseId, result.grade]),
    )
    return (
      <section className="max-w-2xl">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          Lesson complete — {lesson.title}
        </h2>
        <ul className="mt-4 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
          {lesson.exercises.map((exercise) => {
            const exerciseGrade = gradeByExercise.get(exercise.id)
            return (
              <li
                key={exercise.id}
                className="flex items-baseline justify-between gap-4 p-4"
              >
                <span className="text-zinc-100">{exercise.title}</span>
                <span className="shrink-0 text-sm text-zinc-400">
                  {exerciseGrade ? GRADE_LABELS[exerciseGrade] : '—'}
                </span>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={exitRunner}
          className="mt-6 rounded-md bg-amber-500 px-4 py-2 font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          Done
        </button>
      </section>
    )
  }

  const exercise = lesson.exercises[state.exerciseIndex]
  return (
    <section className="max-w-2xl">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          {lesson.title}
        </h2>
        <button
          type="button"
          onClick={exitRunner}
          className="shrink-0 text-sm text-zinc-400 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          End lesson
        </button>
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        Exercise {state.exerciseIndex + 1} of {lesson.exercises.length}
      </p>
      {/* Keyed so per-exercise state (the countdown) resets on advance. */}
      <ExercisePanel
        key={exercise.id}
        exercise={exercise}
        onBeginExercise={beginExercise}
        onCompleteExercise={completeExercise}
        onGrade={grade}
      />
    </section>
  )
}

function ExercisePanel({
  exercise,
  onBeginExercise,
  onCompleteExercise,
  onGrade,
}: {
  exercise: Exercise
  onBeginExercise: () => void
  onCompleteExercise: () => void
  onGrade: (grade: ExerciseGrade, score?: ExerciseScore) => void
}) {
  const resolved = useMemo(() => resolveExercise(exercise), [exercise])
  const notationMeasures = useMemo(
    () => deriveRhythm(resolved.positions),
    [resolved.positions],
  )
  const [tempoBpm, setTempoBpm] = useState(() =>
    getPlayAlongTempo(exercise.id, exercise.tempoBpm),
  )
  const [notationDisplayMode, setNotationDisplayMode] = useState(
    getNotationDisplayMode,
  )
  const [scoreTolerance, setScoreTolerance] = useState(getScoreTolerance)
  const [scoreAnalysis, setScoreAnalysis] = useState<ScoreAnalysisState>(
    initialScoreAnalysisState,
  )
  const [scoreFocusOpen, setScoreFocusOpen] = useState(false)
  const [playthroughStatus, setPlaythroughStatus] =
    useState<PlaythroughStatus>('not-started')
  const [gradePromptOpen, setGradePromptOpen] = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(true)
  const [clickEnabled, setClickEnabled] = useState(true)
  const [guitarVolume, setGuitarVolume] = useState(DEFAULT_GUITAR_VOLUME)
  const [clickVolume, setClickVolume] = useState(DEFAULT_CLICK_VOLUME)
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle')
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const [recordingState, dispatchRecording] = useReducer(
    recordingReducer,
    initialRecordingState,
  )
  const scoreFocusButtonRef = useRef<HTMLButtonElement>(null)
  const restoreScoreFocusRef = useRef(false)
  const engineRef = useRef<PlayAlongEngine | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const captureAudioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const levelMeterRef = useRef<{ stop: () => void } | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef<number | null>(null)
  const recordingTimeoutsRef = useRef<number[]>([])
  const takeUrlRef = useRef<string | null>(null)
  const scoreAnalysisRunRef = useRef(0)
  const mountedRef = useRef(true)
  const playthroughStatusRef = useRef<PlaythroughStatus>('not-started')
  const playbackCompletionTimeoutRef = useRef<number | null>(null)
  const tempoMax = MAX_PLAY_ALONG_TEMPO_BPM
  const highlights: FretboardHighlight[] = resolved.positions.map(
    (position) => ({
      string: position.string,
      fret: position.fret,
      label: noteName(position.note),
      role: position.degree === 1 ? 'root' : 'other',
    }),
  )

  const clearPlaybackCompletionTimeout = useCallback(() => {
    if (playbackCompletionTimeoutRef.current !== null) {
      window.clearTimeout(playbackCompletionTimeoutRef.current)
      playbackCompletionTimeoutRef.current = null
    }
  }, [])

  const stopPlayback = useCallback(() => {
    clearPlaybackCompletionTimeout()
    engineRef.current?.stop()
    setPlaybackStatus('idle')
  }, [clearPlaybackCompletionTimeout])

  function beginPlaythrough(): void {
    if (playthroughStatusRef.current !== 'not-started') return
    playthroughStatusRef.current = 'active'
    setPlaythroughStatus('active')
    onBeginExercise()
  }

  const completePlaythrough = useCallback(() => {
    if (playthroughStatusRef.current !== 'active') return
    playthroughStatusRef.current = 'complete'
    setPlaythroughStatus('complete')
    stopPlayback()
    cleanupCapture({ revokeTake: true })
    dispatchRecording({ type: 'reset' })
    onCompleteExercise()
    setGradePromptOpen(true)
  }, [onCompleteExercise, stopPlayback])

  function schedulePlaybackCompletion(tempo: number): void {
    clearPlaybackCompletionTimeout()
    if (loopEnabled) return
    const countInBeats = clickEnabled ? 4 : 0
    const pattern = createExercisePattern(resolved.positions, {
      click: clickEnabled,
    })
    const durationMs = Math.ceil(
      (countInBeats + pattern.lengthBeats) * secondsPerBeat(tempo) * 1000,
    )
    playbackCompletionTimeoutRef.current = window.setTimeout(
      completePlaythrough,
      durationMs,
    )
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      engineRef.current?.dispose()
      engineRef.current = null
      void audioContextRef.current?.close()
      audioContextRef.current = null
      cleanupCapture({ revokeTake: true })
      clearPlaybackCompletionTimeout()
    }
  }, [clearPlaybackCompletionTimeout])

  async function togglePlayback(): Promise<void> {
    if (playbackStatus === 'loading') return
    if (playbackStatus === 'playing') {
      stopPlayback()
      return
    }
    setPlaybackStatus('loading')
    setPlaybackError(null)
    try {
      audioContextRef.current ??= createUserGestureAudioContext()
      const { createPlayAlongEngine } = await import('../audio')
      if (!mountedRef.current) return
      const engine =
        engineRef.current ??
        (audioContextRef.current
          ? createPlayAlongEngine({ audioContext: audioContextRef.current })
          : createPlayAlongEngine())
      engineRef.current = engine
      await engine.playResolvedExercise({
        positions: resolved.positions,
        tempoBpm,
        loop: loopEnabled,
        click: clickEnabled,
        countInBeats: clickEnabled ? 4 : 0,
        guitarVolume: volumePercentToUnit(guitarVolume),
        clickVolume: volumePercentToUnit(clickVolume),
      })
      if (mountedRef.current) {
        beginPlaythrough()
        schedulePlaybackCompletion(tempoBpm)
        setPlaybackStatus('playing')
      }
    } catch (error) {
      engineRef.current?.stop()
      if (!mountedRef.current) return
      setPlaybackStatus('idle')
      setPlaybackError(
        error instanceof Error ? error.message : 'Play-along could not start',
      )
    }
  }

  function updateTempo(event: ChangeEvent<HTMLInputElement>): void {
    const nextTempo = clampPlayAlongTempo(
      Number(event.currentTarget.value),
      exercise.tempoBpm,
    )
    setTempoBpm(nextTempo)
    savePlayAlongTempo(exercise.id, nextTempo, exercise.tempoBpm)
    engineRef.current?.setTempoBpm(nextTempo)
    if (playbackStatus === 'playing' && !loopEnabled) {
      schedulePlaybackCompletion(nextTempo)
    }
  }

  function updateLoop(event: ChangeEvent<HTMLInputElement>): void {
    setLoopEnabled(event.currentTarget.checked)
    if (playbackStatus === 'playing') stopPlayback()
  }

  function updateClick(event: ChangeEvent<HTMLInputElement>): void {
    setClickEnabled(event.currentTarget.checked)
    if (playbackStatus === 'playing') stopPlayback()
  }

  function updateGuitarVolume(event: ChangeEvent<HTMLInputElement>): void {
    const nextVolume = clampVolumePercent(Number(event.currentTarget.value))
    setGuitarVolume(nextVolume)
    engineRef.current?.setVolumes({ guitar: volumePercentToUnit(nextVolume) })
  }

  function updateClickVolume(event: ChangeEvent<HTMLInputElement>): void {
    const nextVolume = clampVolumePercent(Number(event.currentTarget.value))
    setClickVolume(nextVolume)
    engineRef.current?.setVolumes({ click: volumePercentToUnit(nextVolume) })
  }

  function updateNotationDisplayMode(mode: NotationDisplayMode): void {
    setNotationDisplayMode(mode)
    saveNotationDisplayMode(mode)
  }

  function updateScoreTolerance(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const value = event.currentTarget.value
    if (!SCORE_TOLERANCE_PRESETS.includes(value as ScoreTolerancePreset)) return
    const tolerance = value as ScoreTolerancePreset
    setScoreTolerance(tolerance)
    saveScoreTolerance(tolerance)
    resetScoreAnalysis()
  }

  function openScoreFocus(): void {
    restoreScoreFocusRef.current = false
    setScoreFocusOpen(true)
  }

  const closeScoreFocus = useCallback(() => {
    restoreScoreFocusRef.current = true
    setScoreFocusOpen(false)
  }, [])

  useEffect(() => {
    if (!scoreFocusOpen && restoreScoreFocusRef.current) {
      restoreScoreFocusRef.current = false
      scoreFocusButtonRef.current?.focus()
    }
  }, [scoreFocusOpen])

  function resetScoreAnalysis(): void {
    scoreAnalysisRunRef.current += 1
    setScoreAnalysis(initialScoreAnalysisState)
  }

  function clearRecordingTimeouts(): void {
    for (const timeoutId of recordingTimeoutsRef.current) {
      window.clearTimeout(timeoutId)
    }
    recordingTimeoutsRef.current = []
  }

  function cleanupCapture({ revokeTake }: { revokeTake: boolean }): void {
    clearRecordingTimeouts()
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onstop = null
      recorderRef.current.onerror = null
      recorderRef.current.stop()
    }
    recorderRef.current = null
    levelMeterRef.current?.stop()
    levelMeterRef.current = null
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micStreamRef.current = null
    void captureAudioContextRef.current?.close()
    captureAudioContextRef.current = null
    recordingStartedAtRef.current = null
    recordingChunksRef.current = []
    if (revokeTake && takeUrlRef.current) {
      URL.revokeObjectURL(takeUrlRef.current)
      takeUrlRef.current = null
    }
  }

  function resetTake(): void {
    cleanupCapture({ revokeTake: true })
    dispatchRecording({ type: 'reset' })
    resetScoreAnalysis()
  }

  function failCapture(message: string): void {
    cleanupCapture({ revokeTake: true })
    if (mountedRef.current) {
      dispatchRecording({ type: 'failed', message })
      resetScoreAnalysis()
    }
  }

  async function startCapture(): Promise<void> {
    if (
      recordingState.status === 'requesting-permission' ||
      recordingState.status === 'counting-in'
    ) {
      return
    }
    if (recordingState.status === 'recording') {
      recorderRef.current?.stop()
      return
    }

    stopPlayback()
    cleanupCapture({ revokeTake: true })
    resetScoreAnalysis()
    dispatchRecording({ type: 'request-permission' })

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      dispatchRecording({
        type: 'unsupported',
        message: 'Recording is not available in this browser.',
      })
      return
    }
    const constructors = window as WindowWithWebkitAudio
    if (!constructors.MediaRecorder) {
      dispatchRecording({
        type: 'unsupported',
        message: 'Recording is not available in this browser.',
      })
      return
    }

    try {
      const audioContext = createUserGestureAudioContext()
      if (!audioContext) {
        throw new Error('Web Audio is not available in this browser.')
      }
      captureAudioContextRef.current = audioContext
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      const stream = await navigator.mediaDevices.getUserMedia(
        getRecordingAudioConstraints(),
      )
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      micStreamRef.current = stream
      if (!mountedRef.current) return
      levelMeterRef.current = createInputLevelMeter(audioContext, stream, (level) => {
        dispatchRecording({ type: 'level-changed', level })
      })
      dispatchRecording({ type: 'count-in-started' })
      beginPlaythrough()
      const takeStartTime = scheduleCountInClicks(
        audioContext,
        tempoBpm,
        RECORDING_COUNT_IN_BEATS,
      )
      const beatMs = getCountInDurationMs(tempoBpm, 1)
      for (let beat = 2; beat <= RECORDING_COUNT_IN_BEATS; beat += 1) {
        recordingTimeoutsRef.current.push(
          window.setTimeout(() => {
            dispatchRecording({ type: 'count-in-beat', beat })
          }, (beat - 1) * beatMs),
        )
      }
      const takeStartDelayMs = Math.max(
        (takeStartTime - audioContext.currentTime) * 1000,
        0,
      )
      recordingTimeoutsRef.current.push(
        window.setTimeout(() => {
          try {
            beginMediaRecording(stream, constructors.MediaRecorder!, audioContext)
          } catch (error) {
            failCapture(
              error instanceof Error
                ? error.message
                : 'Recording could not start.',
            )
          }
        }, takeStartDelayMs),
      )
    } catch (error) {
      cleanupCapture({ revokeTake: true })
      dispatchRecording(
        isPermissionDeniedError(error)
          ? {
              type: 'permission-denied',
              message:
                'Microphone access was blocked. Allow it in your browser settings and try again.',
            }
          : {
              type: 'failed',
              message:
                error instanceof Error
                  ? error.message
                  : 'Recording could not start.',
            },
      )
    }
  }

  async function analyzeRecordedTake(
    blob: Blob,
    audioContext: AudioContext,
  ): Promise<void> {
    const analysisRun = scoreAnalysisRunRef.current + 1
    scoreAnalysisRunRef.current = analysisRun
    setScoreAnalysis({ status: 'analyzing', score: null, message: null })
    try {
      const buffer = await audioContext.decodeAudioData(await blob.arrayBuffer())
      if (!isCurrentAnalysisRun(analysisRun)) return
      const pcm = audioBufferToMonoPcm(buffer)
      const events = analyzeTake(pcm, buffer.sampleRate)
      if (events.length === 0) {
        setScoreAnalysis({
          status: 'unclear',
          score: null,
          message:
            "We couldn't hear enough clear notes to score this take. Try a closer mic position and record again.",
        })
        return
      }
      const expected = expectedNotesForExercise(
        exercise.id,
        resolved.positions.map((position) => noteName(position.note)),
        tempoBpm,
      )
      const result = scoreTake(events, expected, scoreTolerance)
      setScoreAnalysis({
        status: 'scored',
        score: toExerciseScore(result, scoreTolerance),
        message: null,
      })
    } catch (error) {
      if (!isCurrentAnalysisRun(analysisRun)) return
      setScoreAnalysis({
        status: 'failed',
        score: null,
        message:
          error instanceof Error
            ? error.message
            : 'This take could not be analyzed.',
      })
    }
  }

  function isCurrentAnalysisRun(analysisRun: number): boolean {
    return mountedRef.current && scoreAnalysisRunRef.current === analysisRun
  }

  function beginMediaRecording(
    stream: MediaStream,
    MediaRecorderConstructor: typeof MediaRecorder,
    audioContext: AudioContext,
  ): void {
    if (!mountedRef.current) return
    clearRecordingTimeouts()
    const mimeType = getRecordingMimeType(MediaRecorderConstructor)
    const recorder = new MediaRecorderConstructor(
      stream,
      mimeType ? { mimeType } : undefined,
    )
    recordingChunksRef.current = []
    recorderRef.current = recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordingChunksRef.current.push(event.data)
    }
    recorder.onerror = () => {
      recorder.ondataavailable = null
      recorder.onstop = null
      failCapture('Recording failed. Check the microphone and try again.')
    }
    recorder.onstop = () => {
      const durationSeconds =
        recordingStartedAtRef.current === null
          ? 0
          : Math.max((performance.now() - recordingStartedAtRef.current) / 1000, 0)
      levelMeterRef.current?.stop()
      levelMeterRef.current = null
      micStreamRef.current?.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
      const blobType =
        mimeType || recordingChunksRef.current[0]?.type || 'audio/webm'
      const blob = new Blob(recordingChunksRef.current, { type: blobType })
      const url = URL.createObjectURL(blob)
      takeUrlRef.current = url
      recorderRef.current = null
      recordingStartedAtRef.current = null
      recordingChunksRef.current = []
      if (mountedRef.current) {
        dispatchRecording({
          type: 'recorded',
          take: {
            url,
            mimeType: blob.type,
            durationSeconds,
            sampleRate: audioContext.sampleRate,
          },
        })
        void analyzeRecordedTake(blob, audioContext)
      } else {
        URL.revokeObjectURL(url)
      }
    }
    recordingStartedAtRef.current = performance.now()
    recorder.start()
    dispatchRecording({ type: 'recording-started' })
  }

  const playbackButtonLabel =
    playbackStatus === 'playing'
      ? `Stop play-along for ${exercise.title}`
      : playbackStatus === 'loading'
        ? `Loading play-along for ${exercise.title}`
        : `Play play-along for ${exercise.title}`

  return (
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium text-zinc-100">{exercise.title}</h3>
        <span className="shrink-0 text-sm text-zinc-400">
          {tempoBpm} BPM
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        {exercise.duration.kind === 'minutes' ? (
          <Countdown
            initialSeconds={exercise.duration.minutes * 60}
            active={playthroughStatus === 'active'}
            onExpire={completePlaythrough}
          />
        ) : (
          `${exercise.duration.count} repetitions`
        )}
      </p>
      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/40 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={beginPlaythrough}
            disabled={playthroughStatus !== 'not-started'}
            aria-label={`Begin ${exercise.title}`}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
          >
            Begin
          </button>
          <button
            type="button"
            onClick={() => void togglePlayback()}
            disabled={playbackStatus === 'loading'}
            aria-label={playbackButtonLabel}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-wait disabled:bg-zinc-700 disabled:text-zinc-300"
          >
            {playbackStatus === 'playing'
              ? 'Stop'
              : playbackStatus === 'loading'
                ? 'Loading'
                : 'Play'}
          </button>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={loopEnabled}
              onChange={updateLoop}
              className="h-4 w-4 accent-amber-500"
            />
            Loop
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={clickEnabled}
              onChange={updateClick}
              className="h-4 w-4 accent-amber-500"
            />
            Click + count-in
          </label>
          <button
            type="button"
            onClick={completePlaythrough}
            disabled={playthroughStatus !== 'active'}
            aria-label={`End playthrough and grade ${exercise.title}`}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
          >
            Next
          </button>
        </div>
        <label
          htmlFor={`tempo-${exercise.id}`}
          className="mt-3 flex items-center justify-between gap-4 text-sm text-zinc-300"
        >
          <span>Tempo</span>
          <span>{tempoBpm} BPM</span>
        </label>
        <input
          id={`tempo-${exercise.id}`}
          type="range"
          min={MIN_PLAY_ALONG_TEMPO_BPM}
          max={tempoMax}
          step={1}
          value={tempoBpm}
          onChange={updateTempo}
          aria-label={`Tempo for ${exercise.title}`}
          className="mt-2 w-full accent-amber-500"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <VolumeControl
            id={`guitar-volume-${exercise.id}`}
            label="Guitar volume"
            value={guitarVolume}
            onChange={updateGuitarVolume}
          />
          <VolumeControl
            id={`click-volume-${exercise.id}`}
            label="Click volume"
            value={clickVolume}
            onChange={updateClickVolume}
          />
        </div>
        {playbackError && (
          <p role="alert" className="mt-2 text-sm text-red-300">
            {playbackError}
          </p>
        )}
      </div>
      <RecordingPanel
        exerciseId={exercise.id}
        exerciseTitle={exercise.title}
        tempoBpm={tempoBpm}
        state={recordingState}
        scoreAnalysis={scoreAnalysis}
        tolerance={scoreTolerance}
        onToleranceChange={updateScoreTolerance}
        onRecord={() => void startCapture()}
        onReset={resetTake}
      />
      {exercise.display.includes('fretboard') && (
        <div className="mt-3">
          <Fretboard
            highlights={highlights}
            fretRange={exercise.window}
            aria-label={`${exercise.title} on the fretboard, frets ${exercise.window.min} to ${exercise.window.max}`}
          />
        </div>
      )}
      {/* Long exercises hit the SVG's min-width floor and scroll sideways
          instead of shrinking fret digits into illegibility (INS-029). */}
      {exercise.display.includes('notation') && (
        <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <NotationDisplayControls
              exerciseTitle={exercise.title}
              displayMode={notationDisplayMode}
              onChange={updateNotationDisplayMode}
            />
            <button
              ref={scoreFocusButtonRef}
              type="button"
              onClick={openScoreFocus}
              aria-label={`Open focus mode for ${exercise.title} score`}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              Focus
            </button>
          </div>
          <div
            tabIndex={0}
            aria-label={`${exercise.title} score viewport`}
            className="mt-3 min-h-[18rem] overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950/60 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:min-h-[21rem]"
          >
            <Notation
              measures={notationMeasures}
              displayMode={notationDisplayMode}
              aria-label={`${exercise.title} — ${NOTATION_DISPLAY_LABELS[notationDisplayMode]}`}
            />
          </div>
          {scoreFocusOpen && (
            <NotationFocusDialog
              exerciseTitle={exercise.title}
              measures={notationMeasures}
              displayMode={notationDisplayMode}
              onDisplayModeChange={updateNotationDisplayMode}
              onClose={closeScoreFocus}
            />
          )}
        </div>
      )}
      {gradePromptOpen && (
        <GradePromptDialog
          exerciseTitle={exercise.title}
          onGrade={(gradeValue) => {
            setGradePromptOpen(false)
            onGrade(gradeValue, scoreAnalysis.score ?? undefined)
          }}
        />
      )}
    </div>
  )
}

function VolumeControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: number
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center justify-between gap-4 text-sm text-zinc-300"
      >
        <span>{label}</span>
        <span>{value}%</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={onChange}
        aria-label={label}
        className="mt-2 w-full accent-amber-500"
      />
    </div>
  )
}

function NotationDisplayControls({
  exerciseTitle,
  displayMode,
  onChange,
}: {
  exerciseTitle: string
  displayMode: NotationDisplayMode
  onChange: (mode: NotationDisplayMode) => void
}) {
  return (
    <div
      role="group"
      aria-label={`Score display for ${exerciseTitle}`}
      className="flex rounded-md border border-zinc-700 bg-zinc-950 p-0.5"
    >
      {NOTATION_DISPLAY_MODES.map((mode) => {
        const selected = displayMode === mode
        const text = mode === 'both' ? 'Both' : mode === 'staff' ? 'Staff' : 'TAB'
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={selected}
            aria-label={`Show ${NOTATION_DISPLAY_LABELS[mode]} for ${exerciseTitle}`}
            onClick={() => onChange(mode)}
            className={
              selected
                ? 'rounded-sm bg-amber-500 px-3 py-1.5 text-sm font-medium text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400'
                : 'rounded-sm px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400'
            }
          >
            {text}
          </button>
        )
      })}
    </div>
  )
}

function clampVolumePercent(volume: number): number {
  if (!Number.isFinite(volume)) return 100
  return Math.min(100, Math.max(0, Math.round(volume)))
}

function volumePercentToUnit(volume: number): number {
  return clampVolumePercent(volume) / 100
}

function expectedNotesForExercise(
  exerciseId: string,
  noteNames: readonly string[],
  tempoBpm: number,
): ExpectedNote[] {
  const beatSeconds = secondsPerBeat(tempoBpm)
  return noteNames.map((note, index) => ({
    id: `${exerciseId}-${index}`,
    note,
    onsetSeconds: index * beatSeconds,
  }))
}

function toExerciseScore(
  result: TakeScore,
  tolerance: ScoreTolerancePreset,
): ExerciseScore {
  return {
    score: result.score,
    tolerance,
    components: result.components,
    perNote: result.perNote.map(toExerciseScoreNote),
    extras: result.extras.length,
    analyzedAt: new Date().toISOString(),
  }
}

function toExerciseScoreNote(note: NoteScore): ExerciseScore['perNote'][number] {
  return {
    expectedId: note.expected.id,
    expectedNote: note.expected.note,
    verdict: note.verdict,
    timingOffsetSeconds:
      note.timingOffsetSeconds === null
        ? null
        : roundSeconds(note.timingOffsetSeconds),
    pitchCents: note.pitchCents === null ? null : Math.round(note.pitchCents),
  }
}

function audioBufferToMonoPcm(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels <= 1) {
    return new Float32Array(buffer.getChannelData(0))
  }
  const pcm = new Float32Array(buffer.length)
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < data.length; index += 1) {
      pcm[index] += data[index] / buffer.numberOfChannels
    }
  }
  return pcm
}

function roundSeconds(seconds: number): number {
  return Math.round(seconds * 1000) / 1000
}

function NotationFocusDialog({
  exerciseTitle,
  measures,
  displayMode,
  onDisplayModeChange,
  onClose,
}: {
  exerciseTitle: string
  measures: ReturnType<typeof deriveRhythm>
  displayMode: NotationDisplayMode
  onDisplayModeChange: (mode: NotationDisplayMode) => void
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function trapTabFocus(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (event.key !== 'Tab') return
    const focusable = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ].filter((element) => !element.hasAttribute('disabled'))
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${exerciseTitle} score focus mode`}
      onKeyDown={trapTabFocus}
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950 p-4 text-zinc-100 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <p className="text-sm text-zinc-400">Score focus</p>
          <h3 className="font-display text-xl font-bold tracking-tight">
            {exerciseTitle}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NotationDisplayControls
            exerciseTitle={exerciseTitle}
            displayMode={displayMode}
            onChange={onDisplayModeChange}
          />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            Exit focus
          </button>
        </div>
      </div>
      <div
        tabIndex={0}
        aria-label={`${exerciseTitle} focus score viewport`}
        className="my-4 min-h-0 flex-1 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        <Notation
          measures={measures}
          displayMode={displayMode}
          size="focus"
          aria-label={`${exerciseTitle} focus — ${NOTATION_DISPLAY_LABELS[displayMode]}`}
        />
      </div>
    </div>
  )
}

function GradePromptDialog({
  exerciseTitle,
  onGrade,
}: {
  exerciseTitle: string
  onGrade: (grade: ExerciseGrade) => void
}) {
  const firstGradeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    firstGradeButtonRef.current?.focus()
  }, [])

  function trapTabFocus(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (event.key !== 'Tab') return
    const focusable = [
      ...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ].filter((element) => !element.hasAttribute('disabled'))
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Grade ${exerciseTitle}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 text-zinc-100"
    >
      <div
        ref={dialogRef}
        onKeyDown={trapTabFocus}
        className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-2xl"
      >
        <p className="text-sm text-zinc-400">Grade exercise</p>
        <h3 className="mt-1 font-display text-lg font-bold tracking-tight">
          {exerciseTitle}
        </h3>
        <GradeButtons
          onGrade={onGrade}
          layout="focus"
          firstButtonRef={firstGradeButtonRef}
        />
      </div>
    </div>
  )
}

function GradeButtons({
  onGrade,
  layout,
  firstButtonRef,
}: {
  onGrade: (grade: ExerciseGrade) => void
  layout: 'inline' | 'focus'
  firstButtonRef?: RefObject<HTMLButtonElement | null>
}) {
  return (
    <div className={layout === 'focus' ? 'flex flex-wrap gap-3' : 'mt-6 flex gap-3'}>
      {GRADE_ORDER.map((gradeValue, index) => (
        <button
          key={gradeValue}
          ref={index === 0 ? firstButtonRef : undefined}
          type="button"
          onClick={() => onGrade(gradeValue)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          {GRADE_LABELS[gradeValue]}
        </button>
      ))}
    </div>
  )
}

function RecordingPanel({
  exerciseId,
  exerciseTitle,
  tempoBpm,
  state,
  scoreAnalysis,
  tolerance,
  onToleranceChange,
  onRecord,
  onReset,
}: {
  exerciseId: string
  exerciseTitle: string
  tempoBpm: number
  state: typeof initialRecordingState
  scoreAnalysis: ScoreAnalysisState
  tolerance: ScoreTolerancePreset
  onToleranceChange: (event: ChangeEvent<HTMLSelectElement>) => void
  onRecord: () => void
  onReset: () => void
}) {
  const levelPercent = Math.round(state.level * 100)
  const busy =
    state.status === 'requesting-permission' || state.status === 'counting-in'
  const buttonLabel =
    state.status === 'recording'
      ? `Stop recording ${exerciseTitle}`
      : state.status === 'recorded'
        ? `Record another take for ${exerciseTitle}`
        : state.status === 'requesting-permission'
          ? `Requesting microphone for ${exerciseTitle}`
          : state.status === 'counting-in'
            ? `Counting in ${exerciseTitle}`
            : `Record take for ${exerciseTitle}`
  const buttonText =
    state.status === 'recording'
      ? 'Stop'
      : state.status === 'recorded'
        ? 'Record again'
        : state.status === 'requesting-permission'
          ? 'Allow mic'
          : state.status === 'counting-in'
            ? 'Counting in'
            : 'Record'

  return (
    <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">Take recorder</p>
          <p className="mt-1 text-xs text-zinc-400">
            Uses your microphone only for this exercise. Audio stays on this device and is discarded when you leave it.
          </p>
        </div>
        <button
          type="button"
          onClick={onRecord}
          disabled={busy}
          aria-label={buttonLabel}
          className="rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-wait disabled:border-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-300"
        >
          {buttonText}
        </button>
      </div>
      {(state.status === 'counting-in' || state.status === 'recording') && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
            <span>
              {state.status === 'counting-in'
                ? `Count-in beat ${state.countInBeat ?? 1} of ${RECORDING_COUNT_IN_BEATS}`
                : `Recording from beat 1 at ${tempoBpm} BPM`}
            </span>
            <span>{levelPercent}% input</span>
          </div>
          <div
            role="meter"
            aria-label="Input level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={levelPercent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${levelPercent}%` }}
            />
          </div>
        </div>
      )}
      {state.take && (
        <RecordedTakePlayer take={state.take} onReset={onReset} />
      )}
      <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor={`score-tolerance-${exerciseId}`}
            className="text-sm font-medium text-zinc-100"
          >
            Scoring tolerance
          </label>
          <select
            id={`score-tolerance-${exerciseId}`}
            value={tolerance}
            onChange={onToleranceChange}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            {SCORE_TOLERANCE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {SCORE_TOLERANCE_LABELS[preset]}
              </option>
            ))}
          </select>
        </div>
        <ScoreAnalysisPanel state={scoreAnalysis} />
      </div>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {state.error}
        </p>
      )}
    </div>
  )
}

function ScoreAnalysisPanel({ state }: { state: ScoreAnalysisState }) {
  if (state.status === 'idle') {
    return (
      <p className="mt-3 text-sm text-zinc-400">
        Record a take to get pitch and timing feedback.
      </p>
    )
  }

  if (state.status === 'analyzing') {
    return (
      <p role="status" className="mt-3 text-sm text-zinc-300">
        Analyzing take…
      </p>
    )
  }

  if (state.status === 'unclear' || state.status === 'failed') {
    return (
      <p role="alert" className="mt-3 text-sm text-amber-200">
        {state.message}
      </p>
    )
  }

  const score = state.score
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">Machine score</p>
          <p className="font-display text-3xl font-bold tracking-tight text-zinc-100">
            {score.score}
          </p>
        </div>
        <ScoreComponents components={score.components} />
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {score.perNote.map((note, index) => (
          <li
            key={note.expectedId}
            className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
          >
            <span className="text-sm text-zinc-100">
              {index + 1}. {displayAccidentals(note.expectedNote)}
            </span>
            <span
              className={`rounded-sm px-2 py-1 text-xs font-medium ${scoreVerdictClass(note.verdict)}`}
            >
              {SCORE_VERDICT_LABELS[note.verdict]}
            </span>
          </li>
        ))}
      </ul>
      {score.extras > 0 && (
        <p className="mt-2 text-xs text-zinc-400">
          {score.extras} extra {score.extras === 1 ? 'note' : 'notes'} detected.
        </p>
      )}
    </div>
  )
}

function ScoreComponents({ components }: { components: ScoreComponents }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-right text-xs text-zinc-400">
      <div>
        <dt>Pitch</dt>
        <dd className="mt-1 font-medium text-zinc-100">{components.pitch}</dd>
      </div>
      <div>
        <dt>Timing</dt>
        <dd className="mt-1 font-medium text-zinc-100">{components.timing}</dd>
      </div>
      <div>
        <dt>Complete</dt>
        <dd className="mt-1 font-medium text-zinc-100">
          {components.completeness}
        </dd>
      </div>
    </dl>
  )
}

function scoreVerdictClass(verdict: ScoreVerdict): string {
  switch (verdict) {
    case 'correct':
      return 'bg-emerald-500/20 text-emerald-200'
    case 'early':
    case 'late':
      return 'bg-amber-500/20 text-amber-200'
    case 'wrong-pitch':
    case 'missed':
      return 'bg-red-500/20 text-red-200'
  }
}

function RecordedTakePlayer({
  take,
  onReset,
}: {
  take: RecordedTake
  onReset: () => void
}) {
  return (
    <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
        <span>
          Take captured · {Math.max(Math.round(take.durationSeconds), 1)}s ·{' '}
          {Math.round(take.sampleRate / 1000)} kHz
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-zinc-400 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          Discard
        </button>
      </div>
      <audio
        controls
        src={take.url}
        aria-label="Recorded take replay"
        className="mt-2 w-full"
      />
    </div>
  )
}

function createUserGestureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const constructors = window as WindowWithWebkitAudio
  const AudioContextConstructor =
    constructors.AudioContext ?? constructors.webkitAudioContext
  if (!AudioContextConstructor) return null
  return new AudioContextConstructor()
}

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function Countdown({
  initialSeconds,
  active,
  onExpire,
}: {
  initialSeconds: number
  active: boolean
  onExpire: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const expired = secondsLeft === 0
  useEffect(() => {
    if (!active || expired) return
    const id = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0))
    }, 1000)
    return () => clearInterval(id)
  }, [active, expired])
  useEffect(() => {
    if (expired) onExpire()
  }, [expired, onExpire])
  return (
    <>
      <span>{expired ? '' : formatSeconds(secondsLeft)}</span>
      {/* Persistent live region so expiry is announced, without chatty ticks. */}
      <span aria-live="polite">{expired ? 'Time — grade yourself' : ''}</span>
    </>
  )
}
