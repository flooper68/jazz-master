import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderRoute } from '../test/renderRoute'
import { resetTrpcTestData } from '../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
})

// Regression guard for ISSUE-001 (app shell overflowed horizontally at phone
// widths). jsdom performs no layout, so this asserts the load-bearing Tailwind
// classes — the stable contract of the fix — rather than measured widths.
describe('Layout shell', () => {
  it('lets the main area shrink inside the column', async () => {
    await renderRoute('/')
    expect(screen.getByRole('main')).toHaveClass('min-w-0', 'flex-1')
  })

  it('links the brand back to the lesson list', async () => {
    await renderRoute('/')
    expect(screen.getByRole('banner')).toContainElement(
      screen.getByRole('link', { name: 'woodshed' }),
    )
    expect(
      screen.getByRole('link', { name: 'woodshed' }).getAttribute('href'),
    ).toMatch(/^\/app\/?$/)
  })
})
