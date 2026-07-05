import { transpose, type IntervalName } from './interval'
import { parseNote, type Note } from './note'

/** Chord formulas as interval stacks over the root (qualities per CLAUDE.md). */
const CHORD_FORMULAS = {
  maj7: ['P1', 'M3', 'P5', 'M7'],
  '7': ['P1', 'M3', 'P5', 'm7'],
  m7: ['P1', 'm3', 'P5', 'm7'],
  m7b5: ['P1', 'm3', 'd5', 'm7'],
  dim7: ['P1', 'm3', 'd5', 'd7'],
  '6': ['P1', 'M3', 'P5', 'M6'],
  m6: ['P1', 'm3', 'P5', 'M6'],
} as const satisfies Record<string, readonly IntervalName[]>

export type ChordQuality = keyof typeof CHORD_FORMULAS

export interface Chord {
  root: Note
  quality: ChordQuality
}

export const CHORD_QUALITIES = Object.keys(CHORD_FORMULAS) as ChordQuality[]

/**
 * Spell a chord as correctly-named notes. A string root is a programmer
 * convenience and throws if unparseable; use parseChord for user input.
 */
export function spellChord(root: Note | string, quality: ChordQuality): Note[] {
  const rootNote = typeof root === 'string' ? parseNote(root) : root
  if (!rootNote) {
    throw new Error(`Invalid chord root: ${String(root)}`)
  }
  return CHORD_FORMULAS[quality].map((interval) =>
    transpose(rootNote, interval),
  )
}

/**
 * Chord tones in ascending order (root, third, fifth, seventh/sixth) — the
 * arpeggio of a quality is its chord formula played melodically.
 */
export function arpeggio(root: Note | string, quality: ChordQuality): Note[] {
  return spellChord(root, quality)
}

// Longest qualities first so m7b5 wins over m7, maj7 over 7.
const CHORD_SYMBOL_PATTERN = /^([A-G](?:bb|b|##|#)?)(maj7|m7b5|dim7|m7|m6|7|6)$/

/** Parse a chord symbol (`F#m7b5`, `Bb7`); null if unparseable. */
export function parseChord(symbol: string): Chord | null {
  const match = CHORD_SYMBOL_PATTERN.exec(symbol)
  if (!match) return null
  const root = parseNote(match[1])
  if (!root) return null
  return { root, quality: match[2] as ChordQuality }
}
