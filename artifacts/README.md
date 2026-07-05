# Artifacts

Human-facing generated or crafted outputs live here: browser presentations, visual maps, static reports, exports, screenshots, and document decks.

Artifacts are not the canonical source for agent instructions. Canonical process, architecture, work, and research rules stay in Markdown under `processes/`, `architecture/`, `work/`, and `research/`.

## Conventions

- Put each artifact in its own folder: `artifacts/<slug>/`.
- Include a short `README.md` with purpose, sources, how to open or regenerate it, and owner.
- Prefer standalone HTML/CSS/JS when the artifact only needs a browser.
- Commit source files, not build caches or generated dependency folders.
- If the artifact summarizes repo knowledge, link back to the canonical Markdown sources.
- If an artifact becomes stale, update or archive it by note in its README; do not silently leave it as current truth.

