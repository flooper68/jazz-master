import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createFakeClerk, FAKE_CODE, type FakeClerk } from './fakeClerk'
import { SignInFlow } from './SignInFlow'
import { SignUpFlow } from './SignUpFlow'

function mountSignIn(clerk: FakeClerk) {
  const navigate = vi.fn()
  render(<SignInFlow loadClerk={async () => clerk} navigate={navigate} />)
  return navigate
}

async function enterEmail(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.type(await screen.findByLabelText('Email'), email)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

describe('SignInFlow', () => {
  it('signs in with email then password, and goes to the app', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk()
    const navigate = mountSignIn(clerk)

    await enterEmail(user, 'player@example.com')
    await user.type(await screen.findByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/app'))
    expect(clerk.activeSession).toBe('sess_fake')
  })

  it('says so in plain words when the password is wrong, and lets them try again', async () => {
    const user = userEvent.setup()
    const navigate = mountSignIn(createFakeClerk())

    await enterEmail(user, 'player@example.com')
    await user.type(await screen.findByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/not right/)
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('tells an unknown email apart without leaving the first step', async () => {
    const user = userEvent.setup()
    mountSignIn(createFakeClerk())

    await enterEmail(user, 'nobody@example.com')

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not find an account/)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('signs in with a code by email instead of the password', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk()
    const navigate = mountSignIn(clerk)

    await enterEmail(user, 'player@example.com')
    await user.click(await screen.findByRole('button', { name: 'Email me a code instead' }))
    await user.type(await screen.findByLabelText('Code'), FAKE_CODE)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/app'))
    expect(clerk.calls).toContain('signIn.prepareFirstFactor:email_code')
  })

  it('resets a forgotten password with a code and signs in', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk()
    const navigate = mountSignIn(clerk)

    await enterEmail(user, 'player@example.com')
    await user.click(await screen.findByRole('button', { name: 'Forgot your password?' }))
    await user.type(await screen.findByLabelText('Code'), FAKE_CODE)
    await user.type(screen.getByLabelText('New password'), 'a new long password')
    await user.click(screen.getByRole('button', { name: 'Set password and sign in' }))

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/app'))
    expect(clerk.calls).toContain('signIn.create:reset_password_email_code')
  })

  it('asks for the authenticator code when the account has a second factor', async () => {
    const user = userEvent.setup()
    const navigate = mountSignIn(createFakeClerk({ account: { email: 'player@example.com', password: 'correct horse', secondFactor: true } }))

    await enterEmail(user, 'player@example.com')
    await user.type(await screen.findByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText(/authenticator app/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Code'), FAKE_CODE)
    await user.click(screen.getByRole('button', { name: 'Verify' }))

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/app'))
  })

  it('offers the social providers the instance has switched on', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk({ social: ['oauth_google'] })
    mountSignIn(clerk)

    await user.click(await screen.findByRole('button', { name: 'Continue with Google' }))

    await vi.waitFor(() => expect(clerk.calls).toContain('signIn.redirect:oauth_google'))
  })

  it('sends someone who is already signed in straight to the app', async () => {
    const navigate = mountSignIn(createFakeClerk({ signedIn: true }))

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/app'))
  })
})

describe('SignUpFlow', () => {
  it('creates an account, verifies the email with a code, and goes to the app', async () => {
    const user = userEvent.setup()
    const clerk = createFakeClerk()
    const navigate = vi.fn()
    render(<SignUpFlow loadClerk={async () => clerk} navigate={navigate} />)

    await user.type(await screen.findByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText(/^Password/), 'a long password')
    await user.click(screen.getByRole('button', { name: 'Create my account' }))
    await user.type(await screen.findByLabelText('Code'), FAKE_CODE)
    await user.click(screen.getByRole('button', { name: 'Create my account' }))

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/app'))
    expect(clerk.activeSession).toBe('sess_new')
  })

  it('points to signing in when the email already has an account', async () => {
    const user = userEvent.setup()
    render(<SignUpFlow loadClerk={async () => createFakeClerk()} navigate={vi.fn()} />)

    await user.type(await screen.findByLabelText('Email'), 'player@example.com')
    await user.type(screen.getByLabelText(/^Password/), 'a long password')
    await user.click(screen.getByRole('button', { name: 'Create my account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already an account/)
  })

  it('sends people to the beta waitlist while sign-up is by invitation', async () => {
    render(<SignUpFlow loadClerk={async () => createFakeClerk({ signUpMode: 'restricted' })} navigate={vi.fn()} />)

    expect(await screen.findByRole('heading', { name: 'Count-in is in beta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Join the beta' })).toHaveAttribute('href', '/#beta')
  })
})
