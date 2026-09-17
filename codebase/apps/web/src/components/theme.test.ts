import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { currentTheme, loadTheme, saveTheme, THEME_KEY, useTheme } from './theme'

afterEach(() => {
  delete document.documentElement.dataset.theme
  localStorage.clear()
})

describe('theme storage', () => {
  it('returns null — follow the system — when nothing valid is saved', () => {
    expect(loadTheme({ getItem: () => null })).toBeNull()
    expect(loadTheme({ getItem: () => 'sepia' })).toBeNull()
    expect(loadTheme(null)).toBeNull()
  })

  it('ignores storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(loadTheme(broken)).toBeNull()
    expect(() => saveTheme('dark', broken)).not.toThrow()
  })

  it('round-trips a saved choice', () => {
    saveTheme('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(loadTheme()).toBe('dark')
  })
})

describe('useTheme', () => {
  it('reads the theme pinned on the root', () => {
    document.documentElement.dataset.theme = 'dark'
    expect(currentTheme()).toBe('dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('toggling pins the other theme on the root and remembers it', () => {
    document.documentElement.dataset.theme = 'light'
    const { result } = renderHook(() => useTheme())

    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(loadTheme()).toBe('dark')

    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(loadTheme()).toBe('light')
  })
})
