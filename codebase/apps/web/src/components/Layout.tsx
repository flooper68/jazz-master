import { UserButton } from '@clerk/astro/react'
import { Link, Outlet } from '@tanstack/react-router'
import type { Ref } from 'react'

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
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-zinc-800 px-4 py-4 md:w-56 md:gap-8 md:border-r md:border-b-0 md:py-6">
        <div>
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            Jazz Master
          </Link>
          <p className="mt-1 text-xs text-zinc-400">
            Practice jazz guitar, one chorus at a time.
          </p>
        </div>
        <nav aria-label="Main">
          <ul className="flex flex-row flex-wrap gap-1 md:flex-col">
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: to === '/' }}
                  className="block rounded px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                  activeProps={{ className: 'bg-zinc-800 font-medium text-zinc-50' }}
                  inactiveProps={{
                    className:
                      'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex items-center justify-start border-t border-zinc-800 pt-4">
          <UserButton />
        </div>
      </aside>
      <main ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  )
}
