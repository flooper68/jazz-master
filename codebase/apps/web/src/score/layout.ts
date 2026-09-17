import { noteStarts, passBeats, type TabNote } from '../content'

/**
 * The horizontal layout shared by every staff of a score: where each beat
 * and each note onset sits, and where the bar lines fall. Time is strictly
 * linear along a line — every beat is the same width, so a cursor moving
 * with the clock moves at one speed — and each bar line sits a little ahead
 * of its downbeat so the first note of a bar has room after it.
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

export const DEFAULT_BEAT_WIDTH = 56
/** Room between a bar line and the downbeat after it. */
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
  const naturalBarWidth = beatsPerBar * naturalBeatWidth
  let barsPerSystem = barCount
  let beatWidth = naturalBeatWidth
  if (availableWidth !== undefined) {
    const room = availableWidth - leftInset - NOTE_LEAD - RIGHT_PAD
    // A line that fits keeps its natural spacing; wrapped lines fill the width.
    if (barCount * naturalBarWidth > room) {
      barsPerSystem = Math.max(Math.floor(room / naturalBarWidth), 1)
      beatWidth = Math.max(room / barsPerSystem / beatsPerBar, naturalBeatWidth * 0.6)
    }
  }
  const barWidth = beatsPerBar * beatWidth
  const systemCount = Math.ceil(barCount / barsPerSystem)

  // A line's time axis: its first downbeat sits a lead past the opening bar line.
  const systemOf = (bar: number) => Math.floor(bar / barsPerSystem)
  const barLocalX = (localBar: number) => leftInset + localBar * barWidth

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
    // Closing bar line: a lead before the beat after the last one, like every bar line.
    const endX = barLocalX(bars.length - 1) + (endBeat - lastBar * beatsPerBar) * beatWidth
    return { index, bars, startBeat, endBeat, endX, noteIndices: [] }
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
    const beat = system.startBeat + (x - leftInset - NOTE_LEAD) / beatWidth
    return Math.min(Math.max(beat, system.startBeat), system.endBeat)
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
