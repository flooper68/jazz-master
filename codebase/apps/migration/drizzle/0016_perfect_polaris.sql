CREATE TABLE "session_notes" (
	"clerk_user_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_notes_clerk_user_id_session_id_pk" PRIMARY KEY("clerk_user_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "exercise_runs" ADD COLUMN "feel" text;--> statement-breakpoint
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_notes_user_created_idx" ON "session_notes" USING btree ("clerk_user_id","created_at");--> statement-breakpoint
ALTER TABLE "exercise_runs" ADD CONSTRAINT "exercise_runs_feel_check" CHECK ("exercise_runs"."feel" in ('dragged', 'fine', 'loved'));