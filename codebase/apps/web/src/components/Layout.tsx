import { Link, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import type { Ref } from 'react'

const ClerkUserButton = lazy(async () => {
  const clerk = await import('@clerk/astro/react')
  return { default: clerk.UserButton }
})

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/practice', label: 'Practice' },
  { to: '/history', label: 'History' },
  { to: '/profile', label: 'Profile' },
] as const

interface LayoutProps {
  /**
   * Focus target for view swaps that replace the whole shell (ISSUE-002):
   * the routed page's heading is not reachable from the swapping component,
   * so the main landmark receives focus instead.
   */
  mainRef?: Ref<HTMLElement>
}

export function Layout({ mainRef }: LayoutProps) {
  const usePlaywrightAccountStub =
    import.meta.env.PUBLIC_PLAYWRIGHT_TEST_AUTH === '1'

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-line bg-panel px-4 py-4 md:w-60 md:gap-8 md:border-r md:border-b-0 md:py-6">
        <div>
          <Link
            to="/"
            className="font-display text-2xl leading-none font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            woodshed
          </Link>
          <p className="mt-1.5 text-xs text-muted">
            Smart, personal guitar practice.
          </p>
        </div>
        <nav aria-label="Main">
          <ul className="flex flex-row flex-wrap gap-1 md:flex-col">
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: to === '/' }}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                  activeProps={{ className: 'bg-panel-2 font-medium text-fg' }}
                  inactiveProps={{
                    className: 'text-fg-2 hover:bg-panel-2/60 hover:text-fg',
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex items-center justify-start border-t border-line pt-4">
          {usePlaywrightAccountStub ? (
            <span className="text-xs font-medium text-muted">
              Test account
            </span>
          ) : (
            <Suspense fallback={null}>
              <ClerkUserButton />
            </Suspense>
          )}
        </div>
      </aside>
      <main ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <Outlet />
      </main>
    </div>
  )
}
