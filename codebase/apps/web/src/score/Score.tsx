import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import type { TabNote } from '../content'
import type { LoopRegion } from '../player/plan'
import { layoutScore, type ScoreLayout, type SystemLayout } from './layout'
import { LINE_GAP, NOTATION_ABOVE, NOTATION_HEIGHT, TAB_HEIGHT, TAB_LINES_HEIGHT } from './metrics'
import { NotationStaff } from './NotationStaff'
import { notationInset, resolveKey } from './notation'
import { TabStaff } from './TabStaff'

/**
 * The score: tab, notation, or both, wrapped into lines that fit the width,
 * with the playback cursor, the loop region and a rail of bar numbers over
 * every line. The cursor moves imperatively through `ScoreHandle` (every
 * animation frame is too often for React state), while the current-note
 * highlight is ordinary state. While following playback the canvas scrolls
 * so the line being played sits in the middle of the visible area.
 *
 * Interactions: press on a staff to seek (snapped to the nearest note);
 * drag to scrub; press or drag on a rail to loop a bar or a beat range.
 */

export type ScoreView = 'tab' | 'notation' | 'both'

export interface ScoreHandle {
  /**
   * Move the cursor to a beat; with `follow`, keep its line centred in view.
   * `approach` (1 → 0) walks it in from the left edge of the line to the
   * beat — how the count-in shows itself.
   */
  moveCursor(beat: number, follow: boolean, approach?: number): void
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
  /** Room kept clear above and below the music, for chrome floating over the canvas. */
  contentInset?: { top: number; bottom: number }
  /** Width to wrap lines to; measured from the container when omitted. */
  availableWidth?: number
  /** Magnification of the whole score, 1 = engraved size. */
  zoom?: number
}

const RAIL_HEIGHT = 22
const STAFF_GAP = 16
const TAB_INSET = 30
const SIDE_PAD = 24
const FALLBACK_WIDTH = 960

interface Bands {
  notationTop: number | null
  tabTop: number | null
  bodyTop: number
  bodyBottom: number
  /** Height of one line (system) including its rail. */
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
  return { notationTop, tabTop, bodyTop: RAIL_HEIGHT, bodyBottom: y, height: y + 10 }
}

/** The container's inner width, kept current as it resizes. */
function useMeasuredWidth(ref: React.RefObject<HTMLDivElement | null>, override?: number): number {
  const [measured, setMeasured] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element || override !== undefined || typeof ResizeObserver === 'undefined') return
    const update = () => setMeasured(element.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, override])
  return override ?? (measured > 0 ? measured : FALLBACK_WIDTH)
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
    availableWidth,
    zoom = 1,
  },
  ref,
) {
  const keySig = useMemo(() => resolveKey(keyName), [keyName])
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerWidth = useMeasuredWidth(scrollRef, availableWidth)
  // The score is engraved at its natural size and magnified as a whole, so a
  // zoomed line wraps to what fits at that magnification.
  const unzoomedWidth = (containerWidth - 2 * SIDE_PAD) / zoom
  const layout = useMemo(
    () =>
      layoutScore(notes, {
        beatsPerBar,
        leftInset: view === 'tab' ? TAB_INSET : notationInset(keySig),
        availableWidth: Math.max(unzoomedWidth, 120),
      }),
    [notes, beatsPerBar, view, keySig, unzoomedWidth],
  )
  const geometry = bands(view)
  const systemHeight = geometry.height
  // A lone line keeps its own width so the canvas can centre it; wrapped lines fill the width.
  const svgWidth = layout.systems.length === 1 ? layout.width : Math.max(unzoomedWidth, layout.width)
  const svgHeight = layout.systems.length * systemHeight
  const svgRef = useRef<SVGSVGElement>(null)
  const cursorRef = useRef<SVGGElement>(null)
  const followedSystem = useRef<number | null>(null)
  const [railDrag, setRailDrag] = useState<{ anchor: number; region: LoopRegion; moved: boolean } | null>(null)
  const scrubbing = useRef(false)

  useImperativeHandle(
    ref,
    () => ({
      moveCursor(beat, follow, approach = 0) {
        const point = layout.xOfBeat(beat)
        const x = point.x - Math.min(Math.max(approach, 0), 1) * (point.x - 6)
        const cursor = cursorRef.current
        if (cursor) cursor.setAttribute('transform', `translate(${x} ${point.system * systemHeight})`)
        const scroller = scrollRef.current
        if (!follow || !scroller) {
          followedSystem.current = null
          return
        }
        if (followedSystem.current === point.system) return
        followedSystem.current = point.system
        // Centre the line between the chrome floating at the top and bottom.
        const viewport = scroller.clientHeight
        if (viewport <= 0 || scroller.scrollHeight <= viewport) return
        const visibleCentre = contentInset.top + (viewport - contentInset.top - contentInset.bottom) / 2
        const lineCentre = contentInset.top + (point.system + 0.5) * systemHeight * zoom
        scroller.scrollTo({ top: Math.max(lineCentre - visibleCentre, 0), behavior: 'smooth' })
      },
    }),
    [layout, systemHeight, zoom, contentInset.top, contentInset.bottom],
  )

  function localPoint(event: PointerEvent<SVGElement>): { x: number; system: number } {
    const rect = svgRef.current?.getBoundingClientRect()
    const x = (event.clientX - (rect?.left ?? 0)) / zoom
    const y = (event.clientY - (rect?.top ?? 0)) / zoom
    const system = Math.min(Math.max(Math.floor(y / systemHeight), 0), layout.systems.length - 1)
    return { x, system }
  }

  function snappedBeat(x: number, system: number): number {
    const beat = layout.beatOfPoint(x, system)
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
    const { x, system } = localPoint(event)
    onSeek(snappedBeat(x, system))
  }

  function onBodyPointerMove(event: PointerEvent<SVGRectElement>) {
    if (!scrubbing.current || !onSeek) return
    const { x, system } = localPoint(event)
    onSeek(snappedBeat(x, system))
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

  function railBeat(event: PointerEvent<SVGElement>): number {
    const { x, system } = localPoint(event)
    return Math.min(layout.beatOfPoint(x, system), layout.totalBeats - 1e-6)
  }

  function onRailPointerDown(event: PointerEvent<SVGRectElement>) {
    if (!onLoopChange || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const beat = railBeat(event)
    setRailDrag({ anchor: beat, region: railRegion(beat, beat), moved: false })
  }

  function onRailPointerMove(event: PointerEvent<SVGRectElement>) {
    if (!railDrag) return
    const beat = railBeat(event)
    setRailDrag({
      ...railDrag,
      region: railRegion(railDrag.anchor, beat),
      moved: railDrag.moved || Math.abs(beat - railDrag.anchor) >= 0.5,
    })
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
  const barLineTop = geometry.notationTop ?? geometry.tabTop ?? 0
  const barLineBottom =
    geometry.tabTop !== null ? geometry.tabTop + TAB_LINES_HEIGHT : (geometry.notationTop ?? 0) + 4 * LINE_GAP

  /** The part of the loop that falls on a line, as x bounds, or null. */
  function loopSpan(system: SystemLayout): [number, number] | null {
    if (!shownLoop) return null
    const start = Math.max(shownLoop.startBeat, system.startBeat)
    const end = Math.min(shownLoop.endBeat, system.endBeat)
    if (end <= start) return null
    const x1 = layout.xOfBeat(start).x
    // The end of a line belongs to the next line's x space; stop at this line's closing bar.
    const x2 = end >= system.endBeat ? system.endX : layout.xOfBeat(end).x
    return [x1, x2]
  }

  return (
    <div
      ref={scrollRef}
      className={`overflow-x-hidden overflow-y-auto overscroll-contain ${className}`}
      data-score-scroller
    >
      {/* Music shorter than the canvas sits just above its middle (the 2:3 spacers); taller music starts at the top. */}
      <div
        className="flex min-h-full flex-col items-center before:flex-2 after:flex-3"
        style={{ padding: `${contentInset.top}px ${SIDE_PAD}px ${contentInset.bottom}px` }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          role="img"
          aria-label={ariaLabel}
          className="block max-w-full select-none touch-none font-sans"
        >
          {layout.systems.map((system) => {
            const span = loopSpan(system)
            const loopStartsHere = shownLoop !== null && shownLoop.startBeat >= system.startBeat && shownLoop.startBeat < system.endBeat
            const loopEndsHere = shownLoop !== null && shownLoop.endBeat > system.startBeat && shownLoop.endBeat <= system.endBeat
            return (
              <g key={system.index} transform={`translate(0 ${system.index * systemHeight})`} data-system={system.index}>
                {span && (
                  <rect
                    x={span[0] - 10}
                    y={0}
                    width={span[1] - span[0] + 14}
                    height={systemHeight - 6}
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
                  width={svgWidth}
                  height={RAIL_HEIGHT}
                  fill="transparent"
                  className="cursor-crosshair"
                  onPointerDown={onRailPointerDown}
                  onPointerMove={onRailPointerMove}
                  onPointerUp={onRailPointerUp}
                  onPointerCancel={onRailPointerUp}
                  data-loop-rail
                />
                {system.bars.map((bar) => (
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
                {span && (
                  <g className="pointer-events-none fill-accent">
                    <rect x={span[0] - 10} y={RAIL_HEIGHT - 5} width={span[1] - span[0] + 14} height={3} rx={1.5} />
                    {loopStartsHere && (
                      <polygon points={`${span[0] - 10},${RAIL_HEIGHT - 16} ${span[0] - 3},${RAIL_HEIGHT - 10} ${span[0] - 10},${RAIL_HEIGHT - 4}`} />
                    )}
                    {loopEndsHere && (
                      <polygon points={`${span[1] + 4},${RAIL_HEIGHT - 16} ${span[1] - 3},${RAIL_HEIGHT - 10} ${span[1] + 4},${RAIL_HEIGHT - 4}`} />
                    )}
                  </g>
                )}
                {/* Bar lines span every staff shown. */}
                {system.bars.map((bar) => (
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
                {system.index === layout.systems.length - 1 ? (
                  <>
                    <line x1={system.endX} x2={system.endX} y1={barLineTop} y2={barLineBottom} className="stroke-fg" strokeWidth={1.2} />
                    <line x1={system.endX + 3.5} x2={system.endX + 3.5} y1={barLineTop} y2={barLineBottom} className="stroke-fg" strokeWidth={3} />
                  </>
                ) : (
                  <line x1={system.endX} x2={system.endX} y1={barLineTop} y2={barLineBottom} className="stroke-line-strong" strokeWidth={1} />
                )}
                {geometry.notationTop !== null && (
                  <NotationStaff
                    notes={notes}
                    layout={layout}
                    system={system}
                    keySig={keySig}
                    top={geometry.notationTop}
                    currentIndex={currentIndex}
                  />
                )}
                {geometry.tabTop !== null && (
                  <TabStaff notes={notes} layout={layout} system={system} top={geometry.tabTop} currentIndex={currentIndex} />
                )}
                {/* The seek/scrub surface sits over the staves but under the cursor. */}
                <rect
                  x={0}
                  y={geometry.bodyTop}
                  width={svgWidth}
                  height={geometry.bodyBottom - geometry.bodyTop}
                  fill="transparent"
                  className={onSeek ? 'cursor-pointer' : undefined}
                  onPointerDown={onBodyPointerDown}
                  onPointerMove={onBodyPointerMove}
                  onPointerUp={onBodyPointerUp}
                  onPointerCancel={onBodyPointerUp}
                  data-seek-surface
                />
              </g>
            )
          })}
          <g
            ref={cursorRef}
            data-cursor
            className="pointer-events-none"
            style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 200ms' }}
          >
            <rect x={-7} y={RAIL_HEIGHT - 2} width={14} height={systemHeight - RAIL_HEIGHT - 4} className="fill-accent" opacity={0.16} rx={4} />
            <line x1={0} x2={0} y1={RAIL_HEIGHT - 2} y2={systemHeight - 6} className="stroke-accent" strokeWidth={2} />
            <polygon points={`-6,${RAIL_HEIGHT - 12} 6,${RAIL_HEIGHT - 12} 0,${RAIL_HEIGHT - 2}`} className="fill-accent" />
          </g>
        </svg>
      </div>
    </div>
  )
})

export type { ScoreLayout }
