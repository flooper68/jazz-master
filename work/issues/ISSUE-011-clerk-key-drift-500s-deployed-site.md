---
id: ISSUE-011
title: Deployed Worker returns HTTP 500 for every browser request after Clerk key drift
status: fixed
severity: blocker
created: 2026-08-02
source: owner report 2026-08-02
---

# ISSUE-011 — Deployed Worker returns HTTP 500 for every browser request after Clerk key drift

## Steps to reproduce

Visit the deployed dev Worker in a browser, or issue a browser-shaped request:

```sh
curl -s -o /dev/null -w '%{http_code} %{url_effective}\n' -L \
  -H 'Accept: text/html' -H 'Sec-Fetch-Dest: document' \
  https://jazz-master.premysl-ciompa.workers.dev/
```

Clerk's development instance requires a dev-browser cookie, so the first
document request is redirected to the Frontend API handshake endpoint and back
to `/?__clerk_handshake=<jwt>`.

## Expected

The handshake resolves, cookies are set, and `/` renders the public landing
page.

## Actual

The return leg returned HTTP 500 with an empty body. Every browser visitor hit
it, including on the public landing page — the whole deployed site was down.
Plain `curl` without browser headers returned 200, which is why the failure was
invisible to the probe style used in ISSUE-008.

Worker logs (`wrangler tail jazz-master`):

```text
(error) [ERROR] Error: Clerk: Handshake token verification failed: Unable to find
a signing key in JWKS that matches the kid='ins_3GIWHzXQ58bmkmuI1GWnysDda0B' of
the provided session token. ... The following kid is available:
ins_3765hAlKxkijpAkQ0mVrm8LHrss ... (reason=jwk-kid-mismatch)
  at HandshakeService.handleTokenVerificationErrorInDevelopment
  at authenticateRequestWithTokenInCookie
  at async astroMiddleware
```

## Cause

The Worker's `PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` belonged to
two different Clerk instances:

- TASK-072 (commit 040e56f, 2026-07-10) changed the committed publishable key in
  `wrangler.jsonc` from `popular-mouse-86` to `organic-ostrich-34`.
- `CLERK_SECRET_KEY` is a Worker secret set out-of-band, so it stayed on the old
  `popular-mouse-86` instance.

Clerk verifies the handshake JWT against the JWKS it fetches with the *secret*
key, so the signing key for the token minted by the *publishable* key's instance
was absent. `@clerk/backend` rethrows that `TokenVerificationError` as a plain
`Error` for development instances instead of degrading to signed-out, so it
escaped `clerkMiddleware` and Astro returned a bare 500.

Nothing else in the app calls Clerk's Backend API, so the mismatch was invisible
on every other surface — `/trpc/health`, `/trpc/dbSmoke`, and the `/app` →
`/sign-in` redirect all kept working — and it sat broken for three weeks.

## Log

### 2026-08-02 — fixed (agent)

Operational fix: uploaded the `organic-ostrich-34` secret key to the deployed
Worker (`wrangler secret put CLERK_SECRET_KEY --name jazz-master`), creating
version `626a1232` at 09:37Z. Verified the key resolves to
`ins_3GIWHzXQ58bmkmuI1GWnysDda0B` before upload, and afterwards that the
handshake probe reason moved from `jwk-kid-mismatch` to
`token-invalid-signature` (i.e. the correct signing key is now found).

Post-fix route check, browser-shaped requests: `/` 200 after 3 redirects,
`/app` → `/sign-in?redirect_url=%2Fapp` 200, `/sign-in` 200, `/sign-up` 200,
`/trpc/health` 200.

Two gaps this exposed are carried by TASK-085: the deployed Worker is named
`jazz-master` while `wrangler.jsonc` declares `jazz-master-web`, and nothing
couples the committed publishable key to the out-of-band secret.

Deviation: the diagnosis and the secret upload used local Cloudflare
credentials, which ADR-009 forbids. The owner was shown the conflict, chose to
run `wrangler login` anyway, and directed the agent to apply the fix. Recorded
as an amendment to ADR-009 with deferred-grill questions.
