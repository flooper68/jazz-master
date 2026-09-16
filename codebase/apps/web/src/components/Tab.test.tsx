import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TabNote } from '../content'
import { Tab } from './Tab'

const notes: TabNote[] = [
  { string: 5, fret: 3, beats: 0.5 },
  { string: 5, fret: 5, beats: 0.5 },
  { string: 4, fret: 2, beats: 1 },
]

describe('Tab', () => {
  it('draws six strings and one fret number per note, in time order', () => {
    const { container } = render(<Tab notes={notes} aria-label="Three notes" />)
    expect(screen.getByRole('img', { name: 'Three notes' })).toBeInTheDocument()
    expect(container.querySelectorAll('line')).toHaveLength(6)
    const frets = [...container.querySelectorAll('[data-note] text')].map(
      (text) => text.textContent,
    )
    expect(frets).toEqual(['3', '5', '2'])
    const xs = [...container.querySelectorAll('[data-note] text')].map((text) =>
      Number(text.getAttribute('x')),
    )
    expect(xs[0]).toBeLessThan(xs[1])
    expect(xs[1]).toBeLessThan(xs[2])
    // A quarter note takes twice the room of an eighth.
    expect(xs[2] - xs[1]).toBeCloseTo((xs[1] - xs[0]) * 1.5)
  })

  it('marks only the current note', () => {
    const { container } = render(<Tab notes={notes} currentIndex={1} />)
    const current = container.querySelectorAll('[data-current]')
    expect(current).toHaveLength(1)
    expect(current[0].getAttribute('data-note')).toBe('1')
    expect(current[0].querySelector('circle')).not.toBeNull()
  })

  it('places a note on its string line, high E on top', () => {
    const { container } = render(<Tab notes={notes} />)
    const lines = [...container.querySelectorAll('line')].map((line) =>
      Number(line.getAttribute('y1')),
    )
    const noteY = Number(
      container.querySelector('[data-note="0"] text')?.getAttribute('y'),
    )
    expect(noteY).toBe(lines[4])
  })
})
