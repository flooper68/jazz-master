import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfile, profileStore } from '../storage'
import { renderRoute } from '../test/renderRoute'

beforeEach(() => {
  localStorage.clear()
})

function seedProfile() {
  profileStore.set(defaultProfile('2026-07-06T10:00:00.000Z'))
}

describe('app router', () => {
  it.each([
    ['/', 'Dashboard'],
    ['/voicings', 'Voicings'],
    ['/progressions', 'Progressions'],
    ['/practice', 'Practice'],
    ['/history', 'History'],
    ['/repertoire', 'Repertoire'],
    ['/ear-training', 'Ear Training'],
    ['/profile', 'Profile'],
  ])('renders the %s page heading', async (path, heading) => {
    seedProfile()
    await renderRoute(path)
    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
  })

  it('shows the app title in the persistent layout', async () => {
    seedProfile()
    await renderRoute('/voicings')
    expect(screen.getByText('Jazz Master')).toBeInTheDocument()
  })

  it('marks only the current page link as active', async () => {
    seedProfile()
    await renderRoute('/voicings')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toContainElement(
      screen.getByRole('link', { name: 'Voicings', current: 'page' }),
    )
    expect(
      screen.queryByRole('link', { name: 'Dashboard', current: 'page' }),
    ).not.toBeInTheDocument()
  })

  it('renders a not-found page for unknown paths', async () => {
    seedProfile()
    await renderRoute('/no-such-page')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('navigates when a nav link is clicked', async () => {
    const user = userEvent.setup()
    seedProfile()
    await renderRoute('/')
    await user.click(screen.getByRole('link', { name: 'Repertoire' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Repertoire' }),
    ).toBeInTheDocument()
  })

  it('shows onboarding on first visit before any route', async () => {
    await renderRoute('/practice')

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
    await renderRoute('/practice')

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

  it('moves focus into the app main region when onboarding gives way to the app', async () => {
    const user = userEvent.setup()
    await renderRoute('/practice')

    await user.click(screen.getByRole('button', { name: 'Skip for now' }))

    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('persists a completed profile and enters the requested route', async () => {
    const user = userEvent.setup()
    await renderRoute('/')

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

  it('does not show onboarding for a returning user with a profile', async () => {
    seedProfile()
    await renderRoute('/practice')

    expect(
      screen.queryByRole('heading', { name: 'How comfortable are you?' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Practice' }),
    ).toBeInTheDocument()
  })
})
