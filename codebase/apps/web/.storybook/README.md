# Jazz Master Storybook

Adapted from Chaos House's React/Vite + Tailwind catalog. Run from the repo root:

```sh
bun run --cwd codebase storybook
```

This starts Astro on port 4321 and Storybook on port 6006. Stop an existing Astro
server first. If Astro is already running on 4321, start only Storybook with
`bun run --cwd codebase/apps/web storybook`. The Vite proxy serves Astro public
component previews through the same Storybook origin.

## Build and deploy

`bun run --cwd codebase storybook:build` builds the React catalog into the ignored
`apps/web/public/_storybook` folder. `bun run --cwd codebase build` builds the
catalog **and** Astro public-component previews into the deployable web output.
The normal Cloudflare Workers Builds pipeline publishes everything at
`/_storybook/` after a push to main. The URL is public and contains sample data.
Use `bun run --cwd codebase preview -- --port 4322` after building to inspect the
complete deployed bundle locally at `http://localhost:4322/_storybook/`.

## Catalog and authoring

- **Pages:** each practice page, onboarding, landing, sign-in and sign-up.
  Dashboard/practice/history include empty, loading and service-error states.
- **Primitives:** actual shared buttons, cards, badges, selects, radios and
  checkboxes, including disabled/checked variants.
- **Components:** fretboard, chord diagrams, notation modes, runner and profile
  fields. Layout is exercised by every practice-page story.
- **Public:** actual Astro header, footer, landing sections and practice board.
- Docs and controls come from typed CSF stories. Use the viewport toolbar for
  mobile (390 × 844) and desktop (1280 × 800); the accessibility panel runs axe.

Keep stories beside components; page fixtures and providers live in
`src/stories/`. Add meaningful states when introducing or changing reusable UI.
Use the same components and CSS as the app. The page provider has a memory router
and in-memory tRPC link, with no HTTP fallback; unknown procedures fail loudly.
Each story gets fresh sample state. The Clerk user button is replaced only in
Storybook's Vite build. Real application authentication remains unchanged.

Public Astro components are prerendered under `/_storybook/previews/` and shown
in sandboxed frames. Authentication stories intentionally show the production
page shell with an inert form placeholder rather than live Clerk credentials.
These demonstrate our layout, not Clerk's internal states. They are marked
noindex, as is the Storybook manager.

Practice playback intentionally uses the normal audio engine and external sample
host after pressing Play. Record requests microphone permission only after the
user presses Record. No recorded takes or practice data are sent to the app API.
Storybook complements the existing unit/component and e2e gates; it does not
replace them.
