import type { KeySignature } from '@jazz-master/theory'
import type { TabNote } from '../content'
import { Accidental, Flag, HEAD_RX, NoteHeadGlyph, TrebleClef } from './glyphs'
import type { ScoreLayout, SystemLayout } from './layout'
import { HALF_GAP, LINE_GAP } from './metrics'
import {
  BOTTOM_LINE_STEP,
  farthestStep,
  keySignatureGlyphs,
  ledgerSteps,
  MIDDLE_LINE_STEP,
  staffNotes,
} from './notation'
import { beamGroups, noteGlyph } from './rhythm'

/**
 * Standard notation on a treble staff, laid out on the score's shared time
 * axis: heads at their onsets, stems and beams by the beat, accidentals as
 * the key and the bar imply. A chord is its heads stacked on one stem; a
 * head a step above its neighbour moves to the other side of the stem so
 * the two do not overlap.
 */

const STEM_LENGTH = 3.3 * LINE_GAP
const BEAM_THICKNESS = 3.2
/** How far a displaced head of a second sits from the stem, on the far side. */
const SECOND_OFFSET = 2 * HEAD_RX - 0.8

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

  const stepsOf = (index: number) => staff[index].map((head) => head.step)
  // Stem direction: an event follows its head farthest from the middle line; a beamed group its farthest head of all.
  const stemUp = (index: number): boolean => {
    const groupIndex = grouped.get(index)
    const steps = groupIndex === undefined ? stepsOf(index) : groups[groupIndex].flatMap(stepsOf)
    return farthestStep(steps) < MIDDLE_LINE_STEP
  }
  const stemX = (index: number) => layout.noteX[index] + (stemUp(index) ? HEAD_RX - 0.4 : -HEAD_RX + 0.4)
  const headYs = (index: number) => stepsOf(index).map(yOfStep)
  // A stem runs from the event's outermost head on its side to a fixed length past the other; beamed stems all reach the beam.
  const stemStartY = (index: number): number => (stemUp(index) ? Math.max(...headYs(index)) : Math.min(...headYs(index)))
  const stemEndY = (index: number): number => {
    const groupIndex = grouped.get(index)
    const up = stemUp(index)
    const ys = groupIndex === undefined ? headYs(index) : groups[groupIndex].flatMap(headYs)
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
      <g data-key-signature>
        {sigGlyphs.map((glyph, i) => (
          <Accidental key={i} kind={glyph.accidental} x={34 + i * 8} y={yOfStep(glyph.step)} />
        ))}
      </g>
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
        const heads = staff[index]
        const current = index === currentIndex
        const up = stemUp(index)
        const inGroup = grouped.has(index)
        // Heads a second apart alternate sides of the stem, from the bass up.
        const displaced: boolean[] = []
        heads.forEach((head, at) => {
          displaced.push(at > 0 && head.step - heads[at - 1].step === 1 && !displaced[at - 1])
        })
        const headX = (at: number) => (displaced[at] ? x + (up ? SECOND_OFFSET : -SECOND_OFFSET) : x)
        // Accidentals of heads close together step back to the left so they do not collide.
        let lastAccidentalStep = -Infinity
        const accidentalX = heads.map((head) => {
          if (head.accidental === null) return x
          const shifted = head.step - lastAccidentalStep <= 2
          lastAccidentalStep = shifted ? -Infinity : head.step
          return x - HEAD_RX - 6.5 - (shifted ? 7 : 0)
        })
        const ledgers = [...new Set(heads.flatMap((head) => ledgerSteps(head.step)))]
        const ledgerWidth = displaced.some(Boolean) ? SECOND_OFFSET : 0
        return (
          <g key={index} data-staff-note={index} data-current={current || undefined}>
            {ledgers.map((step) => (
              <line
                key={step}
                x1={x - HEAD_RX - 3 - (up ? 0 : ledgerWidth)}
                x2={x + HEAD_RX + 3 + (up ? ledgerWidth : 0)}
                y1={yOfStep(step)}
                y2={yOfStep(step)}
                className="stroke-fg"
                strokeWidth={1}
              />
            ))}
            {heads.map((head, at) => {
              const y = yOfStep(head.step)
              return (
                <g key={at} data-head={at}>
                  {head.accidental !== null && <Accidental kind={head.accidental} x={accidentalX[at]} y={y} />}
                  <NoteHeadGlyph head={glyph.head} x={headX(at)} y={y} current={current} />
                  {glyph.dot && (
                    <circle
                      cx={headX(at) + HEAD_RX + 4}
                      cy={y - (head.step % 2 === 0 ? HALF_GAP : 0)}
                      r={1.6}
                      className={current ? 'fill-accent' : 'fill-fg'}
                    />
                  )}
                </g>
              )
            })}
            {glyph.stem && (
              <line
                x1={stemX(index)}
                x2={stemX(index)}
                y1={stemStartY(index)}
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
