-- ORDER MATTERS: deploy the code that no longer knows these columns BEFORE
-- running this. `server/db/users.ts` selects the whole `users` row, which
-- Drizzle expands to the running build's column list — so an older bundle
-- talking to a migrated database raises `42703 column users.starter_routines_at
-- does not exist` on `users.ensure`, which is every sign-in. The normal order
-- holds this (Cloudflare deploys on push; migrations are run afterwards from
-- Railway), but a rollback to a pre-ADR-021 build would need the column back.
-- Neither statement is reversible and nothing was exported first: routines
-- went with the concept (ADR-021, owner decision 2026-09-19).
DROP TABLE "practice_routines" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "starter_routines_at";