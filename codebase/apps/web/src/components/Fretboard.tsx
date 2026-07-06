import {
  displayAccidentals,
  STRING_NUMBERS,
  type FretRange,
  type GuitarString,
} from '@jazz-master/theory'

export interface FretboardHighlight {
  string: GuitarString
  fret: number
  /** Note name or degree; ASCII accidentals (`Bb`, `b7`) render as ♭/♯. */
  label?: string
  role?: 'root' | 'other'
}

interface FretboardProps {
  highlights?: FretboardHighlight[]
  /** Visible window; min 0 shows the nut and open strings. */
  fretRange?: FretRange
  /**
   * Describe the content, not the widget — descendant SVG text is hidden
   * from assistive tech, so "Cmaj7 tones, frets 0–5" beats "Fretboard".
   */
  'aria-label'?: string
}

const FRET_W = 56
const STRING_GAP = 24
const PAD_X = 28
const PAD_Y = 20
const DOT_R = 9
const SINGLE_MARKER_FRETS = [3, 5, 7, 9, 15, 17, 19, 21]
const DOUBLE_MARKER_FRETS = [12, 24]

const ROLE_FILL = { root: 'fill-amber-500', other: 'fill-zinc-200' }

/** y of a string line; tab convention — string 1 (high E) on top. */
function stringY(string: GuitarString): number {
  return PAD_Y + (string - 1) * STRING_GAP
}

export function Fretboard({
  highlights = [],
  fretRange = { min: 0, max: 12 },
  'aria-label': ariaLabel = 'Fretboard',
}: FretboardProps) {
  const { min, max } = fretRange
  const hasNut = min === 0
  // With the nut shown, fret 0 is the open-string area, not a span.
  const firstSpanFret = hasNut ? 1 : min
  const spanCount = Math.max(max - firstSpanFret + 1, 0)
  const x0 = PAD_X
  const width = x0 + spanCount * FRET_W + PAD_X
  const height = 2 * PAD_Y + (STRING_NUMBERS.length - 1) * STRING_GAP
  const yTop = stringY(1)
  const yBottom = stringY(6)
  const yMid = (yTop + yBottom) / 2

  const fretCenterX = (fret: number) =>
    fret === 0 ? x0 - 14 : x0 + (fret - firstSpanFret + 0.5) * FRET_W

  const inSpan = (fret: number) => fret >= firstSpanFret && fret <= max

  const visible = highlights.filter(
    ({ fret }) => fret >= min && fret <= max && (fret > 0 || hasNut),
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
    >
      {/* fret wires; the leftmost is the nut when the window starts at 0 */}
      {Array.from({ length: spanCount + 1 }, (_, i) => (
        <line
          key={i}
          x1={x0 + i * FRET_W}
          y1={yTop}
          x2={x0 + i * FRET_W}
          y2={yBottom}
          className={hasNut && i === 0 ? 'stroke-zinc-300' : 'stroke-zinc-600'}
          strokeWidth={hasNut && i === 0 ? 5 : 1.5}
        />
      ))}
      {STRING_NUMBERS.map((s) => (
        <line
          key={s}
          x1={x0}
          y1={stringY(s)}
          x2={x0 + spanCount * FRET_W}
          y2={stringY(s)}
          className="stroke-zinc-500"
          strokeWidth={0.75 + s * 0.25}
        />
      ))}
      {SINGLE_MARKER_FRETS.filter(inSpan).map((f) => (
        <circle
          key={f}
          data-marker={f}
          cx={fretCenterX(f)}
          cy={yMid}
          r={5}
          className="fill-zinc-700"
        />
      ))}
      {DOUBLE_MARKER_FRETS.filter(inSpan).map((f) => (
        <g key={f} data-marker={f}>
          <circle
            cx={fretCenterX(f)}
            cy={yMid - STRING_GAP}
            r={5}
            className="fill-zinc-700"
          />
          <circle
            cx={fretCenterX(f)}
            cy={yMid + STRING_GAP}
            r={5}
            className="fill-zinc-700"
          />
        </g>
      ))}
      {!hasNut && (
        <text
          x={fretCenterX(min)}
          y={height - 2}
          textAnchor="middle"
          fontSize={11}
          className="fill-zinc-400"
        >
          {min}fr
        </text>
      )}
      {visible.map(({ string, fret, label, role = 'other' }) => (
        <g
          key={`${string}-${fret}`}
          data-string={string}
          data-fret={fret}
          data-role={role}
        >
          <circle
            cx={fretCenterX(fret)}
            cy={stringY(string)}
            r={DOT_R}
            className={ROLE_FILL[role]}
          />
          {label && (
            <text
              x={fretCenterX(fret)}
              y={stringY(string)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fontWeight={600}
              className="fill-zinc-950"
            >
              {displayAccidentals(label)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
