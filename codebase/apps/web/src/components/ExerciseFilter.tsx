import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  activeFilterCount,
  EVERYTHING,
  EXERCISE_AREAS,
  EXERCISE_CONTEXTS,
  EXERCISE_FACETS,
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
import { CloseIcon } from './icons'
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

const CATEGORY_LABELS: Record<ExerciseFacet, string> = {
  styles: 'Style',
  areas: 'Area',
  levels: 'Level',
  voicings: 'Voicing',
  contexts: 'Harmony',
  techniques: 'Technique',
  feels: 'Feel',
  positions: 'On the neck',
}

const ANY_LABELS: Record<ExerciseFacet, string> = {
  styles: 'Any style',
  areas: 'Any area',
  levels: 'Any level',
  voicings: 'Any voicing',
  contexts: 'Any harmony',
  techniques: 'Any technique',
  feels: 'Any feel',
  positions: 'Anywhere on the neck',
}

/**
 * The categories with a select of their own: the three every exercise has,
 * and voicing once the area is chords, which is the only area it describes.
 * Everything else is reached by typing, so the row stays short.
 */
function selectFacets(query: ExerciseQuery): ExerciseFacet[] {
  const always: ExerciseFacet[] = ['styles', 'areas', 'levels']
  return query.areas.includes('chords') ? [...always, 'voicings'] : always
}

/** The select's value for nothing chosen. */
const ANY = ''
/** Suggestions enough to choose from, few enough to read. */
const MOST_SUGGESTIONS = 8

interface ExerciseFilterProps {
  /** Everything there is to find; counts are read from it. */
  exercises: readonly Exercise[]
  query: ExerciseQuery
  onChange: (query: ExerciseQuery) => void
}

/** Long enough that a word arrives whole, short enough to feel immediate. */
const SEARCH_SETTLES_MS = 250

interface Suggestion {
  facet: ExerciseFacet
  value: string | number
  label: string
  count: number
}

/**
 * Finding exercises: a search box and a select for the few categories every
 * exercise has — style, area, level, and voicing once the area is chords.
 * The rest of the vocabulary is reached by typing: what is typed offers the
 * labels it matches, with the number each would show, and choosing one adds
 * it as a chip. Every option says what it would give, and one that would
 * give nothing is not offered.
 */
export function ExerciseFilter({ exercises, query, onChange }: ExerciseFilterProps) {
  const ids = { search: useId(), list: useId() }
  const counts = facetCounts(exercises, query)
  const inRow = selectFacets(query)
  // Everything not in the row is typed for, and shows as a chip once chosen.
  const typedFor = EXERCISE_FACETS.filter((facet) => !inRow.includes(facet))

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

  function valuesOf(facet: ExerciseFacet): readonly (string | number)[] {
    const count = counts[facet] as ReadonlyMap<string | number, number>
    return facet === 'levels' ? [...count.keys()].map(Number).sort((a, b) => a - b) : ORDER[facet]
  }

  function optionsOf(facet: ExerciseFacet): SelectOption<string>[] {
    const count = counts[facet] as ReadonlyMap<string | number, number>
    const chosen = query[facet] as readonly (string | number)[]
    return [
      { value: ANY, label: ANY_LABELS[facet] },
      // A chosen value stays on offer even when the rest of the query has emptied it, so it can be switched off here.
      ...valuesOf(facet)
        .filter((value) => (count.get(value) ?? 0) > 0 || chosen.includes(value))
        .map((value) => ({ value: String(value), label: `${optionLabel(facet, value)} · ${count.get(value) ?? 0}` })),
    ]
  }

  function choose(facet: ExerciseFacet, value: string) {
    onChange({ ...query, [facet]: value === ANY ? [] : [facet === 'levels' ? Number(value) : value] })
  }

  // What is typed offers the labels it matches, whole words first, and never one that would show nothing.
  const wanted = typed.trim().toLowerCase()
  const suggestions: Suggestion[] = wanted
    ? typedFor
        .flatMap((facet) => {
          const count = counts[facet] as ReadonlyMap<string | number, number>
          const chosen = query[facet] as readonly (string | number)[]
          return valuesOf(facet)
            .filter((value) => (count.get(value) ?? 0) > 0 && !chosen.includes(value))
            .map((value) => ({ facet, value, label: optionLabel(facet, value), count: count.get(value) ?? 0 }))
        })
        .filter(({ label }) => label.toLowerCase().includes(wanted))
        .sort((a, b) => Number(b.label.toLowerCase().startsWith(wanted)) - Number(a.label.toLowerCase().startsWith(wanted)))
        .slice(0, MOST_SUGGESTIONS)
    : []
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const open = suggestions.length > 0 && !dismissed
  const at = Math.min(active, suggestions.length - 1)

  function pick(suggestion: Suggestion) {
    // The label is now a chip, so the text it was typed into has done its work.
    setTyped('')
    setHeard('')
    setActive(0)
    onChange({ ...query, text: '', [suggestion.facet]: [suggestion.value] })
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Inside a form, Enter would submit it; searching is not saving.
    if (event.key === 'Enter') event.preventDefault()
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      pick(suggestions[at])
    } else if (event.key === 'Escape') {
      setDismissed(true)
    }
  }

  const chips = typedFor.flatMap((facet) =>
    (query[facet] as readonly (string | number)[]).map((value) => ({ facet, value })),
  )

  return (
    <div role="search" aria-label="Find exercises">
      <div className="relative">
        <label htmlFor={ids.search} className="sr-only">Search exercises</label>
        <input
          id={ids.search}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? ids.list : undefined}
          aria-activedescendant={open ? `${ids.list}-${at}` : undefined}
          aria-autocomplete="list"
          value={typed}
          onChange={(event) => {
            setTyped(event.target.value)
            setActive(0)
            setDismissed(false)
          }}
          onKeyDown={onSearchKeyDown}
          onBlur={() => setDismissed(true)}
          placeholder="Search — dorian, strumming, ii–V–I…"
          className="w-full rounded-lg border border-line bg-field px-2.5 py-1.5 text-sm text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg"
        />
        {open && (
          <ul
            id={ids.list}
            role="listbox"
            aria-label="Categories matching what you typed"
            className="absolute top-full right-0 left-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-panel p-1 shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.facet}-${suggestion.value}`}
                id={`${ids.list}-${index}`}
                role="option"
                aria-selected={index === at}
                onPointerMove={() => setActive(index)}
                // Before the blur that would close the list.
                onMouseDown={(event) => {
                  event.preventDefault()
                  pick(suggestion)
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm ${index === at ? 'bg-panel-2 text-fg' : 'text-fg-2'}`}
              >
                <span className="text-[11px] text-muted uppercase">{CATEGORY_LABELS[suggestion.facet]}</span>
                <span className="min-w-0 flex-1 truncate">{suggestion.label}</span>
                <span className="text-xs text-muted tabular-nums">{suggestion.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-2">
        {inRow.map((facet) => {
          const options = optionsOf(facet)
          // A category with nothing to choose from is not shown: the rest of the query has emptied it.
          if (options.length === 1) return null
          const chosen = query[facet] as readonly (string | number)[]
          return (
            <div key={facet} className="min-w-0 grow basis-40">
              <span aria-hidden="true" className="mb-0.5 block text-[11px] font-medium text-muted">{CATEGORY_LABELS[facet]}</span>
              <Select
                options={options}
                value={chosen.length > 0 ? String(chosen[0]) : ANY}
                onChange={(value) => choose(facet, value)}
                aria-label={CATEGORY_LABELS[facet]}
                compact
              />
            </div>
          )
        })}
      </div>

      {(chips.length > 0 || query.styles.length > 0 || activeFilterCount(query) > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map(({ facet, value }) => (
                <button
                  key={`${facet}-${value}`}
                  type="button"
                  onClick={() => choose(facet, ANY)}
                  aria-label={`Remove ${CATEGORY_LABELS[facet]}: ${optionLabel(facet, value)}`}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-panel py-0.5 pr-1.5 pl-2.5 font-medium text-fg-2 hover:border-line-strong hover:text-fg ${FOCUS}`}
                >
                  <span className="text-muted">{CATEGORY_LABELS[facet]}</span>
                  {optionLabel(facet, value)}
                  <CloseIcon />
                </button>
              ))}
            </div>
          )}
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
