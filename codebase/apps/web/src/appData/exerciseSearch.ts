import {
  EXERCISE_AREAS,
  EXERCISE_CONTEXTS,
  EXERCISE_FEELS,
  EXERCISE_POSITIONS,
  EXERCISE_STYLES,
  EXERCISE_TECHNIQUES,
  EXERCISE_VOICINGS,
  type ExerciseQuery,
} from '../content'

/**
 * The exercise list's filter as the URL carries it, so a filtered list can be
 * reloaded, bookmarked and linked to. Each facet is one comma-separated
 * parameter, left out when nothing is chosen; anything the vocabularies do
 * not know — a hand-edited URL, a link from before a rename — is dropped.
 */
export type ExerciseSearch = {
  q?: string
  area?: string
  style?: string
  /** `0` when the chosen styles should not bring the fundamentals along. */
  fund?: string
  ctx?: string
  tech?: string
  feel?: string
  voicing?: string
  level?: string
  pos?: string
}

const HIGHEST_LEVEL_IN_SEARCH = 9

/** The router reads `level=2` as a number and `style=blues` as a string; both arrive here. */
function listOf(raw: unknown): string[] {
  if (typeof raw === 'number') return [String(raw)]
  if (typeof raw !== 'string') return []
  return raw.split(',').map((value) => value.trim()).filter(Boolean)
}

function known<const Value extends string>(raw: unknown, vocabulary: readonly Value[]): Value[] {
  const asked = listOf(raw)
  return vocabulary.filter((value) => asked.includes(value))
}

export function queryOfSearch(search: Record<string, unknown>): ExerciseQuery {
  const levels = [...new Set(listOf(search.level).map(Number))]
    .filter((level) => Number.isInteger(level) && level >= 1 && level <= HIGHEST_LEVEL_IN_SEARCH)
    .sort((a, b) => a - b)
  return {
    text: typeof search.q === 'string' || typeof search.q === 'number' ? String(search.q).slice(0, 80) : '',
    areas: known(search.area, EXERCISE_AREAS),
    styles: known(search.style, EXERCISE_STYLES),
    fundamentals: !(search.fund === 0 || search.fund === '0'),
    contexts: known(search.ctx, EXERCISE_CONTEXTS),
    techniques: known(search.tech, EXERCISE_TECHNIQUES),
    feels: known(search.feel, EXERCISE_FEELS),
    voicings: known(search.voicing, EXERCISE_VOICINGS),
    levels,
    positions: known(search.pos, EXERCISE_POSITIONS),
  }
}

function joined(values: readonly (string | number)[]): string | undefined {
  return values.length > 0 ? values.join(',') : undefined
}

/** The search a query is written as: only what differs from everything. */
export function searchOfQuery(query: ExerciseQuery): ExerciseSearch {
  const search: ExerciseSearch = {
    q: query.text.trim() || undefined,
    area: joined(query.areas),
    style: joined(query.styles),
    fund: query.styles.length > 0 && !query.fundamentals ? '0' : undefined,
    ctx: joined(query.contexts),
    tech: joined(query.techniques),
    feel: joined(query.feels),
    voicing: joined(query.voicings),
    level: joined(query.levels),
    pos: joined(query.positions),
  }
  return Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined))
}

/** What the route hands the page: the search cleaned of anything unknown, in canonical form. */
export function validateExerciseSearch(search: Record<string, unknown>): ExerciseSearch {
  return searchOfQuery(queryOfSearch(search))
}

