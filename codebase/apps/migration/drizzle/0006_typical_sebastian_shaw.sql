ALTER TABLE "play_along_tempos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "practice_profile_goal_areas" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "practice_profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "practice_session_score_notes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_preferences" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "play_along_tempos" CASCADE;--> statement-breakpoint
DROP TABLE "practice_profile_goal_areas" CASCADE;--> statement-breakpoint
DROP TABLE "practice_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "practice_session_score_notes" CASCADE;--> statement-breakpoint
DROP TABLE "user_preferences" CASCADE;--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP CONSTRAINT "practice_session_results_tolerance_check";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP CONSTRAINT "practice_session_results_score_check";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP CONSTRAINT "practice_session_results_pitch_score_check";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP CONSTRAINT "practice_session_results_timing_score_check";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP CONSTRAINT "practice_session_results_completeness_score_check";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP CONSTRAINT "practice_session_results_extras_check";--> statement-breakpoint
ALTER TABLE "practice_sessions" DROP CONSTRAINT "practice_sessions_score_check";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP COLUMN "score";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP COLUMN "tolerance";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP COLUMN "pitch_score";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP COLUMN "timing_score";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP COLUMN "completeness_score";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP COLUMN "extras";--> statement-breakpoint
ALTER TABLE "practice_session_results" DROP COLUMN "analyzed_at";--> statement-breakpoint
ALTER TABLE "practice_sessions" DROP COLUMN "score";