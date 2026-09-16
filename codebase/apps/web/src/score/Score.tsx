import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { TabNote } from '../content'
import type { LoopRegion } from '../player/plan'
import { layoutScore, type ScoreLayout } from './layout'
import { LINE_GAP, NOTATION_ABOVE, NOTATION_HEIGHT, TAB_HEIGHT, TAB_LINES_HEIGHT } from './metrics'
import { NotationStaff } from './NotationStaff'
import { notationInset, resolveKey } from './notation'
import { TabStaff } from './TabStaff'

/**
 * The score: tab, notation, or both on one time axis, with the playback
 * cursor, the loop region and a rail of bar numbers. The cursor moves
 * imperatively through `ScoreHandle` (every animation frame is too often
 * for React state), while the current-note highlight is ordinary state.
 *
 * Interactions: press on a staff to seek (snapped to the nearest note);
 * drag to scrub; press or drag on the rail to loop a bar or a beat range.
 */

export type ScoreView = 'tab' | 'notation' | 'both'

export interface ScoreHandle {
  /** Move the cursor to a beat; with `follow`, keep it in view. */
  moveCursor(beat: number, follow: boolean): void
}

export interface ScoreProps {
  notes: readonly TabNote[]
  beatsPerBar: number
  keyName?: string
  view: ScoreView
  currentIndex: number | null
  loop: LoopRegion | null
  /** Show the cursor at all (hidden before the first play). */
  cursorVisible: boolean
  onSeek?: (beat: number) => void
  onLoopChange?: (loop: LoopRegion | null) => void
  'aria-label': string
  /** Extra classes for the scroll container (the canvas). */
  className?: string
  /** Room kept clear above and below the staves, for chrome floating over the canvas. */
  contentInset?: { top: number; bottom: number }
}

const RAIL_HEIGHT = 24
const STAFF_GAP = 22
const TAB_INSET = 30

interface Bands {
  notationTop: number | null
  tabTop: number | null
  bodyTop: number
  bodyBottom: number
  height: number
}

function bands(view: ScoreView): Bands {
  let y = RAIL_HEIGHT + 4
  let notationTop: number | null = null
  let tabTop: number | null = null
  if (view !== 'tab') {
    notationTop = y + NOTATION_ABOVE
    y += NOTATION_HEIGHT
  }
  if (view !== 'notation') {
    if (view === 'both') y += STAFF_GAP - 8
    tabTop = y + 8
    y += TAB_HEIGHT
  }
  return { notationTop, tabTop, bodyTop: RAIL_HEIGHT, bodyBottom: y, height: y + 6 }
}

export const Score = forwardRef<ScoreHandle, ScoreProps>(function Score(
  {
    notes,
    beatsPerBar,
    keyName,
    view,
    currentIndex,
    loop,
    cursorVisible,
    onSeek,
    onLoopChange,
    'aria-label': ariaLabel,
    className = '',
    contentInset = { top: 8, bottom: 8 },
  },
  ref,
) {
  const keySig = useMemo(() => resolveKey(keyName), [keyName])
  const layout = useMemo(
    () =>
      layoutScore(notes, {
        beatsPerBar,
        leftInset: view === 'tab' ? TAB_INSET : notationInset(keySig),
      }),
    [notes, beatsPerBar, view, keySig],
  )
  const geometry = bands(view)
  const svgRef = useRef<SVGSVGElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<SVGGElement>(null)
  const [railDrag, setRailDrag] = useState<{ anchor: number; region: LoopRegion; moved: boolean } | null>(null)
  const scrubbing = useRef(false)

  useImperativeHandle(
    ref,
    () => ({
      moveCursor(beat, follow) {
        const x = layout.xOfBeat(beat)
        const cursor = cursorRef.current
        if (cursor) cursor.setAttribute('transform', `translate(${x} 0)`)
        const scroller = scrollRef.current
        if (!follow || !scroller) return
        const viewport = scroller.clientWidth
        if (viewport <= 0 || scroller.scrollWidth <= viewport) return
        const left = scroller.scrollLeft
        if (x < left + viewport * 0.12 || x > left + viewport * 0.78) {
          scroller.scrollTo({ left: Math.max(x - viewport * 0.25, 0), behavior: 'smooth' })
        }
      },
    }),
    [layout],
  )

  function localX(event: PointerEvent<SVGElement>): number {
    const rect = svgRef.current?.getBoundingClientRect()
    return event.clientX - (rect?.left ?? 0)
  }

  function snappedBeat(x: number): number {
    const beat = layout.beatOfX(x)
    let best = 0
    let bestDistance = Infinity
    for (const start of layout.starts) {
      const distance = Math.abs(start - beat)
      if (distance < bestDistance) {
        best = start
        bestDistance = distance
      }
    }
    return best
  }

  function onBodyPointerDown(event: PointerEvent<SVGRectElement>) {
    if (!onSeek || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    scrubbing.current = true
    onSeek(snappedBeat(localX(event)))
  }

  function onBodyPointerMove(event: PointerEvent<SVGRectElement>) {
    if (!scrubbing.current || !onSeek) return
    onSeek(snappedBeat(localX(event)))
  }

  function onBodyPointerUp(event: PointerEvent<SVGRectElement>) {
    scrubbing.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function railRegion(anchorBeat: number, beat: number): LoopRegion {
    const startBeat = Math.floor(Math.min(anchorBeat, beat))
    const endBeat = Math.min(Math.max(Math.ceil(Math.max(anchorBeat, beat)), startBeat + 1), layout.totalBeats)
    return { startBeat, endBeat }
  }

  function barRegion(beat: number): LoopRegion {
    const bar = Math.floor(beat / beatsPerBar)
    return {
      startBeat: bar * beatsPerBar,
      endBeat: Math.min((bar + 1) * beatsPerBar, layout.totalBeats),
    }
  }

  function onRailPointerDown(event: PointerEvent<SVGRectElement>) {
    if (!onLoopChange || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const beat = Math.min(layout.beatOfX(localX(event)), layout.totalBeats - 1e-6)
    setRailDrag({ anchor: beat, region: railRegion(beat, beat), moved: false })
  }

  function onRailPointerMove(event: PointerEvent<SVGRectElement>) {
    if (!railDrag) return
    const beat = Math.min(layout.beatOfX(localX(event)), layout.totalBeats - 1e-6)
    setRailDrag({ ...railDrag, region: railRegion(railDrag.anchor, beat), moved: railDrag.moved || Math.abs(beat - railDrag.anchor) >= 0.5 })
  }

  function onRailPointerUp(event: PointerEvent<SVGRectElement>) {
    if (!railDrag) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const region = railDrag.moved ? railDrag.region : barRegion(railDrag.anchor)
    setRailDrag(null)
    onLoopChange?.(region)
  }

  const shownLoop = railDrag?.region ?? loop
  const loopX = shownLoop ? [layout.xOfBeat(shownLoop.startBeat), layout.xOfBeat(shownLoop.endBeat)] : null
  const barLineTop = geometry.notationTop ?? geometry.tabTop ?? 0
  const barLineBottom = geometry.tabTop !== null ? geometry.tabTop + TAB_LINES_HEIGHT : (geometry.notationTop ?? 0) + 4 * LINE_GAP

  return (
    <div
      ref={scrollRef}
      className={`overflow-x-auto overscroll-x-contain ${className}`}
      data-score-scroller
    >
      <div
        className="flex min-h-full w-max min-w-full items-center"
        style={{ padding: `${contentInset.top}px 24px ${contentInset.bottom}px` }}
      >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width} ${geometry.height}`}
        width={layout.width}
        height={geometry.height}
        role="img"
        aria-label={ariaLabel}
        className="block max-w-none select-none touch-none font-sans"
      >
        {loopX && (
          <rect
            x={loopX[0] - 10}
            y={0}
            width={loopX[1] - loopX[0] + 14}
            height={geometry.height}
            rx={6}
            className="fill-accent"
            opacity={0.14}
            data-loop-region
          />
        )}
        {/* Rail: bar numbers, and the surface loops are drawn on. */}
        <rect
          x={0}
          y={0}
          width={layout.width}
          height={RAIL_HEIGHT}
          fill="transparent"
          className="cursor-crosshair"
          onPointerDown={onRailPointerDown}
          onPointerMove={onRailPointerMove}
          onPointerUp={onRailPointerUp}
          onPointerCancel={onRailPointerUp}
          data-loop-rail
        />
        {layout.bars.map((bar) => (
          <text
            key={bar.index}
            x={bar.x + 3}
            y={RAIL_HEIGHT - 8}
            fontSize={10}
            fontWeight={600}
            className="pointer-events-none fill-muted"
          >
            {bar.index + 1}
          </text>
        ))}
        {loopX && (
          <g className="pointer-events-none fill-accent">
            <rect x={loopX[0] - 10} y={RAIL_HEIGHT - 5} width={loopX[1] - loopX[0] + 14} height={3} rx={1.5} />
            <polygon points={`${loopX[0] - 10},${RAIL_HEIGHT - 16} ${loopX[0] - 3},${RAIL_HEIGHT - 10} ${loopX[0] - 10},${RAIL_HEIGHT - 4}`} />
            <polygon points={`${loopX[1] + 4},${RAIL_HEIGHT - 16} ${loopX[1] - 3},${RAIL_HEIGHT - 10} ${loopX[1] + 4},${RAIL_HEIGHT - 4}`} />
          </g>
        )}
        {/* Bar lines span every staff shown. */}
        {layout.bars.map((bar) => (
          <line
            key={bar.index}
            x1={bar.x}
            x2={bar.x}
            y1={barLineTop}
            y2={barLineBottom}
            className="stroke-line-strong"
            strokeWidth={bar.index === 0 ? 1.2 : 1}
          />
        ))}
        <line x1={layout.endX} x2={layout.endX} y1={barLineTop} y2={barLineBottom} className="stroke-fg" strokeWidth={1.2} />
        <line x1={layout.endX + 3.5} x2={layout.endX + 3.5} y1={barLineTop} y2={barLineBottom} className="stroke-fg" strokeWidth={3} />
        {geometry.notationTop !== null && (
          <NotationStaff
            notes={notes}
            layout={layout}
            keySig={keySig}
            top={geometry.notationTop}
            currentIndex={currentIndex}
          />
        )}
        {geometry.tabTop !== null && (
          <TabStaff notes={notes} layout={layout} top={geometry.tabTop} currentIndex={currentIndex} />
        )}
        {/* The seek/scrub surface sits over the staves but under the cursor. */}
        <rect
          x={0}
          y={geometry.bodyTop}
          width={layout.width}
          height={geometry.bodyBottom - geometry.bodyTop}
          fill="transparent"
          className={onSeek ? 'cursor-pointer' : undefined}
          onPointerDown={onBodyPointerDown}
          onPointerMove={onBodyPointerMove}
          onPointerUp={onBodyPointerUp}
          onPointerCancel={onBodyPointerUp}
          data-seek-surface
        />
        <g
          ref={cursorRef}
          data-cursor
          className="pointer-events-none"
          style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 200ms' }}
        >
          <rect x={-7} y={RAIL_HEIGHT - 2} width={14} height={geometry.height - RAIL_HEIGHT + 2} className="fill-accent" opacity={0.16} rx={4} />
          <line x1={0} x2={0} y1={RAIL_HEIGHT - 2} y2={geometry.height} className="stroke-accent" strokeWidth={2} />
          <polygon points={`-6,${RAIL_HEIGHT - 12} 6,${RAIL_HEIGHT - 12} 0,${RAIL_HEIGHT - 2}`} className="fill-accent" />
        </g>
      </svg>
      </div>
    </div>
  )
})

export type { ScoreLayout }
