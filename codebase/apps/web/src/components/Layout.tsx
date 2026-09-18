import { AccountMenu } from '../auth/AccountMenu'
import { Lockup, Mark } from './Brand'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Exercise } from '../content'
import { GoalIcon, HistoryIcon, HomeIcon, ListIcon, RoutineIcon, SidebarIcon } from './icons'

import type { Routine } from '../appData/routine'
import { QuickRunButton } from './QuickRunButton'
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
import { useTheme } from './theme'

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/exercises', label: 'Exercises', icon: ListIcon },
  { to: '/routines', label: 'Routines', icon: RoutineIcon },
  { to: '/goals', label: 'Goals', icon: GoalIcon },
  { to: '/history', label: 'History', icon: HistoryIcon },
] as const

/** The app shell: brand, navigation and the account control beside (on phones, above) the page. */
interface LayoutProps {
  /** The catalog: the pack, joined by the user's own exercises once the app has them. */
  exercises: readonly Exercise[]
  /** The user's practice routines, one of which can be named as what to play next. */
  routines: readonly Routine[]
  /** What Play offers, worked out by the page. */
  next: { label: string; count: number; seconds: number; routineId: string | null }
  onStartNext: () => void
}

export function Layout({ exercises, routines, next, onStartNext }: LayoutProps) {
  const usePlaywrightAccountStub =
    import.meta.env.PUBLIC_PLAYWRIGHT_TEST_AUTH === '1'
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  // The player is a stage: the phone header drops its nav row there, and the
  // sidebar remembers a fold of its own for it (folded unless opened).
  const onStage = /\/exercises\/[^/]+/.test(pathname) || pathname.endsWith('/session')
  // Playing an exercise is still being in Exercises; a session belongs to no page.
  const current = pathname.endsWith('/history')
    ? '/history'
    : pathname.includes('/routines')
      ? '/routines'
      : pathname.includes('/exercises')
      ? '/exercises'
      : pathname.endsWith('/session')
        ? null
        : '/'

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
    <div data-app className="flex min-h-screen flex-col bg-canvas text-fg md:flex-row">
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
        className={`z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel px-4 py-3 md:sticky md:top-0 md:h-dvh md:shrink-0 md:flex-col md:flex-nowrap md:items-stretch md:gap-y-4 md:border-r md:border-b-0 md:py-4 ${
          collapsed ? 'md:w-14 md:px-1.5' : 'md:w-(--sidebar-w) md:px-2.5'
        } ${dragging ? 'select-none' : 'md:transition-[width] md:duration-150'}`}
      >
        <div className={`flex items-start gap-2 ${collapsed ? 'md:flex-col md:items-center' : 'md:justify-between md:px-2'}`}>
          <div className="min-w-0">
            <Link
              to="/"
              aria-label="count-in"
              className="inline-flex text-2xl md:text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
            >
              <span className={collapsed ? 'md:hidden' : undefined}>
                <Lockup className="text-[1em]" />
              </span>
              {collapsed && <Mark className="hidden h-4 w-[2.42rem] md:block" />}
            </Link>
            <p className={`mt-1.5 text-xs text-muted ${collapsed ? 'md:hidden' : ''}`}>
              Practice smart.
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
          className={`order-last flex w-full flex-wrap gap-0.5 md:order-none md:flex md:flex-col md:flex-nowrap md:gap-1 ${onStage ? 'hidden' : ''}`}
        >
          {NAV.map(({ to, label, icon: NavIcon }) => (
            <Link
              key={to}
              to={to}
              aria-current={to === current ? 'page' : undefined}
              title={collapsed ? label : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1.5 text-[13px] font-medium min-[480px]:px-2.5 min-[480px]:text-sm md:text-sm hover:bg-panel-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                to === current ? 'bg-panel-2 text-fg' : 'text-fg-2'
              } ${collapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              {/* The narrowest phones have no room for the icons beside three labels. */}
              <span className="hidden min-[480px]:inline-flex">
                <NavIcon />
              </span>
              <span className={collapsed ? 'md:sr-only' : 'truncate'}>{label}</span>
            </Link>
          ))}
          {/* The primary action: first in the sidebar, above the links; at the end of the phone row. */}
          <div className="ml-auto md:@container md:order-first md:mb-2 md:ml-0">
            <QuickRunButton
              exercises={exercises}
              routines={routines}
              next={next}
              iconOnly={collapsed}
              onStart={onStartNext}
            />
          </div>
        </nav>
        <div className={`ml-auto min-w-0 md:mt-auto md:ml-0 ${collapsed ? 'md:flex md:justify-center' : 'md:px-2'}`}>
          {usePlaywrightAccountStub ? (
            <span className={`text-xs font-medium text-muted ${collapsed ? 'md:sr-only' : ''}`}>Test account</span>
          ) : (
            <AccountMenu theme={theme} onToggleTheme={toggleTheme} onOpenAccount={() => void navigate({ to: '/account' })} showName={!collapsed} />
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
      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-7">
        <Outlet />
      </main>
    </div>
  )
}
