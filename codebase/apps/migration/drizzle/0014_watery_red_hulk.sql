ALTER TABLE "exercise_runs" ADD COLUMN "difficulty" text;--> statement-breakpoint
ALTER TABLE "exercise_runs" ADD CONSTRAINT "exercise_runs_difficulty_check" CHECK ("exercise_runs"."difficulty" in ('again', 'hard', 'good', 'easy'));--> statement-breakpoint
-- JM-4: the 1–10 rating becomes Anki's four (next-session-design §5).
-- 1–3 → easy, 4–6 → good, 8–9 → hard, 10 → again; 7 was never on offer.
UPDATE "exercise_runs" SET "difficulty" = CASE
  WHEN "rating" BETWEEN 1 AND 3 THEN 'easy'
  WHEN "rating" BETWEEN 4 AND 6 THEN 'good'
  WHEN "rating" BETWEEN 8 AND 9 THEN 'hard'
  WHEN "rating" = 10 THEN 'again'
END WHERE "rating" IS NOT NULL;
