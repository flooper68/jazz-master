---
id: ADR-012
title: Clerk identity and server-owned Postgres app persistence
status: accepted
date: 2026-07-09
accepted: 2026-07-09
source: NOTE-013
---

# ADR-012 — Clerk identity and server-owned Postgres app persistence

## Context

ADR-002 chose a local-first product: no backend, no accounts, and durable
practice data stored in browser localStorage through typed stores. ADR-006
already superseded the "no backend" part by moving the app to Astro on
Cloudflare Workers with typed tRPC routes and an eventual Postgres path, but it
kept practice state local until a feature deliberately moved server-side.

That transition point has arrived. NOTE-013 records the owner's 2026-07-09
decision that long-run app data should not use local browser persistence. Owner
follow-up decisions in the same migration discussion chose Clerk for identity,
Clerk user IDs as the app-data user boundary, no migration bridge from existing
local browser data, and retirement of localStorage during each feature
migration.

## Decision

Jazz Master will move from browser-local product persistence to
Clerk-authenticated, server-owned Postgres persistence for long-run app data.

The target architecture is:

1. **Clerk owns identity.** Clerk is the identity provider for the web app.
   Clerk user ID is the app's durable user boundary and is the key used to scope
   app-owned Postgres data. Email, name, and other Clerk-owned identity/profile
   data stay in Clerk unless a later product need justifies duplication.
2. **Astro route ownership stays split.** `/` remains public. `/app/*` requires
   sign-in once the Clerk foundation lands. Signed-out app access redirects to a
   sign-in page.
3. **Browser code talks to tRPC, not persistence systems.** React pages,
   components, and client helpers call typed tRPC procedures for app data. They
   do not access Postgres directly and do not use localStorage for target
   product persistence.
4. **Server code owns persistence.** tRPC procedures and server-only
   repositories own authorization, validation, Drizzle queries, and Postgres
   access. Postgres is the source of truth for long-run app data.
5. **Local browser data is not migrated.** Existing browser-local profiles,
   sessions, daily plans, preferences, and backups are intentionally discarded
   during this migration. No import bridge, sync bridge, or local-to-server
   migration path is added in this arc.
6. **Temporary localStorage is allowed only as migration state.** Existing typed
   stores may remain for features not yet migrated, but each feature migration
   removes that feature's localStorage path in the same task. After the migration
   chain, `src/storage/` is removed and shared client-safe app-data contracts
   live outside the storage implementation, under `src/appData/` or an
   equivalent app-data module.

### Relationship to ADR-002

ADR-012 supersedes ADR-002's long-term local-first direction. ADR-002 remains
accepted historical context for the original validation slice and for the typed
store implementation that still exists during migration, but it is no longer
the strategic destination.

Concretely:

- **Superseded:** no backend, no accounts, static-only hosting, and localStorage
  as the long-run source of truth for practice data.
- **Kept as transition history:** the typed localStorage stores and backup/import
  path explain how existing product data works before the migration reaches each
  feature. They do not define the target architecture.

### Relationship to ADR-006

ADR-006 remains the platform decision: Astro on Cloudflare Workers, the React
practice app as a client-only island under `/app/*`, typed tRPC routes, and
server-only database access. ADR-012 changes the persistence posture that ADR-006
had deliberately left local. The ADR-006 server boundary now becomes the
required boundary for real app data, protected by Clerk and backed by Postgres.

## Migration sequence

The migration runs in this order:

1. Clerk auth foundation: install/configure Clerk, keep `/` public, protect
   `/app/*`, expose authenticated Clerk user ID to server code, and keep public
   smoke/health procedures public where appropriate.
2. User anchor: create the Postgres user anchor keyed by Clerk user ID.
3. Profile/onboarding: move profile data and onboarding completion to
   Clerk/Postgres; remove profile localStorage usage.
4. Sessions, grades, and scores: move practice session records, exercise grades,
   score summaries, and per-note score details to Clerk/Postgres; keep session
   UUIDs client-generated.
5. Server-computed daily plans: remove daily-plan localStorage and compute
   today's plan from server-owned profile/session data plus curriculum.
6. Preferences: move notation display mode, scoring tolerance, and play-along
   tempo preferences to Clerk/Postgres.
7. Backup/import removal: delete local JSON backup/import because local browser
   data is no longer the source of truth and existing local data is not
   migrated.
8. LocalStorage layer removal: move shared app-data contracts to `src/appData/`
   or equivalent and delete the generic typed localStorage layer.
9. Regression pass: verify signed-in app access, current product workflows,
   clear-storage/reload behavior, and absence of product localStorage usage.

## Consequences

- The product accepts an auth dependency earlier than ADR-002 originally allowed.
  That is now intentional: durable user-owned practice data requires a user
  boundary before it leaves the browser.
- Clearing browser storage should eventually stop losing profile, history,
  planner, score, and preference data. During migration, the guarantee applies
  only to features already moved to Postgres.
- Existing dogfood data in localStorage is disposable. This avoids building and
  supporting a migration bridge before the product has real users.
- The server API becomes an authorization boundary, not just a typed transport.
  Protected tRPC procedures must require authenticated Clerk context before
  reading or writing user-owned data.
- Tests for migrated features should cover server authorization and persistence
  behavior, not just local store behavior.
- Future export/import or portability work, if needed, starts as a separate
  task. It is not smuggled into this migration by preserving local backup/import.

## Considered and rejected

- **Local-first plus server sync/backup.** Rejected by owner decision: the long
  run target is no local persistence for app data, not local data with a sync
  companion.
- **Anonymous server-owned data before auth.** Rejected because durable practice
  data needs a stable user boundary before it can safely move to Postgres.
- **Migrating existing local browser data.** Rejected because the current user
  base is the owner/dogfood loop and the bridge would add complexity before real
  product value.
- **Direct browser-to-Postgres access.** Rejected for the same reason as
  ADR-006: credentials and authorization belong on the server side.
- **Duplicating Clerk identity data in Postgres now.** Rejected because Clerk
  remains the source for identity fields; Postgres stores app-owned data.

## Acceptance (2026-07-09)

Accepted from NOTE-013 and the follow-up owner decisions on 2026-07-09:

1. `/` stays public.
2. `/app/*` requires sign-in once Clerk lands.
3. Signed-out app access uses a sign-in page redirect.
4. Local development uses real Clerk environment keys supplied by the owner.
5. Existing local browser data is discarded, not migrated.
6. Clerk user IDs key app data directly.
7. Email/name remain Clerk-owned.
8. Profile and score data are normalized in Postgres.
9. Session UUIDs remain client-generated.
10. Daily plans are server-computed rather than stored.
11. Preferences migrate in one task.
12. Backup/import is removed.
13. Shared client-safe contracts move out of `src/storage/` after localStorage is
    retired.
