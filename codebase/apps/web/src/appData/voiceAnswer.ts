import type { Difficulty, Feel } from './run'

/**
 * Hearing an answer in what was said. The summary asks two questions — how it
 * went and how it felt — and a player with a guitar in their hands would
 * rather say "hard, but loved it" than put it down and tap twice.
 *
 * The two vocabularies are deliberately disjoint, so one sentence can answer
 * both questions without either stealing the other's word: "good" is only ever
 * how it went, "fine" only ever how it felt. Whichever phrase comes first in
 * the sentence wins its question — "again, no, hard" answers Again, the same
 * as it would read on the page.
 */

/** What was heard, as answers. Either may be absent: nothing in the sentence said so. */
export interface SpokenAnswer {
  difficulty: Difficulty | null
  feel: Feel | null
}

/**
 * The words that choose each answer. The label is always among them; the rest
 * are how people actually say it, including the meanings the summary prints
 * back ("it fell apart", "a slog").
 */
const DIFFICULTY_PHRASES: Record<Difficulty, readonly string[]> = {
  again: ['again', 'repeat', 'fell apart', 'falling apart', 'a mess', 'disaster', 'no chance'],
  hard: ['hard', 'harder', 'difficult', 'tough', 'struggled', 'barely', 'rough'],
  good: ['good', 'clean', 'solid', 'went well', 'nailed it'],
  easy: ['easy', 'easier', 'comfortable', 'simple', 'no problem'],
}

const FEEL_PHRASES: Record<Feel, readonly string[]> = {
  dragged: ['dragged', 'drag', 'dragging', 'a slog', 'slog', 'boring', 'bored', 'hated'],
  fine: ['fine', 'okay', 'ok', 'alright', 'neutral', 'meh'],
  loved: ['loved it', 'loved', 'love it', 'love', 'loving', 'enjoyed', 'great fun', 'brilliant'],
}

/** Said out loud, tidied to the shape the phrase lists are written in. */
function normalise(transcript: string): string {
  return ` ${transcript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `
}

/** Where the earliest of these phrases starts in the sentence, or -1 for none of them. */
function earliest(sentence: string, phrases: readonly string[]): number {
  let found = -1
  for (const phrase of phrases) {
    const at = sentence.indexOf(` ${phrase} `)
    if (at !== -1 && (found === -1 || at < found)) found = at
  }
  return found
}

/** Whichever of these answers is spoken first, or null when none of them is. */
function firstSpoken<T extends string>(sentence: string, phrases: Record<T, readonly string[]>): T | null {
  let chosen: T | null = null
  let chosenAt = -1
  for (const [answer, words] of Object.entries(phrases) as [T, readonly string[]][]) {
    const at = earliest(sentence, words)
    if (at === -1) continue
    if (chosenAt === -1 || at < chosenAt) {
      chosen = answer
      chosenAt = at
    }
  }
  return chosen
}

/** What the player just said, read as answers to the summary's two questions. */
export function matchSpokenAnswer(transcript: string): SpokenAnswer {
  const sentence = normalise(transcript)
  return {
    difficulty: firstSpoken(sentence, DIFFICULTY_PHRASES),
    feel: firstSpoken(sentence, FEEL_PHRASES),
  }
}

/**
 * What the recogniser is told to expect. Contextual biasing turns a one-word
 * answer from a guess into a near-certainty — "again" is otherwise easily
 * heard as "a gain".
 */
export const SPOKEN_ANSWER_PHRASES: readonly string[] = [
  ...Object.values(DIFFICULTY_PHRASES).flat(),
  ...Object.values(FEEL_PHRASES).flat(),
]

/** Nothing in the sentence answered either question. */
export function heardNothing(answer: SpokenAnswer): boolean {
  return answer.difficulty === null && answer.feel === null
}
