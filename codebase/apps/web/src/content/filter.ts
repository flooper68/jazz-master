import {
  EXERCISE_AREAS,
  EXERCISE_CONTEXTS,
  EXERCISE_FEELS,
  EXERCISE_STYLES,
  EXERCISE_TECHNIQUES,
  EXERCISE_VOICINGS,
  styleMatches,
  type ExerciseArea,
  type ExerciseContext,
  type ExerciseFeel,
  type ExerciseStyle,
  type ExerciseTechnique,
  type ExerciseVoicing,
} from './taxonomy'
import type { Exercise } from './types'

/**
 * Finding exercises in a list too long to read. Within a facet the chosen
 * values widen the result (bebop or blues); across facets they narrow it
 * (bebop, and level 2, and over a ii–V–I). Nothing chosen means everything.
 */

/** Where on the neck an exercise sits — read from its tab, never written by hand, so it cannot drift from the notes. */
export const EXERCISE_POSITIONS = ['open', 'low', 'mid', 'high', 'shifting'] as const
export type ExercisePosition = (typeof EXERCISE_POSITIONS)[number]

/** More frets than one hand position covers, the stretch included. */
const WIDEST_POSITION_SPAN = 5

export function exercisePosition(exercise: Pick<Exercise, 'notes'>): ExercisePosition {
  const fretted = exercise.notes.map((note) => note.fret).filter((fret) => fret > 0)
  if (fretted.length === 0) return 'open'
  const lowest = Math.min(...fretted)
  const highest = Math.max(...fretted)
  if (highest - lowest > WIDEST_POSITION_SPAN) return 'shifting'
  const usesOpenStrings = fretted.length < exercise.notes.length
  if (usesOpenStrings && highest <= 4) return 'open'
  if (lowest <= 4) return 'low'
  return lowest <= 8 ? 'mid' : 'high'
}

export interface ExerciseQuery {
  /** Words that must all appear in the title, the text, or a label. */
  text: string
  areas: readonly ExerciseArea[]
  styles: readonly ExerciseStyle[]
  /**
   * With styles chosen: also keep the exercises that have no style. They are
   * the fundamentals every style is built on, and a style alone would hide them.
   */
  fundamentals: boolean
  contexts: readonly ExerciseContext[]
  techniques: readonly ExerciseTechnique[]
  feels: readonly ExerciseFeel[]
  voicings: readonly ExerciseVoicing[]
  levels: readonly number[]
  positions: readonly ExercisePosition[]
}

export const EVERYTHING: ExerciseQuery = Object.freeze({
  text: '',
  areas: [],
  styles: [],
  fundamentals: true,
  contexts: [],
  techniques: [],
  feels: [],
  voicings: [],
  levels: [],
  positions: [],
})

/** The facets a query narrows by; `text` and `fundamentals` are not facets. */
export type ExerciseFacet = 'areas' | 'styles' | 'contexts' | 'techniques' | 'feels' | 'voicings' | 'levels' | 'positions'

export const EXERCISE_FACETS: readonly ExerciseFacet[] = [
  'areas',
  'styles',
  'contexts',
  'techniques',
  'feels',
  'voicings',
  'levels',
  'positions',
]

/** How many values are chosen across every facet, plus one for a search text: what a "Filters (3)" badge counts. */
export function activeFilterCount(query: ExerciseQuery): number {
  return EXERCISE_FACETS.reduce((total, facet) => total + query[facet].length, query.text.trim() ? 1 : 0)
}

function overlaps<Value>(tagged: readonly Value[] | undefined, wanted: readonly Value[]): boolean {
  return wanted.length === 0 || (tagged ?? []).some((value) => wanted.includes(value))
}

function matchesFacet(exercise: Exercise, query: ExerciseQuery, facet: ExerciseFacet): boolean {
  switch (facet) {
    case 'areas':
      return query.areas.length === 0 || query.areas.includes(exercise.area)
    case 'styles': {
      if (query.styles.length === 0) return true
      const tagged = exercise.styles ?? []
      if (tagged.length === 0) return query.fundamentals
      return tagged.some((style) => query.styles.some((wanted) => styleMatches(style, wanted)))
    }
    case 'contexts':
      return overlaps(exercise.contexts, query.contexts)
    case 'techniques':
      return overlaps(exercise.techniques, query.techniques)
    case 'feels':
      return query.feels.length === 0 || (exercise.feel !== undefined && query.feels.includes(exercise.feel))
    case 'voicings':
      return overlaps(exercise.voicings, query.voicings)
    case 'levels':
      return query.levels.length === 0 || query.levels.includes(exercise.level)
    case 'positions':
      return query.positions.length === 0 || query.positions.includes(exercisePosition(exercise))
  }
}

/** Everything about an exercise a person might type to find it, lowercased. */
function searchable(exercise: Exercise): string {
  return [
    exercise.title,
    exercise.area,
    exercise.key ?? '',
    exercise.series ?? '',
    exercise.feel ?? '',
    ...(exercise.styles ?? []),
    ...(exercise.contexts ?? []),
    ...(exercise.techniques ?? []),
    ...(exercise.voicings ?? []),
    ...(exercise.tags ?? []),
    ...(exercise.about ?? []),
  ]
    .join(' ')
    .toLowerCase()
}

function matchesText(exercise: Exercise, text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = searchable(exercise)
  return words.every((word) => haystack.includes(word))
}

function matches(exercise: Exercise, query: ExerciseQuery, except?: ExerciseFacet): boolean {
  return (
    matchesText(exercise, query.text) &&
    EXERCISE_FACETS.every((facet) => facet === except || matchesFacet(exercise, query, facet))
  )
}

/** The exercises a query keeps, in the order they came. */
export function filterExercises<Item extends Exercise>(exercises: readonly Item[], query: ExerciseQuery): Item[] {
  return exercises.filter((exercise) => matches(exercise, query))
}

/** Every value a facet can take, in the order its options read. */
export interface FacetOptions {
  areas: readonly ExerciseArea[]
  styles: readonly ExerciseStyle[]
  contexts: readonly ExerciseContext[]
  techniques: readonly ExerciseTechnique[]
  feels: readonly ExerciseFeel[]
  voicings: readonly ExerciseVoicing[]
  levels: readonly number[]
  positions: readonly ExercisePosition[]
}

export type FacetCounts = { [Facet in ExerciseFacet]: ReadonlyMap<FacetOptions[Facet][number], number> }

function valuesOf(exercise: Exercise, facet: ExerciseFacet): readonly (string | number)[] {
  switch (facet) {
    case 'areas':
      return [exercise.area]
    case 'styles': {
      // A child counts for its family too: three bebop lines are three jazz exercises.
      const tagged = exercise.styles ?? []
      return EXERCISE_STYLES.filter((wanted) => tagged.some((style) => styleMatches(style, wanted)))
    }
    case 'contexts':
      return exercise.contexts ?? []
    case 'techniques':
      return exercise.techniques ?? []
    case 'feels':
      return exercise.feel ? [exercise.feel] : []
    case 'voicings':
      return exercise.voicings ?? []
    case 'levels':
      return [exercise.level]
    case 'positions':
      return [exercisePosition(exercise)]
  }
}

const VOCABULARY: { [Facet in Exclude<ExerciseFacet, 'levels'>]: readonly string[] } = {
  areas: EXERCISE_AREAS,
  styles: EXERCISE_STYLES,
  contexts: EXERCISE_CONTEXTS,
  techniques: EXERCISE_TECHNIQUES,
  feels: EXERCISE_FEELS,
  voicings: EXERCISE_VOICINGS,
  positions: EXERCISE_POSITIONS,
}

/**
 * For every option of every facet, how many exercises choosing it would show:
 * counted with the rest of the query applied and that facet's own choices set
 * aside, so an option says what it would give, not what is left. Options no
 * exercise answers to are absent — an option that finds nothing is not offered.
 * A style's count includes the fundamentals it would bring along, when the
 * query brings them: the number on the chip is the number of rows it shows.
 */
export function facetCounts(exercises: readonly Exercise[], query: ExerciseQuery): FacetCounts {
  const counts = Object.fromEntries(EXERCISE_FACETS.map((facet) => [facet, new Map<string | number, number>()])) as Record<
    ExerciseFacet,
    Map<string | number, number>
  >
  for (const facet of EXERCISE_FACETS) {
    for (const exercise of exercises) {
      if (!matches(exercise, query, facet)) continue
      for (const value of valuesOf(exercise, facet)) counts[facet].set(value, (counts[facet].get(value) ?? 0) + 1)
    }
    if (facet === 'styles' && query.fundamentals) {
      const fundamentals = exercises.filter((exercise) => !exercise.styles?.length && matches(exercise, query, 'styles')).length
      for (const [style, count] of counts.styles) counts.styles.set(style, count + fundamentals)
    }
    // Maps keep insertion order; options read in vocabulary order, levels ascending.
    const order = facet === 'levels' ? [...counts.levels.keys()].sort((a, b) => Number(a) - Number(b)) : VOCABULARY[facet]
    counts[facet] = new Map(order.filter((value) => counts[facet].has(value)).map((value) => [value, counts[facet].get(value) as number]))
  }
  return counts as FacetCounts
}

/** The query with one value of one facet switched on or off. */
export function toggleFacetValue<Facet extends ExerciseFacet>(
  query: ExerciseQuery,
  facet: Facet,
  value: FacetOptions[Facet][number],
): ExerciseQuery {
  const chosen = query[facet] as readonly (string | number)[]
  const next = chosen.includes(value) ? chosen.filter((other) => other !== value) : [...chosen, value]
  return { ...query, [facet]: next }
}
