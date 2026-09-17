import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PracticeSession } from '../appData/session'
import type { PlayerAudio } from '../audio/engine'
import type { Lesson } from '../content'
import { PracticeRunner } from './PracticeRunner'

const lesson: Lesson = {
  id: 'fixture-lesson',
  title: 'Fixture lesson',
  area: 'scales',
  level: 1,
  prerequisites: [],
  estimatedMinutes: 2,
  intro: ['The major scale is the ruler.'],
  exercises: [
    {
      id: 'fx-1',
      title: 'C major — open position',
      key: 'C',
      about: ['No sharps or flats here.'],
      tempoBpm: 60,
      duration: { kind: 'minutes', minutes: 1 },
      notes: [
        { string: 5, fret: 3, beats: 1 },
        { string: 4, fret: 0, beats: 1 },
        { string: 4, fret: 2, beats: 1 },
        { string: 4, fret: 3, beats: 1 },
        { string: 3, fret: 0, beats: 2 },
        { string: 3, fret: 2, beats: 2 },
      ],
    },
    {
      id: 'fx-2',
      title: 'G major — open position',
      tempoBpm: 120,
      duration: { kind: 'repetitions', count: 2 },
      notes: [
        { string: 6, fret: 3, beats: 1 },
        { string: 5, fret: 2, beats: 1 },
      ],
    },
  ],
}

/** The audio clock is the test clock: seconds, advanced by hand. */
const clock = { ms: 0 }

function fakeAudio() {
  const log: string[] = []
  const audio: PlayerAudio = {
    get now() {
      return clock.ms / 1000
    },
    state: 'running',
    async resume() {},
    click(time, accent) {
      log.push(`click ${time.toFixed(2)}${accent ? '!' : ''}`)
    },
    pluck(_time, midi) {
      log.push(`note m${midi}`)
    },
    silence() {
      log.push('silence')
    },
    cancelFrom() {
      log.push('cancel')
    },
    setVoice(voice) {
      log.push(`guitar ${voice}`)
    },
    prime(midis) {
      log.push(`prime ${midis.length}`)
    },
    dispose() {
      log.push('dispose')
    },
  }
  return { audio, log }
}

function renderRunner({
  onSessionChange = vi.fn(),
  onExit = vi.fn(),
  audio = fakeAudio(),
  audioAvailable = true,
}: {
  onSessionChange?: (session: PracticeSession) => void
  onExit?: () => void
  audio?: ReturnType<typeof fakeAudio>
  audioAvailable?: boolean
} = {}) {
  const view = render(
    <PracticeRunner
      lesson={lesson}
      sessionId="session-1"
      startedAt={1_000}
      onSessionChange={onSessionChange}
      onExit={onExit}
      createAudio={() => {
        if (!audioAvailable) throw new Error('no audio')
        return audio.audio
      }}
      now={() => clock.ms}
    />,
  )
  return { ...view, onSessionChange, onExit, audio }
}

type User = ReturnType<typeof userEvent.setup>

async function play(user: User, title: string) {
  await user.click(screen.getByRole('button', { name: `Play ${title}` }))
}

async function next(user: User, title: string) {
  await user.click(screen.getByRole('button', { name: `Next: finish ${title}` }))
}

/** The advanced controls sit behind menus; open one by its label. */
async function openMenu(user: User, label: 'Loop' | 'Repeat' | 'Sound' | 'View') {
  const button = screen.getByRole('button', { name: new RegExp(`^${label}: `) })
  if (button.getAttribute('aria-expanded') !== 'true') await user.click(button)
}

async function disableCountIn(user: User) {
  await openMenu(user, 'Sound')
  await user.click(screen.getByRole('checkbox', { name: 'Count-in' }))
}

/** The cursor polls on animation frames; jsdom needs a nudge after the clock moves. */
async function advanceClock(ms: number) {
  clock.ms += ms
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
  })
}

function currentNote(): string | null {
  return document.querySelector('[data-note][data-current]')?.getAttribute('data-note') ?? null
}

function readout(label: string): string {
  const element = screen.getByText(label).parentElement
  return element?.textContent?.replace(label, '') ?? ''
}

describe('PracticeRunner', () => {
  beforeEach(() => {
    clock.ms = 0
    localStorage.clear()
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the first exercise on the stage with its score, tempo and time', () => {
    renderRunner()
    expect(screen.getByRole('heading', { level: 1, name: 'Fixture lesson' })).toHaveFocus()
    const steps = screen.getByRole('list', { name: 'Exercises' })
    expect(within(steps).getAllByRole('listitem')).toHaveLength(2)
    expect(within(steps).getByRole('listitem', { name: '1. C major — open position' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('heading', { level: 2, name: 'C major — open position 4/4 · 60 BPM' })).toBeInTheDocument()
    expect(readout('Time left')).toBe('1:00')
    expect(readout('Position')).toBe('1.1')
    expect(screen.getByRole('img', { name: 'C major — open position score, 6 notes' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(60)
    expect(document.querySelector('[data-staff="tab"]')).not.toBeNull()
    expect(document.querySelector('[data-staff="notation"]')).not.toBeNull()
    expect(currentNote()).toBeNull()
  })

  it('opens with the lesson intro and the shape on the neck beside the score, and closes on demand', async () => {
    const user = userEvent.setup()
    renderRunner()
    const about = screen.getByRole('complementary', { name: 'About C major — open position' })
    expect(within(about).getByText('The major scale is the ruler.')).toBeInTheDocument()
    expect(within(about).getByText('No sharps or flats here.')).toBeInTheDocument()
    const neck = within(about).getByRole('img', { name: /on the neck, 6 positions, roots marked$/ })
    expect(neck.querySelectorAll('[data-role="root"]')).toHaveLength(1)
    expect(neck.querySelector('[data-string="5"][data-fret="3"]')?.textContent).toBe('C')

    // It stays beside the score while playing, and closes from its own button.
    await play(user, 'C major — open position')
    expect(screen.getByRole('complementary')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('complementary')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'About this exercise' }))
    expect(screen.getByRole('complementary')).toBeInTheDocument()
    // Pressing the backdrop closes it too.
    await user.pointer({ keys: '[MouseLeft]', target: document.querySelector('[data-about-backdrop]')! })
    expect(screen.queryByRole('complementary')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'About this exercise' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))

    // The second exercise has no notes of its own and is not first: nothing to show.
    await next(user, 'C major — open position')
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('counts in and clicks on Play, pauses, and silences on Next', async () => {
    const user = userEvent.setup()
    const { audio } = renderRunner()

    await play(user, 'C major — open position')
    expect(screen.getByRole('button', { name: 'Pause C major — open position' })).toBeInTheDocument()
    await advanceClock(100)
    await waitFor(() => expect(audio.log.find((entry) => entry.startsWith('click'))).toBe('click 0.05!'))
    // During the count-in the cursor is walking in from the left of the first note.
    const cursorX = () =>
      Number(document.querySelector('[data-cursor]')?.getAttribute('transform')?.match(/translate\(([\d.]+)/)?.[1])
    const firstNoteX = Number(document.querySelector('[data-note="0"] text')?.getAttribute('x'))
    expect(cursorX()).toBeLessThan(firstNoteX)
    await advanceClock(2_000)
    const later = cursorX()
    expect(later).toBeGreaterThan(6)
    expect(later).toBeLessThan(firstNoteX)

    await user.click(screen.getByRole('button', { name: 'Pause C major — open position' }))
    expect(audio.log).toContain('silence')
    expect(screen.getByRole('button', { name: 'Play C major — open position' })).toBeInTheDocument()

    await next(user, 'C major — open position')
    expect(screen.getByRole('heading', { level: 2, name: /^G major — open position/ })).toHaveFocus()
    expect(screen.getByRole('listitem', { name: '2. G major — open position' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('listitem', { name: '1. C major — open position (done)' })).toBeInTheDocument()
  })

  it('lets the player silence the click and play the line along, keeping the choice across exercises', async () => {
    const user = userEvent.setup()
    const { audio } = renderRunner()
    await disableCountIn(user)
    await user.click(screen.getByRole('checkbox', { name: 'Click' }))
    await user.click(screen.getByRole('checkbox', { name: 'Play along' }))
    expect(screen.getByRole('button', { name: 'Sound: guitar' })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Guitar' }), 'steel')
    expect(audio.log.filter((entry) => entry.startsWith('guitar')).at(-1)).toBeUndefined()

    await play(user, 'C major — open position')
    await advanceClock(100)
    await waitFor(() => expect(audio.log).toContain('note m48'))
    expect(audio.log.filter((entry) => entry.startsWith('click'))).toEqual([])
    // The chosen guitar reached the audio, primed for the exercise's six pitches.
    expect(audio.log.slice(0, 2)).toEqual(['guitar steel', 'prime 6'])

    await next(user, 'C major — open position')
    await openMenu(user, 'Sound')
    expect(screen.getByRole('checkbox', { name: 'Click' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Play along' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Count-in' })).not.toBeChecked()
    // …and across reloads.
    expect(JSON.parse(localStorage.getItem('jazz-master.player-prefs') ?? '{}')).toMatchObject({
      click: false,
      voice: true,
      countIn: false,
      guitar: 'steel',
    })
  })

  it('opens with the remembered view', async () => {
    localStorage.setItem('jazz-master.player-prefs', JSON.stringify({ view: 'tab' }))
    renderRunner()
    expect(document.querySelector('[data-staff="notation"]')).toBeNull()
    expect(screen.getByRole('button', { name: 'View: tab' })).toBeInTheDocument()
  })

  it('reports missing audio without breaking the exercise', async () => {
    const user = userEvent.setup()
    renderRunner({ audioAvailable: false })

    await play(user, 'C major — open position')

    expect(screen.getByRole('alert')).toHaveTextContent('The click is unavailable in this browser.')
    expect(screen.getByRole('button', { name: 'Next: finish C major — open position' })).toBeInTheDocument()
  })

  it('moves the cursor through the score on the clock and loops', async () => {
    const user = userEvent.setup()
    renderRunner()
    await disableCountIn(user)

    await play(user, 'C major — open position')
    await advanceClock(60)
    expect(currentNote()).toBe('0')
    expect(
      screen.getByRole('img', { name: 'C major — open position score, 6 notes, on note 1' }),
    ).toBeInTheDocument()

    await advanceClock(1_000)
    expect(currentNote()).toBe('1')
    expect(readout('Position')).toBe('1.2')
    await advanceClock(3_000)
    expect(currentNote()).toBe('4')
    expect(readout('Position')).toBe('2.1')
    await advanceClock(4_000)
    expect(currentNote()).toBe('0')
  })

  it('seeks from the score and by bar, and loops a range from the cursor', async () => {
    const user = userEvent.setup()
    renderRunner()
    await disableCountIn(user)

    await user.click(screen.getByRole('button', { name: 'Next bar' }))
    expect(readout('Position')).toBe('2.1')
    await user.click(screen.getByRole('button', { name: 'Previous bar' }))
    expect(readout('Position')).toBe('1.1')

    await user.click(screen.getByRole('button', { name: 'Next bar' }))
    await openMenu(user, 'Loop')
    await user.click(screen.getByRole('button', { name: 'Set loop end at cursor' }))
    expect(screen.getByRole('button', { name: 'Loop: beats 1–4' })).toBeInTheDocument()
    expect(document.querySelector('[data-loop-region]')).not.toBeNull()
    // The loop pulled the cursor back inside it.
    expect(readout('Position')).toBe('1.1')

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByRole('button', { name: 'Loop: whole' })).toBeInTheDocument()

    // Pressing outside the menu closed it; open it again for the next loop.
    await user.click(screen.getByRole('button', { name: 'Next bar' }))
    expect(screen.queryByRole('button', { name: 'This bar' })).toBeNull()
    await openMenu(user, 'Loop')
    await user.click(screen.getByRole('button', { name: 'This bar' }))
    expect(screen.getByRole('button', { name: 'Loop: beats 5–8' })).toBeInTheDocument()
    // The menu closes from the keyboard and on a press outside it.
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'This bar' })).toBeNull()
  })

  it('changes tempo with the buttons and resets, and sets a repeat and a ramp', async () => {
    const user = userEvent.setup()
    renderRunner()
    const tempo = screen.getByRole('spinbutton', { name: 'Tempo in BPM' })

    await user.click(screen.getByRole('button', { name: 'Faster' }))
    await user.click(screen.getByRole('button', { name: 'Faster' }))
    expect(tempo).toHaveValue(68)
    await user.click(screen.getByRole('button', { name: 'Slower' }))
    expect(tempo).toHaveValue(64)
    await user.click(screen.getByRole('button', { name: 'Reset to 60' }))
    expect(tempo).toHaveValue(60)
    expect(screen.queryByRole('button', { name: 'Reset to 60' })).toBeNull()

    await openMenu(user, 'Repeat')
    await user.click(screen.getByRole('button', { name: '4×' }))
    expect(screen.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true')
    expect(readout('Passes')).toBe('Pass 1 of 4')
    expect(screen.getByRole('button', { name: 'Repeat: 4×' })).toHaveAttribute('aria-expanded', 'true')

    // The ramp is a plain toggle; its settings appear beside it while on.
    expect(document.querySelector('[data-ramp-settings]')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Tempo ramp: off' }))
    expect(screen.getByRole('button', { name: 'Tempo ramp: +4/2 → 100' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('[data-ramp-settings]')).not.toBeNull()
    await user.clear(screen.getByRole('spinbutton', { name: 'BPM per step' }))
    await user.type(screen.getByRole('spinbutton', { name: 'BPM per step' }), '10')
    expect(screen.getByRole('button', { name: 'Tempo ramp: +10/2 → 100' })).toBeInTheDocument()
  })

  it('magnifies the score from the View menu and remembers it', async () => {
    const user = userEvent.setup()
    renderRunner()
    await openMenu(user, 'View')
    const svg = document.querySelector('[data-score-scroller] svg')!
    // The canvas keeps its width; the engraving inside it gets bigger (fewer units across).
    const unitsAcross = () => Number(svg.getAttribute('viewBox')?.split(' ')[2])
    const before = unitsAcross()
    await user.click(screen.getByRole('button', { name: 'Larger score' }))
    await user.click(screen.getByRole('button', { name: 'Larger score' }))
    expect(screen.getByText('140%')).toBeInTheDocument()
    expect(unitsAcross()).toBeLessThan(before)
    expect(JSON.parse(localStorage.getItem('jazz-master.player-prefs') ?? '{}')).toMatchObject({ zoom: 1.4 })
    await user.click(screen.getByRole('button', { name: '100%' }))
    expect(screen.getByText('100%', { selector: 'span' })).toBeInTheDocument()
  })

  it('switches between tab, notation and both', async () => {
    const user = userEvent.setup()
    renderRunner()
    await openMenu(user, 'View')
    await user.click(screen.getByRole('radio', { name: 'Tab' }))
    expect(document.querySelector('[data-staff="notation"]')).toBeNull()
    expect(screen.getByRole('img', { name: 'C major — open position tab, 6 notes' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Notes' }))
    expect(document.querySelector('[data-staff="tab"]')).toBeNull()
    expect(document.querySelector('[data-staff="notation"]')).not.toBeNull()
  })

  it('plays and pauses from the keyboard', async () => {
    const user = userEvent.setup()
    renderRunner()
    screen.getByRole('heading', { level: 2, name: /^C major — open position/ }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Pause C major — open position' })).toBeInTheDocument()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Play C major — open position' })).toBeInTheDocument()
  })

  it('counts the timer down only while playing and advances at zero', async () => {
    vi.restoreAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderRunner()

    act(() => vi.advanceTimersByTime(3_000))
    expect(readout('Time left')).toBe('1:00')

    await play(user, 'C major — open position')
    act(() => vi.advanceTimersByTime(2_000))
    expect(readout('Time left')).toBe('0:58')

    act(() => vi.advanceTimersByTime(58_500))
    expect(screen.getByRole('listitem', { name: '2. G major — open position' })).toHaveAttribute('aria-current', 'step')
    vi.useRealTimers()
  })

  it('counts passes and advances when the target is reached', async () => {
    const user = userEvent.setup()
    const { onSessionChange } = renderRunner()
    await disableCountIn(user)
    await play(user, 'C major — open position')
    await next(user, 'C major — open position')

    expect(readout('Passes')).toBe('Pass 1 of 2')
    await play(user, 'G major — open position')
    // 120 BPM, two beats per pass: one pass per second.
    await advanceClock(1_100)
    await waitFor(() => expect(readout('Passes')).toBe('Pass 2 of 2'))
    await advanceClock(1_000)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Lesson complete — Fixture lesson' })).toHaveFocus(),
    )
    expect(onSessionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ completed: true, exercisesCompleted: 2 }),
    )
  })

  it('persists every finished exercise and ends with the summary', async () => {
    const user = userEvent.setup()
    const { onSessionChange, onExit, audio } = renderRunner()

    await play(user, 'C major — open position')
    vi.spyOn(Date, 'now').mockReturnValue(31_000)
    await next(user, 'C major — open position')
    expect(onSessionChange).toHaveBeenLastCalledWith({
      id: 'session-1',
      lessonId: 'fixture-lesson',
      startedAt: new Date(1_000).toISOString(),
      durationSeconds: 30,
      completed: false,
      exercisesCompleted: 1,
    })

    await play(user, 'G major — open position')
    await next(user, 'G major — open position')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Lesson complete — Fixture lesson' }),
    ).toHaveFocus()
    expect(screen.getAllByText('Done')).toHaveLength(3)
    expect(onSessionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ completed: true, exercisesCompleted: 2 }),
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(audio.log).toContain('dispose')
  })

  it('saves an abandoned run as incomplete when the lesson is ended early', async () => {
    const user = userEvent.setup()
    const { onSessionChange, onExit } = renderRunner()

    await play(user, 'C major — open position')
    await next(user, 'C major — open position')
    await user.click(screen.getByRole('button', { name: 'End lesson' }))

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onSessionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ completed: false, exercisesCompleted: 1 }),
    )
  })

  it('disposes the audio when the player unmounts', async () => {
    const user = userEvent.setup()
    const { unmount, audio } = renderRunner()
    await play(user, 'C major — open position')
    unmount()
    expect(audio.log.at(-1)).toBe('dispose')
  })
})
