import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountMenu } from './AccountMenu'
import { createFakeClerk } from './fakeClerk'

afterEach(() => {
  delete window.Clerk
})

describe('AccountMenu', () => {
  it('shows who is signed in, flips the theme, and signs out', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk({ signedIn: true })
    window.Clerk = clerk
    const onToggleTheme = vi.fn()
    const onOpenAccount = vi.fn()
    render(<AccountMenu theme="dark" onToggleTheme={onToggleTheme} onOpenAccount={onOpenAccount} showName />)

    await user.click(await screen.findByRole('button', { name: 'Account: Demo Player' }))
    expect(screen.getByRole('menu', { name: 'Account' })).toHaveTextContent('player@example.com')

    await user.click(screen.getByRole('menuitem', { name: 'Light theme' }))
    expect(onToggleTheme).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('menuitem', { name: 'Account' }))
    expect(onOpenAccount).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Account: Demo Player' }))
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(clerk.calls).toContain('signOut')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    window.Clerk = createFakeClerk({ signedIn: true })
    render(<AccountMenu theme="light" onToggleTheme={vi.fn()} onOpenAccount={vi.fn()} showName={false} />)

    await user.click(await screen.findByRole('button', { name: /^Account/ }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).toBeNull()
  })
})
