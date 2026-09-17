import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountPage from './AccountPage'
import { createFakeClerk } from './fakeClerk'

const deleteAppData = vi.fn(async () => {})

afterEach(() => {
  delete window.Clerk
  deleteAppData.mockClear()
})

describe('AccountPage', () => {
  it('shows who is signed in and saves a new name', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk({ signedIn: true })
    window.Clerk = clerk
    render(<AccountPage deleteAppData={deleteAppData} />)

    expect(await screen.findByText('player@example.com')).toBeInTheDocument()
    const first = screen.getByLabelText('First name')
    await user.clear(first)
    await user.type(first, 'Wes')
    await user.click(screen.getByRole('button', { name: 'Save name' }))

    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    expect(clerk.user?.firstName).toBe('Wes')
  })

  it('changes the password, and says so plainly when the current one is wrong', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk({ signedIn: true })
    window.Clerk = clerk
    render(<AccountPage deleteAppData={deleteAppData} />)

    await user.type(await screen.findByLabelText('Current password'), 'wrong')
    await user.type(screen.getByLabelText('New password'), 'a new long password')
    await user.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not right/)

    await user.clear(screen.getByLabelText('Current password'))
    await user.type(screen.getByLabelText('Current password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText(/Password changed/)).toBeInTheDocument()
  })

  it('lists the signed-in devices and signs out of another one, never this one', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk({ signedIn: true })
    window.Clerk = clerk
    render(<AccountPage deleteAppData={deleteAppData} />)

    const here = (await screen.findByText(/Chrome on Mac/)).closest('li')!
    expect(within(here).getByText('This device')).toBeInTheDocument()
    expect(within(here).queryByRole('button')).toBeNull()

    const phone = screen.getByText(/Safari on iPhone/).closest('li')!
    await user.click(within(phone).getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('Signed out of that device.')).toBeInTheDocument()
    expect(clerk.calls).toContain('session.revoke:sess_phone')
    expect(screen.queryByText(/Safari on iPhone/)).toBeNull()
  })

  it('deletes the account only after DELETE is typed', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk({ signedIn: true })
    window.Clerk = clerk
    render(<AccountPage deleteAppData={deleteAppData} />)

    const confirm = await screen.findByLabelText('Type DELETE to confirm')
    await user.type(confirm, 'delete')
    await user.click(screen.getByRole('button', { name: 'Delete my account' }))
    expect(clerk.calls).not.toContain('user.delete')
    expect(deleteAppData).not.toHaveBeenCalled()
  })
})
