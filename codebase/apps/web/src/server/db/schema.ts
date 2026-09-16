import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
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
  },
  (table) => [
    primaryKey({
      columns: [table.sessionId, table.position],
    }),
    check(
      'practice_session_results_grade_check',
      sql`${table.grade} in ('got-it', 'shaky', 'missed')`,
    ),
  ],
)

// Server-only Drizzle schema entrypoint.
export const schema = {
  practiceSessionResults,
  practiceSessions,
  users,
}
