import { noteName } from '@jazz-master/theory'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { PlayAlongEngine } from '../audio'
import { deriveRhythm, resolveExercise, type Exercise, type Lesson } from '../content'
import {
  MIN_PLAY_ALONG_TEMPO_BPM,
  clampPlayAlongTempo,
  getPlayAlongTempo,
  savePlayAlongTempo,
} from '../storage/playAlongTempos'
import type { ExerciseGrade } from '../storage/sessions'
import { Fretboard, type FretboardHighlight } from './Fretboard'
import { Notation } from './Notation'
import { usePracticeRunner } from './usePracticeRunner'
import { useViewFocus } from './useViewFocus'

const GRADE_LABELS: Record<ExerciseGrade, string> = {
  'got-it': 'Got it',
  shaky: 'Shaky',
  missed: 'Missed',
}

const GRADE_ORDER: readonly ExerciseGrade[] = ['got-it', 'shaky', 'missed']

type PlaybackStatus = 'idle' | 'loading' | 'playing'

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
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
  const { state, grade } = usePracticeRunner({ lesson, sessionId, startedAt })
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
      <ExercisePanel key={exercise.id} exercise={exercise} />
      <div className="mt-6 flex gap-3">
        {GRADE_ORDER.map((gradeValue) => (
          <button
            key={gradeValue}
            type="button"
            onClick={() => grade(gradeValue)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-medium text-zinc-100 hover:border-amber-500 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            {GRADE_LABELS[gradeValue]}
          </button>
        ))}
      </div>
    </section>
  )
}

function ExercisePanel({ exercise }: { exercise: Exercise }) {
  const resolved = useMemo(() => resolveExercise(exercise), [exercise])
  const [tempoBpm, setTempoBpm] = useState(() =>
    getPlayAlongTempo(exercise.id, exercise.tempoBpm),
  )
  const [loopEnabled, setLoopEnabled] = useState(true)
  const [clickEnabled, setClickEnabled] = useState(true)
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle')
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const engineRef = useRef<PlayAlongEngine | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mountedRef = useRef(true)
  const tempoMax = Math.max(
    MIN_PLAY_ALONG_TEMPO_BPM,
    Math.floor(exercise.tempoBpm),
  )
  const highlights: FretboardHighlight[] = resolved.positions.map(
    (position) => ({
      string: position.string,
      fret: position.fret,
      label: noteName(position.note),
      role: position.degree === 1 ? 'root' : 'other',
    }),
  )

  const stopPlayback = useCallback(() => {
    engineRef.current?.stop()
    setPlaybackStatus('idle')
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      engineRef.current?.dispose()
      engineRef.current = null
      void audioContextRef.current?.close()
      audioContextRef.current = null
    }
  }, [])

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
      })
      if (mountedRef.current) setPlaybackStatus('playing')
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
  }

  function updateLoop(event: ChangeEvent<HTMLInputElement>): void {
    setLoopEnabled(event.currentTarget.checked)
    if (playbackStatus === 'playing') stopPlayback()
  }

  function updateClick(event: ChangeEvent<HTMLInputElement>): void {
    setClickEnabled(event.currentTarget.checked)
    if (playbackStatus === 'playing') stopPlayback()
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
          <Countdown initialSeconds={exercise.duration.minutes * 60} />
        ) : (
          `${exercise.duration.count} repetitions`
        )}
      </p>
      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/40 p-3">
        <div className="flex flex-wrap items-center gap-3">
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
        {playbackError && (
          <p role="alert" className="mt-2 text-sm text-red-300">
            {playbackError}
          </p>
        )}
      </div>
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
        <div className="mt-3 overflow-x-auto">
          <Notation
            measures={deriveRhythm(resolved.positions)}
            aria-label={`${exercise.title} — staff and tablature`}
          />
        </div>
      )}
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

function Countdown({ initialSeconds }: { initialSeconds: number }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const expired = secondsLeft === 0
  useEffect(() => {
    if (expired) return
    const id = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0))
    }, 1000)
    return () => clearInterval(id)
  }, [expired])
  return (
    <>
      <span>{expired ? '' : formatSeconds(secondsLeft)}</span>
      {/* Persistent live region so expiry is announced, without chatty ticks. */}
      <span aria-live="polite">{expired ? 'Time — grade yourself' : ''}</span>
    </>
  )
}
