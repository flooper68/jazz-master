import { useSyncExternalStore } from 'react'
import { dayKey } from '../appData/memory'

/**
 * Today, as one value for the whole app. The scheduler plans against a calendar
 * day, so two components reading the clock a second apart must not straddle
 * midnight and offer two different sessions on one screen — and a tab left open
 * overnight must not keep planning against yesterday.
 *
 * The day is re-read whenever the page comes back into view or focus, which is
 * what "I open it again in the morning" actually looks like. There is no timer:
 * a tab sitting visible and untouched through midnight keeps yesterday's plan
 * until it is touched, and that is the cheap side of the trade — a repeating
 * tick costs every test run and every idle tab a wake-up. Listeners hear only a
 * day that really changed, so a plan never churns on a stray focus.
 */
const EVENTS = ['visibilitychange', 'focus', 'pageshow'] as const

let currentDay = dayKey(new Date())
let currentDate = new Date()
const listeners = new Set<() => void>()
let listening = false

function check(): void {
  const now = new Date()
  const day = dayKey(now)
  if (day === currentDay) return
  currentDay = day
  currentDate = now
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!listening && typeof document !== 'undefined') {
    for (const event of EVENTS) document.addEventListener(event, check)
    listening = true
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0 || !listening) return
    for (const event of EVENTS) document.removeEventListener(event, check)
    listening = false
  }
}

/** The same `Date` until the calendar day turns, so a memo keyed on it holds still. */
function snapshot(): Date {
  return currentDate
}

export function useToday(): Date {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
