import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderRoute } from '../test/renderRoute'

// Regression guard for ISSUE-001 (app shell overflowed horizontally at phone
// widths). jsdom performs no layout, so this asserts the load-bearing Tailwind
// classes — the stable contract of the fix — rather than measured widths.
beforeEach(() => {
  localStorage.clear()
})

describe('Layout shell', () => {
  it('lets the main area shrink inside the column', async () => {
    await renderRoute('/')
    expect(screen.getByRole('main')).toHaveClass('min-w-0', 'flex-1')
  })

  it('links the brand back home', async () => {
    await renderRoute('/')
    expect(screen.getByRole('banner')).toContainElement(
      screen.getByRole('link', { name: 'count-in' }),
    )
    expect(
      screen.getByRole('link', { name: 'count-in' }).getAttribute('href'),
    ).toMatch(/^\/app\/?$/)
  })

  it('folds the sidebar to its icon rail and back, and remembers it', async () => {
    const user = userEvent.setup()
    const { unmount } = await renderRoute('/')
    const banner = screen.getByRole('banner')
    expect(banner).not.toHaveAttribute('data-collapsed')

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(banner).toHaveAttribute('data-collapsed')
    // Folded, the links keep their names and the edge cannot be dragged.
    expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument()
    expect(screen.queryByRole('separator', { name: 'Resize sidebar' })).toBeNull()

    unmount()
    await renderRoute('/')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(screen.getByRole('banner')).not.toHaveAttribute('data-collapsed')
  })

  it('starts folded on the practice stage, with a fold of its own there', async () => {
    const user = userEvent.setup()
    await renderRoute('/exercises/scales-major-open-c')
    expect(screen.getByRole('banner')).toHaveAttribute('data-collapsed')

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(screen.getByRole('banner')).not.toHaveAttribute('data-collapsed')
    expect(JSON.parse(localStorage.getItem('jazz-master.sidebar') ?? '{}')).toMatchObject({
      collapsed: false,
      collapsedOnStage: false,
    })
  })

  it('resizes from the keyboard and by dragging its edge, within bounds, and resets on double-click', async () => {
    await renderRoute('/')
    const edge = screen.getByRole('separator', { name: 'Resize sidebar' })
    expect(edge).toHaveAttribute('aria-valuenow', '208')

    fireEvent.keyDown(edge, { key: 'ArrowRight' })
    expect(edge).toHaveAttribute('aria-valuenow', '224')
    fireEvent.keyDown(edge, { key: 'ArrowLeft' })
    fireEvent.keyDown(edge, { key: 'ArrowLeft' })
    expect(edge).toHaveAttribute('aria-valuenow', '192')

    // jsdom lays nothing out, so the sidebar's left edge is x = 0.
    fireEvent.pointerDown(edge, { pointerId: 1, clientX: 192 })
    fireEvent.pointerMove(edge, { pointerId: 1, clientX: 300 })
    expect(edge).toHaveAttribute('aria-valuenow', '300')
    fireEvent.pointerMove(edge, { pointerId: 1, clientX: 5_000 })
    expect(edge).toHaveAttribute('aria-valuenow', '360')
    fireEvent.pointerUp(edge, { pointerId: 1 })
    fireEvent.pointerMove(edge, { pointerId: 1, clientX: 250 })
    expect(edge).toHaveAttribute('aria-valuenow', '360')
    expect(JSON.parse(localStorage.getItem('jazz-master.sidebar') ?? '{}')).toMatchObject({ width: 360 })

    fireEvent.doubleClick(edge)
    expect(edge).toHaveAttribute('aria-valuenow', '208')
  })

  it('marks the section the page belongs to, and no other', async () => {
    const currentLink = () =>
      within(screen.getByRole('navigation', { name: 'Main' }))
        .queryByRole('link', { current: 'page' })?.textContent ?? null

    for (const [path, label] of [
      ['/', 'Home'],
      ['/exercises', 'Exercises'],
      ['/goals', 'Goals'],
      ['/history', 'History'],
      // A goal is still Goals, the way an exercise is still Exercises.
      ['/goals/tone', 'Goals'],
    ] as const) {
      const { unmount } = await renderRoute(path)
      expect(currentLink(), path).toBe(label)
      unmount()
    }

    // The account page is in no section: nothing is marked.
    const { unmount } = await renderRoute('/account')
    expect(currentLink()).toBeNull()
    unmount()
  })

  it('plays the next session from the navigation', async () => {
    const user = userEvent.setup()
    await renderRoute('/history')
    const nav = within(screen.getByRole('navigation', { name: 'Main' }))
    await user.click(nav.getByRole('button', { name: /^Play Next session: \d+ exercises, about \d+ min$/ }))
    expect(await screen.findByText(/^Next session · 1 of \d+$/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'End session' })).toBeInTheDocument()
    // On the stage the sidebar is folded: the button is its icon, the settings are away.
    expect(screen.getByRole('banner')).toHaveAttribute('data-collapsed')
  })
})
