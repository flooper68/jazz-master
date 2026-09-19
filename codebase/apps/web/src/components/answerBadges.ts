import type { Difficulty, Feel } from '../appData/run'

/**
 * An answer already given, read back at a glance. Colour carries the same
 * order the buttons do — Again is the alarm, Easy is the clear water — but it
 * is never the only carrier: the word is always there beside it.
 */
export const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  again: 'bg-danger-soft text-danger-text',
  hard: 'bg-warning-soft text-warning-text',
  good: 'bg-success-soft text-success-text',
  easy: 'bg-blue text-on-blue',
}

/** How it felt, which never moves the schedule and so never shouts. */
export const FEEL_BADGE: Record<Feel, string> = {
  dragged: 'bg-panel-2 text-muted',
  fine: 'bg-panel-2 text-fg-2',
  loved: 'bg-rose text-on-rose',
}
