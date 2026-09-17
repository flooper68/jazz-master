import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExerciseRun } from '../appData/run'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { ExerciseRunner } from './ExerciseRunner'

/** Clocked: one minute on the timer. */
const clocked: Exercise = {
  id: 'fx-1',
  title: 'C major — open position',
  area: 'scales',
  level: 1,
  key: 'C',
  about: ['The major scale is the ruler.', 'No sharps or flats here.'],
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
}

/** Counted: two passes of a two-beat tab. */
const counted: Exercise = {
  id: 'fx-2',
  title: 'G major — open position',
  area: 'scales',
  level: 1,
  tempoBpm: 120,
  duration: { kind: 'repetitions', count: 2 },
  notes: [
    { string: 6, fret: 3, beats: 1 },
    { string: 5, fret: 2, beats: 1 },
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
  exercise = clocked,
  onRunChange = vi.fn(),
  onExit = vi.fn(),
  audio = fakeAudio(),
  audioAvailable = true,
}: {
  exercise?: Exercise
  onRunChange?: (run: ExerciseRun) => void
  onExit?: () => void
  audio?: ReturnType<typeof fakeAudio>
  audioAvailable?: boolean
} = {}) {
  const view = render(
    <ExerciseRunner
      exercise={exercise}
      onRunChange={onRunChange}
      onExit={onExit}
      createAudio={() => {
        if (!audioAvailable) throw new Error('no audio')
        return audio.audio
      }}
      now={() => clock.ms}
    />,
  )
  return { ...view, onRunChange, onExit, audio }
}

type User = ReturnType<typeof userEvent.setup>

async function play(user: User, title: string) {
  await user.click(screen.getByRole('button', { name: `Play ${title}` }))
}

async function finish(user: User, title: string) {
  await user.click(screen.getByRole('button', { name: `Finish ${title}` }))
}

/** The advanced controls sit behind menus; open one by its label. */
async function openMenu(user: User, label: 'Loop' | 'Repeat' | 'Tempo ramp settings') {
  const button = screen.getByRole('button', { name: new RegExp(`^${label}: `) })
  if (button.getAttribute('aria-expanded') !== 'true') await user.click(button)
}

async function disableCountIn(user: User) {
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

describe('ExerciseRunner', () => {
  beforeEach(() => {
    clock.ms = 0
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the exercise on the stage with its score, tempo and time', () => {
    renderRunner()
    expect(screen.getByRole('heading', { level: 1, name: 'C major — open position 4/4 · 60 BPM' })).toHaveFocus()
    // Leaving is the navigation's job: the stage itself carries no way out.
    expect(screen.queryByRole('button', { name: 'Back to exercises' })).toBeNull()
    expect(readout('Time left')).toBe('1:00')
    expect(readout('Position')).toBe('1.1')
    expect(screen.getByRole('img', { name: 'C major — open position score, 6 notes' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Tempo in BPM' })).toHaveValue(60)
    expect(document.querySelector('[data-staff="tab"]')).not.toBeNull()
    expect(document.querySelector('[data-staff="notation"]')).not.toBeNull()
    expect(currentNote()).toBeNull()
  })

  it('shows the story and the shape on the neck only when asked, and closes on demand', async () => {
    const user = userEvent.setup()
    renderRunner()
    expect(screen.queryByRole('complementary')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'About this exercise' }))
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
  })

  it('counts in and clicks on Play, and pauses', async () => {
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
  })

  it('lets the player silence the click and play the line along, keeping the choice for the next round', async () => {
    const user = userEvent.setup()
    const { audio } = renderRunner()
    await disableCountIn(user)
    await user.click(screen.getByRole('checkbox', { name: 'Click' }))
    await user.click(screen.getByRole('checkbox', { name: 'Play along' }))
    await user.click(screen.getByRole('combobox', { name: /^Guitar: / }))
    await user.click(screen.getByRole('option', { name: 'Steel string (synth)' }))
    expect(screen.getByRole('combobox', { name: 'Guitar: Steel string (synth)' })).toBeInTheDocument()
    expect(audio.log.filter((entry) => entry.startsWith('guitar')).at(-1)).toBeUndefined()

    await play(user, 'C major — open position')
    await advanceClock(100)
    await waitFor(() => expect(audio.log).toContain('note m48'))
    expect(audio.log.filter((entry) => entry.startsWith('click'))).toEqual([])
    // The chosen guitar reached the audio, primed for the exercise's six pitches.
    expect(audio.log.slice(0, 2)).toEqual(['guitar steel', 'prime 6'])

    await finish(user, 'C major — open position')
    await user.click(screen.getByRole('button', { name: 'Play again' }))
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
    expect(screen.getByRole('radio', { name: 'Tab' })).toHaveAttribute('aria-checked', 'true')
  })

  it('reports missing audio without breaking the exercise', async () => {
    const user = userEvent.setup()
    renderRunner({ audioAvailable: false })

    await play(user, 'C major — open position')

    expect(screen.getByRole('alert')).toHaveTextContent('The click is unavailable in this browser.')
    expect(screen.getByRole('button', { name: 'Finish C major — open position' })).toBeInTheDocument()
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

    // The ramp is a direct toggle; its settings live in their own menu.
    await user.click(screen.getByRole('button', { name: 'Tempo ramp: off' }))
    expect(screen.getByRole('button', { name: 'Tempo ramp: +4/2 → 100' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /^Tempo ramp settings: / }))
    expect(document.querySelector('[data-ramp-settings]')).not.toBeNull()
    await user.clear(screen.getByRole('spinbutton', { name: 'BPM per step' }))
    await user.type(screen.getByRole('spinbutton', { name: 'BPM per step' }), '10')
    expect(screen.getByRole('button', { name: 'Tempo ramp: +10/2 → 100' })).toBeInTheDocument()
  })

  it('magnifies the score from the View menu and remembers it', async () => {
    const user = userEvent.setup()
    renderRunner()
    const svg = document.querySelector('[data-score-scroller] svg')!
    // The engraving gets bigger: two neighbouring notes sit further apart on screen.
    const noteGapPx = () => {
      const [a, b] = [...svg.querySelectorAll('[data-note] text')].map((t) => Number(t.getAttribute('x')))
      return (b - a) * (Number(svg.getAttribute('width')) / Number(svg.getAttribute('viewBox')?.split(' ')[2]))
    }
    const before = noteGapPx()
    await user.click(screen.getByRole('button', { name: 'Larger score' }))
    await user.click(screen.getByRole('button', { name: 'Larger score' }))
    expect(screen.getByText('140%')).toBeInTheDocument()
    expect(noteGapPx()).toBeGreaterThan(before)
    expect(JSON.parse(localStorage.getItem('jazz-master.player-prefs') ?? '{}')).toMatchObject({ zoom: 1.4 })
  })

  it('transposes by sliding the shape: frets move, the key is renamed, and Reset brings the written key back', async () => {
    const user = userEvent.setup()
    renderRunner()
    const frets = () => [...document.querySelectorAll('[data-note] text')].map((t) => t.textContent)
    const readout = () => document.querySelector('[data-transpose-readout] [aria-hidden]')?.textContent
    expect(frets()).toEqual(['3', '0', '2', '3', '0', '2'])
    expect(document.querySelector('[data-key-signature]')?.children).toHaveLength(0)
    expect(readout()).toBe('C')
    // The lowest note is an open string, so the shape cannot go down.
    expect(screen.getByRole('button', { name: 'Transpose down a semitone' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Transpose up a semitone' }))
    await user.click(screen.getByRole('button', { name: 'Transpose up a semitone' }))
    expect(frets()).toEqual(['5', '2', '4', '5', '2', '4'])
    expect(readout()).toBe('D +2')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('in D major, +2')
    // D major is signed with two sharps.
    expect(document.querySelector('[data-key-signature]')?.children).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Back to the written key' }))
    expect(frets()).toEqual(['3', '0', '2', '3', '0', '2'])
    expect(readout()).toBe('C')
    expect(screen.getByRole('button', { name: 'Back to the written key' })).toBeDisabled()
  })

  it('transposes from the keyboard and stops at the top of the neck', async () => {
    const user = userEvent.setup()
    renderRunner()
    screen.getByRole('heading', { level: 1 }).focus()
    await user.keyboard('ttt')
    expect(document.querySelector('[data-transpose-readout] [aria-hidden]')?.textContent).toBe('E♭ +3')
    // Said in words for a screen reader, which reads ♭ and − unreliably.
    expect(document.querySelector('[data-transpose-readout] .sr-only')?.textContent).toBe('E flat major, 3 semitones up')
    await user.keyboard('{Shift>}T{/Shift}')
    expect(document.querySelector('[data-transpose-readout] [aria-hidden]')?.textContent).toBe('D +2')
    await user.keyboard('tttttttttttttttt')
    expect(document.querySelector('[data-transpose-readout] [aria-hidden]')?.textContent).toBe('B +11')
    expect(screen.getByRole('button', { name: 'Transpose up a semitone' })).toBeDisabled()
  })

  it('plays the guitar along in the transposed key', async () => {
    const user = userEvent.setup()
    const audio = fakeAudio()
    renderRunner({ audio })
    await user.click(screen.getByRole('button', { name: 'Transpose up a semitone' }))
    await user.click(screen.getByRole('checkbox', { name: 'Play along' }))
    await disableCountIn(user)
    await user.click(screen.getByRole('button', { name: /^Play / }))
    // The written line starts on C3 (m48); a semitone up it starts on D♭3.
    await waitFor(() => expect(audio.log.find((entry) => entry.startsWith('note'))).toBe('note m49'))
  })

  it('switches between tab, notation and both', async () => {
    const user = userEvent.setup()
    renderRunner()
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
    screen.getByRole('heading', { level: 1, name: /^C major — open position/ }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Pause C major — open position' })).toBeInTheDocument()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Play C major — open position' })).toBeInTheDocument()
  })

  it('counts the timer down only while playing and ends at zero', async () => {
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
    expect(screen.getByRole('heading', { level: 1, name: 'Exercise complete' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('counts passes and ends when the target is reached', async () => {
    const user = userEvent.setup()
    const { onRunChange } = renderRunner({ exercise: counted })
    await disableCountIn(user)

    expect(readout('Passes')).toBe('Pass 1 of 2')
    await play(user, 'G major — open position')
    // 120 BPM, two beats per pass: one pass per second.
    await advanceClock(1_100)
    await waitFor(() => expect(readout('Passes')).toBe('Pass 2 of 2'))
    await advanceClock(1_000)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Exercise complete' })).toHaveFocus(),
    )
    expect(onRunChange).toHaveBeenCalledTimes(1)
    expect(onRunChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ exerciseId: 'fx-2', tempoBpm: 120, passes: 2, completed: true, rating: null }),
    )
  })

  it('sums the exercise up on Finish, then plays it again or leaves', async () => {
    const user = userEvent.setup()
    const { onExit, audio } = renderRunner()

    await play(user, 'C major — open position')
    await advanceClock(2_500)
    await finish(user, 'C major — open position')

    expect(screen.getByRole('heading', { level: 1, name: 'Exercise complete' })).toHaveFocus()
    const done = screen.getByRole('listitem')
    expect(within(done).getByText('C major — open position')).toBeInTheDocument()
    expect(within(done).getByText('Done today')).toBeInTheDocument()
    expect(audio.log).toContain('dispose')

    // Play again is a fresh stage: the timer and the cursor start over.
    await user.click(screen.getByRole('button', { name: 'Play again' }))
    expect(screen.getByRole('heading', { level: 1, name: /^C major — open position/ })).toHaveFocus()
    expect(readout('Time left')).toBe('1:00')
    expect(currentNote()).toBeNull()

    await finish(user, 'C major — open position')
    await user.click(screen.getByRole('button', { name: 'Back to exercises' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('records the run when it reaches the summary: when, how long, how fast, and that it was cut short', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: 1_000 })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onRunChange } = renderRunner()
    await user.click(screen.getByRole('button', { name: 'Faster' }))

    await play(user, 'C major — open position')
    act(() => vi.advanceTimersByTime(30_000))
    await finish(user, 'C major — open position')

    expect(onRunChange).toHaveBeenCalledTimes(1)
    const run = vi.mocked(onRunChange).mock.calls[0][0]
    expect(run).toMatchObject({
      exerciseId: 'fx-1',
      tempoBpm: 64,
      completed: false,
      rating: null,
    })
    expect(run.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(new Date(run.startedAt).valueOf()).toBeGreaterThanOrEqual(1_000)
    expect(run.durationSeconds).toBeGreaterThanOrEqual(30)
    expect(run.durationSeconds).toBeLessThanOrEqual(31)
    vi.useRealTimers()
  })

  it('takes an optional difficulty rating, 1 to 10 without 7, and sends the rated run again', async () => {
    const user = userEvent.setup()
    const { onRunChange } = renderRunner()
    await play(user, 'C major — open position')
    await finish(user, 'C major — open position')

    const rating = screen.getByRole('group', { name: /^How hard was it\?/ })
    expect(within(rating).getAllByRole('button')).toHaveLength(10)
    expect(within(rating).getByRole('button', { name: '7 out of 10' })).toBeDisabled()
    await user.click(within(rating).getByRole('button', { name: '7 out of 10' }))
    expect(onRunChange).toHaveBeenCalledTimes(1)

    await user.click(within(rating).getByRole('button', { name: '8 out of 10' }))
    expect(within(rating).getByRole('button', { name: '8 out of 10' })).toHaveAttribute('aria-pressed', 'true')
    const [first, rated] = vi.mocked(onRunChange).mock.calls.map(([run]) => run)
    expect(rated).toEqual({ ...first, rating: 8 })
    expect(first.sessionId).toBeNull()

    // Pressing the chosen number again takes the rating back.
    await user.click(within(rating).getByRole('button', { name: '8 out of 10' }))
    expect(onRunChange).toHaveBeenLastCalledWith({ ...first, rating: null })

    // Play again is a new run with its own identity.
    await user.click(screen.getByRole('button', { name: 'Play again' }))
    await play(user, 'C major — open position')
    await finish(user, 'C major — open position')
    const again = vi.mocked(onRunChange).mock.calls.at(-1)![0]
    expect(again.id).not.toBe(first.id)
    expect(again.rating).toBeNull()
  })

  it('records nothing, and asks nothing, when Finish comes before any Play', async () => {
    const user = userEvent.setup()
    const { onRunChange } = renderRunner()
    await finish(user, 'C major — open position')
    expect(screen.getByRole('heading', { level: 1, name: 'Exercise complete' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /^How hard was it\?/ })).toBeNull()
    expect(onRunChange).not.toHaveBeenCalled()
  })

  it('records nothing for a run the player walks away from', async () => {
    const user = userEvent.setup()
    const { onRunChange, unmount } = renderRunner()
    await play(user, 'C major — open position')
    // Navigating away unmounts the stage mid-run.
    unmount()
    expect(onRunChange).not.toHaveBeenCalled()
  })

  it('disposes the audio when the player unmounts', async () => {
    const user = userEvent.setup()
    const { unmount, audio } = renderRunner()
    await play(user, 'C major — open position')
    unmount()
    expect(audio.log.at(-1)).toBe('dispose')
  })
})
