import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  pgTable,
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

// Dormant: rows are runs of the retired lesson model and nothing reads or
// writes them. Kept so no migration is generated; exercise runs replace it.
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
    exercisesCompleted: integer('exercises_completed').notNull().default(0),
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
      'practice_sessions_exercises_completed_check',
      sql`${table.exercisesCompleted} >= 0`,
    ),
  ],
)

// Server-only Drizzle schema entrypoint.
export const schema = {
  practiceSessions,
  users,
}
