import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  smallint,
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

export const exerciseRuns = pgTable(
  'exercise_runs',
  {
    id: uuid('id').primaryKey(),
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    tempoBpm: integer('tempo_bpm').notNull(),
    passes: integer('passes').notNull(),
    completed: boolean('completed').notNull(),
    // 1 (easy) to 10 (hard), never 7; null until the player says.
    rating: smallint('rating'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('exercise_runs_user_started_idx').on(
      table.clerkUserId,
      table.startedAt,
    ),
    check(
      'exercise_runs_duration_seconds_check',
      sql`${table.durationSeconds} >= 0`,
    ),
    check('exercise_runs_tempo_bpm_check', sql`${table.tempoBpm} > 0`),
    check('exercise_runs_passes_check', sql`${table.passes} >= 0`),
    check(
      'exercise_runs_rating_check',
      sql`${table.rating} between 1 and 10 and ${table.rating} <> 7`,
    ),
  ],
)

// Server-only Drizzle schema entrypoint.
export const schema = {
  exerciseRuns,
  users,
}
