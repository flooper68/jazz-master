import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetQuickRunSettings } from '../appData/quickRun'
import type { Routine } from '../appData/routine'
import { EXERCISES as PACK } from '../content'
import { QuickRunButton, type QuickRunButtonProps } from './QuickRunButton'

/** The five founding exercises: a pack small enough for a test to count — three scales, an arpeggio, a line. */
const FOUNDING_IDS = ['scales-major-open-c', 'scales-major-open-g', 'scales-major-open-f', 'lines-ii-v-i-f-arpeggios', 'lines-ii-v-i-f-line']
const EXERCISES = PACK.filter((exercise) => FOUNDING_IDS.includes(exercise.id))

beforeEach(() => {
  localStorage.clear()
  resetQuickRunSettings()
})

const warmUp: Routine = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Warm-up',
  items: [{ exerciseId: 'lines-ii-v-i-f-line' }, { exerciseId: 'scales-major-open-c' }],
}
const emptied: Routine = { id: '10000000-0000-4000-8000-000000000002', name: 'Emptied', items: [{ exerciseId: 'gone-since' }] }

/** What the page works out and hands down: here, a generated session of three. */
const NEXT: QuickRunButtonProps['next'] = { label: 'Next session', count: 3, seconds: 300, routineId: null }

function renderButton(routines: readonly Routine[] = [], next: QuickRunButtonProps['next'] = NEXT) {
  const onStart = vi.fn()
  const view = render(<QuickRunButton exercises={EXERCISES} routines={routines} next={next} onStart={onStart} />)
  return { ...view, onStart }
}

describe('QuickRunButton', () => {
  it('plays the next session in one press, saying how much it is', async () => {
    const user = userEvent.setup()
    const { onStart } = renderButton()
    await user.click(screen.getByRole('button', { name: 'Play Next session: 3 exercises, about 5 min' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('offers nothing to press when there is nothing to practise', () => {
    renderButton([], { label: 'Next session', count: 0, seconds: 0, routineId: null })
    expect(screen.getByRole('button', { name: /^Play Next session/ })).toBeDisabled()
  })

  it('names a routine as what to play instead, and remembers it', async () => {
    const user = userEvent.setup()
    const { unmount } = renderButton([warmUp, emptied])
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'What to play next' }))
    const panel = within(screen.getByRole('dialog', { name: 'What to play next' }))
    expect(panel.getByRole('radio', { name: 'The next session' })).toBeChecked()
    // A routine with nothing left to play cannot be chosen.
    expect(panel.getByRole('radio', { name: /^Emptied/ })).toBeDisabled()

    await user.click(panel.getByRole('radio', { name: /^Warm-up/ }))

    // Remembered: a fresh mount, told the same routine is next, opens on it.
    unmount()
    renderButton([warmUp, emptied], { label: 'Warm-up', count: 2, seconds: 180, routineId: warmUp.id })
    await user.click(screen.getByRole('button', { name: 'What to play next' }))
    expect(within(screen.getByRole('dialog')).getByRole('radio', { name: /^Warm-up/ })).toBeChecked()
  })

  it('shows the routine the page resolved, with its own length', async () => {
    const user = userEvent.setup()
    renderButton([warmUp], { label: 'Warm-up', count: 2, seconds: 180, routineId: warmUp.id })
    expect(screen.getByRole('button', { name: 'Play Warm-up: 2 exercises, about 3 min' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'What to play next' }))
    const panel = within(screen.getByRole('dialog'))
    expect(panel.getByRole('radio', { name: /^Warm-up/ })).toBeChecked()
    expect(panel.getByText(/^Warm-up, as prepared: 2 exercises in order/)).toBeInTheDocument()
  })

  it('closes on Escape and on a press outside', async () => {
    const user = userEvent.setup()
    renderButton()
    await user.click(screen.getByRole('button', { name: 'What to play next' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'What to play next' }))
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('points to Routines when there are none to choose', async () => {
    const user = userEvent.setup()
    renderButton()
    await user.click(screen.getByRole('button', { name: 'What to play next' }))
    expect(screen.getByText(/^No routines yet/)).toBeInTheDocument()
  })
})
