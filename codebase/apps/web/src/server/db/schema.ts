import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
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

// Server-only Drizzle schema entrypoint.
export const schema = {
  practiceProfileGoalAreas,
  practiceProfiles,
  users,
}
