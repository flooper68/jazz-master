import type { Exercise } from '../content'

/**
 * The order to offer never-played exercises in: easiest first, and within a
 * level one from each area in turn. In a pack of many exercises the first
 * three in list order are three of the same kind; a newcomer should be shown
 * a drill, a scale and a pattern, not three spiders.
 */
export function firstPicks(exercises: readonly Exercise[]): Exercise[] {
  const levels = [...new Set(exercises.map((exercise) => exercise.level))].sort((a, b) => a - b)
  return levels.flatMap((level) => {
    const byArea = new Map<string, Exercise[]>()
    for (const exercise of exercises) {
      if (exercise.level !== level) continue
      const queue = byArea.get(exercise.area)
      if (queue) queue.push(exercise)
      else byArea.set(exercise.area, [exercise])
    }
    const queues = [...byArea.values()]
    const turns = Math.max(0, ...queues.map((queue) => queue.length))
    return Array.from({ length: turns }, (_, turn) => queues.flatMap((queue) => queue[turn] ?? [])).flat()
  })
}
