# Process: deep research

How to research a topic thoroughly (online) and persist the result so future work builds on it instead of repeating it. Any task whose plan includes "research X first" runs this process; results always land in `research/`.

## Principles

- **Research is a deliverable**, not a warm-up. The `RES-###` file must let a reader act without redoing the search.
- **Primary sources over listicles.** Official docs, specs, maintainers' writing, and post-mortems outrank SEO blog spam. Note publication dates — frontend advice rots fast.
- **Disagreement is signal.** Where credible sources conflict, record both positions and pick one *for this project*, with reasoning.
- **Recommendations must be actionable here**: filtered through our context — solo developer + AI agents, local-first React/Bun/Vite app, no backend.

## Steps

1. **Frame it.** Write 3–7 concrete research questions in the RES file before searching. Bad: "best practices for testing". Good: "what should be tested at unit vs component vs e2e level in a Vite/React app with a pure domain core?"
2. **Sweep.** In Claude Code, use the `deep-research` skill when available (it fans out searches and verifies claims); otherwise fan out manually with WebSearch/WebFetch — multiple query angles per question (the topic itself, "X vs Y", "X pitfalls", "X 2025/2026", named-expert takes).
3. **Read deeply.** Fetch and actually read the strongest 5–15 sources; don't cite from snippets.
4. **Cross-check.** Any claim that will drive a decision needs two independent sources or a marked "single-source" flag.
5. **Write the RES file** (format in `research/README.md`): findings per question, each with citations; a Recommendations section stating what *we* should adopt, adapt, or skip — and why.
6. **Feed forward.** The consuming task turns Recommendations into concrete changes (process docs, CLAUDE.md conventions, code). Link the RES id from the task's frontmatter (`research: RES-###`) and Log. If research was requested directly and has no consuming task, run `processes/knowledge-maintenance.md` to file or reject follow-up work.

## Quality bar

- Every recommendation traceable to a finding; every finding to a source (URL + date).
- Alternatives that were considered and rejected are listed with the reason.
- The file states its own shelf life: what would make this research stale.
