import { noteStarts, passBeats, type TabNote } from '../content'

/**
 * The horizontal layout shared by every staff of a score: where each beat
 * and each note onset sits, and where the bar lines fall. Time is
 * proportional (an eighth takes half the room of a quarter) with a little
 * extra room after every bar line, the way engraved music breathes.
 *
 * Given an available width the bars wrap into systems (lines), as many
 * whole bars per line as fit, stretched so full lines fill the width.
 * Positions are local to a system; the score stacks systems vertically.
 */

export interface BarLayout {
  index: number
  startBeat: number
  /** x of the bar line that opens this bar, within its system. */
  x: number
}

export interface SystemLayout {
  index: number
  bars: BarLayout[]
  startBeat: number
  endBeat: number
  /** x of the closing bar line. */
  endX: number
  /** Notes whose onset falls in this system, in order. */
  noteIndices: number[]
}

export interface ScorePoint {
  x: number
  system: number
}

export interface ScoreLayout {
  beatsPerBar: number
  totalBeats: number
  beatWidth: number
  /** Room reserved at the left of every system for clefs, signatures and the TAB mark. */
  leftInset: number
  /** Width of the widest system, including the right pad. */
  width: number
  starts: number[]
  /** x of each note's onset, within its system. */
  noteX: number[]
  /** System each note sits in. */
  noteSystem: number[]
  systems: SystemLayout[]
  xOfBeat(beat: number): ScorePoint
  /** The beat under an x within a system, clamped to the system's bars. */
  beatOfPoint(x: number, system: number): number
  /** Index of the note sounding at a beat (the last onset at or before it), or null before the first. */
  noteIndexAtBeat(beat: number): number | null
}

export interface LayoutOptions {
  beatsPerBar: number
  leftInset?: number
  beatWidth?: number
  /** Wrap bars into lines no wider than this; omitted, everything sits on one line. */
  availableWidth?: number
}

export const DEFAULT_BEAT_WIDTH = 64
const BAR_GAP = 18
const NOTE_LEAD = 14
const RIGHT_PAD = 24

export function layoutScore(
  notes: readonly TabNote[],
  { beatsPerBar, leftInset = 0, beatWidth: naturalBeatWidth = DEFAULT_BEAT_WIDTH, availableWidth }: LayoutOptions,
): ScoreLayout {
  const starts = noteStarts(notes)
  const totalBeats = passBeats(notes)
  const barCount = Math.max(Math.ceil(totalBeats / beatsPerBar - 1e-9), 1)

  // How many bars per line, and how wide a beat is once the line is filled.
  const naturalBarWidth = BAR_GAP + NOTE_LEAD + beatsPerBar * naturalBeatWidth
  let barsPerSystem = barCount
  let beatWidth = naturalBeatWidth
  if (availableWidth !== undefined) {
    const room = availableWidth - leftInset - RIGHT_PAD
    // A line that fits keeps its natural spacing; wrapped lines fill the width.
    if (barCount * naturalBarWidth > room) {
      barsPerSystem = Math.max(Math.floor(room / naturalBarWidth), 1)
      beatWidth = Math.max((room / barsPerSystem - BAR_GAP - NOTE_LEAD) / beatsPerBar, naturalBeatWidth * 0.6)
    }
  }
  const barWidth = BAR_GAP + NOTE_LEAD + beatsPerBar * beatWidth
  const systemCount = Math.ceil(barCount / barsPerSystem)

  const barLocalX = (localBar: number) => leftInset + localBar * barWidth
  const systemOf = (bar: number) => Math.floor(bar / barsPerSystem)

  const xOfBeat = (beat: number): ScorePoint => {
    const clamped = Math.min(Math.max(beat, 0), totalBeats)
    const bar = Math.min(Math.floor(clamped / beatsPerBar), barCount - 1)
    const system = systemOf(bar)
    const localBar = bar - system * barsPerSystem
    return { x: barLocalX(localBar) + NOTE_LEAD + (clamped - bar * beatsPerBar) * beatWidth, system }
  }

  const systems: SystemLayout[] = Array.from({ length: systemCount }, (_, index) => {
    const firstBar = index * barsPerSystem
    const lastBar = Math.min(firstBar + barsPerSystem, barCount) - 1
    const bars: BarLayout[] = []
    for (let bar = firstBar; bar <= lastBar; bar += 1) {
      bars.push({ index: bar, startBeat: bar * beatsPerBar, x: barLocalX(bar - firstBar) })
    }
    const startBeat = firstBar * beatsPerBar
    const endBeat = Math.min((lastBar + 1) * beatsPerBar, totalBeats)
    const endX = xOfBeat(endBeat).x + NOTE_LEAD
    return { index, bars, startBeat, endBeat, endX, noteIndices: [] }
  })
  // The last system closes where the music ends, others at their last bar line.
  systems.forEach((system) => {
    if (system.index < systemCount - 1) system.endX = barLocalX(system.bars.length)
  })

  const noteX: number[] = []
  const noteSystem: number[] = []
  starts.forEach((start, index) => {
    const point = xOfBeat(start)
    noteX.push(point.x)
    noteSystem.push(point.system)
    systems[point.system].noteIndices.push(index)
  })

  const width = Math.max(...systems.map((system) => system.endX)) + RIGHT_PAD

  const beatOfPoint = (x: number, systemIndex: number): number => {
    const system = systems[Math.min(Math.max(systemIndex, 0), systemCount - 1)]
    const localBar = Math.min(Math.max(Math.floor((x - leftInset) / barWidth), 0), system.bars.length - 1)
    const within = Math.min(Math.max((x - barLocalX(localBar) - NOTE_LEAD) / beatWidth, 0), beatsPerBar)
    return Math.min(system.bars[localBar].startBeat + within, totalBeats)
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
    noteX,
    noteSystem,
    systems,
    xOfBeat,
    beatOfPoint,
    noteIndexAtBeat,
  }
}
