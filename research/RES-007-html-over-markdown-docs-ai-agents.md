---
id: RES-007
title: HTML over Markdown for documentation aimed at AI agents
status: complete
task: none              # requested directly by owner
created: 2026-07-05
stale_when: "Major coding agents change their repository-instruction discovery model, Markdown/HTML parsing behavior changes materially in mainstream agent tooling, or durable evidence appears that HTML documentation measurably improves AI-agent task performance over Markdown."
---

# RES-007 - HTML over Markdown for documentation aimed at AI agents

## Research questions

1. What properties of Markdown make it effective or ineffective for documentation that AI coding agents must read and follow?
2. What properties of HTML make it effective or ineffective for the same agent-facing documentation use case?
3. Do current AI coding-agent docs and instruction mechanisms prefer Markdown, HTML, or another structured format?
4. Where does HTML provide real advantages over Markdown for docs: semantics, navigation, embeds, validation, generated output, or machine extraction?
5. For a solo-owner, AI-agent-built React/Bun/Vite project, when should project documentation stay in Markdown, and when should HTML be introduced?

## Findings

### 1. Markdown's core advantage is source readability, which maps well to agent context

Markdown was designed as easy-to-read plain text that can be converted to structurally valid HTML. CommonMark repeats the same core point: Markdown is a plain-text format for structured documents, and its distinguishing property is readability in the source itself [1].

That matters for AI agents because repository docs are often read as raw files, not as browser-rendered pages. Codex reads `AGENTS.md` before work starts [4]. Claude Code describes `CLAUDE.md` as Markdown files written in plain text and read at the start of sessions [5]. GitHub Copilot repository instructions use `.md` files, including `.github/copilot-instructions.md`, path-specific `NAME.instructions.md`, and agent-facing `AGENTS.md` files [6]. The public AGENTS.md format states directly that AGENTS.md is standard Markdown and that agents parse the text provided [7].

The practical implication is simple: for agent-facing repository documentation, Markdown is the native convention across current tools. HTML can be read by models, but it is not the discovery format these tools document.

### 2. Markdown is not perfectly structured; its ambiguity is real but usually manageable

CommonMark exists because the original Markdown description was ambiguous and implementations diverged on sublists, blank lines, indented code, list tightness, headings in lists, reference definitions, and precedence rules [1]. It also notes that Markdown has no syntax errors, so divergence may not be discovered immediately [1].

For agent docs, this means Markdown should be written in the boring subset:

- ATX headings (`#`, `##`, `###`)
- Short paragraphs
- Simple bullets and numbered lists
- Fenced code blocks with language names
- Tables only when they genuinely improve scanning
- Inline code for commands, paths, file names, identifiers, and literal values

Avoiding clever nesting, mixed list styles, raw HTML blocks, and renderer-specific extensions reduces both human and agent ambiguity.

### 3. HTML's advantage is explicit semantics, validation, rendering, and interactivity

HTML is better when the document is meant to be rendered, navigated, validated, styled, or made interactive. MDN frames semantic HTML as using elements for their meaning, not their visual appearance; semantic elements help search engines, screen readers, developers, and code navigation [2].

This is a real advantage for human-facing docs and generated reports. HTML is also the output target for many documentation systems: MkDocs writes docs in Markdown and builds static HTML sites [8]; Docusaurus uses Markdown as its authoring format while compiling docs to React/HTML and allowing MDX for richer interactive content [9].

For AI agents, however, those same features are often overhead when the agent needs instructions. Tags, nav shells, CSS classes, scripts, and generated site chrome can consume context and obscure the core instruction text. This claim is an inference from the source evidence: HTML's strengths are rendering and semantics [2], while agent instruction files are loaded as raw Markdown/plain text [4][5][6][7].

### 4. Current AI-agent instruction mechanisms prefer Markdown, sometimes with XML-like delimiters

The current ecosystem points to Markdown as the default instruction medium:

- Codex: `AGENTS.md` for custom instructions [4].
- Claude Code: `CLAUDE.md` for project memory and instructions [5].
- GitHub Copilot: `copilot-instructions.md`, `NAME.instructions.md`, and `AGENTS.md` [6].
- AGENTS.md format: standard Markdown with arbitrary headings [7].

OpenAI prompt-engineering guidance also recommends a combination of Markdown and XML-style tags for logical boundaries in prompts. It says Markdown headers and lists communicate hierarchy, while XML tags help mark the start and end of supporting documents and carry metadata through attributes [10]. Anthropic similarly recommends XML tags for Claude prompting structure [11].

So the best current pattern is not "HTML over Markdown." It is:

- Markdown for ordinary agent instructions and project docs.
- XML-like tags in prompts or generated context bundles when a section needs a strong boundary or metadata.
- HTML only when the artifact must be rendered or interacted with.

### 5. Agent context files help only when they are concise and operational

The evidence on agent context files is mixed. One 2026 study of AGENTS.md files across 10 repositories and 124 pull requests found lower median runtime and reduced output token consumption when AGENTS.md was present, with comparable task completion behavior [13]. Another 2026 evaluation found repository context files did not generally improve success rates and increased inference cost by over 20%; it concluded that context files are useful for non-standard practices but should be evaluated before deployment [14].

A 2026 configuration-smells paper found widespread issues in AGENTS.md/CLAUDE.md files, especially "Lint Leakage" at 62%, "Context Bloat" at 42%, and "Skill Leakage" at 35% [12]. Claude Code's own memory docs give the same operational warning: instructions are context rather than enforced configuration, should be specific and concise, and should target under 200 lines per `CLAUDE.md` file [5].

That argues against HTML for always-loaded agent docs. HTML tends to add boilerplate and markup tokens unless aggressively stripped. The real quality bar is not file extension; it is whether the file gives the agent short, current, task-relevant operating constraints.

### 6. LLM-oriented website docs are moving toward Markdown mirrors, not HTML-only pages

The `/llms.txt` proposal directly states the problem with raw websites for LLM use: converting complex HTML pages with navigation, ads, and JavaScript into LLM-friendly plain text is difficult and imprecise [3]. Its proposed solution is a Markdown `/llms.txt` file plus links to detailed Markdown files, and it says Markdown is currently the most widely and easily understood format for language models [3].

VitePress now surfaces the same pattern in its docs UI: pages include a note for LLMs pointing to a Markdown version of the current page [15]. This is a single-source observation for VitePress specifically, but it aligns with the independent `/llms.txt` proposal and with the broader agent-instruction convention.

For a future public Jazz Master docs site, this suggests an authoring pipeline that keeps Markdown source and optionally publishes:

- HTML pages for humans.
- `llms.txt` and/or `.md` mirrors for agents.
- Short curated context bundles for agent tasks, instead of asking agents to scrape the rendered site.

### 7. HTML comments and hidden markup are not reliable agent instruction channels

Claude Code strips block-level HTML comments from `CLAUDE.md` before injecting content into context, preserving them only when the file is read directly [5]. That is tool-specific, but it is a useful warning: hidden HTML affordances are not portable as agent instructions.

If content should guide an agent, make it visible in the Markdown body. If content is only for human maintainers, an HTML comment can be useful, but do not rely on it for agent behavior.

## Recommendations

### Adopt: Markdown as the canonical source for agent-facing docs

Keep Jazz Master's agent and process documentation in Markdown: `AGENTS.md`, `CLAUDE.md` if added, `processes/*.md`, `architecture/*.md`, `work/*.md`, and `research/*.md`. This matches Codex, Claude Code, GitHub Copilot, AGENTS.md, and common docs tooling conventions [4][5][6][7][8][9][15].

Write these files as agent-operational documents, not websites:

- Start with the decision or rule.
- Use shallow headings.
- Keep commands copyable.
- Put file paths and identifiers in backticks.
- Avoid decorative prose, clever Markdown, nested list mazes, and raw HTML blocks.
- Keep always-loaded instruction files short enough to avoid context bloat [5][12][14].

### Adapt: use HTML for rendered docs and generated reports, not persistent agent instructions

Use HTML when the deliverable needs browser behavior:

- Public docs site output.
- Interactive codebase maps, dashboards, trace explorers, or visual QA reports.
- Rich media, diagrams, searchable navigation, collapsible regions, or styling.

Even then, keep the canonical content in Markdown when practical and generate HTML from it. MkDocs, Docusaurus, and VitePress all support this "Markdown source, HTML output" model [8][9][15].

### Adapt: use XML-style tags only for bounded prompt/context packaging

For one-off prompts, generated context bundles, or scripts that concatenate many sources, XML-like tags can be useful:

```text
<source path="architecture/overview.md">
...
</source>
```

This follows OpenAI and Anthropic prompt-structure guidance [10][11]. Do not turn project docs into HTML just to get tags. Use tags at the prompt packaging layer when boundaries and metadata matter.

### Adopt: if Jazz Master gets a public docs site, provide LLM-friendly Markdown mirrors

If the project later publishes docs, prefer this stack:

- Author in Markdown.
- Render to HTML for humans.
- Publish `/llms.txt` with a curated map of high-value docs.
- Provide Markdown page mirrors or generated context files for agents.

This follows the `/llms.txt` proposal and the VitePress pattern of exposing Markdown optimized for LLMs [3][15].

### Skip: replacing `.md` project docs with `.html` files for agent use

Do not replace repo-native Markdown docs with HTML for agent-facing documentation. The benefits of semantic HTML do not outweigh:

- Poor fit with current agent discovery conventions.
- Extra token/context cost from tags and site chrome.
- More friction for agents editing docs in plain text.
- Higher chance of stale generated HTML if source and output both live in git.

### Skip: hiding agent instructions in HTML comments, attributes, or rendered-only UI

Do not put instructions where an agent might not see them. Claude Code strips block-level HTML comments from loaded memory files [5], and other tools may sanitize or extract text differently. Agent instructions should be visible Markdown text.

### Feed-forward outcome

No immediate implementation task is required. Jazz Master's current knowledge system already uses Markdown, which is the recommended canonical format. Revisit this research when either of these happens:

- The project creates a public documentation site.
- The owner wants a generated `llms.txt`, `.md` mirror, or agent context bundle.

At that point, create a task linked to `RES-007` for the docs/export pipeline.

## Considered and rejected alternatives

- HTML-only documentation in the repo: rejected. It optimizes rendered semantics and browser UX at the cost of raw-file readability, editability, and current agent-tool conventions.
- Markdown-only forever, no HTML output: rejected. HTML is the right output for public docs and interactive reports.
- MDX as the default for all docs: rejected for now. MDX is useful for React-powered docs, but it adds parser complexity and JSX syntax. Use it only if a docs site needs embedded React components [9].
- JSON/YAML as the main docs format: rejected for narrative instructions. Structured data is useful for machine configuration, but prose guidance and workflows are easier to maintain in Markdown. Use structured formats only where the code consumes them.
- XML tags everywhere inside docs: rejected. Tags are useful for prompt packaging, but Markdown headings and lists are enough for normal repository documentation [10][11].

## Sources

[1] CommonMark Spec 0.31.2 - https://spec.commonmark.org/0.31.2/ (updated 2024-01-28, accessed 2026-07-05)

[2] Semantics - MDN Web Docs - https://developer.mozilla.org/en-US/docs/Glossary/Semantics (last modified 2025-11-07, accessed 2026-07-05)

[3] The /llms.txt file - https://llmstxt.org/ (published 2024-09-03, accessed 2026-07-05)

[4] Custom instructions with AGENTS.md - Codex - https://developers.openai.com/codex/guides/agents-md (accessed 2026-07-05)

[5] How Claude remembers your project - Claude Code Docs - https://code.claude.com/docs/en/memory (accessed 2026-07-05)

[6] Adding repository custom instructions for GitHub Copilot - GitHub Docs - https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions (accessed 2026-07-05)

[7] AGENTS.md - https://agents.md/ (accessed 2026-07-05)

[8] MkDocs - https://www.mkdocs.org/ (accessed 2026-07-05)

[9] Markdown Features - Docusaurus - https://docusaurus.io/docs/markdown-features (updated 2026-04-30, accessed 2026-07-05)

[10] Prompt engineering - OpenAI API Docs - https://developers.openai.com/api/docs/guides/prompt-engineering (accessed 2026-07-05)

[11] Prompting best practices - Claude Platform Docs - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#structure-prompts-with-xml-tags (accessed 2026-07-05)

[12] Configuration Smells in AGENTS.md Files: Common Mistakes in Configuring Coding Agents - https://arxiv.org/abs/2606.15828 (published 2026-06-14, revised 2026-06-19, accessed 2026-07-05)

[13] On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents - https://arxiv.org/abs/2601.20404 (published 2026-01-28, revised 2026-03-30, accessed 2026-07-05)

[14] Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents? - https://arxiv.org/abs/2602.11988 (published 2026-02-12, revised 2026-06-23, accessed 2026-07-05)

[15] Markdown Extensions - VitePress - https://vitepress.dev/guide/markdown (accessed 2026-07-05)
