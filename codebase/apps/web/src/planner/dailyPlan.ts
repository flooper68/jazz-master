import type { Lesson, LessonArea } from '../content'
import { defaultProfile } from '../appData/profile'
import type { PracticeArea, PracticeProfile } from '../appData/profile'
import type { ExerciseGrade, PracticeSession } from '../appData/session'

const DAY_MS = 24 * 60 * 60 * 1000
const NEEDS_ATTENTION_GRADES = new Set<ExerciseGrade>(['shaky', 'missed'])

export interface PlanItem {
  lessonId: string
  lessonTitle: string
  area: LessonArea
  estimatedMinutes: number
  reason: string
}

export interface DailyPlan {
  date: string
  totalMinutes: number
  items: PlanItem[]
}

interface LessonCandidate {
  lesson: Lesson
  reason: string
  needsAttention: boolean
}

export function toPlanDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function generatePlan(
  profile: PracticeProfile | null,
  history: readonly PracticeSession[],
  lessons: readonly Lesson[],
  date: Date,
): DailyPlan {
  const resolvedProfile = profile ?? defaultProfile(date.toISOString())
  const lessonAreas = unique(lessons.map((lesson) => lesson.area))
  const areaOrder = orderAreasForDate(
    lessonAreas,
    resolvedProfile.goalAreas,
    toPlanDate(date),
  )
  const completedLessonIds = new Set(
    history
      .filter((session) => session.completed)
      .map((session) => session.lessonId),
  )
  const latestByLesson = latestSessionsByLesson(history)
  const lessonOrder = new Map(lessons.map((lesson, index) => [lesson.id, index]))
  const selectedLessonIds = new Set<string>()
  const items: PlanItem[] = []
  let totalMinutes = 0

  while (true) {
    let addedThisRound = false

    for (const area of areaOrder) {
      const candidate = bestCandidateForArea({
        area,
        profile: resolvedProfile,
        lessons,
        historyByLesson: latestByLesson,
        completedLessonIds,
        selectedLessonIds,
        lessonOrder,
      })
      if (!candidate) continue
      const wouldExceed = totalMinutes + candidate.lesson.estimatedMinutes > resolvedProfile.minutesPerDay
      if (wouldExceed && items.length > 0) continue

      items.push({
        lessonId: candidate.lesson.id,
        lessonTitle: candidate.lesson.title,
        area: candidate.lesson.area,
        estimatedMinutes: candidate.lesson.estimatedMinutes,
        reason: candidate.reason,
      })
      selectedLessonIds.add(candidate.lesson.id)
      totalMinutes += candidate.lesson.estimatedMinutes
      addedThisRound = true
    }

    if (!addedThisRound) break
  }

  return { date: toPlanDate(date), totalMinutes, items }
}

function bestCandidateForArea({
  area,
  profile,
  lessons,
  historyByLesson,
  completedLessonIds,
  selectedLessonIds,
  lessonOrder,
}: {
  area: LessonArea
  profile: PracticeProfile
  lessons: readonly Lesson[]
  historyByLesson: Map<string, PracticeSession>
  completedLessonIds: Set<string>
  selectedLessonIds: Set<string>
  lessonOrder: Map<string, number>
}): LessonCandidate | null {
  const targetLevel = profile.levels[area as PracticeArea] ?? 1
  const goalRank = profile.goalAreas.indexOf(area as PracticeArea)
  const candidates = lessons
    .filter((lesson) => {
      if (lesson.area !== area) return false
      if (selectedLessonIds.has(lesson.id)) return false
      if (lesson.level > targetLevel) return false
      return lesson.prerequisites.every((id) => completedLessonIds.has(id))
    })
    .map((lesson) => {
      const latest = historyByLesson.get(lesson.id)
      const attentionGrade = attentionGradeFor(latest)
      const needsAttention = attentionGrade !== undefined
      return {
        lesson,
        needsAttention,
        reason: reasonForLesson({
          lesson,
          latest,
          attentionGrade,
          isGoalArea: goalRank !== -1,
        }),
      }
    })

  if (candidates.length === 0) return null

  return candidates.sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) {
      return a.needsAttention ? -1 : 1
    }
    const aCompleted = completedLessonIds.has(a.lesson.id)
    const bCompleted = completedLessonIds.has(b.lesson.id)
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1
    return (lessonOrder.get(a.lesson.id) ?? 0) - (lessonOrder.get(b.lesson.id) ?? 0)
  })[0]
}

function reasonForLesson({
  lesson,
  latest,
  attentionGrade,
  isGoalArea,
}: {
  lesson: Lesson
  latest: PracticeSession | undefined
  attentionGrade: 'shaky' | 'missed' | undefined
  isGoalArea: boolean
}): string {
  if (latest && attentionGrade) {
    return `${lesson.title} was ${formatGrade(attentionGrade)} on ${formatSessionDay(latest.startedAt)}.`
  }
  if (!latest) {
    return isGoalArea
      ? `Starts your ${lesson.area} goal at level ${lesson.level}.`
      : `Keeps ${lesson.area} rotating into your practice.`
  }
  return `Reviews ${lesson.area} at level ${lesson.level} so the area stays fresh.`
}

function latestSessionsByLesson(
  history: readonly PracticeSession[],
): Map<string, PracticeSession> {
  const latest = new Map<string, PracticeSession>()
  for (const session of history) {
    const existing = latest.get(session.lessonId)
    if (
      !existing ||
      Date.parse(session.startedAt) > Date.parse(existing.startedAt)
    ) {
      latest.set(session.lessonId, session)
    }
  }
  return latest
}

function orderAreasForDate(
  lessonAreas: readonly LessonArea[],
  goalAreas: readonly PracticeArea[],
  date: string,
): LessonArea[] {
  const lessonAreaSet = new Set<LessonArea>(lessonAreas)
  const goalLessonAreas = goalAreas.filter((area): area is LessonArea =>
    lessonAreaSet.has(area as LessonArea),
  )
  const otherAreas = lessonAreas.filter(
    (area) => !goalLessonAreas.includes(area),
  )
  const primaryAreas = goalLessonAreas.length > 0 ? goalLessonAreas : lessonAreas
  const rotatedPrimary = rotate(primaryAreas, dayOrdinal(date))
  return [...rotatedPrimary, ...otherAreas]
}

function rotate<T>(items: readonly T[], offset: number): T[] {
  if (items.length === 0) return []
  const start = offset % items.length
  return [...items.slice(start), ...items.slice(0, start)]
}

function dayOrdinal(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)]
}

function formatGrade(grade: 'shaky' | 'missed'): string {
  return grade
}

function isAttentionGrade(grade: ExerciseGrade): grade is 'shaky' | 'missed' {
  return NEEDS_ATTENTION_GRADES.has(grade)
}

function attentionGradeFor(
  session: PracticeSession | undefined,
): 'shaky' | 'missed' | undefined {
  for (const result of session?.results ?? []) {
    if (isAttentionGrade(result.grade)) return result.grade
  }
  return undefined
}

function formatSessionDay(startedAt: string): string {
  const date = new Date(startedAt)
  if (Number.isNaN(date.getTime())) return 'your last session'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(date)
}
