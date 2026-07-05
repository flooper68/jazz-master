# Process: artifact creation

Creates and maintains human-facing outputs such as browser presentations, static reports, screenshots, exports, `.docx` files, slide decks, PDFs, and other visual artifacts.

Use this when the owner asks for an artifact, presentation, document, rendered visual, report, or export. Use it during knowledge maintenance when repo knowledge needs a human-facing companion.

## Principles

- Markdown remains the canonical source for agent-facing instructions, process rules, architecture, work items, and research.
- Artifacts are rendered companions for humans, not hidden sources of truth.
- Every artifact links back to its canonical sources.
- Prefer the simplest durable format that satisfies the request.
- Do not commit transient build output, caches, or downloaded dependency trees.

## Where artifacts live

Store artifacts under `artifacts/<slug>/`.

Each artifact folder should include:

- `README.md` with purpose, sources, how to open or regenerate it, and maintenance note.
- Source files required to edit or regenerate the artifact.
- Final output files only when they are the deliverable and are reasonable to keep in git.

Examples:

| Request | Home |
|---|---|
| Standalone browser presentation | `artifacts/<slug>/index.html`, `styles.css`, `script.js` |
| Static visual report | `artifacts/<slug>/index.html` or `report.md` plus assets |
| PDF or deck deliverable | `artifacts/<slug>/source/` plus final `.pdf` or `.pptx` |
| Screenshots from QA | `artifacts/<slug>/screenshots/` with a README explaining source and date |

## Format choice

1. Use Markdown when the output is primarily agent-readable or repo-operational.
2. Use standalone HTML/CSS/JS when the output needs layout, visual hierarchy, navigation, or light interaction. This is the default even for presentations; reach for reveal.js only when a formal deck needs speaker notes, PDF export, or nested-slide navigation, and record the dependency and open/export instructions in the artifact README (RES-009).
3. Use `.docx`, `.pptx`, or `.pdf` only when the requested deliverable needs that format.
4. Use generated images only when a visual cannot be clearly built from HTML/CSS/SVG or existing assets.
5. Do not add a framework or build step (React, Vite, Tailwind, MDX, …) by default — only when it materially improves the requested deliverable, documented in the README.

## Design defaults for browser artifacts

Concrete rules, not aesthetic adjectives (RES-009):

- Audience and purpose first; one clear information architecture.
- Semantic HTML landmarks and headings before styling.
- Responsive grid/flex layout with relative units and stable dimensions for slides, cards, charts, and controls.
- CSS custom properties for color, spacing, type scale, borders, shadows.
- Text contrast meets WCAG AA unless the artifact is purely internal and the exception is noted in the README.
- Keyboard-operable controls with visible focus states.
- Reduced-motion fallbacks (`prefers-reduced-motion`) for transitions and animations.
- No decorative clutter that carries no information; no hidden source of truth in the HTML — link canonical Markdown sources.

## Steps

1. Identify the audience, purpose, and shelf life.
2. Find the canonical sources in `processes/`, `work/`, `architecture/`, `research/`, `notes/`, or `strategy/`.
3. Create or update `artifacts/<slug>/README.md` before or with the artifact.
4. Build the artifact from explicit source links; do not encode unsupported claims as if they were canonical.
5. Verify the artifact opens or renders in its target format.
6. If the artifact changes repo organization, update `AGENTS.md`, `architecture/overview.md`, or other indexes.
7. If the artifact reveals product defects or follow-up work, file those through `processes/feedback-intake.md`.

## Verification

Rendered verification is mandatory for visual artifacts — never rely on reading the HTML/CSS alone (RES-009):

- Standalone HTML opens without a dev server unless the README says otherwise.
- Open in a real browser or via Playwright; inspect at desktop and phone (~375px) widths, capturing screenshots for review when tooling allows.
- Browser console is free of errors.
- Presentations have keyboard or visible navigation; exercise controls by keyboard and pointer.
- Documents, PDFs, and decks are rendered once for visual inspection before delivery.
- Source links point to current canonical files.
- Iterate on the rendered result before delivery, not after.

## Output

- New or updated files under `artifacts/<slug>/`.
- Any needed process or index updates.
- A short delivery note with the path to open and what was verified.

## Deferred: visual-artifacts skill

Per `research/RES-009-agent-skill-html-visual-artifacts.md`, when the next artifact request arrives, create a repo-local `.agents/skills/visual-artifacts/SKILL.md` encoding this process (structure, design defaults, rendered-QA checklist) and use it on that artifact. Do not create it preemptively; this document remains sufficient until then.

