CREATE TABLE "play_along_tempos" (
	"clerk_user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"tempo_bpm" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "play_along_tempos_clerk_user_id_exercise_id_pk" PRIMARY KEY("clerk_user_id","exercise_id"),
	CONSTRAINT "play_along_tempos_tempo_bpm_check" CHECK ("play_along_tempos"."tempo_bpm" >= 40 and "play_along_tempos"."tempo_bpm" <= 200)
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"notation_display_mode" text NOT NULL,
	"scoring_tolerance" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_notation_display_mode_check" CHECK ("user_preferences"."notation_display_mode" in ('both', 'staff', 'tab')),
	CONSTRAINT "user_preferences_scoring_tolerance_check" CHECK ("user_preferences"."scoring_tolerance" in ('lenient', 'standard', 'strict'))
);
--> statement-breakpoint
ALTER TABLE "play_along_tempos" ADD CONSTRAINT "play_along_tempos_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;