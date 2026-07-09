import { displayAccidentals, noteName } from '@jazz-master/theory'
import { useEffect, useId, useRef, useState } from 'react'
import type { NotationMeasure } from '../content/rhythm'
import type { NotationDisplayMode } from '../appData/preferences'
import { NOTATION_DISPLAY_LABELS } from './notationDisplay'
import type { NotationSize } from './notationRender'

export interface NotationProps {
  /**
   * Derived measures for the exercise (see `deriveRhythm`). Compared by
   * content, not identity — callers may derive inline on every render
   * without triggering VexFlow re-layouts.
   */
  measures: readonly NotationMeasure[]
  /** Which systems to draw. Defaults to the aligned staff + TAB pair. */
  displayMode?: NotationDisplayMode
  /** Focus mode allows more natural scaling than the inline runner card. */
  size?: NotationSize
  /** Defaults to the spelled note sequence. */
  'aria-label'?: string
}

/** Measures are plain data, so a JSON signature is a stable content key. */
function contentKey(
  measures: readonly NotationMeasure[],
  displayMode: NotationDisplayMode,
  size: NotationSize,
): string {
  return JSON.stringify({ measures, displayMode, size })
}

/**
 * Staff + tablature for an exercise's resolved notes. The VexFlow-backed
 * renderer arrives via dynamic import inside the effect (external
 * synchronization: the score is imperative SVG owned by VexFlow, and the
 * library must stay out of the initial /app chunk — ADR-010).
 */
export function Notation({
  measures,
  displayMode = 'both',
  size = 'inline',
  'aria-label': ariaLabel,
}: NotationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedKeyRef = useRef<string | null>(null)
  const descriptionId = useId()
  // 'ready' sticks: content changes redraw in place, no placeholder flash.
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const key = contentKey(measures, displayMode, size)
    if (key === renderedKeyRef.current) return
    let cancelled = false
    import('./notationRender')
      .then(({ renderNotation }) => {
        if (cancelled) return
        renderNotation(container, measures, { displayMode, size })
        renderedKeyRef.current = key
        setStatus('ready')
      })
      .catch((error: unknown) => {
        // Loud beats a silently blank score: a rejection here is a broken
        // chunk load or a spelling/position mismatch (stavePitch throws).
        console.error('Notation render failed', error)
        if (!cancelled) setStatus('failed')
      })
    return () => {
      cancelled = true
    }
  }, [displayMode, measures, size])

  if (measures.length === 0) return null

  const spelledSequence = measures
    .flatMap((measure) => measure.notes)
    .map(({ position }) => displayAccidentals(noteName(position.note)))
    .join(', ')

  return (
    <div
      role="img"
      aria-label={
        ariaLabel ??
        `${NOTATION_DISPLAY_LABELS[displayMode]}: ${spelledSequence}`
      }
      aria-describedby={ariaLabel ? descriptionId : undefined}
      aria-busy={status === 'loading'}
      className="text-zinc-100"
    >
      {ariaLabel && (
        <p id={descriptionId} className="sr-only">
          {NOTATION_DISPLAY_LABELS[displayMode]}: {spelledSequence}
        </p>
      )}
      {/* The score pops in only after the lazy VexFlow chunk loads (INS-029);
          give sighted users feedback instead of a blank gap meanwhile — and a
          terminal message on failure, never an eternal "loading". */}
      {status === 'loading' && (
        <p className="py-4 text-sm text-zinc-400">Loading notation…</p>
      )}
      {status === 'failed' && (
        <p className="py-4 text-sm text-zinc-400">Notation couldn’t load.</p>
      )}
      <div ref={containerRef} />
    </div>
  )
}
