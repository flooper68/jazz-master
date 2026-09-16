import type { NoteHead } from './rhythm'

export { LINE_GAP, HALF_GAP } from './metrics'

/**
 * Hand-drawn music glyphs as SVG, sized against a staff line gap. They are
 * deliberately simple strokes and shapes rather than a music font: no
 * asset to load, every colour a theme token.
 */

/** A treble clef whose curl wraps the G line at `gLineY`. */
export function TrebleClef({ x, gLineY }: { x: number; gLineY: number }) {
  // Drawn relative to the G line; the staff spans -27..+9 around it.
  const d = [
    `M ${x + 10} ${gLineY - 42}`,
    `C ${x + 17} ${gLineY - 36}, ${x + 16} ${gLineY - 26}, ${x + 10} ${gLineY - 19}`,
    `C ${x + 5} ${gLineY - 13}, ${x + 1} ${gLineY - 6}, ${x + 3} ${gLineY + 1}`,
    `C ${x + 5} ${gLineY + 8}, ${x + 14} ${gLineY + 9}, ${x + 16.5} ${gLineY + 3}`,
    `C ${x + 19} ${gLineY - 3}, ${x + 14} ${gLineY - 8}, ${x + 9.5} ${gLineY - 6}`,
    `C ${x + 5.5} ${gLineY - 4}, ${x + 5.5} ${gLineY + 1}, ${x + 9} ${gLineY + 1.5}`,
    `M ${x + 10} ${gLineY - 42}`,
    `L ${x + 12} ${gLineY + 17}`,
    `C ${x + 12.5} ${gLineY + 22}, ${x + 5} ${gLineY + 23}, ${x + 5} ${gLineY + 18.5}`,
  ].join(' ')
  return (
    <path
      d={d}
      fill="none"
      className="stroke-fg"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

export function Accidental({ kind, x, y }: { kind: -1 | 0 | 1; x: number; y: number }) {
  if (kind === 1) {
    return (
      <g className="stroke-fg" strokeLinecap="round">
        <line x1={x - 1.6} y1={y - 6.5} x2={x - 1.6} y2={y + 6.5} strokeWidth={1} />
        <line x1={x + 1.6} y1={y - 7.5} x2={x + 1.6} y2={y + 5.5} strokeWidth={1} />
        <line x1={x - 4} y1={y - 1} x2={x + 4} y2={y - 3.2} strokeWidth={2.1} />
        <line x1={x - 4} y1={y + 3.6} x2={x + 4} y2={y + 1.4} strokeWidth={2.1} />
      </g>
    )
  }
  if (kind === -1) {
    return (
      <g>
        <line x1={x - 2.4} y1={y - 12} x2={x - 2.4} y2={y + 3.5} className="stroke-fg" strokeWidth={1.1} strokeLinecap="round" />
        <path
          d={`M ${x - 2.4} ${y - 4} C ${x + 1} ${y - 7}, ${x + 5} ${y - 4}, ${x + 3.5} ${y - 0.5} C ${x + 2.5} ${y + 1.5}, ${x} ${y + 3}, ${x - 2.4} ${y + 3.5}`}
          className="stroke-fg"
          fill="none"
          strokeWidth={1.6}
        />
      </g>
    )
  }
  return (
    <g className="stroke-fg" strokeLinecap="round">
      <line x1={x - 1.8} y1={y - 8} x2={x - 1.8} y2={y + 3} strokeWidth={1} />
      <line x1={x + 1.8} y1={y - 3} x2={x + 1.8} y2={y + 8} strokeWidth={1} />
      <line x1={x - 1.8} y1={y - 3.2} x2={x + 1.8} y2={y - 4.6} strokeWidth={2} />
      <line x1={x - 1.8} y1={y + 4.6} x2={x + 1.8} y2={y + 3.2} strokeWidth={2} />
    </g>
  )
}

export const HEAD_RX = 4.7
export const HEAD_RY = 3.3

export function NoteHeadGlyph({
  head,
  x,
  y,
  current,
}: {
  head: NoteHead
  x: number
  y: number
  current: boolean
}) {
  const fill = current ? 'fill-accent stroke-accent' : 'fill-fg stroke-fg'
  if (head === 'whole') {
    return (
      <g className={fill}>
        <ellipse cx={x} cy={y} rx={5.6} ry={3.4} fill="none" strokeWidth={1.4} />
        <ellipse cx={x} cy={y} rx={2.4} ry={2.9} transform={`rotate(-60 ${x} ${y})`} className="fill-panel" stroke="none" />
      </g>
    )
  }
  if (head === 'half') {
    return (
      <ellipse
        cx={x}
        cy={y}
        rx={HEAD_RX}
        ry={HEAD_RY}
        transform={`rotate(-22 ${x} ${y})`}
        fill="none"
        strokeWidth={1.7}
        className={fill}
      />
    )
  }
  return (
    <ellipse
      cx={x}
      cy={y}
      rx={HEAD_RX}
      ry={HEAD_RY}
      transform={`rotate(-22 ${x} ${y})`}
      className={fill}
      strokeWidth={0.6}
    />
  )
}

/** A flag hanging off a stem end; `direction` 1 for an up-stem (flag points down). */
export function Flag({ x, y, direction, current }: { x: number; y: number; direction: 1 | -1; current: boolean }) {
  const s = direction
  const d = `M ${x} ${y} C ${x + 0.5} ${y + 6 * s}, ${x + 7.5} ${y + 7 * s}, ${x + 6} ${y + 17 * s} C ${x + 7} ${y + 10 * s}, ${x + 2.5} ${y + 7 * s}, ${x} ${y + 5.5 * s} Z`
  return <path d={d} className={current ? 'fill-accent' : 'fill-fg'} />
}
