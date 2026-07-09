CREATE TABLE "mock_practice_rows" (
	"id" uuid PRIMARY KEY NOT NULL,
	"exercise_slug" text NOT NULL,
	"exercise_title" text NOT NULL,
	"minutes" integer NOT NULL,
	"focus" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
