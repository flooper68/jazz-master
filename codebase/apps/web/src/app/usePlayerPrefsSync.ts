import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { PlayerPrefs } from '../appData/playerPrefs'
import {
  markPlayerPrefsSaved,
  markPlayerPrefsUnsaved,
  playerPrefs,
  playerPrefsUnsaved,
  setPlayerPrefs,
  subscribePlayerPrefs,
} from '../components/playerPrefs'
import { useTRPC } from './trpc'

/**
 * The player's settings belong to the account, not to the browser. What the
 * account holds wins when the app opens — the same click, guitar and score on
 * the laptop and on the phone — unless this browser is holding a choice the
 * account has never confirmed, which is the later word and goes up instead.
 *
 * The browser's storage stays the local copy: it is what the player reads
 * before the account answers, and all there is when the database is not
 * configured or the network is down. A choice is marked unsaved the moment it
 * is made and cleared only when a write comes back `ok`, so a reload a moment
 * later, or a write that never lands, costs nothing — the next visit hands it
 * up again.
 */

/** Long enough that holding a zoom button is one write, short enough to be there on the next page. */
const WRITE_AFTER_MS = 600

export function usePlayerPrefsSync(): void {
  const trpc = useTRPC()
  // Read once per page load: the answer is only ever used to settle the
  // opening, so refetching it on every window focus would cost a query and a
  // database connection for nothing.
  const { data } = useQuery({
    ...trpc.users.playerPrefs.queryOptions(),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  })
  // What the account is known to hold, so its own answer is not echoed back.
  const known = useRef<string | null>(null)
  // The account has answered; until it has, a change is only marked unsaved.
  const settled = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { mutate } = useMutation(
    trpc.users.savePlayerPrefs.mutationOptions({
      onSuccess: (answer, sent) => {
        // Anything else — no database, a failed write — leaves the choice
        // marked unsaved, for the next visit to hand up again.
        if (answer.status !== 'ok') return
        known.current = JSON.stringify(sent)
        markPlayerPrefsSaved()
      },
    }),
  )
  // Latest-value ref: the subscription below is set up once, so a re-render
  // cannot drop a write that is already waiting out its delay.
  const write = useRef(mutate)
  write.current = mutate

  useEffect(() => {
    if (data?.status !== 'ok' || settled.current) return
    settled.current = true
    if (data.prefs !== null && !playerPrefsUnsaved()) {
      known.current = JSON.stringify(data.prefs)
      setPlayerPrefs(data.prefs)
      return
    }
    // Either this browser holds a choice the account has not confirmed, or the
    // account holds nothing and something was chosen here. An untouched
    // browser hands nothing up: its defaults are not a choice, and pinning
    // them as the account's would overwrite a real one made on another device.
    if (playerPrefsUnsaved()) write.current(playerPrefs())
  }, [data])

  useEffect(() => {
    const push = (prefs: PlayerPrefs) => {
      timer.current = null
      if (settled.current) write.current(prefs)
    }
    const stop = subscribePlayerPrefs(() => {
      const current = playerPrefs()
      // The account's own answer, arriving: not a change to write back.
      if (JSON.stringify(current) === known.current) return
      markPlayerPrefsUnsaved()
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => push(current), WRITE_AFTER_MS)
    })
    // A tab being closed or hidden takes the pending write with it: send it
    // now. If it still does not arrive, the unsaved mark carries it over.
    const flush = () => {
      if (!timer.current) return
      clearTimeout(timer.current)
      push(playerPrefs())
    }
    const onVisibility = () => {
      if (document.hidden) flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
}
