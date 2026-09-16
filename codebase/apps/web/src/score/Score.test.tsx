import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { TabNote } from '../content'
import { Score, type ScoreHandle } from './Score'

const notes: TabNote[] = [
  { string: 5, fret: 3, beats: 1 },
  { string: 4, fret: 0, beats: 0.5 },
  { string: 4, fret: 2, beats: 0.5 },
  { string: 3, fret: 0, beats: 2 },
  { string: 3, fret: 2, beats: 4 },
]

function renderScore(overrides: Partial<React.ComponentProps<typeof Score>> = {}) {
  const ref = createRef<ScoreHandle>()
  const onSeek = vi.fn()
  const onLoopChange = vi.fn()
  const view = render(
    <Score
      ref={ref}
      notes={notes}
      beatsPerBar={4}
      keyName="F"
      view="both"
      currentIndex={null}
      loop={null}
      cursorVisible
      onSeek={onSeek}
      onLoopChange={onLoopChange}
      aria-label="Fixture score"
      {...overrides}
    />,
  )
  return { ...view, ref, onSeek, onLoopChange }
}

describe('Score', () => {
  it('draws the tab and the staff on one time axis', () => {
    const { container } = renderScore()
    expect(screen.getByRole('img', { name: 'Fixture score' })).toBeInTheDocument()
    expect(container.querySelector('[data-staff="tab"]')).not.toBeNull()
    expect(container.querySelector('[data-staff="notation"]')).not.toBeNull()
    const frets = [...container.querySelectorAll('[data-note] text')].map((t) => t.textContent)
    expect(frets).toEqual(['3', '0', '2', '0', '2'])
    expect(container.querySelectorAll('[data-staff-note]')).toHaveLength(5)
    // Two bars of 4/4: bar numbers 1 and 2 on the rail.
    const rail = [...container.querySelectorAll('svg > text')].map((t) => t.textContent)
    expect(rail).toEqual(['1', '2'])
    // Tab numbers and note heads line up.
    const tabX = [...container.querySelectorAll('[data-note] text')].map((t) => Number(t.getAttribute('x')))
    const headX = [...container.querySelectorAll('[data-staff-note]')].map((g) =>
      Number(g.querySelector('ellipse')?.getAttribute('cx')),
    )
    expect(headX).toEqual(tabX)
  })

  it('shows one view at a time when asked', () => {
    const { container, rerender } = renderScore({ view: 'tab' })
    expect(container.querySelector('[data-staff="notation"]')).toBeNull()
    rerender(
      <Score notes={notes} beatsPerBar={4} view="notation" currentIndex={null} loop={null} cursorVisible aria-label="x" />,
    )
    expect(container.querySelector('[data-staff="tab"]')).toBeNull()
    expect(container.querySelector('[data-staff="notation"]')).not.toBeNull()
  })

  it('marks the current note on both staves', () => {
    const { container } = renderScore({ currentIndex: 2 })
    const current = container.querySelectorAll('[data-current]')
    expect(current).toHaveLength(2)
    expect(container.querySelector('[data-note][data-current]')?.getAttribute('data-note')).toBe('2')
    expect(container.querySelector('[data-staff-note][data-current]')?.getAttribute('data-staff-note')).toBe('2')
  })

  it('seeks to the nearest note when a staff is pressed, and scrubs while dragging', () => {
    const { container, onSeek } = renderScore()
    const surface = container.querySelector('[data-seek-surface]')!
    const noteX = [...container.querySelectorAll('[data-note] text')].map((t) => Number(t.getAttribute('x')))
    surface.setPointerCapture = () => {}
    surface.hasPointerCapture = () => false
    fireEvent.pointerDown(surface, { clientX: noteX[3] + 4, button: 0 })
    expect(onSeek).toHaveBeenLastCalledWith(2)
    fireEvent.pointerMove(surface, { clientX: noteX[1] - 2 })
    expect(onSeek).toHaveBeenLastCalledWith(1)
    fireEvent.pointerUp(surface, { clientX: noteX[1] - 2 })
    fireEvent.pointerMove(surface, { clientX: noteX[4] })
    expect(onSeek).toHaveBeenCalledTimes(2)
  })

  it('loops a whole bar on a rail press and a beat range on a rail drag', () => {
    const { container, onLoopChange } = renderScore()
    const rail = container.querySelector('[data-loop-rail]')!
    rail.setPointerCapture = () => {}
    rail.hasPointerCapture = () => false
    const noteX = [...container.querySelectorAll('[data-note] text')].map((t) => Number(t.getAttribute('x')))

    fireEvent.pointerDown(rail, { clientX: noteX[4] + 10, button: 0 })
    fireEvent.pointerUp(rail, { clientX: noteX[4] + 10 })
    expect(onLoopChange).toHaveBeenLastCalledWith({ startBeat: 4, endBeat: 8 })

    fireEvent.pointerDown(rail, { clientX: noteX[1] + 2, button: 0 })
    fireEvent.pointerMove(rail, { clientX: noteX[3] + 4 })
    expect(container.querySelector('[data-loop-region]')).not.toBeNull()
    fireEvent.pointerUp(rail, { clientX: noteX[3] + 4 })
    expect(onLoopChange).toHaveBeenLastCalledWith({ startBeat: 1, endBeat: 3 })
  })

  it('shades the loop region and moves the cursor on demand', () => {
    const { container, ref } = renderScore({ loop: { startBeat: 1, endBeat: 2 } })
    expect(container.querySelector('[data-loop-region]')).not.toBeNull()
    ref.current!.moveCursor(1, false)
    const noteX = Number(container.querySelector('[data-note="1"] text')?.getAttribute('x'))
    expect(container.querySelector('[data-cursor]')?.getAttribute('transform')).toBe(`translate(${noteX} 0)`)
  })
})
