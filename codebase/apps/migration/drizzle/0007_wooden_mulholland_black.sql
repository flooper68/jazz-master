ALTER TABLE "practice_session_results" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "practice_session_results" CASCADE;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD COLUMN "exercises_completed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_exercises_completed_check" CHECK ("practice_sessions"."exercises_completed" >= 0);