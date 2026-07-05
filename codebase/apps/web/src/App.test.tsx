import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it.each([
    ['/', 'Dashboard'],
    ['/voicings', 'Voicings'],
    ['/progressions', 'Progressions'],
    ['/practice', 'Practice'],
    ['/repertoire', 'Repertoire'],
    ['/ear-training', 'Ear Training'],
  ])('renders the %s page heading', (path, heading) => {
    renderAt(path)
    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
  })

  it('shows the app title in the persistent layout', () => {
    renderAt('/voicings')
    expect(screen.getByText('Jazz Master')).toBeInTheDocument()
  })

  it('marks only the current page link as active', () => {
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
    renderAt('/no-such-page')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('navigates when a nav link is clicked', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('link', { name: 'Repertoire' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Repertoire' }),
    ).toBeInTheDocument()
  })
})
