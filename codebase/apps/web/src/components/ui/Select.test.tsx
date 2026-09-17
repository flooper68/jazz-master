import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

const options = [
  { value: 'nylon', label: 'Nylon', group: 'Synth' },
  { value: 'steel', label: 'Steel string', group: 'Synth' },
  { value: 'jazz-sampled', label: 'Jazz guitar', group: 'Sampled' },
]

describe('Select', () => {
  it('opens a listbox, shows groups, and picks with the mouse', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select options={options} value="nylon" onChange={onChange} aria-label="Guitar" />)
    const button = screen.getByRole('combobox', { name: 'Guitar' })
    expect(button).toHaveTextContent('Nylon')
    expect(screen.queryByRole('listbox')).toBeNull()

    await user.click(button)
    expect(screen.getByRole('listbox', { name: 'Guitar' })).toBeInTheDocument()
    expect(screen.getByText('Sampled')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Nylon' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('option', { name: 'Jazz guitar' }))
    expect(onChange).toHaveBeenCalledWith('jazz-sampled')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(button).toHaveFocus()
  })

  it('moves with the keyboard, types ahead, and closes on Escape', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select options={options} value="nylon" onChange={onChange} aria-label="Guitar" />)
    const button = screen.getByRole('combobox', { name: 'Guitar' })
    button.focus()
    await user.keyboard('{ArrowDown}')
    const list = screen.getByRole('listbox')
    expect(list).toHaveFocus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('steel')

    await user.keyboard('{Enter}')
    await user.keyboard('j{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('jazz-sampled')

    await user.keyboard(' ')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(button).toHaveFocus()
  })

  it('can be an icon button that names and tips the current choice', async () => {
    const user = userEvent.setup()
    render(<Select options={options} value="steel" onChange={() => {}} aria-label="Guitar" data-tip="Which guitar plays" icon={<span>G</span>} />)
    const button = screen.getByRole('combobox', { name: 'Guitar: Steel string' })
    expect(button).toHaveAttribute('data-tip', 'Which guitar plays: Steel string')
    await user.click(button)
    expect(screen.getByRole('option', { name: 'Steel string' })).toHaveAttribute('aria-selected', 'true')
  })

  it('closes on a press outside and stays shut when disabled', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">Elsewhere</button>
        <Select options={options} value="nylon" onChange={() => {}} aria-label="Guitar" />
      </div>,
    )
    await user.click(screen.getByRole('combobox', { name: 'Guitar' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
