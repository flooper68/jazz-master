---
id: RES-009
title: Agent skill for polished HTML/CSS/JS visual artifacts, presentations, and docs
status: complete
task: none              # requested directly by owner
created: 2026-07-05
stale_when: "Codex or the Agent Skills standard changes skill loading/metadata materially; browser artifact verification tools change materially; or Jazz Master adopts a dedicated docs/deck framework."
---

# RES-009 - Agent skill for polished HTML/CSS/JS visual artifacts, presentations, and docs

## Research questions

1. When should Jazz Master use an agent skill for visual artifacts instead of `AGENTS.md`, a process doc, or a full plugin?
2. What should the skill's default artifact format be for attractive presentations, visual reports, and docs built with HTML/CSS/JS?
3. Which design and implementation constraints should the skill encode so agents produce polished, responsive, accessible artifacts rather than generic pages?
4. What verification loop should the skill require, especially for visual quality?
5. What should the skill bundle as references, scripts, templates, or assets, and what should it avoid?

## Findings

### 1. A skill is the right unit for a repeatable artifact-making workflow

Codex defines skills as reusable workflow packages: a directory with `SKILL.md` plus optional resources and scripts. Skills load progressively: Codex initially sees only name, description, and path, then loads the full instructions only when the task matches the skill or the user invokes it directly [1]. The Agent Skills specification describes the same structure: required `SKILL.md`, optional `scripts/`, `references/`, and `assets/`, with name and description in YAML frontmatter [2].

This fits a "make a nice visual artifact / browser presentation / rendered doc" workflow better than `AGENTS.md`. The repo's `AGENTS.md` should stay short and durable; RES-007 already concluded that Markdown should remain canonical for agent-facing docs, while HTML belongs to rendered artifacts for humans [15]. A visual-artifact skill can load only when needed and can carry templates/checklists without bloating every development task.

For distribution, Codex docs draw a boundary: use skills to design the workflow; package skills as plugins only when other developers need to install them or when bundling app integrations/assets matters [1]. For Jazz Master, repo-local or personal skill authoring is enough until the workflow proves reusable outside this project.

### 2. The default output should be standalone browser artifacts

Jazz Master's artifact process already says to use standalone HTML/CSS/JS when the output needs layout, hierarchy, navigation, or light interaction, and to store those files under `artifacts/<slug>/` with a README linking canonical sources [14]. The existing `artifacts/process-map/` deck follows that shape with `index.html`, `styles.css`, `script.js`, and a README.

This should remain the default for agent-generated visual reports, process maps, explainers, and lightweight presentations because it is local-first, inspectable in git, easy to open, and does not require app integration or a backend. `.pptx`, `.docx`, and `.pdf` should remain explicit-format deliverables, not the default, because the project already treats artifacts as rendered companions rather than sources of truth [14][15].

For slide-like artifacts, reveal.js is the main serious alternative. It is an open-source HTML presentation framework with CSS styling, JavaScript APIs, Markdown support, PDF export, speaker notes, syntax highlighting, and nested slides [9]. That is useful for formal decks, but it adds framework dependency and generated conventions. For small Jazz Master artifacts, plain HTML/CSS/JS is simpler; use reveal.js only when the request needs speaker notes, PDF export, nested slide navigation, or a longer deck.

### 3. "Nice" needs concrete UI rules, not aesthetic adjectives

Primary web-platform guidance points to a few constraints the skill should make explicit.

Responsive layout should use flexible grids, relative units, and min/max constraints before relying on many breakpoints. MDN notes that responsive sites are built on flexible grids and do not need pixel-perfect targeting for every device; media queries help but are not always required [5]. Container queries are now a practical pattern for artifact components because they let styles respond to the size of a containing element rather than only the viewport [6].

Accessibility cannot be bolted on at the end. WCAG 2.2 is the current W3C recommendation; the relevant artifact checks include contrast, reflow, focus visibility/appearance, target size, meaningful sequence, and non-text contrast [7]. MDN's `prefers-reduced-motion` guidance also matters when presentations use transitions or animation: respect the user's reduced-motion preference and remove, reduce, or replace non-essential motion [8].

The skill should therefore encode concrete defaults:

- Semantic HTML landmarks and headings.
- Keyboard-operable presentation controls.
- Clear visible focus states.
- Text contrast that meets WCAG AA for normal text unless the artifact is purely internal and manually approved.
- Responsive behavior at phone and desktop widths.
- Stable dimensions for slides, charts, cards, controls, and fixed-format diagrams.
- Reduced-motion fallbacks for transitions and animated diagrams.
- No hidden source of truth inside generated HTML; link back to canonical Markdown sources.

This is also consistent with the Codex app's in-app browser guidance: visual work should be previewed in the rendered page, with precise page feedback for overflowing controls, tooltip placement, mobile layout, and other issues that code inspection alone misses [12].

### 4. Rendered verification is mandatory for visual artifacts

Recent agent/UI research supports a render-and-compare loop. VISTA argues that UI-centric agent work must measure structural alignment, behavior, and visual fidelity, and notes that visual fidelity and functional correctness are partly decoupled [10]. VisRefiner makes the same practical point from screenshot-to-code research: observing rendered output and visual differences improves layout fidelity and self-refinement [11]. VisCritic is not directly about artifact generation, but it reinforces the same failure mode: GUI agents miss problems when verification is text-only [13].

Tooling supports this loop today. Playwright can capture full-page screenshots, element screenshots, and image buffers for inspection [3]. Playwright Test can also compare screenshots, but its own docs warn that rendering varies across OS, browser, hardware, headless mode, and other factors, so baselines must be generated and compared in a consistent environment [4]. For one-off artifacts, the first verification step should be screenshot inspection at multiple viewports, not committed visual regression snapshots.

Automated accessibility testing helps but is incomplete. Playwright's accessibility guide uses `@axe-core/playwright` and lists common detectable issues such as poor color contrast, unlabeled controls, and duplicate IDs, while warning that many accessibility problems require manual testing [16]. Lighthouse similarly audits performance, accessibility, SEO, and more, but should be treated as a supporting check rather than the definition of visual quality [17].

The skill should require:

- Open the artifact in a real browser or Playwright.
- Check at desktop and phone widths.
- Capture screenshots for review when possible.
- Verify controls by keyboard and pointer.
- Inspect console errors.
- Run lightweight accessibility checks when dependencies are available.
- Iterate on the rendered result before delivery.

### 5. The skill should be moderately prescriptive and evaluated

Agent Skills guidance is consistent: keep the skill focused, spend context on what the agent would otherwise get wrong, provide clear defaults instead of menus, and split detailed references into separate files loaded only when needed [2][3]. Description quality matters because the `description` field is the main trigger signal; it should be specific enough to activate for artifact/deck/report/doc requests but not for ordinary frontend implementation [18].

Codex's own best practices say repeated workflows should become skills, stable workflows can later become automations, and durable repo guidance belongs in `AGENTS.md` [19]. That suggests a skill whose job is not "general frontend design" but "create or revise human-facing rendered artifacts from canonical project sources."

Skill evaluation should be small and concrete at first. Agent Skills evaluation docs recommend 2-3 realistic prompts, varied phrasing, edge cases, and with-skill vs without-skill comparisons. They also distinguish programmatic assertions from human review for qualities like visual design [20]. For this topic, evals should check whether the skill reliably creates the README, links canonical sources, opens locally, has keyboard navigation for presentations, renders at mobile/desktop widths, and avoids unsupported claims.

## Recommendations

### Adopt: create a repo-local `visual-artifacts` skill when the next artifact request arrives

Do not add it preemptively unless the owner wants skill authoring as a standalone task. The next time a rendered artifact/deck/report/doc is requested, create `.agents/skills/visual-artifacts/SKILL.md` and use it immediately on that artifact.

Suggested description:

```yaml
description: Create or revise polished human-facing visual artifacts, browser presentations, interactive reports, rendered docs, and standalone HTML/CSS/JS deliverables under artifacts/<slug>/. Use when the user asks for an artifact, deck, presentation, visual report, explainer, rendered document, or HTML/CSS/JS doc. Do not trigger for ordinary app UI feature work.
```

This follows the skill-description guidance: front-load use cases and trigger words, and include a negative boundary [1][18].

### Adopt: make standalone HTML/CSS/JS the default

The skill should default to:

- `artifacts/<slug>/README.md`
- `artifacts/<slug>/index.html`
- `artifacts/<slug>/styles.css`
- `artifacts/<slug>/script.js`
- Optional `assets/` only when the artifact genuinely needs images, data, or reusable media

This matches `processes/artifact-creation.md` and avoids unnecessary deck/document toolchains [14].

### Adapt: include a small design system checklist in the skill

The skill should tell agents to choose a restrained visual system per artifact:

- Audience and purpose first.
- One clear information architecture.
- Semantic HTML before styling.
- Responsive grid/flex layout with stable dimensions.
- CSS custom properties for color, spacing, type scale, borders, and shadows.
- Distinct colors with accessible contrast; avoid one-hue palettes.
- No decorative clutter that does not carry information.
- Keyboard and visible-button navigation for presentations.
- Reduced-motion support for animations.

This is specific enough to improve outputs without turning the skill into a general design textbook [3][5][6][7][8].

### Adopt: require rendered QA before delivery

Every artifact run should end with:

- Open locally with `file://` when possible, otherwise document the required server.
- Verify desktop and phone widths.
- Capture or inspect screenshots.
- Check for console errors.
- Exercise controls and keyboard navigation.
- Confirm source links in the README.

Use Playwright screenshots or the Codex in-app browser when available. Do not rely only on reading HTML/CSS [3][4][10][11][12].

### Adapt: use reveal.js only for formal decks

Plain HTML/CSS/JS remains the default. Reach for reveal.js when the user asks for a real deck with speaker notes, export, nested slides, Markdown slide authoring, or a longer presentation that benefits from framework navigation [9]. If used, record the dependency and open/export instructions in the artifact README.

### Adapt: keep detailed references outside `SKILL.md`

Recommended skill layout:

```text
.agents/skills/visual-artifacts/
  SKILL.md
  references/
    artifact-structure.md
    visual-qa-checklist.md
    presentation-patterns.md
    accessibility-checklist.md
  assets/
    templates/
      standalone-html/
```

Keep `SKILL.md` under the recommended size and load references only when relevant, following progressive disclosure [2][3].

### Skip: making this a plugin now

A plugin is premature. The workflow is project-local, and the repo already has an artifact process and one browser artifact. Revisit plugin packaging only after the skill has produced several artifacts and is useful outside Jazz Master [1].

### Skip: adding a large framework or build step by default

Avoid defaulting to React, Vite, Docusaurus, MDX, Tailwind, or reveal.js for every artifact. The artifact process says browser artifacts should open without a dev server unless a README says otherwise [14]. A dependency is justified only when it materially improves the requested deliverable.

### Feed-forward outcome

No immediate implementation task is required unless the owner wants to create the skill now. The direct research result is complete and can feed a future task:

- "Create `.agents/skills/visual-artifacts` from RES-009."
- Or: "Use RES-009 while creating the next HTML artifact, then extract the working process into a skill."

Until then, `processes/artifact-creation.md` remains sufficient for ordinary one-off artifacts.

## Considered and rejected alternatives

- Put all visual artifact rules in `AGENTS.md`: rejected. It would load on every task and duplicate the existing process; a skill is the right on-demand unit [1][15].
- Convert all artifacts to reveal.js: rejected. Good for formal decks, unnecessary for small reports/maps, and adds dependency overhead [9][14].
- Use `.pptx`/`.docx` as default outputs: rejected. They are correct only when explicitly requested; standalone HTML is easier to inspect, revise, and keep connected to canonical Markdown [14][15].
- Build artifacts inside the product app: rejected for reports/decks/docs. Human-facing companion artifacts belong under `artifacts/`, not in `src/pages/`, unless the requested work is actually a product feature.
- Depend only on automated audits: rejected. Accessibility/performance tools are useful, but Playwright docs and UI-generation research both support rendered/manual inspection for visual quality [4][10][16][17].

## Sources

[1] OpenAI Codex Manual, "Agent Skills" - fetched from `https://developers.openai.com/codex/codex-manual.md` by `/Users/premylsciompa/.codex/skills/.system/openai-docs/scripts/fetch-codex-manual.mjs` (accessed 2026-07-05)

[2] Agent Skills Specification - https://agentskills.io/specification (accessed 2026-07-05)

[3] Best practices for skill creators - https://agentskills.io/skill-creation/best-practices (accessed 2026-07-05)

[4] Visual comparisons - Playwright - https://playwright.dev/docs/test-snapshots (accessed 2026-07-05)

[5] Responsive web design - MDN Web Docs - https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design (last modified 2026-06-23, accessed 2026-07-05)

[6] CSS container queries - MDN Web Docs - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries (last modified 2026-06-08, accessed 2026-07-05)

[7] Web Content Accessibility Guidelines (WCAG) 2.2 - W3C - https://www.w3.org/TR/WCAG22/ (W3C Recommendation 2023-10-05, accessed 2026-07-05)

[8] `prefers-reduced-motion` CSS media feature - MDN Web Docs - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion (accessed 2026-07-05)

[9] reveal.js - https://revealjs.com/ (accessed 2026-07-05)

[10] JunJia Guo, Yuhang Yao, Jiawei Zhou, Jingdi Chen, "VISTA: An End-to-End Benchmark for Visual Spec-to-Web-App Coding Agents" - https://arxiv.org/abs/2605.26144 (submitted 2026-05-22, revised 2026-06-22, accessed 2026-07-05)

[11] Jie Deng, Kaichun Yao, Libo Zhang, "VisRefiner: Learning from Visual Differences for Screenshot-to-Code Generation" - https://arxiv.org/abs/2602.05998 (submitted 2026-02-05, accessed 2026-07-05)

[12] OpenAI Codex Manual, "In-app browser" - fetched from `https://developers.openai.com/codex/codex-manual.md` by `/Users/premylsciompa/.codex/skills/.system/openai-docs/scripts/fetch-codex-manual.mjs` (accessed 2026-07-05)

[13] Jiachen Qian, "VisCritic: Visual State Comparison as Process Reward for GUI Agents" - https://arxiv.org/abs/2606.24525 (submitted 2026-06-23, accessed 2026-07-05)

[14] Jazz Master `processes/artifact-creation.md` (local canonical process, accessed 2026-07-05)

[15] Jazz Master `research/RES-007-html-over-markdown-docs-ai-agents.md` (local research, created 2026-07-05, accessed 2026-07-05)

[16] Accessibility testing - Playwright - https://playwright.dev/docs/accessibility-testing (accessed 2026-07-05)

[17] Introduction to Lighthouse - Chrome for Developers - https://developer.chrome.com/docs/lighthouse/overview/ (accessed 2026-07-05)

[18] Optimizing skill descriptions - Agent Skills - https://agentskills.io/skill-creation/optimizing-descriptions (accessed 2026-07-05)

[19] OpenAI Codex Manual, "Best practices" - fetched from `https://developers.openai.com/codex/codex-manual.md` by `/Users/premylsciompa/.codex/skills/.system/openai-docs/scripts/fetch-codex-manual.mjs` (accessed 2026-07-05)

[20] Evaluating skill output quality - Agent Skills - https://agentskills.io/skill-creation/evaluating-skills (accessed 2026-07-05)
