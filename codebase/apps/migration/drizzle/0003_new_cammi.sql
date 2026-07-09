CREATE TABLE "practice_session_results" (
	"session_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"exercise_id" text NOT NULL,
	"grade" text NOT NULL,
	"score" integer,
	"tolerance" text,
	"pitch_score" integer,
	"timing_score" integer,
	"completeness_score" integer,
	"extras" integer,
	"analyzed_at" timestamp with time zone,
	CONSTRAINT "practice_session_results_session_id_position_pk" PRIMARY KEY("session_id","position"),
	CONSTRAINT "practice_session_results_grade_check" CHECK ("practice_session_results"."grade" in ('got-it', 'shaky', 'missed')),
	CONSTRAINT "practice_session_results_tolerance_check" CHECK ("practice_session_results"."tolerance" is null or "practice_session_results"."tolerance" in ('lenient', 'standard', 'strict')),
	CONSTRAINT "practice_session_results_score_check" CHECK ("practice_session_results"."score" is null or ("practice_session_results"."score" >= 0 and "practice_session_results"."score" <= 100))
);
--> statement-breakpoint
CREATE TABLE "practice_session_score_notes" (
	"session_id" uuid NOT NULL,
	"result_position" integer NOT NULL,
	"note_position" integer NOT NULL,
	"expected_id" text NOT NULL,
	"expected_note" text NOT NULL,
	"verdict" text NOT NULL,
	"timing_offset_seconds" double precision,
	"pitch_cents" integer,
	CONSTRAINT "practice_session_score_notes_session_id_result_position_note_position_pk" PRIMARY KEY("session_id","result_position","note_position"),
	CONSTRAINT "practice_session_score_notes_verdict_check" CHECK ("practice_session_score_notes"."verdict" in ('correct', 'early', 'late', 'wrong-pitch', 'missed'))
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer NOT NULL,
	"completed" boolean NOT NULL,
	"score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_sessions_duration_seconds_check" CHECK ("practice_sessions"."duration_seconds" >= 0),
	CONSTRAINT "practice_sessions_score_check" CHECK ("practice_sessions"."score" is null or ("practice_sessions"."score" >= 0 and "practice_sessions"."score" <= 100))
);
--> statement-breakpoint
ALTER TABLE "practice_session_results" ADD CONSTRAINT "practice_session_results_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_score_notes" ADD CONSTRAINT "practice_session_score_notes_session_id_result_position_practice_session_results_session_id_position_fk" FOREIGN KEY ("session_id","result_position") REFERENCES "public"."practice_session_results"("session_id","position") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;