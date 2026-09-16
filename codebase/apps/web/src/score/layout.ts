import { noteStarts, passBeats, type TabNote } from '../content'

/**
 * The horizontal layout shared by every staff of a score: where each beat
 * and each note onset sits, and where the bar lines fall. Time is
 * proportional (an eighth takes half the room of a quarter) with a little
 * extra room after every bar line, the way engraved music breathes.
 */

export interface BarLayout {
  index: number
  startBeat: number
  /** x of the bar line that opens this bar. */
  x: number
}

export interface ScoreLayout {
  beatsPerBar: number
  totalBeats: number
  beatWidth: number
  /** Room reserved at the left for clefs, signatures and the TAB mark. */
  leftInset: number
  width: number
  starts: number[]
  /** x of each note's onset. */
  noteX: number[]
  bars: BarLayout[]
  /** x of the closing bar line. */
  endX: number
  xOfBeat(beat: number): number
  beatOfX(x: number): number
  /** Index of the note sounding at a beat (the last onset at or before it), or null before the first. */
  noteIndexAtBeat(beat: number): number | null
}

export interface LayoutOptions {
  beatsPerBar: number
  leftInset?: number
  beatWidth?: number
}

export const DEFAULT_BEAT_WIDTH = 64
const BAR_GAP = 18
const NOTE_LEAD = 14
const RIGHT_PAD = 24

export function layoutScore(
  notes: readonly TabNote[],
  { beatsPerBar, leftInset = 0, beatWidth = DEFAULT_BEAT_WIDTH }: LayoutOptions,
): ScoreLayout {
  const starts = noteStarts(notes)
  const totalBeats = passBeats(notes)
  const barCount = Math.max(Math.ceil(totalBeats / beatsPerBar - 1e-9), 1)

  const barLineX = (bar: number) => leftInset + bar * (BAR_GAP + NOTE_LEAD + beatsPerBar * beatWidth)
  const xOfBeat = (beat: number): number => {
    const clamped = Math.min(Math.max(beat, 0), totalBeats)
    const bar = Math.min(Math.floor(clamped / beatsPerBar), barCount - 1)
    return barLineX(bar) + NOTE_LEAD + (clamped - bar * beatsPerBar) * beatWidth
  }
  const bars: BarLayout[] = Array.from({ length: barCount }, (_, index) => ({
    index,
    startBeat: index * beatsPerBar,
    x: barLineX(index),
  }))
  const endX = xOfBeat(totalBeats) + NOTE_LEAD
  const width = endX + RIGHT_PAD

  const beatOfX = (x: number): number => {
    if (x <= barLineX(0) + NOTE_LEAD) return 0
    let bar = 0
    while (bar + 1 < barCount && barLineX(bar + 1) <= x) bar += 1
    const within = (x - barLineX(bar) - NOTE_LEAD) / beatWidth
    return Math.min(Math.max(bar * beatsPerBar + within, bar * beatsPerBar), totalBeats)
  }

  const noteIndexAtBeat = (beat: number): number | null => {
    let index: number | null = null
    for (let i = 0; i < starts.length; i += 1) {
      if (starts[i] <= beat + 1e-9) index = i
      else break
    }
    return index
  }

  return {
    beatsPerBar,
    totalBeats,
    beatWidth,
    leftInset,
    width,
    starts,
    noteX: starts.map(xOfBeat),
    bars,
    endX,
    xOfBeat,
    beatOfX,
    noteIndexAtBeat,
  }
}
