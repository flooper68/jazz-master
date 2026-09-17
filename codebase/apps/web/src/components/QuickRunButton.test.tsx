import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuickRunPlan } from '../appData/quickRun'
import type { Routine } from '../appData/routine'
import { EXERCISES } from '../content'
import { QuickRunButton } from './QuickRunButton'

beforeEach(() => {
  localStorage.clear()
})

const warmUp: Routine = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Warm-up',
  items: [{ exerciseId: 'lines-ii-v-i-f-line' }, { exerciseId: 'scales-major-open-c' }],
}
const emptied: Routine = { id: '10000000-0000-4000-8000-000000000002', name: 'Emptied', items: [{ exerciseId: 'gone-since' }] }

function renderButton(routines: readonly Routine[] = []) {
  const onStart = vi.fn<(plan: QuickRunPlan) => void>()
  const view = render(<QuickRunButton exercises={EXERCISES} routines={routines} onStart={onStart} />)
  return { ...view, onStart }
}

describe('QuickRunButton', () => {
  it('starts a run of three different exercises in one press', async () => {
    const user = userEvent.setup()
    const { onStart } = renderButton()
    await user.click(screen.getByRole('button', { name: /^Quick run: / }))
    expect(onStart).toHaveBeenCalledTimes(1)
    const picked = onStart.mock.calls[0][0].exercises
    expect(picked).toHaveLength(3)
    expect(new Set(picked.map((exercise) => exercise.id)).size).toBe(3)
  })

  it('keeps its settings behind the chevron: how many, and from where', async () => {
    const user = userEvent.setup()
    const { onStart } = renderButton()
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Quick run settings' }))
    const settings = within(screen.getByRole('dialog', { name: 'Quick run settings' }))
    await user.click(settings.getByRole('button', { name: 'Fewer exercises' }))
    expect(settings.getByRole('status')).toHaveTextContent('2')
    await user.click(settings.getByRole('checkbox', { name: /^Arpeggios/ }))
    await user.click(settings.getByRole('checkbox', { name: /^Standards/ }))
    // The last area cannot be taken away.
    await user.click(settings.getByRole('checkbox', { name: /^Scales/ }))
    expect(settings.getByRole('checkbox', { name: /^Scales/ })).toBeChecked()

    await user.click(screen.getByRole('button', { name: /^Quick run: / }))
    const picked = onStart.mock.calls[0][0].exercises
    expect(picked).toHaveLength(2)
    expect(picked.every((exercise) => exercise.area === 'scales')).toBe(true)
  })

  it('says when the areas hold fewer exercises than asked for', async () => {
    const user = userEvent.setup()
    renderButton()
    await user.click(screen.getByRole('button', { name: 'Quick run settings' }))
    const settings = within(screen.getByRole('dialog'))
    await user.click(settings.getByRole('checkbox', { name: /^Scales/ }))
    await user.click(settings.getByRole('checkbox', { name: /^Standards/ }))
    expect(settings.getByText('Only 1 to draw from — the run will have 1.')).toBeInTheDocument()
  })

  it('closes on Escape and on a press outside, and remembers the settings', async () => {
    const user = userEvent.setup()
    const { unmount } = renderButton()
    await user.click(screen.getByRole('button', { name: 'Quick run settings' }))
    await user.click(screen.getByRole('button', { name: 'More exercises' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Quick run settings' }))
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()

    unmount()
    renderButton()
    await user.click(screen.getByRole('button', { name: 'Quick run settings' }))
    expect(screen.getByRole('status')).toHaveTextContent('4')
  })

  it('plays a chosen routine as prepared, instead of drawing', async () => {
    const user = userEvent.setup()
    const { onStart, unmount } = renderButton([warmUp, emptied])
    await user.click(screen.getByRole('button', { name: 'Quick run settings' }))
    const settings = within(screen.getByRole('dialog'))
    expect(settings.getByRole('radio', { name: 'A random draw' })).toBeChecked()
    // A routine with nothing left to play cannot be chosen.
    expect(settings.getByRole('radio', { name: /^Emptied/ })).toBeDisabled()

    await user.click(settings.getByRole('radio', { name: /^Warm-up/ }))
    // The draw's own settings step aside.
    expect(settings.queryByRole('button', { name: 'More exercises' })).toBeNull()
    expect(settings.getByText(/^Warm-up, as prepared: 2 exercises in order/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Quick run: Warm-up, 2 exercises/ }))
    const plan = onStart.mock.calls[0][0]
    expect(plan.routine).toEqual(warmUp)
    expect(plan.exercises.map((exercise) => exercise.id)).toEqual(['lines-ii-v-i-f-line', 'scales-major-open-c'])

    // Remembered — and when the routine is gone, the draw stands in.
    unmount()
    const again = renderButton([])
    await user.click(screen.getByRole('button', { name: /^Quick run: 3 random exercises/ }))
    expect(again.onStart.mock.calls[0][0].routine).toBeNull()
  })

  it('points to Routines when there are none to choose', async () => {
    const user = userEvent.setup()
    renderButton()
    await user.click(screen.getByRole('button', { name: 'Quick run settings' }))
    expect(screen.getByText(/^No routines yet/)).toBeInTheDocument()
  })
})
