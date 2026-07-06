# Process: wiki maintenance

How the `wiki/` derived-knowledge layer stays current and trustworthy. The wiki compiles "how the product works" and "how the project works" into cross-linked pages; this process defines its three operations — **ingest/update**, **query**, and **lint** — and where the rest of the loop triggers them. Page schema and conventions live in `wiki/README.md`; the decision record is `architecture/decisions/ADR-007-wiki-derived-knowledge-layer.md` (pattern source: `research/RES-003-karpathy-llm-wiki-skill.md`).

## Principles

- **Derived, never canonical.** Wiki pages synthesize canonical sources (`strategy/`, `processes/`, `architecture/`, `research/`, `work/`, code) and cite them in `sources:` frontmatter. On conflict, the canonical source wins and the page is corrected.
- **Link and synthesize, don't copy.** A page that quotes canonical text verbatim is a lint finding — it will drift. Say what the sources mean together; link to them for the letter.
- **Every touch leaves a trail.** Page changes update `wiki/index.md` when the page set or one-line summaries change, and append one line to `wiki/log.md`. Git review is the control surface — wiki edits ship in reviewed commits like everything else.
- **No tooling before it hurts.** `index.md` + grep is the retrieval story until the corpus outgrows it (RES-003 rec. 6).

## Operations

### Ingest / update

When a change alters how the product or the project works:

1. Identify affected pages from `wiki/index.md` (one change may touch several).
2. Update them: adjust the synthesis, keep `sources:` accurate, bump `updated:`.
3. Create a new page only for durable "how it works" knowledge with no home — not for anything lifecycle-managed (that's `work/`) or canonical (that's the source layers).
4. Update `wiki/index.md` if pages were added or their summaries changed; append a `wiki/log.md` line (date, what, why, driving item ID).

Commit rules follow `processes/git-workflow.md`: wiki updates caused by a work item ship **in that item's commit** (hard rule 4); standalone wiki work uses a `work:` prefix.

### Query

When answering "how does X work" questions: read `wiki/index.md` first, then the relevant pages, and follow their `sources:` for authority. If the answer required real synthesis the wiki lacked and it will be needed again, file it back as a page or page-section (ingest rules above).

### Lint

Run as part of the `processes/knowledge-maintenance.md` sweep (it owns the cadence). Check:

- **Contradictions:** page claims vs their cited sources and vs `architecture/overview.md` — canonical wins; fix the page.
- **Staleness:** pages whose `updated:` predates shipped work that changed their subject (compare `wiki/log.md` against `git log`).
- **Orphans and gaps:** pages missing from `index.md`; index entries whose page moved; "how it works" areas that changed shape with no page coverage.
- **Broken references:** `sources:` entries or in-page links pointing at renamed/moved files.
- **Verbatim drift:** sections that copy canonical text instead of synthesizing it.

Small fixes land inline in the sweep's commit; rewrites bigger than the sweep become a task via the knowledge-maintenance routing table.

## Where the loop triggers this

| Trigger | Process hook |
|---|---|
| Shipped work changed how the product/project works | `processes/dev-loop.md` step 7 (Record) — update affected pages in the ship commit |
| Research completed | `processes/deep-research.md` step 6 (feed forward) — durable findings ingested into pages |
| ADR accepted / process doc changed | Part of that change's commit — same-commit rule |
| Knowledge-maintenance sweep | Lint (above) |
| Wiki visibly unmaintained | `processes/heartbeat.md` cadence check schedules the sweep |

## Guardrails

- Never move canonical content *into* the wiki; the wiki points outward.
- Never edit `strategy/` to make it agree with a wiki page — propose to the owner.
- Wiki pages carry no lifecycle state (no statuses, no open questions masquerading as facts); uncertainty belongs in `work/insights/` or `notes/`.
- Do not add search/embedding tooling without an ADR; the trigger is agents repeatedly wasting context scanning pages (RES-003).
