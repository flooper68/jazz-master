/**
 * How the run went, said in one tap on the summary — Anki's four, in the same
 * order: Again (it fell apart), Hard, Good, Easy. There is no safe middle to
 * hide in, and no default: an unanswered run is `null`.
 */
export type Difficulty = 'again' | 'hard' | 'good' | 'easy'

/** Hardest first, which is the order the summary shows them in. */
export const DIFFICULTIES: readonly Difficulty[] = ['again', 'hard', 'good', 'easy']

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

/** What each answer means, said back once it is chosen. */
export const DIFFICULTY_MEANINGS: Record<Difficulty, string> = {
  again: 'It fell apart — back tomorrow',
  hard: 'Got through it, barely',
  good: 'Clean, with effort',
  easy: 'Comfortable, room to spare',
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value)
}

/**
 * How it *felt*, which is a different question from how it went: an exercise
 * can be clean and joyless, or a mess and the best part of the day. The answer
 * shapes the session — what it opens on, what it ends on, what a bad week gets
 * — and never the schedule (docs/product/next-session-design.md §8).
 */
export type Feel = 'dragged' | 'fine' | 'loved'

/** Worst first, the order the summary shows them in. */
export const FEELS: readonly Feel[] = ['dragged', 'fine', 'loved']

export const FEEL_LABELS: Record<Feel, string> = {
  dragged: 'Dragged',
  fine: 'Fine',
  loved: 'Loved it',
}

/** What each one means, said back once it is chosen. */
export const FEEL_MEANINGS: Record<Feel, string> = {
  dragged: 'A slog — you will see less of it',
  fine: 'No strong feeling either way',
  loved: 'More of this, and it closes your sessions',
}

export function isFeel(value: unknown): value is Feel {
  return typeof value === 'string' && (FEELS as readonly string[]).includes(value)
}

/** One played-through run of one exercise, recorded when it reaches the summary. */
export interface ExerciseRun {
  id: string
  exerciseId: string
  /** ISO 8601 timestamp of the first Play. */
  startedAt: string
  /** Time spent playing; setup and pauses are excluded. */
  durationSeconds: number
  /** The tempo the run ended at — the written one unless it was changed or ramped. */
  tempoBpm: number
  /** Whole passes through the tab. */
  passes: number
  /** True when the timer ran out or the passes were done; false when ended early with Finish. */
  completed: boolean
  /** How it went, if the player said. */
  difficulty: Difficulty | null
  /** How it felt, if the player said. Null reads as `fine` everywhere it is used. */
  feel: Feel | null
  /** The practice session (a quick run) this run was part of; null when played on its own. */
  sessionId: string | null
}

/** What the player knows about a run when it ends — everything but its identity and difficulty. */
export type RunOutcome = Pick<
  ExerciseRun,
  'startedAt' | 'durationSeconds' | 'tempoBpm' | 'passes' | 'completed'
>
