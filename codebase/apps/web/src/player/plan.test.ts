import { describe, expect, it } from 'vitest'
import type { TabNote } from '../content'
import { createRun, tempoForPass, type RunPlan } from './plan'

const notes: TabNote[] = [
  { string: 5, fret: 3, beats: 1 }, // C3, beat 0
  { string: 4, fret: 0, beats: 1 }, // D3, beat 1
  { string: 4, fret: 2, beats: 0.5 }, // E3, beat 2
  { string: 4, fret: 3, beats: 0.5 }, // F3, beat 2.5
  { string: 3, fret: 0, beats: 1 }, // G3, beat 3
]

function plan(overrides: Partial<RunPlan> = {}): RunPlan {
  return {
    notes,
    beatsPerBar: 4,
    region: { startBeat: 0, endBeat: 4 },
    tempoBpm: 60,
    ladder: null,
    repeat: null,
    countInBeats: 0,
    ...overrides,
  }
}

describe('tempoForPass', () => {
  it('holds the tempo without a ladder and climbs with one until the target', () => {
    expect(tempoForPass(plan(), 7)).toBe(60)
    const climbing = plan({ ladder: { stepBpm: 10, everyPasses: 2, toBpm: 85 } })
    expect([0, 1, 2, 3, 4, 5, 6, 9].map((pass) => tempoForPass(climbing, pass))).toEqual([
      60, 60, 70, 70, 80, 80, 85, 85,
    ])
  })

  it('can also come down, and ignores a ladder that cannot move', () => {
    const falling = plan({ tempoBpm: 100, ladder: { stepBpm: -20, everyPasses: 1, toBpm: 70 } })
    expect([0, 1, 2, 3].map((pass) => tempoForPass(falling, pass))).toEqual([100, 80, 70, 70])
    expect(tempoForPass(plan({ ladder: { stepBpm: 0, everyPasses: 1, toBpm: 90 } }), 5)).toBe(60)
    expect(tempoForPass(plan({ ladder: { stepBpm: 5, everyPasses: 0, toBpm: 90 } }), 5)).toBe(60)
  })
})

describe('createRun', () => {
  it('moves the cursor through the region and wraps into the next pass', () => {
    const run = createRun(plan(), { beat: 0, pass: 0, time: 10 })
    expect(run.positionAt(10)).toMatchObject({ phase: 'playing', beat: 0, pass: 0, tempoBpm: 60 })
    expect(run.positionAt(12.5)).toMatchObject({ beat: 2.5, pass: 0 })
    expect(run.positionAt(14)).toMatchObject({ beat: 0, pass: 1 })
    expect(run.positionAt(19)).toMatchObject({ beat: 1, pass: 2 })
    expect(run.endTime).toBeNull()
  })

  it('starts a partial first pass from a seek and loops the region afterwards', () => {
    const run = createRun(plan({ region: { startBeat: 1, endBeat: 3 }, tempoBpm: 120 }), {
      beat: 2,
      pass: 4,
      time: 0,
    })
    expect(run.positionAt(0)).toMatchObject({ beat: 2, pass: 4 })
    // Beat 3 is reached after half a second; then full passes of one second.
    expect(run.positionAt(0.5)).toMatchObject({ beat: 1, pass: 5 })
    expect(run.positionAt(1.25)).toMatchObject({ beat: 2.5, pass: 5 })
    expect(run.timeOf(1, 1)).toBe(0.5)
    expect(run.timeOf(2, 2)).toBe(2)
  })

  it('finishes after the repeat count and reports done from then on', () => {
    const run = createRun(plan({ repeat: 2 }), { beat: 0, pass: 0, time: 0 })
    expect(run.endTime).toBe(8)
    expect(run.positionAt(7.9)).toMatchObject({ phase: 'playing', pass: 1 })
    expect(run.positionAt(7.9).beat).toBeCloseTo(3.9)
    expect(run.positionAt(8)).toMatchObject({ phase: 'done', beat: 4, pass: 2 })
    expect(run.positionAt(30)).toMatchObject({ phase: 'done', pass: 2 })
    // Passes already done count against the target.
    expect(createRun(plan({ repeat: 2 }), { beat: 0, pass: 2, time: 0 }).positionAt(0).phase).toBe('done')
  })

  it('counts in before the first pass, at the first pass tempo', () => {
    const run = createRun(plan({ countInBeats: 4, tempoBpm: 120 }), { beat: 1, pass: 0, time: 5 })
    expect(run.positionAt(5)).toMatchObject({ phase: 'count-in', beat: 1, countInBeatsLeft: 4 })
    expect(run.positionAt(6.5)).toMatchObject({ phase: 'count-in', countInBeatsLeft: 1 })
    expect(run.positionAt(7)).toMatchObject({ phase: 'playing', beat: 1, pass: 0 })
    const clicks = run.eventsBetween(5, 7).filter((event) => event.kind === 'click')
    expect(clicks.map((click) => click.time)).toEqual([5, 5.5, 6, 6.5])
    expect(clicks.map((click) => click.accent)).toEqual([true, false, false, false])
  })

  it('raises the tempo pass by pass on a ladder, so later passes are shorter', () => {
    const run = createRun(
      plan({ ladder: { stepBpm: 60, everyPasses: 1, toBpm: 240 }, repeat: 3 }),
      { beat: 0, pass: 0, time: 0 },
    )
    // 4 beats at 60, then at 120, then at 180: 4 s + 2 s + 1.333 s.
    expect(run.timeOf(1, 0)).toBe(4)
    expect(run.timeOf(2, 0)).toBe(6)
    expect(run.endTime).toBeCloseTo(7.3333)
    expect(run.positionAt(5).tempoBpm).toBe(120)
    expect(run.positionAt(5)).toMatchObject({ beat: 2, pass: 1 })
  })

  it('lists clicks and note onsets in a window, accenting the downbeat', () => {
    const run = createRun(plan(), { beat: 0, pass: 0, time: 0 })
    const events = run.eventsBetween(0, 4.5)
    expect(events.map((event) => `${event.kind}@${event.time}`)).toEqual([
      'click@0', 'note@0', 'click@1', 'note@1', 'click@2', 'note@2', 'note@2.5',
      'click@3', 'note@3', 'click@4', 'note@4',
    ])
    expect(events[0]).toMatchObject({ kind: 'click', accent: true, pass: 0 })
    expect(events[2]).toMatchObject({ kind: 'click', accent: false })
    expect(events[1]).toMatchObject({ kind: 'note', noteIndex: 0, midi: 48, seconds: 1 })
    expect(events[6]).toMatchObject({ kind: 'note', noteIndex: 3, midi: 53, seconds: 0.5 })
    expect(events[10]).toMatchObject({ kind: 'note', noteIndex: 0, pass: 1 })
    expect(run.eventsBetween(2, 2)).toEqual([])
  })

  it('only sounds notes that start inside the region, cut to its end', () => {
    const run = createRun(plan({ region: { startBeat: 1.5, endBeat: 2.75 } }), {
      beat: 1.5,
      pass: 0,
      time: 0,
    })
    const events = run.eventsBetween(0, 1.25)
    expect(events.map((event) => `${event.kind}@${event.time}`)).toEqual([
      'click@0.5', 'note@0.5', 'note@1',
    ])
    // The eighth at beat 2.5 runs past the region end at 2.75: a sixteenth.
    expect(events[2]).toMatchObject({ noteIndex: 3, seconds: 0.25 })
  })

  it('stops listing events after the last pass', () => {
    const run = createRun(plan({ repeat: 1 }), { beat: 0, pass: 0, time: 0 })
    expect(run.eventsBetween(3.5, 10).map((event) => event.time)).toEqual([])
    expect(run.eventsBetween(2.5, 10).map((event) => `${event.kind}@${event.time}`)).toEqual([
      'note@2.5', 'click@3', 'note@3',
    ])
  })

  it('refuses an empty region', () => {
    expect(() =>
      createRun(plan({ region: { startBeat: 2, endBeat: 2 } }), { beat: 2, pass: 0, time: 0 }),
    ).toThrow('non-empty region')
  })
})
