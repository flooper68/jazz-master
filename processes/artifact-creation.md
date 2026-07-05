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
2. Use standalone HTML/CSS/JS when the output needs layout, visual hierarchy, navigation, or light interaction.
3. Use `.docx`, `.pptx`, or `.pdf` only when the requested deliverable needs that format.
4. Use generated images only when a visual cannot be clearly built from HTML/CSS/SVG or existing assets.

## Steps

1. Identify the audience, purpose, and shelf life.
2. Find the canonical sources in `processes/`, `work/`, `architecture/`, `research/`, `notes/`, or `strategy/`.
3. Create or update `artifacts/<slug>/README.md` before or with the artifact.
4. Build the artifact from explicit source links; do not encode unsupported claims as if they were canonical.
5. Verify the artifact opens or renders in its target format.
6. If the artifact changes repo organization, update `AGENTS.md`, `architecture/overview.md`, or other indexes.
7. If the artifact reveals product defects or follow-up work, file those through `processes/feedback-intake.md`.

## Verification

- Standalone HTML opens without a dev server unless the README says otherwise.
- Browser artifacts work at desktop and phone widths.
- Presentations have keyboard or visible navigation.
- Documents, PDFs, and decks are rendered once for visual inspection before delivery.
- Source links point to current canonical files.

## Output

- New or updated files under `artifacts/<slug>/`.
- Any needed process or index updates.
- A short delivery note with the path to open and what was verified.

