CREATE TABLE "exercise_priorities" (
	"clerk_user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"priority" text NOT NULL,
	"target_override_bpm" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_priorities_clerk_user_id_exercise_id_pk" PRIMARY KEY("clerk_user_id","exercise_id"),
	CONSTRAINT "exercise_priorities_priority_check" CHECK ("exercise_priorities"."priority" in ('pinned', 'boosted', 'muted')),
	CONSTRAINT "exercise_priorities_target_check" CHECK ("exercise_priorities"."target_override_bpm" is null or "exercise_priorities"."target_override_bpm" > 0)
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"goal" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_priorities" ADD CONSTRAINT "exercise_priorities_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_user_created_idx" ON "goals" USING btree ("clerk_user_id","created_at");