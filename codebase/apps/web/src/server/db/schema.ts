import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const mockPracticeRows = pgTable('mock_practice_rows', {
  id: uuid('id').primaryKey(),
  exerciseSlug: text('exercise_slug').notNull(),
  exerciseTitle: text('exercise_title').notNull(),
  minutes: integer('minutes').notNull(),
  focus: text('focus'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Server-only Drizzle schema entrypoint. Product practice state remains local
// until ADR-012 and TASK-063 deliberately move a real slice to Postgres.
export const schema = {
  mockPracticeRows,
  users,
}
