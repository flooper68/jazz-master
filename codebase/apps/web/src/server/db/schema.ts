import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  // How this user has the player set — sound and view, the whole object, read
  // back through appData/playerPrefs. Null until they have changed anything.
  playerPrefs: jsonb('player_prefs'),
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
    // How it went — 'again', 'hard', 'good' or 'easy'; null until the player says.
    difficulty: text('difficulty'),
    // How it felt — 'dragged', 'fine' or 'loved'; null when the player did not say,
    // which reads as 'fine'. Shapes the session, never the schedule.
    feel: text('feel'),
    // Groups the runs of one practice session (a quick run); no table of its own yet.
    sessionId: uuid('session_id'),
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
      'exercise_runs_difficulty_check',
      sql`${table.difficulty} in ('again', 'hard', 'good', 'easy')`,
    ),
    check(
      'exercise_runs_feel_check',
      sql`${table.feel} in ('dragged', 'fine', 'loved')`,
    ),
  ],
)

// What the user said about a whole sitting, in their own words. Runs already
// carry the session id they belong to and there is no sessions table, so that
// id keys the note too — one note per sitting, rewritten in place.
//
// **The key is the owner and the sitting together.** The session id arrives
// from the client, so keying on it alone would let one user's row sit where
// another's belongs: whoever wrote first would own that id for everyone. With
// the pair as the key, every write and every read is scoped by construction
// rather than by a predicate somebody has to remember to add.
export const sessionNotes = pgTable(
  'session_notes',
  {
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.clerkUserId, table.sessionId] }),
    index('session_notes_user_created_idx').on(table.clerkUserId, table.createdAt),
  ],
)

// A user's own exercises, beside the pack that ships in code. The exercise is
// stored whole: it is parsed against the library's schema on the way in and
// again on the way out, so the columns here are only what queries need.
export const userExercises = pgTable(
  'user_exercises',
  {
    id: uuid('id').primaryKey(),
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    exercise: jsonb('exercise').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('user_exercises_user_created_idx').on(
      table.clerkUserId,
      table.createdAt,
    ),
  ],
)

// A goal and the path to it, stored whole: the JSON is parsed
// against appData/goal's schema on the way in and again on the way out, so the
// columns here are only what queries need.
export const goals = pgTable(
  'goals',
  {
    id: uuid('id').primaryKey(),
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    goal: jsonb('goal').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('goals_user_created_idx').on(table.clerkUserId, table.createdAt)],
)

// What the teacher remembers about the player, reduced to one living document:
// preferences, skills, what they have learned, what bores them. One row per
// user, rewritten in place — the bio is the latest reduction, not a history.
// Never read by the scheduler: the practice stays a function of runs alone.
export const playerBios = pgTable('player_bios', {
  clerkUserId: text('clerk_user_id')
    .primaryKey()
    .references(() => users.clerkUserId, { onDelete: 'cascade' }),
  bio: text('bio').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// One summary per lesson — what was said, what was decided, why. Append-only:
// there is no update and no delete, because a record of a conversation that can
// be rewritten afterwards is not a record. The transcript lives elsewhere (or
// nowhere); this is what the next lesson actually reads.
export const playerLog = pgTable(
  'player_log',
  {
    id: uuid('id').primaryKey(),
    clerkUserId: text('clerk_user_id')
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    summary: text('summary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('player_log_user_created_idx').on(table.clerkUserId, table.createdAt),
    check(
      'player_log_kind_check',
      sql`${table.kind} in ('onboarding', 'after_session', 'on_demand', 'check_in')`,
    ),
  ],
)

// People who asked to join the beta from the public landing page. Not users:
// nobody here has an account yet, so nothing references the users table.
export const waitlistSignups = pgTable('waitlist_signups', {
  id: uuid('id').primaryKey(),
  // Trimmed and lower-cased on the way in, so one address joins once.
  email: text('email').notNull().unique(),
  // What they want to learn, in their own words; the landing page offers it, never requires it.
  goal: text('goal'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Server-only Drizzle schema entrypoint.
export const schema = {
  exerciseRuns,
  goals,
  playerBios,
  playerLog,
  sessionNotes,
  userExercises,
  users,
  waitlistSignups,
}
