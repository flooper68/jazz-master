import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import {
  defaultPracticePreferences,
  type NotationDisplayMode,
  type PracticePreferences,
} from '../appData/preferences'
import type { ScoreTolerancePreset } from '../appData/session'
import { useTRPC } from './trpc'

interface PendingPreferenceEdits {
  notationDisplayMode?: NotationDisplayMode
  scoringTolerance?: ScoreTolerancePreset
  playAlongTempos: Record<string, number>
}

type PreferenceStatus = 'pending' | 'ready' | 'error'
type PreferenceWriteResult = {
  status: 'ok' | 'unconfigured' | 'error'
  message?: string
}

interface LatestWriteQueue<T> {
  desired: T | null
  running: boolean
}

export interface PracticePreferenceControls {
  preferences: PracticePreferences
  status: PreferenceStatus
  isSaving: boolean
  message: string | null
  saveNotationDisplayMode: (mode: NotationDisplayMode) => void
  saveScoringTolerance: (tolerance: ScoreTolerancePreset) => void
  savePlayAlongTempo: (exerciseId: string, tempoBpm: number) => void
}

export function usePreferences(): PracticePreferenceControls {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const preferencesQuery = useQuery(trpc.preferences.get.queryOptions())
  const notationMutation = useMutation(
    trpc.preferences.setNotationDisplayMode.mutationOptions(),
  )
  const scoringMutation = useMutation(
    trpc.preferences.setScoringTolerance.mutationOptions(),
  )
  const tempoMutation = useMutation(
    trpc.preferences.setPlayAlongTempo.mutationOptions(),
  )
  const [pendingEdits, setPendingEdits] = useState<PendingPreferenceEdits>({
    playAlongTempos: {},
  })
  const [writeErrors, setWriteErrors] = useState<Record<string, string>>({})
  const [pendingWriteCount, setPendingWriteCount] = useState(0)
  const notationQueue = useRef<LatestWriteQueue<NotationDisplayMode>>({
    desired: null,
    running: false,
  })
  const scoringQueue = useRef<LatestWriteQueue<ScoreTolerancePreset>>({
    desired: null,
    running: false,
  })
  const tempoQueues = useRef(
    new Map<string, LatestWriteQueue<number>>(),
  )
  const serverPreferences =
    preferencesQuery.data?.status === 'ok'
      ? preferencesQuery.data.preferences
      : defaultPracticePreferences()
  const preferences = useMemo<PracticePreferences>(
    () => ({
      notationDisplayMode:
        pendingEdits.notationDisplayMode ??
        serverPreferences.notationDisplayMode,
      scoringTolerance:
        pendingEdits.scoringTolerance ?? serverPreferences.scoringTolerance,
      playAlongTempos: {
        ...serverPreferences.playAlongTempos,
        ...pendingEdits.playAlongTempos,
      },
    }),
    [pendingEdits, serverPreferences],
  )
  const queryMessage = preferencesQuery.isError
    ? 'Preferences could not be loaded.'
    : preferencesQuery.data?.status === 'unconfigured'
      ? 'Preference database is not configured.'
      : preferencesQuery.data?.status === 'error'
        ? preferencesQuery.data.message
        : null
  const status: PreferenceStatus = preferencesQuery.isPending
    ? 'pending'
    : preferencesQuery.data?.status === 'ok'
      ? 'ready'
      : 'error'

  function updateCachedPreferences(
    update: (current: PracticePreferences) => PracticePreferences,
  ): void {
    queryClient.setQueryData(
      trpc.preferences.get.queryKey(),
      (current) =>
        current?.status === 'ok'
          ? {
              status: 'ok' as const,
              preferences: update(current.preferences),
            }
          : current,
    )
  }

  function clearWriteError(key: string): void {
    setWriteErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function recordWriteFailure(
    key: string,
    result: PreferenceWriteResult | undefined,
    invalidate: boolean,
  ): void {
    const message =
      result?.status === 'unconfigured'
        ? 'Preference database is not configured.'
        : (result?.message ?? 'Preferences could not be saved.')
    setWriteErrors((current) => ({ ...current, [key]: message }))
    if (invalidate) {
      void queryClient.invalidateQueries({
        queryKey: trpc.preferences.get.queryKey(),
      })
    }
  }

  async function trackWrite(
    write: () => Promise<PreferenceWriteResult>,
  ): Promise<PreferenceWriteResult> {
    setPendingWriteCount((current) => current + 1)
    try {
      return await write()
    } finally {
      setPendingWriteCount((current) => Math.max(current - 1, 0))
    }
  }

  return {
    preferences,
    status,
    isSaving: pendingWriteCount > 0,
    message: Object.values(writeErrors)[0] ?? queryMessage,
    saveNotationDisplayMode(mode) {
      const key = 'notationDisplayMode'
      setPendingEdits((current) => ({
        ...current,
        notationDisplayMode: mode,
      }))
      clearWriteError(key)
      enqueueLatestWrite(
        notationQueue.current,
        mode,
        (value) =>
          trackWrite(() => notationMutation.mutateAsync({ mode: value })),
        (value, result) => {
          if (result?.status === 'ok') {
            updateCachedPreferences((current) => ({
              ...current,
              notationDisplayMode: value,
            }))
            setPendingEdits((current) =>
              current.notationDisplayMode === value
                ? { ...current, notationDisplayMode: undefined }
                : current,
            )
            clearWriteError(key)
            return
          }
          setPendingEdits((current) =>
            current.notationDisplayMode === value
              ? { ...current, notationDisplayMode: undefined }
              : current,
          )
          recordWriteFailure(
            key,
            result,
            notationQueue.current.desired === null,
          )
        },
      )
    },
    saveScoringTolerance(tolerance) {
      const key = 'scoringTolerance'
      setPendingEdits((current) => ({
        ...current,
        scoringTolerance: tolerance,
      }))
      clearWriteError(key)
      enqueueLatestWrite(
        scoringQueue.current,
        tolerance,
        (value) =>
          trackWrite(() =>
            scoringMutation.mutateAsync({ tolerance: value }),
          ),
        (value, result) => {
          if (result?.status === 'ok') {
            updateCachedPreferences((current) => ({
              ...current,
              scoringTolerance: value,
            }))
            setPendingEdits((current) =>
              current.scoringTolerance === value
                ? { ...current, scoringTolerance: undefined }
                : current,
            )
            clearWriteError(key)
            return
          }
          setPendingEdits((current) =>
            current.scoringTolerance === value
              ? { ...current, scoringTolerance: undefined }
              : current,
          )
          recordWriteFailure(
            key,
            result,
            scoringQueue.current.desired === null,
          )
        },
      )
    },
    savePlayAlongTempo(exerciseId, tempoBpm) {
      const key = `tempo:${exerciseId}`
      const queue = tempoQueues.current.get(exerciseId) ?? {
        desired: null,
        running: false,
      }
      tempoQueues.current.set(exerciseId, queue)
      setPendingEdits((current) => ({
        ...current,
        playAlongTempos: {
          ...current.playAlongTempos,
          [exerciseId]: tempoBpm,
        },
      }))
      clearWriteError(key)
      enqueueLatestWrite(
        queue,
        tempoBpm,
        (value) =>
          trackWrite(() =>
            tempoMutation.mutateAsync({ exerciseId, tempoBpm: value }),
          ),
        (value, result) => {
          if (result?.status === 'ok') {
            updateCachedPreferences((current) => ({
              ...current,
              playAlongTempos: {
                ...current.playAlongTempos,
                [exerciseId]: value,
              },
            }))
          }
          setPendingEdits((current) => {
            if (current.playAlongTempos[exerciseId] !== value) return current
            const playAlongTempos = { ...current.playAlongTempos }
            delete playAlongTempos[exerciseId]
            return { ...current, playAlongTempos }
          })
          if (result?.status === 'ok') {
            clearWriteError(key)
          } else {
            recordWriteFailure(key, result, queue.desired === null)
          }
        },
      )
    },
  }
}

function enqueueLatestWrite<T>(
  queue: LatestWriteQueue<T>,
  value: T,
  write: (value: T) => Promise<PreferenceWriteResult>,
  onSettled: (value: T, result?: PreferenceWriteResult) => void,
): void {
  queue.desired = value
  if (queue.running) return
  queue.running = true

  void (async () => {
    try {
      while (queue.desired !== null) {
        const next = queue.desired
        queue.desired = null
        try {
          onSettled(next, await write(next))
        } catch {
          onSettled(next)
        }
      }
    } finally {
      queue.running = false
    }
  })()
}
