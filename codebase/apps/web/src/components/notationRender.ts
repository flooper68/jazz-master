/**
 * The one module that imports VexFlow (ADR-010 decision 3/5). `Notation` loads
 * it via dynamic import so the library stays out of the initial /app chunk —
 * nothing else may import this file statically. The `vexflow/bravura` entry
 * bundles only Bravura + Academico (both embedded as data URIs, so offline
 * rendering keeps working) instead of the full build's five fonts — TASK-039.
 */
import {
  Accidental,
  Beam,
  Formatter,
  Metrics,
  MetricsDefaults,
  Renderer,
  Stave,
  StaveNote,
  TabNote,
  TabStave,
  Voice,
} from 'vexflow/bravura'
import type { NotationMeasure } from '../content/rhythm'
import type { NotationDisplayMode } from '../storage/notationPreferences'
import { stavePitch } from './notationPitch'

// VexFlow's default font stack puts Bravura (the music font) first even for
// TAB fret digits, whose Bravura forms are heavy time-signature glyphs —
// unreadable at fret-number size. Route just the fret text to the companion
// text font.
MetricsDefaults.TabNote.text.fontFamily = 'Academico'
Metrics.clear('TabNote.text')

const STAVE_Y = 20
const TAB_Y = 140
const TAB_ONLY_Y = 35
const BOTH_HEIGHT = 300
const SINGLE_HEIGHT = 175
const NOTE_WIDTH = 48
const CLEF_WIDTH = 48
// Breathing room per bar for barlines and end padding — without it a short
// final bar clips its content at the stave edge.
const MEASURE_PAD = 24
const MARGIN = 10
// The responsive floor: how far below natural size the score may shrink.
const INLINE_MIN_WIDTH_FRACTION = 0.72
const FOCUS_MIN_WIDTH_FRACTION = 0.9
const INLINE_MAX_SCALE = 1.4
const FOCUS_MAX_SCALE = 2

export type NotationSize = 'inline' | 'focus'

interface RenderNotationOptions {
  displayMode?: NotationDisplayMode
  size?: NotationSize
}

function measureWidth(measure: NotationMeasure, isFirst: boolean): number {
  return (
    measure.notes.length * NOTE_WIDTH +
    MEASURE_PAD +
    (isFirst ? CLEF_WIDTH : 0)
  )
}

/**
 * Attach explicit accidental glyphs so the staff reads exactly as the theory
 * core spells, with measure-local bookkeeping only: a glyph appears when the
 * note's accidental differs from what an earlier note in the same bar left in
 * effect on that letter+octave (so C blues shows G♭ then G♮). Never key-derived
 * (ADR-010 decision 1).
 */
function buildStaveNotes(measure: NotationMeasure): StaveNote[] {
  const inEffect = new Map<string, number>()
  return measure.notes.map(({ position, duration }) => {
    const pitch = stavePitch(position)
    const staveNote = new StaveNote({ keys: [pitch.key], duration })
    const slot = `${pitch.letter}/${pitch.octave}`
    const effective = inEffect.get(slot) ?? 0
    if (position.note.accidental !== effective) {
      staveNote.addModifier(new Accidental(pitch.accidental ?? 'n'), 0)
      inEffect.set(slot, position.note.accidental)
    }
    return staveNote
  })
}

/**
 * Render measures as an aligned staff + TAB system into `container`, replacing
 * whatever it held. Colors are `currentColor` so the surrounding text color
 * themes the score.
 */
export function renderNotation(
  container: HTMLDivElement,
  measures: readonly NotationMeasure[],
  options: RenderNotationOptions = {},
): void {
  container.replaceChildren()
  if (measures.length === 0) return

  const displayMode = options.displayMode ?? 'both'
  const size = options.size ?? 'inline'
  const showStaff = displayMode === 'both' || displayMode === 'staff'
  const showTab = displayMode === 'both' || displayMode === 'tab'
  const height = displayMode === 'both' ? BOTH_HEIGHT : SINGLE_HEIGHT
  const minWidthFraction =
    size === 'focus' ? FOCUS_MIN_WIDTH_FRACTION : INLINE_MIN_WIDTH_FRACTION
  const maxScale = size === 'focus' ? FOCUS_MAX_SCALE : INLINE_MAX_SCALE

  const totalWidth =
    2 * MARGIN +
    measures.reduce((sum, m, i) => sum + measureWidth(m, i === 0), 0)

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(totalWidth, height)
  const context = renderer.getContext()
  context.setFillStyle('currentColor')
  context.setStrokeStyle('currentColor')
  // VexFlow blanks the TAB line behind fret numbers with an opaque 'white'
  // rect by default — a white blob on our dark theme. Transparent keeps the
  // score background-agnostic.
  context.setBackgroundFillStyle('transparent')

  let x = MARGIN
  measures.forEach((measure, index) => {
    const width = measureWidth(measure, index === 0)
    const stave = showStaff ? new Stave(x, STAVE_Y, width) : null
    const tabStave = showTab
      ? new TabStave(x, displayMode === 'both' ? TAB_Y : TAB_ONLY_Y, width)
      : null
    if (index === 0) {
      stave?.addClef('treble')
      tabStave?.addClef('tab')
    }

    const staveNotes = showStaff ? buildStaveNotes(measure) : []
    const tabNotes = showTab
      ? measure.notes.map(
          ({ position, duration }) =>
            new TabNote({
              positions: [{ str: position.string, fret: position.fret }],
              duration,
            }),
        )
      : []
    const beams = showStaff
      ? measure.beams.map((group) => new Beam(group.map((i) => staveNotes[i])))
      : []

    const eighths = measure.notes.length
    const formatter = new Formatter()
    const voice = showStaff
      ? new Voice({ numBeats: eighths, beatValue: 8 }).addTickables(staveNotes)
      : null
    const tabVoice = showTab
      ? new Voice({ numBeats: eighths, beatValue: 8 }).addTickables(tabNotes)
      : null
    if (voice) formatter.joinVoices([voice])
    if (tabVoice) formatter.joinVoices([tabVoice])
    const formatTarget = stave ?? tabStave
    if (formatTarget) {
      formatter.formatToStave(
        [voice, tabVoice].filter((v): v is Voice => v !== null),
        formatTarget,
      )
    }

    stave?.setContext(context).draw()
    tabStave?.setContext(context).draw()
    if (voice && stave) voice.draw(context, stave)
    if (tabVoice && tabStave) tabVoice.draw(context, tabStave)
    beams.forEach((beam) => beam.setContext(context).draw())

    x += width
  })

  const svg = container.querySelector('svg')
  if (!svg) return
  // A few strokes (stave connectors) ignore the context style and stay black.
  svg.querySelectorAll('[stroke="black"]').forEach((el) => {
    el.setAttribute('stroke', 'currentColor')
  })
  svg.querySelectorAll('[fill="black"]').forEach((el) => {
    el.setAttribute('fill', 'currentColor')
  })
  // Scale with the container instead of VexFlow's fixed pixel size (resize()
  // pins width/height as inline style, which beats attributes).
  svg.removeAttribute('style')
  svg.setAttribute('viewBox', `0 0 ${totalWidth} ${height}`)
  svg.setAttribute('width', '100%')
  svg.removeAttribute('height')
  // Legibility bounds: never shrink below half natural size — long exercises
  // on narrow viewports scroll (callers wrap in overflow-x-auto) instead of
  // shrinking staff and fret digits indefinitely — and never scale a short
  // exercise past natural size on wide panels.
  svg.style.display = 'block'
  svg.style.minWidth = `${totalWidth * minWidthFraction}px`
  svg.style.maxWidth = `${totalWidth * maxScale}px`
}
