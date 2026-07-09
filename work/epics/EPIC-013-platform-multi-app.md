---
id: EPIC-013
title: Platform & multi-app architecture
vision: VIS-001
status: in-progress
created: 2026-07-05
---

# EPIC-013 — Platform & multi-app architecture

## Goal

A repository and runtime platform that supports multiple apps sharing the domain core: knowledge at the repo root, code as a Bun-workspaces monorepo under `codebase/` (ADR-005), and the web app migrated to Astro on Cloudflare Workers with a typed tRPC surface (RES-002, ADR-006 — written, `proposed`). The current extension of the epic moves Jazz Master from browser-local app data to Clerk-authenticated, server-owned Postgres persistence for all current features.

## Why this matters now

The owner has decided the product grows beyond one web app — document creation, presentations, and CLIs are planned. The current single-package layout has no home for a second app or a shared package. Restructuring is cheapest now, before the Astro shell (TASK-021) and the persistence layer (TASK-008) land; the RES-002 platform tasks were filed without an epic ("owner to decide") and belong here.

## Scope

- Monorepo restructure: `codebase/` split, Bun workspaces, `@jazz-master/theory` extraction, root shim (ADR-005 / TASK-026–027)
- Platform migration per RES-002: Astro shell + SPA island, TanStack Router, tRPC scaffold, Workers deploy (TASK-020–024)
- Local and server database foundation: Postgres via Docker Compose + `psql`, Drizzle ORM, generated SQL migrations, a server-only DB smoke check, and a mock app-data write/read path (TASK-028, TASK-055, TASK-056, TASK-061; RES-017)
- Persistence transition planning: ADR-012 supersedes ADR-002's local-first target after NOTE-013 and owner discussion on 2026-07-09; Clerk is the chosen identity provider, Clerk user IDs key app data, and existing local data will not be migrated (TASK-062)
- Clerk/Postgres feature migration: Clerk auth foundation, app-hosted Clerk sign-in/sign-up pages, Clerk-keyed user anchor, profile/onboarding, sessions/grades/scores, server-computed daily plans, preferences, backup/import removal, localStorage layer removal, and a final regression pass (TASK-063, TASK-074, TASK-065 through TASK-072)
- Production database infrastructure is owner-owned. Agents may consume owner-provided binding/secret names in future tasks, but do not provision Railway, Hyperdrive, Cloudflare dashboard state, or production credentials.

## Out of scope

- Building the actual future apps (CLI, docs, presentations) — each gets its own epic when concrete
- Extracting `packages/ui`, `packages/storage`, `packages/config` — deferred with explicit triggers in ADR-005
- Billing, organizations, teams, roles, and Clerk features beyond single-user authentication
- Server-backed export/import or data-portability tooling; local backup/import is removed in this migration arc
- Production database provisioning, provider credentials, and Cloudflare/Hyperdrive dashboard setup

## Tasks

- TASK-026 — Write ADR-005: codebase/ split + Bun workspaces monorepo
- TASK-027 — Restructure the repo to ADR-005
- TASK-020 — Write ADR-006: hybrid Astro SSR + SPA on Cloudflare Workers with tRPC and Hyperdrive
- TASK-021 — Host the existing React SPA inside Astro under /app/*
- TASK-022 — Migrate SPA routing from React Router to TanStack Router
- TASK-023 — tRPC scaffold with typed /trpc/health endpoint
- TASK-024 — Deploy the Astro app to Cloudflare Workers
- TASK-025 — Abandoned: agent-owned Railway/Hyperdrive production database setup
- TASK-028 — Local Postgres for development via Docker Compose and psql
- TASK-055 — Add Drizzle ORM and migration foundation
- TASK-056 — Add server-side database smoke check through Drizzle
- TASK-060 — Run database migrations from a Railway migration service
- TASK-061 — Add DB-backed mock app-data flow
- TASK-064 — Wire Hyperdrive binding into DB smoke runtime
- TASK-073 — Enable Cloudflare Workers logs and observability
- TASK-062 — Write ADR-012: Clerk and server-owned app persistence target
- TASK-063 — Add Clerk auth foundation
- TASK-074 — Add app-hosted Clerk sign-in and sign-up pages
- TASK-065 — Add Clerk-keyed user database anchor
- TASK-066 — Migrate profile and onboarding to Clerk/Postgres
- TASK-067 — Migrate practice sessions, grades, and scores to Clerk/Postgres
- TASK-068 — Move daily planning to server-computed tRPC
- TASK-069 — Migrate preferences to Clerk/Postgres
- TASK-070 — Remove local backup and import
- TASK-071 — Remove generic localStorage store layer
- TASK-072 — Run Clerk/Postgres migration regression pass

## Done when

`codebase/` holds `apps/web` and `packages/theory` with `bun run check` green from the repo root; the web app runs on Cloudflare Workers with typed tRPC endpoints; adding a new app is a one-directory operation requiring no refactoring of existing code; local server-persistence development has Postgres, Drizzle migrations, and server-owned app-data paths; Clerk protects `/app/*` and app-hosted `/sign-in` plus `/sign-up` pages cover Account Portal-disabled auth entry; profile, sessions/scores, daily planning, and preferences use Clerk/Postgres rather than localStorage; backup/import and the generic localStorage store layer are removed; the final Clerk/Postgres regression pass is green.

## Current status

In progress. ADR-005 is written and the codebase restructure has shipped. ADR-006 is **accepted** (owner grill 2026-07-06, NOTE-005; TASK-020 done): operational commitment confirmed, Railway confirmed as a deliberate choice at the time, slice-one landing page pinned to barebones (name + sentence + link into `/app`, nothing marketing-shaped). **TASK-021 shipped 2026-07-06**: Astro 7 shell with the barebones landing at `/` and the React app as a client-only island under `/app/*`, Workers-target build via `@astrojs/cloudflare` (`wrangler.jsonc` with `nodejs_compat` arrived early — dev SSR needs it). **TASK-022 shipped 2026-07-06**: SPA routing migrated to TanStack Router (file-based routes in `src/app/routes/`, `basepath: '/app'`, react-router removed) — the RES-002 plugin-in-Astro risk flagged by INS-017 didn't materialize; codegen works under dev and build. **TASK-023 shipped 2026-07-06**: typed tRPC surface end to end — `appRouter` under `src/server/trpc/` (Zod boundaries), Astro fetch-adapter endpoint at `/trpc/health`, consumed in the SPA via `@trpc/tanstack-react-query` on one shared `QueryClient`, health chip visible on every SPA view. INS-017's re-verify happened as part of the task: the RES-002 fetch-adapter shape was exact, but the client integration moved to `@trpc/tanstack-react-query` (staleness note now in RES-002). **TASK-024 shipped 2026-07-07**: after two owner redesigns (ADR-009 + amendment — no local credentials, then no token at all), the app deploys via Cloudflare Workers Builds on every push to `main` and is live at https://jazz-master.premysl-ciompa.workers.dev — SSR landing, `/app/*` SPA with deep-link reloads, typed `/trpc/health`, and the full practice flow verified in a real browser against the live URL; INS-020/021 folded in (dev-only health chip, stack-stripped tRPC errors). The RES-002 first-slice target is complete. Production deploy is no longer epic scope: TASK-036 was abandoned by owner decision 2026-07-07 (NOTE-008). Production database infrastructure is also owner-owned as of 2026-07-08: TASK-025 is abandoned, RES-017 records the local Postgres/Drizzle direction. **TASK-028 shipped 2026-07-08** with the local Compose Postgres service. **TASK-055 shipped 2026-07-09** with Drizzle ORM, migration metadata/scripts, and the build-step migration contract; **TASK-060 superseded that deployment contract the same day** by moving deployment migrations into a Railway `apps/migration` service so Cloudflare Workers Builds no longer needs `DATABASE_URL`; **TASK-061 shipped the same day** with the first committed mock practice-data table and tRPC write/read path. **TASK-064 shipped the same day** with deployed Hyperdrive DB smoke verification. **TASK-073 shipped 2026-07-09** with Cloudflare Workers observability, source-map configuration, and safe structured server logs. NOTE-013 changed the persistence target: long-run app data should live server-side, with no local persistence as the destination. Owner discussion on 2026-07-09 expanded that into a full Clerk/Postgres migration: Clerk auth, Clerk-keyed user rows, all current feature data moved to Postgres, no local-data bridge, backup/import removed, and `src/appData/` used for shared client-safe contracts after `src/storage/` disappears. **ADR-012 accepted that target in TASK-062** and supersedes ADR-002's local-first direction as the destination while preserving it as migration history. **TASK-063 shipped the Clerk auth foundation**: `/app/*` is protected by Clerk, the app shell has an account control, and protected tRPC procedures receive Clerk user IDs. **TASK-065 shipped the Clerk-keyed user database anchor**: Postgres now has a minimal `users` table keyed directly by Clerk user ID, protected tRPC has `users.ensure`, and no Clerk email/name/profile PII is duplicated. **TASK-074 is now owner-prioritized as the next blocker**: Account Portal-disabled sign-in currently fails without app-hosted `/sign-in` and `/sign-up` pages, so this must ship before the remaining Clerk/Postgres migration chain. Remaining EPIC-013 work resumes with TASK-066 through TASK-072 after TASK-074.

## Last reviewed

2026-07-09 — Owner reported the Clerk Account Portal-disabled 404 and prioritized TASK-074 before the remaining migration chain: add app-hosted `/sign-in` and `/sign-up` pages using Clerk prebuilt UI, including password recovery and MFA/session-task coverage. RES-020 records the official-docs research. Earlier: TASK-073 shipped Cloudflare Workers logs/observability, source maps, and safe structured server logs so deployed tRPC/Hyperdrive failures can be debugged without violating ADR-009. Earlier: TASK-065 shipped the Clerk-keyed user database anchor: `users.clerk_user_id` is the app-data user key, `users.ensure` is protected, and email/name/profile data stays in Clerk. Earlier: TASK-063 shipped the Clerk auth foundation: `/app/*` is protected, `/` stays public, the app shell has a Clerk account control, and protected tRPC procedures receive Clerk user IDs. Earlier: TASK-062 accepted ADR-012: Clerk identity plus server-owned Postgres persistence is now the target, localStorage is temporary migration state, existing local browser data will not be migrated, and TASK-063 is the next migration item. Earlier: Owner chose the full Clerk/Postgres migration shape and requested tasks: local data is discarded, Clerk IDs key app data directly, email/name stay in Clerk, profile and score data are normalized, session UUIDs remain client-generated, daily plans are server-computed rather than stored, preferences migrate in one task, backup/import is removed, and shared app-data contracts move to `src/appData/`. TASK-063 was rescoped to Clerk auth foundation; TASK-065 through TASK-072 were added. Earlier: TASK-061 shipped the first mock practice-data Drizzle table plus tRPC write/read path; the next EPIC-013 item is TASK-062. Earlier: TASK-060 moved deployment migrations from Cloudflare Workers Builds into a Railway migration service. Earlier: NOTE-013 added the owner decision that long-run app data should not use local persistence. Added TASK-061/TASK-062/TASK-063 to turn database usage into mock app-data usage, record the superseding persistence ADR, and gate the first real server-backed slice on an identity/account decision. Earlier: 2026-07-09 — TASK-055 shipped: Drizzle ORM/migration foundation and build-step migration contract are in place; TASK-056 is now the only remaining database foundation task. Earlier: 2026-07-08 — Owner directed the database setup shape: local Postgres via `docker-compose.yaml` + `psql`, Drizzle ORM/migrations, and owner-owned production infrastructure. RES-017 created; TASK-025 abandoned; TASK-028 rewritten as ready local database work; TASK-055/TASK-056 created. Earlier: 2026-07-07 — TASK-036 abandoned by owner decision (grill NOTE-008); production removed from remaining epic scope. Earlier same day: TASK-024 shipped and verified live (first Workers Builds deploy); status updated. Earlier: 2026-07-06 — TASK-023 shipped (tRPC scaffold + /trpc/health); status updated, INS-020/021 filed from review, RES-002 staleness note recorded (INS-017's tRPC re-verify done). Earlier same day: TASK-022 shipped (TanStack Router migration); status updated, INS-018/019 filed from review. Earlier same day: TASK-021 shipped (Astro shell + SPA island); status updated, INS-017 noted. Earlier same day: grill session (NOTE-005): ADR-006 accepted, chain unblocked, migration made next work. Earlier: TASK-030 sweep: goal wording de-staled (ADR-006 is written, `proposed`); status and task list verified current. Earlier same day — Current status updated for ADR-006 written/proposed (TASK-020). 2026-07-05 — created; adopted the six orphaned platform tasks (TASK-020–025) that were awaiting an epic.
