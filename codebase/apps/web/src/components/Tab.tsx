import { STRING_NUMBERS } from '@jazz-master/theory'
import { noteStarts, type TabNote } from '../content'

/**
 * Tablature: six string lines (high E on top, tab convention), one fret
 * number per note, laid out in time — a note's x position is its beat
 * offset, so an eighth takes half the room of a quarter. The current note
 * gets a filled marker behind its number.
 */

interface TabProps {
  notes: readonly TabNote[]
  /** Index of the note to highlight, or null for none. */
  currentIndex?: number | null
  /**
   * Describe the content, not the widget — descendant SVG text is hidden
   * from assistive tech, so "C major scale, 15 notes" beats "Tab".
   */
  'aria-label'?: string
}

const BEAT_W = 48
const STRING_GAP = 18
const PAD_X = 20
const PAD_Y = 14
const MARKER_R = 9

function stringY(string: number): number {
  return PAD_Y + (string - 1) * STRING_GAP
}

export function Tab({
  notes,
  currentIndex = null,
  'aria-label': ariaLabel = 'Tablature',
}: TabProps) {
  const starts = noteStarts(notes)
  const total = notes.reduce((sum, note) => sum + note.beats, 0)
  const width = PAD_X * 2 + Math.max(total, 1) * BEAT_W
  const height = PAD_Y * 2 + (STRING_NUMBERS.length - 1) * STRING_GAP
  const noteX = (index: number) =>
    PAD_X + (starts[index] + notes[index].beats / 2) * BEAT_W

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      className="max-w-none"
    >
      {STRING_NUMBERS.map((string) => (
        <line
          key={string}
          x1={PAD_X / 2}
          y1={stringY(string)}
          x2={width - PAD_X / 2}
          y2={stringY(string)}
          className="stroke-line-strong"
          strokeWidth={1}
        />
      ))}
      {notes.map((note, index) => {
        const current = index === currentIndex
        return (
          <g
            key={index}
            data-note={index}
            data-current={current || undefined}
          >
            {current && (
              <circle
                cx={noteX(index)}
                cy={stringY(note.string)}
                r={MARKER_R}
                className="fill-accent"
              />
            )}
            {!current && (
              <rect
                x={noteX(index) - 7}
                y={stringY(note.string) - 7}
                width={14}
                height={14}
                className="fill-panel"
              />
            )}
            <text
              x={noteX(index)}
              y={stringY(note.string)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fontWeight={current ? 700 : 500}
              className={current ? 'fill-on-accent' : 'fill-fg'}
            >
              {note.fret}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
