import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import {
  getTrpcTestPreferences,
  getTrpcTestPreferenceWriteCalls,
  resetTrpcTestData,
  setTrpcTestPreferenceBehavior,
  trpcTestFetch,
} from '../test/trpcTestFetch'
import { AppProviders } from './providers'
import { usePreferences } from './usePreferences'

function Wrapper({ children }: { children: ReactNode }) {
  return <AppProviders fetch={trpcTestFetch}>{children}</AppProviders>
}

beforeEach(() => {
  resetTrpcTestData()
})

describe('usePreferences', () => {
  it('rolls back a failed optimistic edit and allows the same choice to retry', async () => {
    setTrpcTestPreferenceBehavior({ writeFailures: 1 })
    const { result } = renderHook(() => usePreferences(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.saveNotationDisplayMode('staff'))
    expect(result.current.preferences.notationDisplayMode).toBe('staff')

    await waitFor(() => {
      expect(result.current.message).toBe('Preference database write failed')
      expect(result.current.preferences.notationDisplayMode).toBe('both')
    })

    act(() => result.current.saveNotationDisplayMode('staff'))
    await waitFor(() => {
      expect(result.current.message).toBeNull()
      expect(getTrpcTestPreferences().notationDisplayMode).toBe('staff')
    })
  })

  it('coalesces rapid tempo changes and persists the latest value', async () => {
    setTrpcTestPreferenceBehavior({ writeDelayMs: 30 })
    const { result } = renderHook(() => usePreferences(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => {
      for (let tempoBpm = 41; tempoBpm <= 100; tempoBpm += 1) {
        result.current.savePlayAlongTempo('exercise-1', tempoBpm)
      }
    })
    expect(result.current.preferences.playAlongTempos['exercise-1']).toBe(100)
    expect(result.current.isSaving).toBe(true)

    await waitFor(() => {
      expect(getTrpcTestPreferences().playAlongTempos['exercise-1']).toBe(100)
    })
    expect(getTrpcTestPreferenceWriteCalls()).toEqual([
      'tempo:exercise-1',
      'tempo:exercise-1',
    ])
    expect(result.current.isSaving).toBe(false)
  })

  it('keeps the latest value when a superseded write fails', async () => {
    setTrpcTestPreferenceBehavior({ writeDelayMs: 30, writeFailures: 1 })
    const { result } = renderHook(() => usePreferences(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => {
      result.current.saveNotationDisplayMode('staff')
      result.current.saveNotationDisplayMode('tab')
    })

    await waitFor(() => {
      expect(getTrpcTestPreferences().notationDisplayMode).toBe('tab')
      expect(result.current.preferences.notationDisplayMode).toBe('tab')
      expect(result.current.message).toBeNull()
    })
    expect(getTrpcTestPreferenceWriteCalls()).toEqual([
      'notation',
      'notation',
    ])
  })
})
