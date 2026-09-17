import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { HistoryIcon, ListIcon, SidebarIcon } from './icons'
import {
  clampSidebarWidth,
  DEFAULT_SIDEBAR_PREFS,
  loadSidebarPrefs,
  saveSidebarPrefs,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
  SIDEBAR_STEP,
  type SidebarPrefs,
} from './sidebarPrefs'
import { useTheme, type Theme } from './theme'

const ClerkUserButton = lazy(async () => {
  const clerk = await import('@clerk/astro/react')
  return { default: clerk.UserButton }
})

// Clerk mounts menu icons into its own DOM, outside React: plain SVG markup,
// drawn like icons.tsx (16px, currentColor). The icon shows the theme on offer.
const THEME_ICON_SVG: Record<Theme, string> = {
  light:
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M7.25 1h1.5v2.5h-1.5zM7.25 12.5h1.5V15h-1.5zM1 7.25h2.5v1.5H1zM12.5 7.25H15v1.5h-2.5zM2.5 3.6l1.1-1.1 1.8 1.8-1.1 1.1zM10.6 11.7l1.1-1.1 1.8 1.8-1.1 1.1zM2.5 12.4l1.8-1.8 1.1 1.1-1.8 1.8zM10.6 4.3l1.8-1.8 1.1 1.1-1.8 1.8z"/></svg>',
  dark:
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6.2 1.6a6.5 6.5 0 1 0 8.2 8.2A5.5 5.5 0 0 1 6.2 1.6z"/></svg>',
}

const NAV = [
  { to: '/', label: 'Exercises', icon: ListIcon },
  { to: '/history', label: 'History', icon: HistoryIcon },
] as const

/** The app shell: brand, navigation and the account control beside (on phones, above) the page. */
export function Layout() {
  const usePlaywrightAccountStub =
    import.meta.env.PUBLIC_PLAYWRIGHT_TEST_AUTH === '1'
  const { theme, toggleTheme } = useTheme()
  // The theme toggle lives in the account menu, between Clerk's own items.
  const menuItems = useMemo(() => {
    const offered: Theme = theme === 'dark' ? 'light' : 'dark'
    return [
      {
        label: offered === 'dark' ? 'Dark theme' : 'Light theme',
        onClick: toggleTheme,
        mountIcon: (el: HTMLDivElement) => {
          el.innerHTML = THEME_ICON_SVG[offered]
        },
        unmountIcon: (el?: HTMLDivElement) => {
          if (el) el.innerHTML = ''
        },
      },
    ]
  }, [theme, toggleTheme])

  const pathname = useRouterState({ select: (state) => state.location.pathname })
  // The player is a stage: the phone header drops its nav row there, and the
  // sidebar remembers a fold of its own for it (folded unless opened).
  const onStage = pathname.includes('/exercises/')
  // Playing an exercise is still being in Exercises.
  const current = pathname.endsWith('/history') ? '/history' : '/'

  const [sidebar, setSidebar] = useState<SidebarPrefs>(loadSidebarPrefs)
  useEffect(() => saveSidebarPrefs(sidebar), [sidebar])
  const foldKey = onStage ? 'collapsedOnStage' : 'collapsed'
  const collapsed = sidebar[foldKey]
  const setWidth = (width: number) =>
    setSidebar((prefs) => ({ ...prefs, width: clampSidebarWidth(width) }))

  // Dragging the edge follows the pointer; the header's left edge is the origin.
  const headerRef = useRef<HTMLElement>(null)
  const [dragging, setDragging] = useState(false)
  function onResizePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
  }
  function onResizePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragging) return
    setWidth(event.clientX - (headerRef.current?.getBoundingClientRect().left ?? 0))
  }
  function onResizeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    const delta = { ArrowLeft: -SIDEBAR_STEP, ArrowRight: SIDEBAR_STEP }[event.key]
    if (delta === undefined) return
    event.preventDefault()
    setWidth(sidebar.width + delta)
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-3 focus:py-2 focus:text-fg focus:outline-2 focus:outline-fg"
      >
        Skip to content
      </a>
      {/* One element, two shapes: a top bar on phones, the left sidebar from md up. */}
      <header
        ref={headerRef}
        data-collapsed={collapsed || undefined}
        style={{ '--sidebar-w': `${sidebar.width}px` } as CSSProperties}
        className={`z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel px-4 py-3 md:sticky md:top-0 md:h-dvh md:shrink-0 md:flex-col md:flex-nowrap md:items-stretch md:gap-y-6 md:border-r md:border-b-0 md:py-5 ${
          collapsed ? 'md:w-16 md:px-2' : 'md:w-(--sidebar-w) md:px-3'
        } ${dragging ? 'select-none' : 'md:transition-[width] md:duration-150'}`}
      >
        <div className={`flex items-start gap-2 ${collapsed ? 'md:flex-col md:items-center' : 'md:justify-between md:px-2'}`}>
          <div className="min-w-0">
            <Link
              to="/"
              aria-label="woodshed"
              className="font-display text-2xl leading-none font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              <span className={collapsed ? 'md:hidden' : undefined}>woodshed</span>
              {collapsed && <span className="hidden md:inline">w</span>}
            </Link>
            <p className={`mt-1 text-xs text-muted ${collapsed ? 'md:hidden' : ''}`}>
              Smart, personal guitar practice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSidebar((prefs) => ({ ...prefs, [foldKey]: !prefs[foldKey] }))}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-panel-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg md:inline-flex"
          >
            <SidebarIcon />
          </button>
        </div>
        <nav
          aria-label="Main"
          className={`order-last flex w-full gap-1 md:order-none md:flex md:flex-col ${onStage ? 'hidden' : ''}`}
        >
          {NAV.map(({ to, label, icon: NavIcon }) => (
            <Link
              key={to}
              to={to}
              aria-current={to === current ? 'page' : undefined}
              title={collapsed ? label : undefined}
              className={`inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-panel-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                to === current ? 'bg-panel-2 text-fg' : 'text-fg-2'
              } ${collapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              <NavIcon />
              <span className={collapsed ? 'md:sr-only' : 'truncate'}>{label}</span>
            </Link>
          ))}
        </nav>
        <div className={`ml-auto md:mt-auto md:ml-0 ${collapsed ? 'md:flex md:justify-center' : 'md:px-2'}`}>
          {usePlaywrightAccountStub ? (
            <span className={`text-xs font-medium text-muted ${collapsed ? 'md:sr-only' : ''}`}>Test account</span>
          ) : (
            <Suspense fallback={null}>
              {/* Clerk reads the menu items once, at mount: remount so the label follows the theme. */}
              <ClerkUserButton key={theme} customMenuItems={menuItems} />
            </Suspense>
          )}
        </div>
        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={SIDEBAR_MIN}
            aria-valuemax={SIDEBAR_MAX}
            aria-valuenow={sidebar.width}
            tabIndex={0}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onDoubleClick={() => setWidth(DEFAULT_SIDEBAR_PREFS.width)}
            onKeyDown={onResizeKeyDown}
            className={`absolute inset-y-0 -right-1 hidden w-2 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 hover:after:bg-line-strong focus-visible:outline-none focus-visible:after:bg-fg md:block ${
              dragging ? 'after:bg-fg' : ''
            }`}
          />
        )}
      </header>
      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <Outlet />
      </main>
    </div>
  )
}
