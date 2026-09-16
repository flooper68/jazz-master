import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PracticeSession } from '../appData/session'
import type { ClickTrack } from '../audio/click'
import type { Lesson } from '../content'
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
      tempoBpm: 60,
      duration: { kind: 'minutes', minutes: 1 },
      notes: [
        { string: 5, fret: 3, beats: 1 },
        { string: 4, fret: 0, beats: 1 },
        { string: 4, fret: 2, beats: 1 },
      ],
    },
    {
      id: 'fx-2',
      title: 'G7 arpeggio — open position',
      tempoBpm: 120,
      duration: { kind: 'repetitions', count: 2 },
      notes: [
        { string: 6, fret: 3, beats: 1 },
        { string: 5, fret: 2, beats: 1 },
      ],
    },
  ],
}

function fakeClick() {
  const calls: string[] = []
  let playing = false
  const track: ClickTrack = {
    start(tempoBpm) {
      calls.push(`start ${tempoBpm}`)
      playing = true
    },
    stop() {
      calls.push('stop')
      playing = false
    },
    get playing() {
      return playing
    },
    dispose() {
      calls.push('dispose')
      playing = false
    },
  }
  return { track, calls }
}

const clock = { ms: 0 }

function renderRunner({
  onSessionChange = vi.fn(),
  onExit = vi.fn(),
  click = fakeClick(),
}: {
  onSessionChange?: (session: PracticeSession) => void
  onExit?: () => void
  click?: ReturnType<typeof fakeClick>
} = {}) {
  const view = render(
    <PracticeRunner
      lesson={lesson}
      sessionId="session-1"
      startedAt={1_000}
      onSessionChange={onSessionChange}
      onExit={onExit}
      createClick={() => click.track}
      now={() => clock.ms}
    />,
  )
  return { ...view, onSessionChange, onExit, click }
}

async function begin(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole('button', { name: `Play ${title}` }))
}

/** The runner's cursor polls on animation frames; jsdom needs a nudge. */
async function advanceClock(ms: number) {
  clock.ms += ms
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
  })
}

function currentNote(): string | null {
  return (
    document
      .querySelector('[data-current]')
      ?.getAttribute('data-note') ?? null
  )
}

async function finishAndGrade(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
  grade: string,
) {
  await user.click(screen.getByRole('button', { name: `Next: finish ${title}` }))
  const group = screen.getByRole('group', { name: `Grade ${title}` })
  await user.click(within(group).getByRole('button', { name: grade }))
}

describe('PracticeRunner', () => {
  beforeEach(() => {
    clock.ms = 0
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the first exercise as a tab with its tempo and time', () => {
    renderRunner()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Fixture lesson' }),
    ).toHaveFocus()
    expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'C major — open position' }),
    ).toBeInTheDocument()
    expect(screen.getByText('60 BPM')).toBeInTheDocument()
    expect(screen.getByText('1:00')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'C major — open position tab, 3 notes' }),
    ).toBeInTheDocument()
    expect(currentNote()).toBeNull()
    expect(screen.queryByRole('group', { name: /^Grade / })).toBeNull()
  })

  it('starts the click at the exercise tempo on Begin and stops it on Next', async () => {
    const user = userEvent.setup()
    const { click } = renderRunner()

    await begin(user, 'C major — open position')
    expect(click.calls).toEqual(['start 60'])

    await user.click(
      screen.getByRole('button', { name: 'Next: finish C major — open position' }),
    )
    expect(click.calls).toEqual(['start 60', 'stop'])
    expect(
      within(
        screen.getByRole('group', { name: 'Grade C major — open position' }),
      ).getByRole('button', { name: 'Got it' }),
    ).toHaveFocus()
  })

  it('lets the player silence and resume the click mid-exercise', async () => {
    const user = userEvent.setup()
    const { click } = renderRunner()

    await user.click(screen.getByRole('checkbox', { name: 'Click' }))
    await begin(user, 'C major — open position')
    expect(click.calls).toEqual([])

    await user.click(screen.getByRole('checkbox', { name: 'Click' }))
    expect(click.calls).toEqual(['start 60'])
  })

  it('reports a click that cannot start without breaking the exercise', async () => {
    const user = userEvent.setup()
    const click = fakeClick()
    click.track.start = () => {
      throw new Error('no audio')
    }
    renderRunner({ click })

    await begin(user, 'C major — open position')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The click is unavailable in this browser.',
    )
    expect(
      screen.getByRole('button', { name: 'Next: finish C major — open position' }),
    ).toBeInTheDocument()
  })

  it('counts the timer down only while the exercise is active and grades at zero', async () => {
    vi.restoreAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderRunner()

    act(() => vi.advanceTimersByTime(3_000))
    expect(screen.getByText('1:00')).toBeInTheDocument()

    await begin(user, 'C major — open position')
    act(() => vi.advanceTimersByTime(2_000))
    expect(screen.getByText('0:58')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(58_000))
    expect(screen.getByText('Time — grade yourself')).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Grade C major — open position' }),
    ).toBeInTheDocument()
    // A timer expiry announces; it does not steal focus.
    expect(screen.getByRole('button', { name: 'Got it' })).not.toHaveFocus()
    vi.useRealTimers()
  })

  it('moves focus to the next exercise heading on advance and keeps the click preference', async () => {
    const user = userEvent.setup()
    const { click } = renderRunner()

    await user.click(screen.getByRole('checkbox', { name: 'Click' }))
    await begin(user, 'C major — open position')
    await finishAndGrade(user, 'C major — open position', 'Got it')

    expect(
      screen.getByRole('heading', { level: 2, name: 'G7 arpeggio — open position' }),
    ).toHaveFocus()
    expect(screen.getByRole('checkbox', { name: 'Click' })).not.toBeChecked()
    await begin(user, 'G7 arpeggio — open position')
    expect(click.calls).toEqual([])
  })

  it('moves the cursor through the tab on the clock and loops', async () => {
    const user = userEvent.setup()
    renderRunner()

    await begin(user, 'C major — open position')
    expect(currentNote()).toBe('0')
    expect(
      screen.getByRole('img', { name: 'C major — open position tab, 3 notes, on note 1' }),
    ).toBeInTheDocument()

    await advanceClock(1_000)
    expect(currentNote()).toBe('1')
    await advanceClock(1_000)
    expect(currentNote()).toBe('2')
    await advanceClock(1_000)
    expect(currentNote()).toBe('0')
    expect(
      screen.getByRole('img', { name: 'C major — open position tab, 3 notes, on note 1' }),
    ).toBeInTheDocument()
  })

  it('counts passes and grades when the target is reached', async () => {
    const user = userEvent.setup()
    renderRunner()
    await begin(user, 'C major — open position')
    await finishAndGrade(user, 'C major — open position', 'Got it')

    expect(screen.getByText('Exercise 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('0 of 2 passes')).toBeInTheDocument()
    await begin(user, 'G7 arpeggio — open position')
    // 120 BPM, two beats per pass: one pass per second.
    await advanceClock(1_100)
    expect(screen.getByText('1 of 2 passes')).toBeInTheDocument()
    await advanceClock(1_000)

    expect(
      screen.getByRole('group', { name: 'Grade G7 arpeggio — open position' }),
    ).toBeInTheDocument()
    expect(currentNote()).toBeNull()
  })

  it('persists every grade and finishes with the summary', async () => {
    const user = userEvent.setup()
    const { onSessionChange, onExit, click } = renderRunner()

    await begin(user, 'C major — open position')
    vi.spyOn(Date, 'now').mockReturnValue(31_000)
    await finishAndGrade(user, 'C major — open position', 'Shaky')
    expect(onSessionChange).toHaveBeenLastCalledWith({
      id: 'session-1',
      lessonId: 'fixture-lesson',
      startedAt: new Date(1_000).toISOString(),
      durationSeconds: 30,
      completed: false,
      results: [{ exerciseId: 'fx-1', grade: 'shaky' }],
    })

    await begin(user, 'G7 arpeggio — open position')
    await finishAndGrade(user, 'G7 arpeggio — open position', 'Got it')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Lesson complete — Fixture lesson',
      }),
    ).toHaveFocus()
    expect(screen.getByText('Shaky')).toBeInTheDocument()
    expect(screen.getByText('Got it')).toBeInTheDocument()
    expect(onSessionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        completed: true,
        results: [
          { exerciseId: 'fx-1', grade: 'shaky' },
          { exerciseId: 'fx-2', grade: 'got-it' },
        ],
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(click.calls).toContain('stop')
  })

  it('saves an abandoned run as incomplete when the lesson is ended early', async () => {
    const user = userEvent.setup()
    const { onSessionChange, onExit } = renderRunner()

    await begin(user, 'C major — open position')
    await finishAndGrade(user, 'C major — open position', 'Missed')
    await user.click(screen.getByRole('button', { name: 'End lesson' }))

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onSessionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        completed: false,
        results: [{ exerciseId: 'fx-1', grade: 'missed' }],
      }),
    )
  })

  it('disposes the click track when the player unmounts', async () => {
    const user = userEvent.setup()
    const { unmount, click } = renderRunner()
    await begin(user, 'C major — open position')
    expect(click.track.playing).toBe(true)
    unmount()
    expect(click.calls.at(-1)).toBe('dispose')
    expect(click.track.playing).toBe(false)
  })
})
