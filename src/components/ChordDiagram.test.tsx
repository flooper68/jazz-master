import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChordDiagram, type Grip } from './ChordDiagram'

// Open-position Cmaj7: x32000, fingered 3 and 2.
const cmaj7: Grip = {
  frets: ['x', 3, 2, 0, 0, 0],
  fingers: [0, 3, 2, 0, 0, 0],
}

// Ebm7 rooted on the A string at the 6th fret: x-6-8-6-7-6.
const ebm7: Grip = {
  frets: ['x', 6, 8, 6, 7, 6],
  fingers: [0, 1, 3, 1, 2, 1],
}

function getDot(svg: HTMLElement, string: number, fret: number) {
  return svg.querySelector(`g[data-string="${string}"][data-fret="${fret}"]`)
}

describe('ChordDiagram', () => {
  it('renders a nut-position grip with dots, fingers, and x/o markers', () => {
    render(<ChordDiagram grip={cmaj7} label="Cmaj7" />)
    const svg = screen.getByRole('img', { name: 'Cmaj7 chord diagram' })

    // thick nut shown, no base-fret label
    expect(svg.querySelector('[data-nut]')).not.toBeNull()
    expect(svg.querySelector('[data-basefret]')).toBeNull()

    // dots on A string fret 3 and D string fret 2, with finger numbers
    expect(getDot(svg, 5, 3)!.querySelector('text')).toHaveTextContent('3')
    expect(getDot(svg, 4, 2)!.querySelector('text')).toHaveTextContent('2')
    expect(svg.querySelectorAll('g[data-string]')).toHaveLength(2)

    // muted low E, open G/B/high-E
    expect(
      svg.querySelector('[data-string="6"][data-marker="muted"]'),
    ).not.toBeNull()
    for (const openString of [3, 2, 1]) {
      expect(
        svg.querySelector(`[data-string="${openString}"][data-marker="open"]`),
      ).not.toBeNull()
    }
  })

  it('renders a 6th-fret grip windowed from its lowest fret', () => {
    render(<ChordDiagram grip={ebm7} label="Ebm7" />)
    const svg = screen.getByRole('img', { name: 'E♭m7 chord diagram' })

    // windowed: no nut, base-fret label instead
    expect(svg.querySelector('[data-nut]')).toBeNull()
    expect(svg.querySelector('[data-basefret="6"]')).toHaveTextContent('6fr')

    // absolute fret numbers are preserved on the dots
    expect(getDot(svg, 5, 6)).not.toBeNull()
    expect(getDot(svg, 4, 8)).not.toBeNull()
    expect(getDot(svg, 3, 6)).not.toBeNull()
    expect(getDot(svg, 2, 7)).not.toBeNull()
    expect(getDot(svg, 1, 6)).not.toBeNull()
    expect(svg.querySelectorAll('g[data-string]')).toHaveLength(5)
  })

  it('shows the chord symbol with Unicode accidentals', () => {
    render(<ChordDiagram grip={ebm7} label="Ebm7" />)
    const svg = screen.getByRole('img', { name: 'E♭m7 chord diagram' })
    expect(svg).toHaveTextContent('E♭m7')
  })

  it('respects an explicit base fret', () => {
    // A shape that fits the default window but is played at the 5th position.
    render(
      <ChordDiagram
        grip={{ frets: ['x', 5, 7, 5, 6, 5], baseFret: 5 }}
        label="Dm7"
      />,
    )
    const svg = screen.getByRole('img', { name: 'Dm7 chord diagram' })
    expect(svg.querySelector('[data-basefret="5"]')).toHaveTextContent('5fr')
    expect(svg.querySelector('[data-nut]')).toBeNull()
    expect(getDot(svg, 4, 7)).not.toBeNull()
  })

  it('renders an all-open grip at the nut with no dots', () => {
    render(<ChordDiagram grip={{ frets: [0, 0, 0, 0, 0, 0] }} label="Em11" />)
    const svg = screen.getByRole('img', { name: 'Em11 chord diagram' })
    expect(svg.querySelector('[data-nut]')).not.toBeNull()
    expect(svg.querySelectorAll('[data-marker="open"]')).toHaveLength(6)
    expect(svg.querySelectorAll('g[data-string]')).toHaveLength(0)
  })

  it('throws on fretted notes below an explicit base fret', () => {
    expect(() =>
      render(
        <ChordDiagram grip={{ frets: ['x', 3, 5, 5, 5, 5], baseFret: 5 }} />,
      ),
    ).toThrow(/below baseFret/)
  })

  it('scales to container width via viewBox', () => {
    render(<ChordDiagram grip={cmaj7} />)
    const svg = screen.getByRole('img', { name: 'Chord diagram' })
    expect(svg).toHaveAttribute('width', '100%')
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 \d+/)
  })
})
