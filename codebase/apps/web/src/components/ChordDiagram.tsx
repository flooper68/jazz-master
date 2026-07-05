import { displayAccidentals } from './notation'

/** Per-string action: an absolute fret number (0 = open) or `'x'` (muted). */
export type GripFret = number | 'x'

type Finger = 0 | 1 | 2 | 3 | 4

export interface Grip {
  /** Written as guitarists write grips — low E (string 6) to high E: `x32000`. */
  frets: readonly [GripFret, GripFret, GripFret, GripFret, GripFret, GripFret]
  /** Aligned with `frets`; 0 = no finger number shown. */
  fingers?: readonly [Finger, Finger, Finger, Finger, Finger, Finger]
  /**
   * First fret of the diagram window. Derived when omitted: nut position if
   * the grip fits in the default window, else the lowest fretted fret.
   * Fretted notes below it throw — voicing data bugs should fail in tests,
   * not render corrupt diagrams.
   */
  baseFret?: number
}

interface ChordDiagramProps {
  grip: Grip
  /** Chord symbol above the diagram; ASCII accidentals (`Bb7`) render as ♭/♯. */
  label?: string
  'aria-label'?: string
}

const STRING_GAP = 20
const FRET_GAP = 26
const DOT_R = 7.5
const DEFAULT_FRET_COUNT = 4
// Symmetric padding keeps the grid centered; wide enough for the "12fr" label.
const PAD_X = 24
const TITLE_BASELINE = 14
const GRID_TOP = 36 // marker row sits between title and grid

const GRID_W = 5 * STRING_GAP

/** x of a string line; string 6 (low E) leftmost, as grip charts are read. */
function stringX(stringNumber: number): number {
  return PAD_X + (6 - stringNumber) * STRING_GAP
}

export function ChordDiagram({
  grip,
  label,
  'aria-label': ariaLabel,
}: ChordDiagramProps) {
  const { frets, fingers = [] } = grip
  const frettedFrets = frets.filter(
    (f): f is number => typeof f === 'number' && f > 0,
  )
  const maxFret = frettedFrets.length > 0 ? Math.max(...frettedFrets) : 1
  const baseFret =
    grip.baseFret ??
    (maxFret <= DEFAULT_FRET_COUNT ? 1 : Math.min(...frettedFrets))
  if (frettedFrets.some((f) => f < baseFret)) {
    throw new Error(
      `Grip has fretted notes below baseFret ${baseFret}: ${frets.join('-')}`,
    )
  }
  const hasNut = baseFret === 1
  const fretCount = Math.max(DEFAULT_FRET_COUNT, maxFret - baseFret + 1)

  const width = 2 * PAD_X + GRID_W
  const gridBottom = GRID_TOP + fretCount * FRET_GAP
  const height = gridBottom + 8
  const fretCenterY = (fret: number) =>
    GRID_TOP + (fret - baseFret + 0.5) * FRET_GAP

  const displayLabel = label ? displayAccidentals(label) : undefined

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={ariaLabel ?? (displayLabel ? `${displayLabel} chord diagram` : 'Chord diagram')}
    >
      {displayLabel && (
        <text
          x={PAD_X + GRID_W / 2}
          y={TITLE_BASELINE}
          textAnchor="middle"
          fontSize={14}
          fontWeight={600}
          className="fill-zinc-100"
        >
          {displayLabel}
        </text>
      )}
      {/* top edge: thick nut at first position, plain wire when windowed */}
      <line
        data-nut={hasNut || undefined}
        x1={PAD_X}
        y1={GRID_TOP}
        x2={PAD_X + GRID_W}
        y2={GRID_TOP}
        className={hasNut ? 'stroke-zinc-300' : 'stroke-zinc-600'}
        strokeWidth={hasNut ? 4 : 1.5}
      />
      {Array.from({ length: fretCount }, (_, i) => (
        <line
          key={i}
          x1={PAD_X}
          y1={GRID_TOP + (i + 1) * FRET_GAP}
          x2={PAD_X + GRID_W}
          y2={GRID_TOP + (i + 1) * FRET_GAP}
          className="stroke-zinc-600"
          strokeWidth={1.5}
        />
      ))}
      {frets.map((_, i) => (
        <line
          key={i}
          x1={stringX(6 - i)}
          y1={GRID_TOP}
          x2={stringX(6 - i)}
          y2={gridBottom}
          className="stroke-zinc-500"
          strokeWidth={1}
        />
      ))}
      {!hasNut && (
        <text
          data-basefret={baseFret}
          x={PAD_X + GRID_W + 4}
          y={fretCenterY(baseFret)}
          dominantBaseline="central"
          fontSize={10}
          className="fill-zinc-400"
        >
          {baseFret}fr
        </text>
      )}
      {frets.map((fret, i) => {
        const stringNumber = 6 - i
        if (fret === 'x') {
          return (
            <text
              key={stringNumber}
              data-string={stringNumber}
              data-marker="muted"
              x={stringX(stringNumber)}
              y={GRID_TOP - 9}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              className="fill-zinc-500"
            >
              ×
            </text>
          )
        }
        if (fret === 0) {
          return (
            <circle
              key={stringNumber}
              data-string={stringNumber}
              data-marker="open"
              cx={stringX(stringNumber)}
              cy={GRID_TOP - 9}
              r={3.5}
              fill="none"
              className="stroke-zinc-300"
              strokeWidth={1.25}
            />
          )
        }
        const finger = fingers[i] ?? 0
        return (
          <g
            key={stringNumber}
            data-string={stringNumber}
            data-fret={fret}
          >
            <circle
              cx={stringX(stringNumber)}
              cy={fretCenterY(fret)}
              r={DOT_R}
              className="fill-zinc-200"
            />
            {finger > 0 && (
              <text
                x={stringX(stringNumber)}
                y={fretCenterY(fret)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9.5}
                fontWeight={600}
                className="fill-zinc-950"
              >
                {finger}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
