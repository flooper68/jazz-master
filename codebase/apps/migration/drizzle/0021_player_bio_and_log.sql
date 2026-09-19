-- The teacher's memory of a player (ADR-023, next-session-design §10): the bio
-- it rewrites, and the log it only appends to.
--
-- Safe in either order with respect to the code: both tables are additive and
-- nothing reads them until the lesson endpoint ships. Neither is ever read by
-- the scheduler — the practice stays a function of runs, the catalogue, the
-- paths and the clock, so a bio cannot move a due date.
CREATE TABLE "player_bios" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"bio" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"kind" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_log_kind_check" CHECK ("player_log"."kind" in ('onboarding', 'after_session', 'on_demand', 'check_in'))
);
--> statement-breakpoint
ALTER TABLE "player_bios" ADD CONSTRAINT "player_bios_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_log" ADD CONSTRAINT "player_log_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_log_user_created_idx" ON "player_log" USING btree ("clerk_user_id","created_at");
