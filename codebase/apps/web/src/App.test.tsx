import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { defaultProfile, profileStore } from './storage'

beforeEach(() => {
  localStorage.clear()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

function seedProfile() {
  profileStore.set(defaultProfile('2026-07-06T10:00:00.000Z'))
}

describe('App', () => {
  it.each([
    ['/', 'Dashboard'],
    ['/voicings', 'Voicings'],
    ['/progressions', 'Progressions'],
    ['/practice', 'Practice'],
    ['/repertoire', 'Repertoire'],
    ['/ear-training', 'Ear Training'],
    ['/profile', 'Profile'],
  ])('renders the %s page heading', (path, heading) => {
    seedProfile()
    renderAt(path)
    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
  })

  it('shows the app title in the persistent layout', () => {
    seedProfile()
    renderAt('/voicings')
    expect(screen.getByText('Jazz Master')).toBeInTheDocument()
  })

  it('marks only the current page link as active', () => {
    seedProfile()
    renderAt('/voicings')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toContainElement(
      screen.getByRole('link', { name: 'Voicings', current: 'page' }),
    )
    expect(
      screen.queryByRole('link', { name: 'Dashboard', current: 'page' }),
    ).not.toBeInTheDocument()
  })

  it('renders a not-found page for unknown paths', () => {
    seedProfile()
    renderAt('/no-such-page')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('navigates when a nav link is clicked', async () => {
    const user = userEvent.setup()
    seedProfile()
    renderAt('/')
    await user.click(screen.getByRole('link', { name: 'Repertoire' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Repertoire' }),
    ).toBeInTheDocument()
  })

  it('shows onboarding on first visit before any route', () => {
    renderAt('/practice')

    expect(
      screen.getByRole('heading', { name: 'How comfortable are you?' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Practice' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Main' }),
    ).not.toBeInTheDocument()
  })

  it('persists a skipped profile and enters the requested route', async () => {
    const user = userEvent.setup()
    renderAt('/practice')

    await user.click(screen.getByRole('button', { name: 'Skip for now' }))

    expect(profileStore.get()).toMatchObject({
      levels: { scales: 1, arpeggios: 1, chords: 1, standards: 1, ears: 1 },
      goalAreas: ['scales', 'arpeggios'],
      minutesPerDay: 20,
    })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Practice' }),
    ).toBeInTheDocument()
  })

  it('persists a completed profile and enters the requested route', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const scales = screen.getByRole('group', { name: 'Scales' })
    await user.click(within(scales).getByRole('radio', { name: 'Intermediate' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('checkbox', { name: /Chords/ }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('radio', { name: '30 min' }))
    await user.click(screen.getByRole('button', { name: 'Start practicing' }))

    expect(profileStore.get()).toMatchObject({
      levels: { scales: 2 },
      goalAreas: ['scales', 'arpeggios', 'chords'],
      minutesPerDay: 30,
    })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('does not show onboarding for a returning user with a profile', () => {
    seedProfile()
    renderAt('/practice')

    expect(
      screen.queryByRole('heading', { name: 'How comfortable are you?' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Practice' }),
    ).toBeInTheDocument()
  })
})
