import type { KeySignature } from '@jazz-master/theory'
import type { TabNote } from '../content'
import { Accidental, Flag, HEAD_RX, NoteHeadGlyph, TrebleClef } from './glyphs'
import type { ScoreLayout, SystemLayout } from './layout'
import { HALF_GAP, LINE_GAP } from './metrics'
import {
  BOTTOM_LINE_STEP,
  keySignatureGlyphs,
  ledgerSteps,
  MIDDLE_LINE_STEP,
  staffNotes,
} from './notation'
import { beamGroups, noteGlyph } from './rhythm'

/**
 * Standard notation on a treble staff, laid out on the score's shared time
 * axis: heads at their onsets, stems and beams by the beat, accidentals as
 * the key and the bar imply.
 */

const STEM_LENGTH = 3.3 * LINE_GAP
const BEAM_THICKNESS = 3.2

interface NotationStaffProps {
  notes: readonly TabNote[]
  layout: ScoreLayout
  /** The line (system) this staff draws. */
  system: SystemLayout
  keySig: KeySignature | null
  /** y of the top staff line. */
  top: number
  currentIndex: number | null
}

export function NotationStaff({ notes, layout, system, keySig, top, currentIndex }: NotationStaffProps) {
  const bottomY = top + 4 * LINE_GAP
  const yOfStep = (step: number) => bottomY - (step - BOTTOM_LINE_STEP) * HALF_GAP
  const staff = staffNotes(notes, layout.starts, layout.beatsPerBar, keySig)
  const glyphs = notes.map((note) => noteGlyph(note.beats))
  const inSystem = new Set(system.noteIndices)
  // Beam groups never cross a bar line, so none straddles a line break.
  const groups = beamGroups(notes.map((note) => note.beats), layout.starts, layout.beatsPerBar).filter(
    (group) => inSystem.has(group[0]),
  )
  const grouped = new Map<number, number>()
  groups.forEach((group, groupIndex) => group.forEach((index) => grouped.set(index, groupIndex)))

  // Stem direction: a beamed group follows its farthest head from the middle line.
  const stemUp = (index: number): boolean => {
    const groupIndex = grouped.get(index)
    if (groupIndex === undefined) return staff[index].step < MIDDLE_LINE_STEP
    const steps = groups[groupIndex].map((i) => staff[i].step)
    const farthest = steps.reduce((a, b) =>
      Math.abs(b - MIDDLE_LINE_STEP) > Math.abs(a - MIDDLE_LINE_STEP) ? b : a,
    )
    return farthest < MIDDLE_LINE_STEP
  }
  const stemX = (index: number) => layout.noteX[index] + (stemUp(index) ? HEAD_RX - 0.4 : -HEAD_RX + 0.4)
  const headY = (index: number) => yOfStep(staff[index].step)
  // Beamed stems all reach the beam; a lone stem is a fixed length.
  const stemEndY = (index: number): number => {
    const groupIndex = grouped.get(index)
    const up = stemUp(index)
    if (groupIndex === undefined) return headY(index) + (up ? -STEM_LENGTH : STEM_LENGTH)
    const ys = groups[groupIndex].map(headY)
    return up ? Math.min(...ys) - STEM_LENGTH : Math.max(...ys) + STEM_LENGTH
  }

  const sigGlyphs = keySignatureGlyphs(keySig)
  const timeSigX = layout.leftInset - 18
  const clefX = 4

  return (
    <g data-staff="notation">
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1={0}
          x2={system.endX}
          y1={top + line * LINE_GAP}
          y2={top + line * LINE_GAP}
          className="stroke-line-strong"
          strokeWidth={0.9}
        />
      ))}
      <TrebleClef x={clefX} gLineY={yOfStep(32)} />
      {sigGlyphs.map((glyph, i) => (
        <Accidental key={i} kind={glyph.accidental} x={34 + i * 8} y={yOfStep(glyph.step)} />
      ))}
      {system.index === 0 && (
        <>
          <text
            x={timeSigX}
            y={top + 2 * LINE_GAP - 1.5}
            textAnchor="middle"
            fontSize={17}
            fontWeight={700}
            className="fill-fg font-display"
          >
            {layout.beatsPerBar}
          </text>
          <text
            x={timeSigX}
            y={top + 4 * LINE_GAP - 1.5}
            textAnchor="middle"
            fontSize={17}
            fontWeight={700}
            className="fill-fg font-display"
          >
            4
          </text>
        </>
      )}
      {system.noteIndices.map((index) => {
        const glyph = glyphs[index]
        const x = layout.noteX[index]
        const y = headY(index)
        const current = index === currentIndex
        const up = stemUp(index)
        const inGroup = grouped.has(index)
        return (
          <g key={index} data-staff-note={index} data-current={current || undefined}>
            {ledgerSteps(staff[index].step).map((step) => (
              <line
                key={step}
                x1={x - HEAD_RX - 3}
                x2={x + HEAD_RX + 3}
                y1={yOfStep(step)}
                y2={yOfStep(step)}
                className="stroke-fg"
                strokeWidth={1}
              />
            ))}
            {staff[index].accidental !== null && (
              <Accidental kind={staff[index].accidental} x={x - HEAD_RX - 6.5} y={y} />
            )}
            <NoteHeadGlyph head={glyph.head} x={x} y={y} current={current} />
            {glyph.dot && <circle cx={x + HEAD_RX + 4} cy={y - (staff[index].step % 2 === 0 ? HALF_GAP : 0)} r={1.6} className={current ? 'fill-accent' : 'fill-fg'} />}
            {glyph.stem && (
              <line
                x1={stemX(index)}
                x2={stemX(index)}
                y1={y}
                y2={stemEndY(index)}
                className={current ? 'stroke-accent' : 'stroke-fg'}
                strokeWidth={1.3}
              />
            )}
            {glyph.stem && !inGroup && glyph.flags > 0 && (
              <>
                <Flag x={stemX(index)} y={stemEndY(index)} direction={up ? 1 : -1} current={current} />
                {glyph.flags > 1 && (
                  <Flag x={stemX(index)} y={stemEndY(index) + (up ? 7 : -7)} direction={up ? 1 : -1} current={current} />
                )}
              </>
            )}
          </g>
        )
      })}
      {groups.map((group, groupIndex) => {
        const first = group[0]
        const last = group[group.length - 1]
        const y = stemEndY(first)
        const up = stemUp(first)
        const x1 = stemX(first) - 0.65
        const x2 = stemX(last) + 0.65
        const thickness = up ? BEAM_THICKNESS : -BEAM_THICKNESS
        return (
          <g key={groupIndex} className="fill-fg">
            <polygon points={`${x1},${y} ${x2},${y} ${x2},${y + thickness} ${x1},${y + thickness}`} />
            {group.slice(0, -1).map((index, i) => {
              const next = group[i + 1]
              if (glyphs[index].flags < 2 || glyphs[next].flags < 2) return null
              const y2 = y + thickness * 1.6
              return (
                <polygon
                  key={index}
                  points={`${stemX(index) - 0.65},${y2} ${stemX(next) + 0.65},${y2} ${stemX(next) + 0.65},${y2 + thickness} ${stemX(index) - 0.65},${y2 + thickness}`}
                />
              )
            })}
          </g>
        )
      })}
    </g>
  )
}
