import { useEffect, useId, useRef, useState } from 'react'
import {
  activeFilterCount,
  EVERYTHING,
  EXERCISE_FACETS,
  EXERCISE_STYLES,
  facetCounts,
  STYLE_FAMILIES,
  styleFamily,
  toggleFacetValue,
  type Exercise,
  type ExerciseFacet,
  type ExercisePosition,
  type ExerciseQuery,
  type FacetOptions,
} from '../content'
import { AREA_LABELS } from './areaLabels'
import { CONTEXT_LABELS, FEEL_LABELS, STYLE_LABELS, TECHNIQUE_LABELS, VOICING_LABELS } from './facetLabels'
import { CloseIcon, SlidersIcon } from './icons'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const CHIP = `inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${FOCUS}`
const CHIP_OFF = 'border-line bg-panel text-fg-2 hover:border-line-strong hover:text-fg'
const CHIP_ON = 'border-fg bg-fg text-panel'

const POSITION_LABELS: Record<ExercisePosition, string> = {
  open: 'Open position',
  low: 'Low on the neck',
  mid: 'Middle of the neck',
  high: 'High on the neck',
  shifting: 'Along the neck',
}

/** What an option of a facet is called on the page. */
function optionLabel(facet: ExerciseFacet, value: string | number): string {
  switch (facet) {
    case 'areas':
      return AREA_LABELS[value as FacetOptions['areas'][number]]
    case 'styles':
      return STYLE_LABELS[value as FacetOptions['styles'][number]]
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

/** The facets behind the Filters button, in the order they read; style has its own row above. */
const PANEL_FACETS: readonly { facet: Exclude<ExerciseFacet, 'styles'>; legend: string }[] = [
  { facet: 'areas', legend: 'Area' },
  { facet: 'levels', legend: 'Level' },
  { facet: 'contexts', legend: 'Harmony' },
  { facet: 'techniques', legend: 'Technique' },
  { facet: 'feels', legend: 'Feel' },
  { facet: 'voicings', legend: 'Voicing' },
  { facet: 'positions', legend: 'On the neck' },
]

interface ExerciseFilterProps {
  /** Everything there is to find; counts are read from it. */
  exercises: readonly Exercise[]
  query: ExerciseQuery
  onChange: (query: ExerciseQuery) => void
}

/** Long enough that a word arrives whole, short enough to feel immediate. */
const SEARCH_SETTLES_MS = 250

/**
 * Finding exercises: a search box, the styles of music, and the rest of the
 * facets behind a button. Every option says how many exercises it would
 * show, and one that would show none is not offered.
 */
export function ExerciseFilter({ exercises, query, onChange }: ExerciseFilterProps) {
  const ids = { search: useId(), panel: useId(), style: useId() }
  const counts = facetCounts(exercises, query)
  const panelFacets = PANEL_FACETS
  const chosenInPanel = panelFacets.reduce((total, { facet }) => total + query[facet].length, 0)
  // Open from the start when the URL arrives with something chosen in it.
  const [open, setOpen] = useState(chosenInPanel > 0)

  // A chosen style stays in the row even when the rest of the query has emptied it, so it can be switched off there.
  const families = STYLE_FAMILIES.filter((family) => counts.styles.has(family) || query.styles.includes(family))
  // The children of every family in play: one chosen itself, or through one of its children.
  const familiesInPlay = new Set(query.styles.map(styleFamily))
  const children = EXERCISE_STYLES.filter(
    (style) => style.includes('/') && familiesInPlay.has(styleFamily(style)) && (counts.styles.has(style) || query.styles.includes(style)),
  )
  const active = EXERCISE_FACETS.flatMap((facet) =>
    (query[facet] as readonly (string | number)[]).map((value) => ({ facet, value })),
  )

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

  function toggle(facet: ExerciseFacet, value: string | number) {
    onChange(toggleFacetValue(query, facet, value as never))
  }

  function chips(facet: ExerciseFacet, values: readonly (string | number)[]) {
    const chosen = query[facet] as readonly (string | number)[]
    return values.map((value) => {
      const count = (counts[facet] as ReadonlyMap<string | number, number>).get(value) ?? 0
      return (
        <button
          key={value}
          type="button"
          aria-pressed={chosen.includes(value)}
          aria-label={`${optionLabel(facet, value)}, ${count} ${count === 1 ? 'exercise' : 'exercises'}`}
          onClick={() => toggle(facet, value)}
          className={`${CHIP} ${chosen.includes(value) ? CHIP_ON : CHIP_OFF}`}
        >
          {optionLabel(facet, value)}
          <span aria-hidden="true" className="tabular-nums opacity-60">{count}</span>
        </button>
      )
    })
  }

  return (
    <div role="search" aria-label="Find exercises">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 basis-56">
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
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={ids.panel}
          onClick={() => setOpen((current) => !current)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm font-medium text-fg hover:border-line-strong ${FOCUS}`}
        >
          <SlidersIcon />
          Filters
          {chosenInPanel > 0 && <span className="rounded-full bg-fg px-1.5 text-[11px] text-panel tabular-nums">{chosenInPanel}</span>}
        </button>
      </div>

      {families.length > 0 && (
        // A group, not a fieldset: a legend names form controls, and these are toggle buttons.
        <div role="group" aria-labelledby={ids.style} className="mt-2.5">
          <span id={ids.style} className="sr-only">Style</span>
          <div className="flex flex-wrap items-center gap-1.5">{chips('styles', families)}</div>
          {children.length > 0 && <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-3">{chips('styles', children)}</div>}
          {query.styles.length > 0 && (
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-fg-2">
              <input
                type="checkbox"
                checked={query.fundamentals}
                onChange={(event) => onChange({ ...query, fundamentals: event.target.checked })}
                className="h-3.5 w-3.5 accent-fg"
              />
              Fundamentals too — the scales and drills every style is built on
            </label>
          )}
        </div>
      )}

      <div id={ids.panel} hidden={!open} className="mt-3 space-y-3 rounded-2xl border border-line bg-panel p-3.5">
        {panelFacets.map(({ facet, legend }) => {
          const values = [...counts[facet].keys()]
          // A chosen value stays on offer even when the rest of the query has emptied it, so it can be switched off here.
          const offered = [...values, ...(query[facet] as readonly (string | number)[]).filter((value) => !values.includes(value as never))]
          if (offered.length === 0) return null
          return (
            <div key={facet} role="group" aria-labelledby={`${ids.panel}-${facet}`}>
              <span id={`${ids.panel}-${facet}`} className="text-xs font-medium text-muted">{legend}</span>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{chips(facet, offered)}</div>
            </div>
          )
        })}
      </div>

      {activeFilterCount(query) > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">Showing</span>
          {active.map(({ facet, value }) => (
            <button
              key={`${facet}-${value}`}
              type="button"
              onClick={() => toggle(facet, value)}
              aria-label={`Remove ${optionLabel(facet, value)}`}
              className={`${CHIP} ${CHIP_OFF} py-0.5`}
            >
              {optionLabel(facet, value)}
              <CloseIcon />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(EVERYTHING)}
            className={`cursor-pointer rounded px-1 text-muted underline underline-offset-2 hover:text-fg ${FOCUS}`}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
