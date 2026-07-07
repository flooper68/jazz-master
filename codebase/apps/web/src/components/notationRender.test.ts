import { parseNote, scalePositions } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { deriveRhythm } from '../content/rhythm'
import { renderNotation } from './notationRender'

// SMuFL accidental glyphs as VexFlow renders them into <text> elements.
const FLAT = ''
const NATURAL = ''
const SHARP = ''

function glyphCount(svg: SVGElement, glyph: string): number {
  return [...svg.querySelectorAll('text')].filter(
    (t) => t.textContent === glyph,
  ).length
}

function render(measures: ReturnType<typeof deriveRhythm>): HTMLDivElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  renderNotation(container, measures)
  return container
}

describe('renderNotation', () => {
  it('clears the container and draws nothing for no measures', () => {
    const container = render([])
    container.innerHTML = '<span>stale</span>'
    renderNotation(container, [])
    expect(container.querySelector('svg')).toBeNull()
    expect(container.textContent).toBe('')
  })

  it('draws one aligned staff + TAB system across measures', () => {
    const positions = scalePositions(
      { root: parseNote('C')!, type: 'ionian' },
      { min: 0, max: 4 },
    )
    const measures = deriveRhythm(positions)
    expect(measures.length).toBeGreaterThan(1)
    const svg = render(measures).querySelector('svg')!
    expect(svg).not.toBeNull()

    // one Stave + one TabStave per measure
    expect(svg.querySelectorAll('g.vf-stave').length).toBe(measures.length * 2)
    // every position appears once on each system
    expect(svg.querySelectorAll('g.vf-stavenote').length).toBe(positions.length)
    expect(svg.querySelectorAll('g.vf-tabnote').length).toBe(positions.length)

    // corresponding staff and TAB notes share x — the single Formatter pass
    const noteheadXs = [...svg.querySelectorAll('g.vf-notehead text')].map(
      (t) => Number(t.getAttribute('x')),
    )
    const tabXs = [...svg.querySelectorAll('g.vf-tabnote text')].map((t) =>
      Number(t.getAttribute('x')),
    )
    expect(tabXs.length).toBe(noteheadXs.length)
    noteheadXs.forEach((x, i) => {
      expect(Math.abs(x - tabXs[i])).toBeLessThan(15)
    })
  })

  it('renders TAB fret numbers verbatim from the positions', () => {
    const positions = scalePositions(
      { root: parseNote('C')!, type: 'ionian' },
      { min: 0, max: 4 },
    )
    const svg = render(deriveRhythm(positions)).querySelector('svg')!
    const tabTexts = [...svg.querySelectorAll('g.vf-tabnote text')].map(
      (t) => t.textContent,
    )
    expect(tabTexts).toEqual(positions.map((p) => String(p.fret)))
  })

  it('marks accidentals explicitly, incl. the natural after a flat in the bar', () => {
    // C blues in the open window; the first bar runs
    // F, Gb, G, Bb, C, Eb, F, Gb — Gb2 then G2 forces an explicit natural.
    const positions = scalePositions(
      { root: parseNote('C')!, type: 'blues' },
      { min: 0, max: 4 },
    )
    const [firstBar] = deriveRhythm(positions)
    expect(
      firstBar.notes.map(
        (n) => `${n.position.note.letter}${n.position.note.accidental}`,
      ),
    ).toEqual(['F0', 'G-1', 'G0', 'B-1', 'C0', 'E-1', 'F0', 'G-1'])

    const svg = render([firstBar]).querySelector('svg')!
    expect(glyphCount(svg, FLAT)).toBe(4) // Gb2, Bb2, Eb3, Gb3
    expect(glyphCount(svg, NATURAL)).toBe(1) // G2 after Gb2
    expect(glyphCount(svg, SHARP)).toBe(0)
  })

  it('themes via currentColor with no hardcoded black left', () => {
    const positions = scalePositions(
      { root: parseNote('C')!, type: 'ionian' },
      { min: 0, max: 4 },
    )
    const svg = render(deriveRhythm(positions)).querySelector('svg')!
    expect(svg.querySelectorAll('[stroke="black"]').length).toBe(0)
    expect(svg.querySelectorAll('[fill="black"]').length).toBe(0)
    expect(svg.getAttribute('width')).toBe('100%')
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 \d+ \d+$/)
  })
})
