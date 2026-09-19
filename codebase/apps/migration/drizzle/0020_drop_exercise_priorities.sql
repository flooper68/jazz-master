-- ORDER MATTERS: deploy the code that no longer reads this table BEFORE
-- running it. The goals router used to return `priorities` alongside the
-- goals on every `goals.list`, so an older bundle talking to a migrated
-- database raises `42P01 relation "exercise_priorities" does not exist` on
-- the home card's first query — which is every signed-in page load.
-- Not reversible and nothing was exported first: pin, boost, mute and the
-- per-exercise target override went with the concept (ADR-022, owner
-- decision 2026-09-19). What they did, the teacher now does by editing the
-- path in a lesson.
DROP TABLE "exercise_priorities" CASCADE;
