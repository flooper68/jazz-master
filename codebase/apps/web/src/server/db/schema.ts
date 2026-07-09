import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const practiceProfiles = pgTable('practice_profiles', {
  clerkUserId: text('clerk_user_id')
    .primaryKey()
    .references(() => users.clerkUserId, { onDelete: 'cascade' }),
  scalesLevel: integer('scales_level').notNull(),
  arpeggiosLevel: integer('arpeggios_level').notNull(),
  chordsLevel: integer('chords_level').notNull(),
  standardsLevel: integer('standards_level').notNull(),
  earsLevel: integer('ears_level').notNull(),
  minutesPerDay: integer('minutes_per_day').notNull(),
  onboardingCompletedAt: timestamp('onboarding_completed_at', {
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const userPreferences = pgTable(
  'user_preferences',
  {
    clerkUserId: text('clerk_user_id')
      .primaryKey()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    notationDisplayMode: text('notation_display_mode').notNull(),
    scoringTolerance: text('scoring_tolerance').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'user_preferences_notation_display_mode_check',
      sql`${table.notationDisplayMode} in ('both', 'staff', 'tab')`,
    ),
    check(
      'user_preferences_scoring_tolerance_check',
      sql`${table.scoringTolerance} in ('lenient', 'standard', 'strict')`,
    ),
  ],
)

export const playAlongTempos = pgTable(
  'play_along_tempos',
  {
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    tempoBpm: integer('tempo_bpm').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.clerkUserId, table.exerciseId] }),
    check(
      'play_along_tempos_tempo_bpm_check',
      sql`${table.tempoBpm} >= 40 and ${table.tempoBpm} <= 200`,
    ),
  ],
)

export const practiceProfileGoalAreas = pgTable(
  'practice_profile_goal_areas',
  {
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    area: text('area').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.clerkUserId, table.position],
    }),
  ],
)

export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid('id').primaryKey(),
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    completed: boolean('completed').notNull(),
    score: integer('score'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'practice_sessions_duration_seconds_check',
      sql`${table.durationSeconds} >= 0`,
    ),
    check(
      'practice_sessions_score_check',
      sql`${table.score} is null or (${table.score} >= 0 and ${table.score} <= 100)`,
    ),
  ],
)

export const practiceSessionResults = pgTable(
  'practice_session_results',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => practiceSessions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    exerciseId: text('exercise_id').notNull(),
    grade: text('grade').notNull(),
    score: integer('score'),
    tolerance: text('tolerance'),
    pitchScore: integer('pitch_score'),
    timingScore: integer('timing_score'),
    completenessScore: integer('completeness_score'),
    extras: integer('extras'),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  },
  (table) => [
    primaryKey({
      columns: [table.sessionId, table.position],
    }),
    check(
      'practice_session_results_grade_check',
      sql`${table.grade} in ('got-it', 'shaky', 'missed')`,
    ),
    check(
      'practice_session_results_tolerance_check',
      sql`${table.tolerance} is null or ${table.tolerance} in ('lenient', 'standard', 'strict')`,
    ),
    check(
      'practice_session_results_score_check',
      sql`${table.score} is null or (${table.score} >= 0 and ${table.score} <= 100)`,
    ),
    check(
      'practice_session_results_pitch_score_check',
      sql`${table.pitchScore} is null or (${table.pitchScore} >= 0 and ${table.pitchScore} <= 100)`,
    ),
    check(
      'practice_session_results_timing_score_check',
      sql`${table.timingScore} is null or (${table.timingScore} >= 0 and ${table.timingScore} <= 100)`,
    ),
    check(
      'practice_session_results_completeness_score_check',
      sql`${table.completenessScore} is null or (${table.completenessScore} >= 0 and ${table.completenessScore} <= 100)`,
    ),
    check(
      'practice_session_results_extras_check',
      sql`${table.extras} is null or ${table.extras} >= 0`,
    ),
  ],
)

export const practiceSessionScoreNotes = pgTable(
  'practice_session_score_notes',
  {
    sessionId: uuid('session_id').notNull(),
    resultPosition: integer('result_position').notNull(),
    notePosition: integer('note_position').notNull(),
    expectedId: text('expected_id').notNull(),
    expectedNote: text('expected_note').notNull(),
    verdict: text('verdict').notNull(),
    timingOffsetSeconds: doublePrecision('timing_offset_seconds'),
    pitchCents: integer('pitch_cents'),
  },
  (table) => [
    primaryKey({
      columns: [table.sessionId, table.resultPosition, table.notePosition],
    }),
    foreignKey({
      columns: [table.sessionId, table.resultPosition],
      foreignColumns: [
        practiceSessionResults.sessionId,
        practiceSessionResults.position,
      ],
    }).onDelete('cascade'),
    check(
      'practice_session_score_notes_verdict_check',
      sql`${table.verdict} in ('correct', 'early', 'late', 'wrong-pitch', 'missed')`,
    ),
  ],
)

// Server-only Drizzle schema entrypoint.
export const schema = {
  playAlongTempos,
  practiceSessionResults,
  practiceSessionScoreNotes,
  practiceSessions,
  practiceProfileGoalAreas,
  practiceProfiles,
  userPreferences,
  users,
}
