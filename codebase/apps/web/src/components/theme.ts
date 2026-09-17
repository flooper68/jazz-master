import { useCallback, useEffect, useState } from 'react'

/**
 * The colour theme. The tokens in index.css follow the system scheme until a
 * `data-theme` on the root pins one; the choice is remembered per browser.
 * BaseLayout applies the saved choice before first paint, so this module only
 * reads what is already on the root and changes it.
 */

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'jazz-master.theme'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/** The saved choice, or null to follow the system; storage that is missing or broken is ignored. */
export function loadTheme(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Theme | null {
  try {
    const raw = storage?.getItem(THEME_KEY)
    return isTheme(raw) ? raw : null
  } catch {
    return null
  }
}

export function saveTheme(theme: Theme, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(THEME_KEY, theme)
  } catch {
    // Private mode or a full quota: the choice still holds for this page.
  }
}

/** The theme on screen: the pinned one, else what the system asks for. */
export function currentTheme(): Theme {
  const pinned = document.documentElement.dataset.theme
  if (isTheme(pinned)) return pinned
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  // Until a theme is pinned the page follows the system, so the label must too.
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setTheme(currentTheme())
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    saveTheme(next)
    setTheme(next)
  }, [])

  return { theme, toggleTheme }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
