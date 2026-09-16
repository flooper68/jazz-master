import { Link, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const ClerkUserButton = lazy(async () => {
  const clerk = await import('@clerk/astro/react')
  return { default: clerk.UserButton }
})

/** The app shell: a slim header (brand, account control) over the page. */
export function Layout() {
  const usePlaywrightAccountStub =
    import.meta.env.PUBLIC_PLAYWRIGHT_TEST_AUTH === '1'

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-3 focus:py-2 focus:text-fg focus:outline-2 focus:outline-fg"
      >
        Skip to content
      </a>
      <header className="flex items-center justify-between gap-4 border-b border-line bg-panel px-4 py-3 md:px-10">
        <div>
          <Link
            to="/"
            className="font-display text-2xl leading-none font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            woodshed
          </Link>
          <p className="mt-1 text-xs text-muted">
            Smart, personal guitar practice.
          </p>
        </div>
        {usePlaywrightAccountStub ? (
          <span className="text-xs font-medium text-muted">Test account</span>
        ) : (
          <Suspense fallback={null}>
            <ClerkUserButton />
          </Suspense>
        )}
      </header>
      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <Outlet />
      </main>
    </div>
  )
}
