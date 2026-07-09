CREATE TABLE "practice_profiles" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"scales_level" integer NOT NULL,
	"arpeggios_level" integer NOT NULL,
	"chords_level" integer NOT NULL,
	"standards_level" integer NOT NULL,
	"ears_level" integer NOT NULL,
	"minutes_per_day" integer NOT NULL,
	"onboarding_completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_profiles_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "practice_profile_goal_areas" (
	"clerk_user_id" text NOT NULL,
	"area" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "practice_profile_goal_areas_clerk_user_id_position_pk" PRIMARY KEY("clerk_user_id","position"),
	CONSTRAINT "practice_profile_goal_areas_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
DROP TABLE "mock_practice_rows";
