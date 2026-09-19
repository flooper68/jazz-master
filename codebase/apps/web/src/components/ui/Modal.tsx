import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '../icons'

/**
 * A centred dialog over a dimmed page: the way to put a pile of settings out
 * of sight until they are wanted. It closes on Escape and on a press outside
 * the panel, and it takes focus while it is open so the keyboard stays in it.
 *
 * It always covers the window, wherever it is written. That takes a portal:
 * `fixed` is measured from the nearest ancestor with a transform, filter or
 * backdrop-filter rather than from the window, so a dialog left where it
 * stands ends up boxed inside whatever animated panel happens to hold it.
 * The host is the fullscreen element when there is one — nothing outside that
 * subtree is on screen — and the body otherwise.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

export interface ModalProps {
  /** The heading, and the dialog's accessible name. */
  title: string
  /** One line under the heading saying what these controls are for. */
  description?: string
  onClose: () => void
  children: ReactNode
  /** Width of the panel: it fills the screen's height, and up to this across. */
  className?: string
  /**
   * Where focus goes when the dialog closes. Needed when whatever opened it is
   * gone by then — a menu item that closed its own menu on the way here.
   */
  returnFocusTo?: RefObject<HTMLElement | null>
  /**
   * How tall the panel is. `screen` fills the height, which is what a pile of
   * settings wants; `content` is only as tall as what is in it and sits in the
   * middle, which is what a short answer-this-and-move-on dialog wants.
   */
  fit?: 'screen' | 'content'
  /**
   * The title bar with its close button. Turn it off where the panel says its
   * own name — `title` still names the dialog for a screen reader.
   */
  header?: boolean
}

export function Modal({
  title,
  description,
  onClose,
  children,
  className = 'max-w-3xl',
  returnFocusTo,
  fit = 'screen',
  header = true,
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  // A press that began inside the panel and ended on the backdrop (a drag off
  // a slider, a text selection) is not a press on the backdrop.
  const pressedBackdrop = useRef(false)
  // Latest-value ref: the effect below runs once, so a re-render cannot take
  // focus back from whatever is being typed into.
  const close = useRef(onClose)
  close.current = onClose
  const titleId = useId()
  const ids = { title: `${titleId}-title`, description: `${titleId}-description` }
  // Settled before the first paint, so the panel is in the document in time
  // for the focus below; it moves if the page enters or leaves fullscreen.
  const [host, setHost] = useState<HTMLElement | null>(() =>
    typeof document === 'undefined' ? null : ((document.fullscreenElement as HTMLElement | null) ?? document.body),
  )

  useEffect(() => {
    const follow = () => setHost((document.fullscreenElement as HTMLElement | null) ?? document.body)
    follow()
    document.addEventListener('fullscreenchange', follow)
    return () => document.removeEventListener('fullscreenchange', follow)
  }, [])

  useEffect(() => {
    // The opener, unless it has already gone: a menu item that closed its own
    // menu on the way here is detached by now, so the caller says where to go.
    const opener = document.activeElement
    const returnTo = returnFocusTo ?? (opener instanceof HTMLElement && opener !== document.body ? { current: opener } : null)
    panel.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      // A dropdown inside the dialog takes Escape first and marks it handled;
      // only an unclaimed Escape belongs to the dialog.
      if (event.key !== 'Escape' || event.defaultPrevented) return
      close.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      returnTo?.current?.focus?.()
    }
  }, [returnFocusTo])

  /**
   * `aria-modal` tells a screen reader the rest of the page is out of play; it
   * does nothing for the Tab key, so the dialog keeps the keyboard itself by
   * wrapping at both ends.
   */
  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (event.key !== 'Tab' || !panel.current) return
    const stops = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
    )
    const first = stops[0]
    const last = stops.at(-1)
    if (!first || !last) return
    const on = document.activeElement
    if (event.shiftKey && (on === first || on === panel.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && on === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!host) return null

  return createPortal(
    <div
      className={`fade-in fixed inset-0 z-50 flex justify-center bg-fg/25 p-3 backdrop-blur-[2px] md:p-6 ${
        fit === 'screen' ? 'items-stretch' : 'items-center overflow-y-auto'
      }`}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget && event.button === 0
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && pressedBackdrop.current) onClose()
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={header ? undefined : title}
        aria-labelledby={header ? ids.title : undefined}
        aria-describedby={description && header ? ids.description : undefined}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className={`flex w-full ${fit === 'screen' ? 'h-full' : 'max-h-full'} ${className} flex-col rounded-2xl border border-line bg-panel text-left shadow-lg shadow-shade outline-none`}
      >
        {header && (
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={ids.title} className="font-display text-base font-semibold tracking-tight text-fg">
              {title}
            </h2>
            {description && (
              <p id={ids.description} className="mt-1 text-xs text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className={`inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-panel text-fg-2 hover:border-line-strong hover:text-fg ${FOCUS}`}
          >
            <CloseIcon />
          </button>
        </div>
        )}
        {/* The settings scroll; the heading and the way out stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    host,
  )
}
