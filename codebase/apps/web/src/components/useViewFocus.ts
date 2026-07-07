import { useEffect, useRef } from 'react'

interface ViewFocusOptions {
  /**
   * Also focus on the first render of the calling component. Use when the
   * component itself mounting IS the view swap (e.g. the practice runner
   * appearing after Start) rather than an internal view change.
   */
  focusOnMount?: boolean
}

/**
 * App-wide focus management for same-route view swaps (ISSUE-002).
 *
 * When a whole view is unmounted and replaced without navigation, the element
 * that held focus disappears and focus drops to `document.body`, so keyboard
 * and screen-reader users lose their place. Call this with a key that
 * identifies the currently visible view and attach the returned ref (plus
 * `tabIndex={-1}`) to that view's heading or landmark; whenever the key
 * changes, the newly rendered target receives focus.
 *
 * Focusing the DOM is synchronization with an external system, so an Effect
 * is the right tool here; render stays pure.
 */
export function useViewFocus<T extends HTMLElement>(
  viewKey: string,
  { focusOnMount = false }: ViewFocusOptions = {},
) {
  const ref = useRef<T>(null)
  const previousKey = useRef<string | null>(null)

  useEffect(() => {
    const isFirstRun = previousKey.current === null
    const keyChanged = !isFirstRun && previousKey.current !== viewKey
    previousKey.current = viewKey
    if (isFirstRun ? !focusOnMount : !keyChanged) return
    // The current view may not attach the ref (its swap focus is handled
    // elsewhere, e.g. by a child that owns the incoming view) — skip quietly.
    ref.current?.focus()
  }, [viewKey, focusOnMount])

  return ref
}
