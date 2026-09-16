import { STRING_NUMBERS } from '@jazz-master/theory'
import type { TabNote } from '../content'
import { Flag } from './glyphs'
import type { ScoreLayout } from './layout'
import { STRING_GAP } from './metrics'
import { beamGroups, noteGlyph } from './rhythm'

/**
 * Tablature on the score's shared time axis: six string lines, high E on
 * top, one fret number per note at its onset, and rhythm stems under the
 * strings so the tab reads in time without the staff above it.
 */

const STEM_TOP = 7
const STEM_LENGTH = 17
const BEAM_THICKNESS = 3

interface TabStaffProps {
  notes: readonly TabNote[]
  layout: ScoreLayout
  /** y of the high E string. */
  top: number
  currentIndex: number | null
}

export function TabStaff({ notes, layout, top, currentIndex }: TabStaffProps) {
  const stringY = (string: number) => top + (string - 1) * STRING_GAP
  const bottom = stringY(6)
  const stemTop = bottom + STEM_TOP
  const glyphs = notes.map((note) => noteGlyph(note.beats))
  const groups = beamGroups(notes.map((note) => note.beats), layout.starts, layout.beatsPerBar)
  const grouped = new Set(groups.flat())

  return (
    <g data-staff="tab">
      <text
        x={10}
        y={top + 2.5 * STRING_GAP}
        fontSize={9}
        fontWeight={800}
        letterSpacing={1.5}
        className="fill-muted font-display"
        transform={`rotate(-90 10 ${top + 2.5 * STRING_GAP})`}
        textAnchor="middle"
      >
        TAB
      </text>
      {STRING_NUMBERS.map((string) => (
        <line
          key={string}
          x1={0}
          x2={layout.endX}
          y1={stringY(string)}
          y2={stringY(string)}
          className="stroke-line-strong"
          strokeWidth={string >= 5 ? 1.2 : 0.9}
        />
      ))}
      {notes.map((note, index) => {
        const x = layout.noteX[index]
        const y = stringY(note.string)
        const current = index === currentIndex
        const glyph = glyphs[index]
        const wide = note.fret >= 10
        return (
          <g key={index} data-note={index} data-current={current || undefined}>
            {current ? (
              <circle cx={x} cy={y} r={8.5} className="fill-accent" />
            ) : (
              <rect x={x - (wide ? 8 : 6)} y={y - 6.5} width={wide ? 16 : 12} height={13} rx={2} className="fill-panel" />
            )}
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fontWeight={current ? 800 : 600}
              className={current ? 'fill-on-accent' : 'fill-fg'}
            >
              {note.fret}
            </text>
            {glyph.stem && (
              <line
                x1={x}
                x2={x}
                y1={glyph.head === 'half' ? stemTop + STEM_LENGTH * 0.45 : stemTop}
                y2={stemTop + STEM_LENGTH}
                className={current ? 'stroke-accent' : 'stroke-fg-2'}
                strokeWidth={1.2}
              />
            )}
            {glyph.stem && !grouped.has(index) && glyph.flags > 0 && (
              <>
                <Flag x={x} y={stemTop + STEM_LENGTH} direction={-1} current={current} />
                {glyph.flags > 1 && <Flag x={x} y={stemTop + STEM_LENGTH - 6} direction={-1} current={current} />}
              </>
            )}
            {glyph.dot && <circle cx={x + 5} cy={stemTop + STEM_LENGTH - 2} r={1.4} className="fill-fg-2" />}
          </g>
        )
      })}
      {groups.map((group, groupIndex) => {
        const y = stemTop + STEM_LENGTH
        const x1 = layout.noteX[group[0]] - 0.6
        const x2 = layout.noteX[group[group.length - 1]] + 0.6
        return (
          <g key={groupIndex} className="fill-fg-2">
            <polygon points={`${x1},${y} ${x2},${y} ${x2},${y - BEAM_THICKNESS} ${x1},${y - BEAM_THICKNESS}`} />
            {group.slice(0, -1).map((index, i) => {
              const next = group[i + 1]
              if (glyphs[index].flags < 2 || glyphs[next].flags < 2) return null
              const y2 = y - BEAM_THICKNESS * 1.7
              return (
                <polygon
                  key={index}
                  points={`${layout.noteX[index] - 0.6},${y2} ${layout.noteX[next] + 0.6},${y2} ${layout.noteX[next] + 0.6},${y2 - BEAM_THICKNESS} ${layout.noteX[index] - 0.6},${y2 - BEAM_THICKNESS}`}
                />
              )
            })}
          </g>
        )
      })}
    </g>
  )
}
