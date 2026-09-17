CREATE TABLE "exercise_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer NOT NULL,
	"tempo_bpm" integer NOT NULL,
	"passes" integer NOT NULL,
	"completed" boolean NOT NULL,
	"rating" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_runs_duration_seconds_check" CHECK ("exercise_runs"."duration_seconds" >= 0),
	CONSTRAINT "exercise_runs_tempo_bpm_check" CHECK ("exercise_runs"."tempo_bpm" > 0),
	CONSTRAINT "exercise_runs_passes_check" CHECK ("exercise_runs"."passes" >= 0),
	CONSTRAINT "exercise_runs_rating_check" CHECK ("exercise_runs"."rating" between 1 and 10 and "exercise_runs"."rating" <> 7)
);
--> statement-breakpoint
DROP TABLE "practice_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "exercise_runs" ADD CONSTRAINT "exercise_runs_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_runs_user_started_idx" ON "exercise_runs" USING btree ("clerk_user_id","started_at");