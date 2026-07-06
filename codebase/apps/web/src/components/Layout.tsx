import { Link, Outlet } from '@tanstack/react-router'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/voicings', label: 'Voicings' },
  { to: '/progressions', label: 'Progressions' },
  { to: '/practice', label: 'Practice' },
  { to: '/history', label: 'History' },
  { to: '/repertoire', label: 'Repertoire' },
  { to: '/ear-training', label: 'Ear Training' },
  { to: '/profile', label: 'Profile' },
] as const

export function Layout() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-56 shrink-0 flex-col gap-8 border-r border-zinc-800 px-4 py-6">
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
          <ul className="flex flex-col gap-1">
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
      </aside>
      <main className="flex-1 px-8 py-10">
        <Outlet />
      </main>
    </div>
  )
}
