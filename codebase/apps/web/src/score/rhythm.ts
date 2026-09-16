/**
 * Rhythmic notation shared by the tab (stems under the strings) and the
 * staff: which head, stem and flags a duration gets, and which notes beam
 * together.
 */

export type NoteHead = 'whole' | 'half' | 'black'

export interface NoteGlyph {
  head: NoteHead
  stem: boolean
  /** Flags (or beams) — 0 for a quarter and longer, 1 for eighths, 2 for sixteenths. */
  flags: 0 | 1 | 2
  dot: boolean
}

const GLYPHS: ReadonlyArray<[beats: number, glyph: NoteGlyph]> = [
  [4, { head: 'whole', stem: false, flags: 0, dot: false }],
  [3, { head: 'half', stem: true, flags: 0, dot: true }],
  [2, { head: 'half', stem: true, flags: 0, dot: false }],
  [1.5, { head: 'black', stem: true, flags: 0, dot: true }],
  [1, { head: 'black', stem: true, flags: 0, dot: false }],
  [0.75, { head: 'black', stem: true, flags: 1, dot: true }],
  [0.5, { head: 'black', stem: true, flags: 1, dot: false }],
  [0.375, { head: 'black', stem: true, flags: 2, dot: true }],
  [0.25, { head: 'black', stem: true, flags: 2, dot: false }],
]

/** The glyph for a length in beats; an unusual length draws as the nearest shorter standard value. */
export function noteGlyph(beats: number): NoteGlyph {
  for (const [length, glyph] of GLYPHS) {
    if (Math.abs(beats - length) < 1e-6) return glyph
  }
  const shorter = GLYPHS.find(([length]) => length < beats)
  return shorter ? { ...shorter[1], dot: false } : GLYPHS[GLYPHS.length - 1][1]
}

/**
 * Beam groups: runs of adjacent flagged notes that fall inside the same
 * beaming unit — half a bar when the bar divides in two, else one beat. A
 * lone flagged note keeps its flag.
 */
export function beamGroups(
  beatsList: readonly number[],
  starts: readonly number[],
  beatsPerBar: number,
): number[][] {
  const unit = beatsPerBar % 2 === 0 ? 2 : 1
  const groups: number[][] = []
  let current: number[] = []
  const flush = () => {
    if (current.length > 1) groups.push(current)
    current = []
  }
  for (let i = 0; i < beatsList.length; i += 1) {
    const flagged = noteGlyph(beatsList[i]).flags > 0
    if (!flagged) {
      flush()
      continue
    }
    const unitIndex = Math.floor(starts[i] / unit + 1e-9)
    const previous = current.at(-1)
    if (previous !== undefined && Math.floor(starts[previous] / unit + 1e-9) !== unitIndex) flush()
    current.push(i)
  }
  flush()
  return groups
}
