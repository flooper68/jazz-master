import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXERCISES, type Exercise } from '../content'
import { QuickRunButton } from './QuickRunButton'

beforeEach(() => {
  localStorage.clear()
})

function renderButton() {
  const onStart = vi.fn<(exercises: Exercise[]) => void>()
  const view = render(<QuickRunButton exercises={EXERCISES} onStart={onStart} />)
  return { ...view, onStart }
}

describe('QuickRunButton', () => {
  it('starts a run of three different exercises in one press', async () => {
    const user = userEvent.setup()
    const { onStart } = renderButton()
    await user.click(screen.getByRole('button', { name: /^Quick run: / }))
    expect(onStart).toHaveBeenCalledTimes(1)
    const picked = onStart.mock.calls[0][0]
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
    const picked = onStart.mock.calls[0][0]
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
})
