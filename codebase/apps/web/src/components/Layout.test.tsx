import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfile } from '../appData/profile'
import { renderRoute } from '../test/renderRoute'
import { resetTrpcTestData, seedTrpcTestProfile } from '../test/trpcTestFetch'

beforeEach(() => {
  localStorage.clear()
  resetTrpcTestData()
  seedTrpcTestProfile(defaultProfile('2026-07-06T10:00:00.000Z'))
})

// Regression guard for ISSUE-001 (app shell overflowed horizontally at phone
// widths). jsdom performs no layout, so these tests assert the load-bearing
// Tailwind classes — the stable contract of the fix — rather than measured
// widths. They catch accidental removal of the responsive classes, not every
// possible overflow; real viewport checks stay in manual/browser QA.
describe('Layout responsive shell (ISSUE-001)', () => {
  it('lets the main area shrink inside the flex row', async () => {
    await renderRoute('/practice')
    expect(screen.getByRole('main')).toHaveClass('min-w-0', 'flex-1')
  })

  it('stacks the shell vertically below md and side-by-side from md up', async () => {
    await renderRoute('/practice')
    const shell = screen.getByRole('main').parentElement
    expect(shell).toHaveClass('flex-col', 'md:flex-row')
  })

  it('gives the sidebar its fixed width only from md up', async () => {
    await renderRoute('/practice')
    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveClass('md:w-56')
    expect(sidebar).not.toHaveClass('w-56')
  })
})
