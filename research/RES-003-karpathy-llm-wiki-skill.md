---
id: RES-003
title: Karpathy LLM Wiki pattern for agent-maintained knowledge bases
status: complete
task: none              # requested directly by owner
created: 2026-07-05
stale_when: >
  Karpathy publishes a concrete implementation or materially revises the gist;
  Codex/Claude Code ship native wiki-memory products that make the markdown/git
  pattern obsolete; or Jazz Master adopts a formal project-knowledge subsystem.
---

# RES-003 - Karpathy LLM Wiki pattern for agent-maintained knowledge bases

## Research questions

1. What is Karpathy's "LLM Wiki" pattern, and is it actually a packaged skill?
2. How does the pattern work operationally: storage, schema, ingest, query, and maintenance?
3. How is it different from RAG, file uploads, and long chat history?
4. What are the main strengths, failure modes, and scaling limits?
5. What should Jazz Master adopt, adapt, or skip?

## Findings

### 1. It is a pattern, not a packaged skill

Karpathy's artifact is a GitHub gist titled "LLM Wiki: A pattern for building personal knowledge bases using LLMs" [1]. It is not a `SKILL.md`, plugin, CLI, or runnable package. The gist explicitly says it is an "idea file" intended to be pasted into an LLM agent such as Codex, Claude Code, OpenCode/Pi, etc., after which the agent and user instantiate the specifics together [1].

The closest way to describe it in Codex terms is: a seed instruction document for creating a domain-specific wiki-maintainer workflow. It becomes "skill-like" only after the user turns the pattern into repository conventions, agent instructions, directory structure, and optional tools.

Secondary work treats it the same way. "Memory as Metabolism" cites Karpathy's LLM Wiki as a 2026 practitioner design proposal, identifies its three layers as raw sources, compiled wiki, and schema, and notes that the schema is intentionally abstract and co-evolved by the user and LLM [2].

### 2. The core mechanism is incremental compilation into markdown

Karpathy's core move is to replace one-shot retrieval with a persistent, LLM-maintained markdown wiki. In ordinary RAG, documents are indexed and relevant chunks are retrieved at question time. In LLM Wiki, the agent reads a new source once, extracts and integrates its knowledge into a structured wiki, then updates affected pages as new material arrives [1].

The architecture has three layers [1]:

- Raw sources: immutable source documents such as articles, papers, images, notes, or data files. The agent reads but does not modify them.
- Wiki: generated markdown pages: summaries, entity pages, concept pages, comparisons, overviews, and syntheses. The LLM owns writes here; the human reads and reviews.
- Schema: an instruction/configuration file such as `CLAUDE.md` or `AGENTS.md` that defines directory layout, page conventions, frontmatter, ingest/query/lint workflows, citation rules, and local norms.

The standard operations are:

- Ingest: add a source, read it, create or update summary/entity/concept pages, update index, and append a log entry. Karpathy says one source may touch 10-15 pages [1].
- Query: search/read wiki pages, answer with citations, and optionally file high-value answers back into the wiki as new pages [1].
- Lint: periodically inspect the wiki for contradictions, stale claims, orphan pages, missing cross-references, concept gaps, and useful follow-up searches [1].

Two navigation files are central in the gist:

- `index.md`: content-oriented map of pages with summaries and optional metadata; the agent reads it first to decide what to inspect [1].
- `log.md`: chronological append-only history of ingests, queries, lint passes, and evolution of the wiki [1].

### 3. The key difference from RAG is compounding structure

The original RAG paper framed retrieval as combining a model with external non-parametric memory, typically a dense vector index, to improve provenance, factuality, and updateability [5]. Karpathy's objection is not that RAG is useless; it is that common RAG/file-upload workflows repeatedly rediscover the same knowledge at query time and do not accumulate synthesis [1].

LLM Wiki shifts work earlier in the lifecycle. The source is compiled into human-readable, cross-linked, durable pages. Contradictions and relationships should be discovered at ingest or lint time rather than rediscovered on every query. The result is closer to a maintained codebase than a vector index: markdown pages, links, logs, git history, and conventions.

A 2026 LLM-Wiki paper makes the same distinction academically: it argues that agent retrieval should behave less like static lookup and more like reasoning through search, read, traversal, and sufficiency decisions. Its system compiles documents into structured wiki pages with bidirectional links and exposes search/read/link-following operations as tools, then adds an "Error Book" for persistent correction [3]. This independently supports the pattern's central claim: structure and maintenance matter, not just retrieval.

### 4. Why it can work

The bookkeeping burden is the part humans usually fail at: cross-references, updated summaries, contradiction tracking, index maintenance, and consistency across many pages. Karpathy's thesis is that LLM agents are well-suited to this maintenance work because they can touch many files in one pass and do not mind repetitive editorial tasks [1].

The pattern also fits git and Obsidian well. Karpathy describes Obsidian as the rendering/inspection surface and the LLM as the writer/maintainer. Since the wiki is just markdown files in a git repo, version history, branching, review, and collaboration are cheap [1].

Optional search tooling becomes useful once `index.md` is not enough. Karpathy points to `qmd` as a local markdown search engine with CLI and MCP interfaces [1]. QMD's README says it indexes markdown notes/docs locally and combines BM25, vector search, and LLM reranking, with JSON/files output designed for agent workflows [6]. This is a plausible supporting tool, but not required at small scale.

### 5. Main risks and limits

The biggest risk is lossy or wrong compilation. WiCER, a 2026 paper on LLM Wiki systems, calls this the "compilation gap": distilling raw documents into a wiki can drop critical facts. Its experiments found blind compilation had high catastrophic failure rates, while iterative diagnostic evaluation and refinement recovered much of the lost quality [4]. This is directly relevant: an agent-maintained wiki should preserve links to raw sources, run probes/lint checks, and treat summaries as derived artifacts, not source of truth.

The second risk is self-sealing drift. If the wiki integrates only what fits current pages, contradictory evidence can be suppressed. "Memory as Metabolism" argues that Karpathy's lint operation handles some contradictions reactively, but proposes stronger scheduled consolidation/audit mechanisms and minority-hypothesis retention so contradictory clusters can accumulate enough pressure to update high-gravity entries [2]. This is more than Jazz Master likely needs now, but it is a useful warning: a wiki needs a maintenance policy, not just pages.

The third risk is token and file-loading overhead. At small scale, `index.md` and direct file reads are enough. At hundreds of pages, the agent needs routing files or a search tool, or it will repeatedly reread instructions, indexes, and broad pages. QMD or a simple local search script can help, but adding search too early creates tool complexity without benefit [1][6].

The fourth risk is over-integration into product scope. Karpathy's examples include personal, research, book, business/team, and hobby knowledge bases [1]. For Jazz Master, this pattern is more immediately useful for project knowledge, research, repertoire/reference content, or agent process memory than as a user-facing feature.

### 6. Fit for Jazz Master

Jazz Master already has a durable knowledge map: `strategy/`, `processes/`, `architecture/`, `work/`, and `research/`. This is structurally compatible with LLM Wiki but should not be replaced by it. The repo's current process already implements part of the pattern: research is compiled into `RES-*` files, work is tracked in markdown, architecture logs are persistent, and `AGENTS.md` acts as schema.

The gap is not "we need a new wiki." The gap is that cross-linking and maintenance are mostly manual. A lightweight adaptation would add a wiki-style maintenance pass over existing durable docs:

- Ensure `architecture/overview.md` stays a reliable map.
- Keep `research/` entries linked from consuming tasks.
- Periodically lint for stale architecture claims, orphan work items, and insights that should become tasks or be rejected.
- File useful agent discoveries into `work/insights/` or `research/`, not only chat.

## Recommendations

1. Do not treat Karpathy's gist as an installable skill.
   Treat it as a design pattern for repository knowledge management. If adopted, instantiate it through this repo's existing process files and `AGENTS.md`, not by adding an unrelated "wiki system" beside the current knowledge map [1][2].

2. Adapt the pattern lightly around existing folders.
   Jazz Master already has raw-ish inputs (`work/insights`, source docs), compiled knowledge (`research`, `architecture`), logs (`architecture/LOG.md`, task logs), and schema (`AGENTS.md`, `processes/`). A future task should improve these links rather than introduce a parallel `/wiki` directory.

3. Add a maintenance/lint task before adding tooling.
   The most valuable first slice would be a process task that checks for stale architecture notes, unlinked research, orphan tasks/insights, missing log updates, and contradictions between decisions and implementation. This follows Karpathy's lint operation while staying inside current project rules [1].

4. Preserve raw sources and citations.
   Any summary or synthesis page must point back to sources. WiCER's compilation-gap finding makes raw-source preservation non-negotiable: derived wiki pages are useful working memory, not canonical truth [4].

5. Use git review as the control surface.
   Since the wiki is markdown in a repo, agent-generated updates should be reviewed like code. This fits the existing rule that tracker updates and code ship together, and it avoids silent memory drift.

6. Defer vector/BM25 tooling until the corpus is large enough.
   At current size, `rg`, indexes, and direct file reads are sufficient. Consider QMD or a small local search helper only if agents repeatedly waste context scanning many research/architecture/work files [1][6].

7. Do not build this as a user-facing Jazz Master feature yet.
   Nothing in the current product scope asks for a general personal knowledge wiki. For users, the closest legitimate future applications would be repertoire notes, practice-journal synthesis, or lesson-plan/reference ingestion, but those should come from explicit work items.

## Considered and rejected

- Add a new top-level `wiki/` now: rejected. It would duplicate `architecture/`, `research/`, and `work/` instead of strengthening them.
- Implement vector RAG immediately: rejected. Karpathy's pattern is explicitly useful before embedding infrastructure; the project's current corpus is small enough for markdown indexes and `rg`.
- Let agents rewrite compiled knowledge without review: rejected. The compilation-gap and drift risks make human/code-review style control important.
- Put user practice data into an LLM Wiki: rejected for now. The app is local-first and has no current requirement for AI-maintained user memory.

## Sources

[1] Andrej Karpathy, "LLM Wiki: A pattern for building personal knowledge bases using LLMs" - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f (created 2026-04-04, accessed 2026-07-05)

[2] Stefan Miteski, "Memory as Metabolism: A Design for Companion Knowledge Systems" - https://arxiv.org/abs/2604.12034 and https://arxiv.org/html/2604.12034 (submitted 2026-04-13, accessed 2026-07-05)

[3] Haoliang Ming, Feifei Li, Xiaoqing Wu, Wenhui Que, "Retrieval as Reasoning: Self-Evolving Agent-Native Retrieval via LLM-Wiki" - https://arxiv.org/abs/2605.25480 (submitted 2026-05-25, revised 2026-05-26, accessed 2026-07-05)

[4] Juan M. Huerta, "WiCER: Wiki-memory Compile, Evaluate, Refine Iterative Knowledge Compilation for LLM Wiki Systems" - https://arxiv.org/abs/2605.07068 (submitted 2026-05-08, accessed 2026-07-05)

[5] Patrick Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" - https://arxiv.org/abs/2005.11401 (submitted 2020-05-22, revised 2021-04-12, accessed 2026-07-05)

[6] tobi/qmd README, "QMD - Query Markup Documents" - https://github.com/tobi/qmd (accessed 2026-07-05)
