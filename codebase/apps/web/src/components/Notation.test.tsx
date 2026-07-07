import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Exercise, NoteName } from '../content'
import { deriveRhythm, resolveExercise } from '../content'
import { Notation } from './Notation'

const FLAT = ''
const SHARP = ''

function arpeggioMeasures(root: NoteName) {
  const exercise: Exercise = {
    id: `test-${root}`,
    title: `${root} maj7 arpeggio`,
    material: { kind: 'arpeggio', root, quality: 'maj7' },
    window: { min: 0, max: 4 },
    tempoBpm: 80,
    duration: { kind: 'repetitions', count: 1 },
    display: ['fretboard'],
  }
  const { positions } = resolveExercise(exercise)
  return { positions, measures: deriveRhythm(positions) }
}

function svgGlyphs(container: HTMLElement, glyph: string): number {
  return [...container.querySelectorAll('svg text')].filter(
    (t) => t.textContent === glyph,
  ).length
}

async function findSvg(container: HTMLElement): Promise<SVGElement> {
  await waitFor(() => {
    expect(container.querySelector('svg')).not.toBeNull()
  })
  return container.querySelector('svg')!
}

describe('Notation', () => {
  it('renders nothing without measures', () => {
    render(<Notation measures={[]} />)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('names the image with the spelled note sequence', async () => {
    const { measures } = arpeggioMeasures('Db')
    const { container } = render(<Notation measures={measures} />)
    const figure = screen.getByRole('img')
    expect(figure).toHaveAccessibleName(/staff and tablature: .*d♭/i)
    expect(figure.getAttribute('aria-label')).not.toContain('♯')
    await findSvg(container)
  })

  it('accepts an aria-label override', async () => {
    const { measures } = arpeggioMeasures('Db')
    const { container } = render(
      <Notation measures={measures} aria-label="D♭ arpeggio notation" />,
    )
    expect(
      screen.getByRole('img', { name: 'D♭ arpeggio notation' }),
    ).toBeInTheDocument()
    await findSvg(container)
  })

  it.each(['Db', 'Eb', 'Ab', 'Bb'] as const)(
    'spells %s arpeggio content with flats, never sharps',
    async (root) => {
      const { measures } = arpeggioMeasures(root)
      const { container } = render(<Notation measures={measures} />)
      await findSvg(container)
      expect(svgGlyphs(container, FLAT)).toBeGreaterThan(0)
      expect(svgGlyphs(container, SHARP)).toBe(0)
      expect(screen.getByRole('img').getAttribute('aria-label')).toContain('♭')
    },
  )

  it('shows the TAB fret numbers of the exercise positions', async () => {
    const { positions, measures } = arpeggioMeasures('Db')
    const { container } = render(<Notation measures={measures} />)
    const svg = await findSvg(container)
    const tabTexts = [...svg.querySelectorAll('g.vf-tabnote text')].map(
      (t) => t.textContent,
    )
    expect(tabTexts).toEqual(positions.map((p) => String(p.fret)))
  })

  it('re-renders the score when the content changes', async () => {
    const db = arpeggioMeasures('Db')
    const eb = arpeggioMeasures('Eb')
    const { container, rerender } = render(<Notation measures={db.measures} />)
    await findSvg(container)
    rerender(<Notation measures={eb.measures} />)
    await waitFor(() => {
      const tabTexts = [
        ...container.querySelectorAll('g.vf-tabnote text'),
      ].map((t) => t.textContent)
      expect(tabTexts).toEqual(eb.positions.map((p) => String(p.fret)))
    })
    expect(container.querySelectorAll('svg').length).toBe(1)
  })

  it('skips re-layout when re-rendered with equal content', async () => {
    const { measures } = arpeggioMeasures('Db')
    const { container, rerender } = render(<Notation measures={measures} />)
    const svg = await findSvg(container)
    // fresh objects, same content — the drawn SVG must survive untouched
    rerender(<Notation measures={arpeggioMeasures('Db').measures} />)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(container.querySelector('svg')).toBe(svg)
  })

  it('clears the score on unmount', async () => {
    const { measures } = arpeggioMeasures('Db')
    const { container, unmount } = render(<Notation measures={measures} />)
    await findSvg(container)
    unmount()
    expect(container.querySelector('svg')).toBeNull()
  })
})
