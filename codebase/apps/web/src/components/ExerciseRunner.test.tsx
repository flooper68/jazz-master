import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExerciseRun } from '../appData/run'
import type { PlayerAudio } from '../audio/engine'
import type { Exercise } from '../content'
import { ExerciseRunner, type RunnerSession } from './ExerciseRunner'
import { resetPlayerPrefs } from './playerPrefs'

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

/** Every exercise is played inside a session; on its own it is a session of one. */
function sessionOfOne(onContinue: () => void, step = 1, total = 1): RunnerSession {
  return { id: 'session-1', label: 'Next session', endLabel: 'End session', step, total, onContinue }
}

function renderRunner({
  exercise = clocked,
  onRunChange = vi.fn(),
  onExit = vi.fn(),
  onContinue = vi.fn(),
  step = 1,
  total = 1,
  audio = fakeAudio(),
  audioAvailable = true,
}: {
  exercise?: Exercise
  onRunChange?: (run: ExerciseRun) => void
  onExit?: () => void
  onContinue?: () => void
  /** Where in its session this exercise sits; a session of one by default. */
  step?: number
  total?: number
  audio?: ReturnType<typeof fakeAudio>
  audioAvailable?: boolean
} = {}) {
  const view = render(
    <ExerciseRunner
      exercise={exercise}
      onRunChange={onRunChange}
      onExit={onExit}
      session={sessionOfOne(onContinue, step, total)}
      createAudio={() => {
        if (!audioAvailable) throw new Error('no audio')
        return audio.audio
      }}
      now={() => clock.ms}
    />,
  )
  return { ...view, onRunChange, onExit, onContinue, audio }
}

type User = ReturnType<typeof userEvent.setup>

async function play(user: User, title: string) {
  await user.click(screen.getByRole('button', { name: `Play ${title}` }))
}

async function finish(user: User, title: string) {
  await user.click(screen.getByRole('button', { name: `Finish ${title}` }))
}

/** The loop controls sit behind a menu on the stage; open it by its label. */
async function openMenu(user: User, label: 'Loop') {
  const button = screen.getByRole('button', { name: new RegExp(`^${label}: `) })
  if (button.getAttribute('aria-expanded') !== 'true') await user.click(button)
}

/**
 * Everything but the tempo and the loop lives behind Advanced: open the
 * dialog. The name grows a suffix once something behind it is set.
 */
function advancedButton() {
  return screen.getByRole('button', { name: /^Advanced/ })
}

async function openAdvanced(user: User) {
  const button = advancedButton()
  if (button.getAttribute('aria-expanded') !== 'true') await user.click(button)
}

async function closeAdvanced(user: User) {
  await user.click(screen.getByRole('button', { name: 'Close advanced' }))
}

async function disableCountIn(user: User) {
  await openAdvanced(user)
  await user.click(screen.getByRole('checkbox', { name: 'Count-in' }))
  await closeAdvanced(user)
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
    resetPlayerPrefs()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the exercise on the stage with its score, tempo and time', () => {
    renderRunner()
    expect(screen.getByRole('heading', { level: 1, name: 'C major — open position 4/4 · 60 BPM' })).toHaveFocus()
    // Leaving is the navigation's job: the stage itself carries no way out.
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
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
    const view = renderRunner()
    const { audio } = view
    await openAdvanced(user)
    await user.click(screen.getByRole('checkbox', { name: 'Count-in' }))
    await user.click(screen.getByRole('checkbox', { name: 'Click' }))
    await user.click(screen.getByRole('checkbox', { name: 'Play along' }))
    await user.click(screen.getByRole('combobox', { name: 'Guitar' }))
    await user.click(screen.getByRole('option', { name: 'Steel string (synth)' }))
    expect(screen.getByRole('combobox', { name: 'Guitar' })).toHaveTextContent('Steel string (synth)')
    await closeAdvanced(user)
    expect(audio.log.filter((entry) => entry.startsWith('guitar')).at(-1)).toBeUndefined()

    await play(user, 'C major — open position')
    await advanceClock(100)
    await waitFor(() => expect(audio.log).toContain('note m48'))
    expect(audio.log.filter((entry) => entry.startsWith('click'))).toEqual([])
    // The chosen guitar reached the audio, primed for the exercise's six pitches.
    expect(audio.log.slice(0, 2)).toEqual(['guitar steel', 'prime 6'])

    // A fresh stage — the next exercise of the session — opens on the same choices.
    view.unmount()
    renderRunner()
    await openAdvanced(user)
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
    const user = userEvent.setup()
    localStorage.setItem('jazz-master.player-prefs', JSON.stringify({ view: 'tab' }))
    renderRunner()
    expect(document.querySelector('[data-staff="notation"]')).toBeNull()
    await openAdvanced(user)
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

    // The ramp switches on beside the tempo; its steps live behind Advanced.
    await user.click(screen.getByRole('button', { name: 'Tempo ramp: off' }))
    expect(screen.getByRole('button', { name: 'Tempo ramp: +4/2 → 100' })).toHaveAttribute('aria-pressed', 'true')

    await openAdvanced(user)
    await user.click(screen.getByRole('button', { name: '4×' }))
    expect(screen.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true')
    await user.clear(screen.getByRole('spinbutton', { name: 'BPM per step' }))
    await user.type(screen.getByRole('spinbutton', { name: 'BPM per step' }), '10')
    await closeAdvanced(user)

    expect(screen.getByRole('button', { name: 'Tempo ramp: +10/2 → 100' })).toBeInTheDocument()
    expect(readout('Passes')).toBe('Pass 1 of 4')
    // The stage says, without naming it, that something behind the door is set.
    expect(document.querySelector('[data-advanced-dot]')).not.toBeNull()
  })

  it('gives Advanced the keyboard, and hands it back on Escape', async () => {
    const user = userEvent.setup()
    renderRunner()
    await openAdvanced(user)

    // The stage's shortcuts belong to the dialog while it is open: Space in it
    // must not start the exercise behind it.
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Play C major — open position' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Advanced' })).toBeNull()
    // Focus goes back where it came from, not to the top of the page.
    expect(advancedButton()).toHaveFocus()
  })

  it('magnifies the score from the Advanced panel and remembers it', async () => {
    const user = userEvent.setup()
    renderRunner()
    await openAdvanced(user)
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
    await openAdvanced(user)
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
    // The shortcuts are the stage's; the title says where the shape now sits.
    const heading = () => screen.getByRole('heading', { level: 1 })
    heading().focus()
    await user.keyboard('ttt')
    expect(heading()).toHaveTextContent('in E♭ major, +3')
    await user.keyboard('{Shift>}T{/Shift}')
    expect(heading()).toHaveTextContent('in D major, +2')
    await user.keyboard('tttttttttttttttt')
    expect(heading()).toHaveTextContent('in B major, +11')

    await openAdvanced(user)
    expect(document.querySelector('[data-transpose-readout] [aria-hidden]')?.textContent).toBe('B +11')
    // Said in words for a screen reader, which reads ♭ and − unreliably.
    expect(document.querySelector('[data-transpose-readout] .sr-only')?.textContent).toBe('B major, 11 semitones up')
    expect(screen.getByRole('button', { name: 'Transpose up a semitone' })).toBeDisabled()
  })

  it('plays the guitar along in the transposed key', async () => {
    const user = userEvent.setup()
    const audio = fakeAudio()
    renderRunner({ audio })
    await openAdvanced(user)
    await user.click(screen.getByRole('button', { name: 'Transpose up a semitone' }))
    await user.click(screen.getByRole('checkbox', { name: 'Play along' }))
    await user.click(screen.getByRole('checkbox', { name: 'Count-in' }))
    await closeAdvanced(user)
    await user.click(screen.getByRole('button', { name: /^Play / }))
    // The written line starts on C3 (m48); a semitone up it starts on D♭3.
    await waitFor(() => expect(audio.log.find((entry) => entry.startsWith('note'))).toBe('note m49'))
  })

  it('switches between tab, notation and both', async () => {
    const user = userEvent.setup()
    renderRunner()
    await openAdvanced(user)
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
    expect(screen.getByRole('heading', { level: 2, name: 'Exercise complete' })).toBeInTheDocument()
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
      expect(screen.getByRole('heading', { level: 2, name: 'Exercise complete' })).toBeInTheDocument(),
    )
    expect(onRunChange).toHaveBeenCalledTimes(1)
    expect(onRunChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ exerciseId: 'fx-2', tempoBpm: 120, passes: 2, completed: true, difficulty: null }),
    )
  })

  it('sums the exercise up on Finish, then hands over to the session or leaves it', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    const { onExit, audio } = renderRunner({ onContinue })

    await play(user, 'C major — open position')
    await advanceClock(2_500)
    await finish(user, 'C major — open position')

    // The summary is a dialog over the stage, and it takes the keyboard.
    const summary = screen.getByRole('dialog')
    expect(summary).toHaveFocus()
    expect(within(summary).getByRole('heading', { level: 2, name: 'Exercise complete' })).toBeInTheDocument()
    const done = within(summary).getByRole('listitem')
    expect(within(done).getByText('C major — open position')).toBeInTheDocument()
    expect(within(done).getByText('Done today')).toBeInTheDocument()
    // The stage stays behind the dialog, so the audio is silenced rather than disposed.
    expect(audio.log).toContain('silence')

    // The last step of the session, so the way on is its closing screen.
    await user.click(within(summary).getByRole('button', { name: 'End session' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('hands the session on when the summary is finished with', async () => {
    const user = userEvent.setup()
    const { onContinue } = renderRunner({ step: 2, total: 4 })

    await play(user, 'C major — open position')
    await finish(user, 'C major — open position')
    const summary = screen.getByRole('dialog')
    expect(within(summary).getByText('Next session · 2 of 4')).toBeInTheDocument()

    await user.click(within(summary).getByRole('button', { name: 'Next exercise' }))
    // The summary steps aside first, so the hand-over is not instant.
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1))
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
      difficulty: null,
    })
    expect(run.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(new Date(run.startedAt).valueOf()).toBeGreaterThanOrEqual(1_000)
    expect(run.durationSeconds).toBeGreaterThanOrEqual(30)
    expect(run.durationSeconds).toBeLessThanOrEqual(31)
    vi.useRealTimers()
  })

  it('takes an optional answer — Again, Hard, Good or Easy — and sends the answered run again', async () => {
    const user = userEvent.setup()
    const { onRunChange } = renderRunner()
    await play(user, 'C major — open position')
    await finish(user, 'C major — open position')

    const answer = screen.getByRole('group', { name: /^How did it go\?/ })
    // The four, hardest first, and nothing chosen for the player.
    expect(within(answer).getAllByRole('button').map((button) => button.textContent)).toEqual(['Again', 'Hard', 'Good', 'Easy'])
    for (const button of within(answer).getAllByRole('button')) expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(onRunChange).toHaveBeenCalledTimes(1)

    await user.click(within(answer).getByRole('button', { name: 'Hard' }))
    expect(within(answer).getByRole('button', { name: 'Hard' })).toHaveAttribute('aria-pressed', 'true')
    const [first, answered] = vi.mocked(onRunChange).mock.calls.map(([run]) => run)
    expect(answered).toEqual({ ...first, difficulty: 'hard' })
    // Every run belongs to the session it was played in.
    expect(first.sessionId).toBe('session-1')

    // Pressing the chosen answer again takes it back.
    await user.click(within(answer).getByRole('button', { name: 'Hard' }))
    expect(onRunChange).toHaveBeenLastCalledWith({ ...first, difficulty: null })
  })

  it('records nothing, and asks nothing, when Finish comes before any Play', async () => {
    const user = userEvent.setup()
    const { onRunChange } = renderRunner()
    await finish(user, 'C major — open position')

    // Every exercise ends on its summary; this one says it was skipped.
    const summary = screen.getByRole('dialog')
    expect(within(summary).getByRole('heading', { level: 2, name: 'Exercise skipped' })).toBeInTheDocument()
    expect(within(summary).getByText('Not played')).toBeInTheDocument()
    expect(within(summary).queryByRole('group', { name: /^How did it go\?/ })).toBeNull()
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
