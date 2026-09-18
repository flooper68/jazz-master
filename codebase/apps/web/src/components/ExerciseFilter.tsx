import { useEffect, useId, useRef, useState } from 'react'
import {
  activeFilterCount,
  EVERYTHING,
  EXERCISE_AREAS,
  EXERCISE_CONTEXTS,
  EXERCISE_FEELS,
  EXERCISE_POSITIONS,
  EXERCISE_STYLES,
  EXERCISE_TECHNIQUES,
  EXERCISE_VOICINGS,
  facetCounts,
  styleFamily,
  type Exercise,
  type ExerciseFacet,
  type ExercisePosition,
  type ExerciseQuery,
  type ExerciseStyle,
  type FacetOptions,
} from '../content'
import { AREA_LABELS } from './areaLabels'
import { CONTEXT_LABELS, FEEL_LABELS, STYLE_LABELS, TECHNIQUE_LABELS, VOICING_LABELS } from './facetLabels'
import { Select, type SelectOption } from './ui/Select'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

const POSITION_LABELS: Record<ExercisePosition, string> = {
  open: 'Open position',
  low: 'Low on the neck',
  mid: 'Middle of the neck',
  high: 'High on the neck',
  shifting: 'Along the neck',
}

/** What an option of a facet is called on the page. A child style carries its family: `Jazz › Bebop`. */
function optionLabel(facet: ExerciseFacet, value: string | number): string {
  switch (facet) {
    case 'areas':
      return AREA_LABELS[value as FacetOptions['areas'][number]]
    case 'styles': {
      const style = value as ExerciseStyle
      const family = styleFamily(style)
      return family === style ? STYLE_LABELS[style] : `${STYLE_LABELS[family]} › ${STYLE_LABELS[style]}`
    }
    case 'contexts':
      return CONTEXT_LABELS[value as FacetOptions['contexts'][number]]
    case 'techniques':
      return TECHNIQUE_LABELS[value as FacetOptions['techniques'][number]]
    case 'feels':
      return FEEL_LABELS[value as FacetOptions['feels'][number]]
    case 'voicings':
      return VOICING_LABELS[value as FacetOptions['voicings'][number]]
    case 'levels':
      return `Level ${value}`
    case 'positions':
      return POSITION_LABELS[value as ExercisePosition]
  }
}

/** The order a facet's options read: its vocabulary's; levels count up. */
const ORDER: { [Facet in Exclude<ExerciseFacet, 'levels'>]: readonly string[] } = {
  areas: EXERCISE_AREAS,
  styles: EXERCISE_STYLES,
  contexts: EXERCISE_CONTEXTS,
  techniques: EXERCISE_TECHNIQUES,
  feels: EXERCISE_FEELS,
  voicings: EXERCISE_VOICINGS,
  positions: EXERCISE_POSITIONS,
}

/** One select per category, in the order they read across the row. */
const CATEGORIES: readonly { facet: ExerciseFacet; label: string; any: string }[] = [
  { facet: 'styles', label: 'Style', any: 'Any style' },
  { facet: 'areas', label: 'Area', any: 'Any area' },
  { facet: 'levels', label: 'Level', any: 'Any level' },
  { facet: 'contexts', label: 'Harmony', any: 'Any harmony' },
  { facet: 'techniques', label: 'Technique', any: 'Any technique' },
  { facet: 'feels', label: 'Feel', any: 'Any feel' },
  { facet: 'voicings', label: 'Voicing', any: 'Any voicing' },
  { facet: 'positions', label: 'On the neck', any: 'Anywhere on the neck' },
]

/** The select's value for nothing chosen. */
const ANY = ''

interface ExerciseFilterProps {
  /** Everything there is to find; counts are read from it. */
  exercises: readonly Exercise[]
  query: ExerciseQuery
  onChange: (query: ExerciseQuery) => void
}

/** Long enough that a word arrives whole, short enough to feel immediate. */
const SEARCH_SETTLES_MS = 250

/**
 * Finding exercises: a search box and a select per category — style, area,
 * level, harmony, technique, feel, voicing, where on the neck. One choice
 * per category; every option says how many exercises it would show, and
 * one that would show none is not offered.
 */
export function ExerciseFilter({ exercises, query, onChange }: ExerciseFilterProps) {
  const ids = { search: useId() }
  const counts = facetCounts(exercises, query)

  // What is typed is held here and handed on once it settles: the owner of the query may keep it in the URL, and
  // browsers refuse a history entry rewritten on every keystroke. A text changed from outside — cleared, or a
  // link followed — replaces what is typed.
  const [typed, setTyped] = useState(query.text)
  const [heard, setHeard] = useState(query.text)
  if (query.text !== heard) {
    setHeard(query.text)
    setTyped(query.text)
  }
  const latest = useRef({ query, onChange })
  useEffect(() => {
    latest.current = { query, onChange }
  })
  useEffect(() => {
    if (typed === latest.current.query.text) return
    const timer = setTimeout(() => latest.current.onChange({ ...latest.current.query, text: typed }), SEARCH_SETTLES_MS)
    return () => clearTimeout(timer)
  }, [typed])

  function optionsOf(facet: ExerciseFacet, any: string): SelectOption<string>[] {
    const count = counts[facet] as ReadonlyMap<string | number, number>
    const chosen = query[facet] as readonly (string | number)[]
    const values: readonly (string | number)[] =
      facet === 'levels' ? [...count.keys()].map(Number).sort((a, b) => a - b) : ORDER[facet]
    return [
      { value: ANY, label: any },
      // A chosen value stays on offer even when the rest of the query has emptied it, so it can be switched off here.
      ...values
        .filter((value) => (count.get(value) ?? 0) > 0 || chosen.includes(value))
        .map((value) => ({ value: String(value), label: `${optionLabel(facet, value)} · ${count.get(value) ?? 0}` })),
    ]
  }

  function choose(facet: ExerciseFacet, value: string) {
    const next = value === ANY ? [] : [facet === 'levels' ? Number(value) : value]
    onChange({ ...query, [facet]: next })
  }

  return (
    <div role="search" aria-label="Find exercises">
      <label htmlFor={ids.search} className="sr-only">Search exercises</label>
      <input
        id={ids.search}
        type="search"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        // Inside a form — the routine editor — Enter here would submit it; searching is not saving.
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault()
        }}
        placeholder="Search — dorian, ii–V–I, bends…"
        className="w-full rounded-lg border border-line bg-field px-2.5 py-1.5 text-sm text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
      />

      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-2">
        {CATEGORIES.map(({ facet, label, any }) => {
          const options = optionsOf(facet, any)
          // A category with nothing to choose from is not shown: the rest of the query has emptied it.
          if (options.length === 1) return null
          const chosen = query[facet] as readonly (string | number)[]
          return (
            <div key={facet} className="min-w-0 grow basis-40">
              <span aria-hidden="true" className="mb-0.5 block text-[11px] font-medium text-muted">{label}</span>
              <Select
                options={options}
                value={chosen.length > 0 ? String(chosen[0]) : ANY}
                onChange={(value) => choose(facet, value)}
                aria-label={label}
                compact
              />
            </div>
          )
        })}
      </div>

      {(query.styles.length > 0 || activeFilterCount(query) > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {query.styles.length > 0 && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-fg-2">
              <input
                type="checkbox"
                checked={query.fundamentals}
                onChange={(event) => onChange({ ...query, fundamentals: event.target.checked })}
                className="h-3.5 w-3.5 accent-fg"
              />
              Fundamentals too — the scales and drills every style is built on
            </label>
          )}
          {activeFilterCount(query) > 0 && (
            <button
              type="button"
              onClick={() => onChange(EVERYTHING)}
              className={`cursor-pointer rounded px-1 text-muted underline underline-offset-2 hover:text-fg ${FOCUS}`}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
