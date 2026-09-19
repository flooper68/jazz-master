import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { quickRunSettings, resetQuickRunSettings } from '../appData/quickRun'
import { QuickRunButton, type QuickRunButtonProps } from './QuickRunButton'

beforeEach(() => {
  localStorage.clear()
  resetQuickRunSettings()
})

/** What the page works out and hands down: here, a generated session of three. */
const NEXT: QuickRunButtonProps['next'] = { label: 'Next session', count: 3, seconds: 300 }

function renderButton(next: QuickRunButtonProps['next'] = NEXT) {
  const onStart = vi.fn()
  const view = render(<QuickRunButton next={next} onStart={onStart} />)
  return { ...view, onStart }
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'How long have you got?' }))
  return within(screen.getByRole('dialog', { name: 'How long have you got?' }))
}

describe('QuickRunButton', () => {
  it('plays the next session in one press, saying how much it is', async () => {
    const user = userEvent.setup()
    const { onStart } = renderButton()
    await user.click(screen.getByRole('button', { name: 'Play Next session: 3 exercises, about 5 min' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('offers nothing to press when there is nothing to practise', () => {
    renderButton({ label: 'Next session', count: 0, seconds: 0 })
    expect(screen.getByRole('button', { name: /^Play Next session/ })).toBeDisabled()
  })

  it('asks how long you have got, and remembers the answer', async () => {
    const user = userEvent.setup()
    const { unmount } = renderButton()
    expect(screen.queryByRole('dialog')).toBeNull()

    const panel = await openPanel(user)
    expect(panel.getByRole('radio', { name: '20 min' })).toBeChecked()
    await user.click(panel.getByRole('radio', { name: '40 min' }))
    expect(quickRunSettings().sessionMinutes).toBe(40)

    // Remembered: a fresh mount opens on the length that was chosen.
    unmount()
    renderButton()
    expect((await openPanel(user)).getByRole('radio', { name: '40 min' })).toBeChecked()
  })

  it('explains a generated session in the panel', async () => {
    const user = userEvent.setup()
    renderButton()
    expect((await openPanel(user)).getByText(/^Worked out from what you have played/)).toBeInTheDocument()
  })

  it('closes on Escape and on a press outside', async () => {
    const user = userEvent.setup()
    renderButton()
    await openPanel(user)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()

    await openPanel(user)
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
