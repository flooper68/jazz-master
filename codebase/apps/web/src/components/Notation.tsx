import { displayAccidentals, noteName } from '@jazz-master/theory'
import { useEffect, useRef, useState } from 'react'
import type { NotationMeasure } from '../content/rhythm'

export interface NotationProps {
  /**
   * Derived measures for the exercise (see `deriveRhythm`). Compared by
   * content, not identity — callers may derive inline on every render
   * without triggering VexFlow re-layouts.
   */
  measures: readonly NotationMeasure[]
  /** Defaults to the spelled note sequence. */
  'aria-label'?: string
}

/** Measures are plain data, so a JSON signature is a stable content key. */
function contentKey(measures: readonly NotationMeasure[]): string {
  return JSON.stringify(measures)
}

/**
 * Staff + tablature for an exercise's resolved notes. The VexFlow-backed
 * renderer arrives via dynamic import inside the effect (external
 * synchronization: the score is imperative SVG owned by VexFlow, and the
 * library must stay out of the initial /app chunk — ADR-010).
 */
export function Notation({
  measures,
  'aria-label': ariaLabel,
}: NotationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedKeyRef = useRef<string | null>(null)
  // 'ready' sticks: content changes redraw in place, no placeholder flash.
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const key = contentKey(measures)
    if (key === renderedKeyRef.current) return
    let cancelled = false
    import('./notationRender')
      .then(({ renderNotation }) => {
        if (cancelled) return
        renderNotation(container, measures)
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
  }, [measures])

  if (measures.length === 0) return null

  const spelledSequence = measures
    .flatMap((measure) => measure.notes)
    .map(({ position }) => displayAccidentals(noteName(position.note)))
    .join(', ')

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `Staff and tablature: ${spelledSequence}`}
      aria-busy={status === 'loading'}
      className="text-zinc-100"
    >
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
