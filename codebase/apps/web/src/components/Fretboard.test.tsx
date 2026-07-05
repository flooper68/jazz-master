import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Fretboard, type FretboardHighlight } from './Fretboard'

// C major triad in open position: C (root), E, G.
const cMajorTriad: FretboardHighlight[] = [
  { string: 5, fret: 3, label: 'C', role: 'root' },
  { string: 4, fret: 2, label: 'E' },
  { string: 3, fret: 0, label: 'G' },
]

function getDot(svg: HTMLElement, string: number, fret: number) {
  return svg.querySelector(`g[data-string="${string}"][data-fret="${fret}"]`)
}

describe('Fretboard', () => {
  it('renders the C major triad dots with labels and roles', () => {
    render(<Fretboard highlights={cMajorTriad} />)
    const svg = screen.getByRole('img', { name: 'Fretboard' })

    const root = getDot(svg, 5, 3)
    expect(root).not.toBeNull()
    expect(root).toHaveAttribute('data-role', 'root')
    expect(root!.querySelector('text')).toHaveTextContent('C')

    expect(getDot(svg, 4, 2)!.querySelector('text')).toHaveTextContent('E')
    expect(getDot(svg, 4, 2)).toHaveAttribute('data-role', 'other')
    expect(getDot(svg, 3, 0)!.querySelector('text')).toHaveTextContent('G')
    expect(svg.querySelectorAll('g[data-string]')).toHaveLength(3)
  })

  it('scales to container width via viewBox', () => {
    render(<Fretboard />)
    const svg = screen.getByRole('img', { name: 'Fretboard' })
    expect(svg).toHaveAttribute('width', '100%')
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 \d+/)
  })

  it('renders strings, fret wires, and markers for the default window', () => {
    render(<Fretboard />)
    const svg = screen.getByRole('img', { name: 'Fretboard' })
    const lines = svg.querySelectorAll('line')
    // 6 strings + 13 fret wires (nut + frets 1–12)
    expect(lines).toHaveLength(19)
    // single markers at 3/5/7/9 + double dot at 12
    const markers = [...svg.querySelectorAll('[data-marker]')]
    expect(markers.map((m) => m.getAttribute('data-marker'))).toEqual([
      '3',
      '5',
      '7',
      '9',
      '12',
    ])
  })

  it('renders ASCII accidentals in labels as Unicode', () => {
    render(
      <Fretboard
        highlights={[
          { string: 2, fret: 6, label: 'Bb' },
          { string: 1, fret: 2, label: 'F#' },
        ]}
      />,
    )
    const svg = screen.getByRole('img', { name: 'Fretboard' })
    expect(getDot(svg, 2, 6)!.querySelector('text')).toHaveTextContent('B♭')
    expect(getDot(svg, 1, 2)!.querySelector('text')).toHaveTextContent('F♯')
  })

  it('only shows highlights inside the fret-range window', () => {
    render(
      <Fretboard
        highlights={[
          { string: 6, fret: 8, label: 'C' },
          { string: 5, fret: 3, label: 'C' },
          { string: 2, fret: 1, label: 'C' },
          { string: 4, fret: 0, label: 'D' },
        ]}
        fretRange={{ min: 3, max: 8 }}
      />,
    )
    const svg = screen.getByRole('img', { name: 'Fretboard' })
    expect(getDot(svg, 6, 8)).not.toBeNull()
    expect(getDot(svg, 5, 3)).not.toBeNull()
    expect(getDot(svg, 2, 1)).toBeNull()
    expect(getDot(svg, 4, 0)).toBeNull()
    // windowed view is labeled with its starting fret
    expect(svg).toHaveTextContent('3fr')
  })

  it('supports a custom accessible name', () => {
    render(<Fretboard aria-label="C major triad" />)
    expect(screen.getByRole('img', { name: 'C major triad' })).toBeVisible()
  })
})
