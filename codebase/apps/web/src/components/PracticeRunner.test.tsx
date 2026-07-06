import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveExercise, type Lesson } from '../content'
import { sessionsStore } from '../storage/sessions'
import { PracticeRunner } from './PracticeRunner'

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
      display: ['fretboard'],
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

function renderRunner(onExit = vi.fn()) {
  render(
    <PracticeRunner
      lesson={lesson}
      sessionId="session-1"
      startedAt={Date.now()}
      onExit={onExit}
    />,
  )
  return onExit
}

beforeEach(() => {
  localStorage.clear()
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

  it('runs the happy path: grade both exercises, see the summary, persist a completed session', async () => {
    const user = userEvent.setup()
    const onExit = renderRunner()

    expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('C major — open position')).toBeInTheDocument()
    expect(screen.getByText('60 BPM')).toBeInTheDocument()
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
})
