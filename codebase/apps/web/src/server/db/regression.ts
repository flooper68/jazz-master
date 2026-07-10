import { isDeepStrictEqual } from 'node:util'
import type { PracticeProfile } from '../../appData/profile'
import type { PracticeSession } from '../../appData/session'
import { createPreferenceRepository } from './preferences'
import { createProfileRepository } from './profiles'
import { createSessionRepository } from './sessions'

const REGRESSION_USER_ID = 'user_task072_regression'
const SCORED_SESSION_ID = '07200000-0000-4000-8000-000000000001'
const INCOMPLETE_SESSION_ID = '07200000-0000-4000-8000-000000000002'
const EXERCISE_ID = 'scales-major-open-c'

const profile: PracticeProfile = {
  levels: {
    scales: 2,
    arpeggios: 1,
    chords: 1,
    standards: 1,
    ears: 1,
  },
  goalAreas: ['scales', 'arpeggios'],
  minutesPerDay: 30,
  createdAt: '2026-07-10T00:00:00.000Z',
}

const scoredSession: PracticeSession = {
  id: SCORED_SESSION_ID,
  lessonId: 'scales-major-open',
  startedAt: '2026-07-10T00:10:00.000Z',
  durationSeconds: 90,
  completed: true,
  score: 92,
  results: [
    {
      exerciseId: EXERCISE_ID,
      grade: 'got-it',
      score: {
        score: 92,
        tolerance: 'strict',
        components: { pitch: 100, timing: 83, completeness: 100 },
        perNote: [
          {
            expectedId: `${EXERCISE_ID}-0`,
            expectedNote: 'C',
            verdict: 'correct',
            timingOffsetSeconds: 0.01,
            pitchCents: 2,
          },
        ],
        extras: 0,
        analyzedAt: '2026-07-10T00:11:30.000Z',
      },
    },
  ],
}

const incompleteSession: PracticeSession = {
  id: INCOMPLETE_SESSION_ID,
  lessonId: 'scales-major-open',
  startedAt: '2026-07-10T00:20:00.000Z',
  durationSeconds: 30,
  completed: false,
  results: [{ exerciseId: EXERCISE_ID, grade: 'shaky' }],
}

export async function runDatabaseRegression(): Promise<void> {
  const profileRepository = createProfileRepository()
  const preferenceRepository = createPreferenceRepository()
  const sessionRepository = createSessionRepository()

  if (!profileRepository || !preferenceRepository || !sessionRepository) {
    throw new Error('DATABASE_URL is required for the database regression')
  }

  await profileRepository.saveProfile(REGRESSION_USER_ID, profile)
  await preferenceRepository.setNotationDisplayMode(REGRESSION_USER_ID, 'staff')
  await preferenceRepository.setScoringTolerance(REGRESSION_USER_ID, 'strict')
  await preferenceRepository.setPlayAlongTempo(
    REGRESSION_USER_ID,
    EXERCISE_ID,
    72,
  )
  await sessionRepository.upsertSession(REGRESSION_USER_ID, scoredSession)
  await sessionRepository.upsertSession(REGRESSION_USER_ID, incompleteSession)

  const restoredProfile = await requiredProfileRepository().getProfile(
    REGRESSION_USER_ID,
  )
  const restoredPreferences =
    await requiredPreferenceRepository().getPreferences(REGRESSION_USER_ID)
  const restoredSessions =
    await requiredSessionRepository().listSessions(REGRESSION_USER_ID)
  const restoredScore = restoredSessions.find(
    (session) => session.id === SCORED_SESSION_ID,
  )
  const restoredIncomplete = restoredSessions.find(
    (session) => session.id === INCOMPLETE_SESSION_ID,
  )

  if (!restoredScore || !restoredIncomplete) {
    throw new Error('regression sessions were not returned')
  }

  assertEqual(restoredProfile, profile, 'profile round-trip')
  assertEqual(
    restoredPreferences,
    {
      notationDisplayMode: 'staff',
      scoringTolerance: 'strict',
      playAlongTempos: { [EXERCISE_ID]: 72 },
    },
    'preference round-trip',
  )
  assertEqual(restoredScore, scoredSession, 'machine-score round-trip')
  assertEqual(restoredIncomplete, incompleteSession, 'incomplete-session round-trip')

  console.log(
    JSON.stringify({
      profile: 'ok',
      preferences: 'ok',
      completedScore: restoredScore.score,
      normalizedScoreNotes: restoredScore.results[0]?.score?.perNote.length,
      incompleteSession: !restoredIncomplete.completed,
    }),
  )
}

function requiredProfileRepository() {
  const repository = createProfileRepository()
  if (!repository) throw new Error('DATABASE_URL is required for profile reads')
  return repository
}

function requiredPreferenceRepository() {
  const repository = createPreferenceRepository()
  if (!repository) {
    throw new Error('DATABASE_URL is required for preference reads')
  }
  return repository
}

function requiredSessionRepository() {
  const repository = createSessionRepository()
  if (!repository) throw new Error('DATABASE_URL is required for session reads')
  return repository
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${label} mismatch`)
  }
}

if (import.meta.main) {
  await runDatabaseRegression()
}
