# Process: security and privacy review

Lightweight review for a Clerk-authenticated app with server-owned persistence
and browser audio/recording capabilities. Use it before shipping
security-sensitive changes, during code review when a diff touches persistence,
input, dependencies, or browser capabilities, and during QA product reviews.

## When required

- New dependency or dependency upgrade
- localStorage schema, import/export, persistence, or migration changes
- User-entered text, parsed files, URLs, or generated markup
- Audio recording, microphone access, scoring, or other browser permissions
- Any change that could expose, corrupt, or silently lose user practice data

## Checklist

**Data and privacy**
- [ ] The change stores only data needed for the feature.
- [ ] Stored data shape is typed, versioned where durable, and migration-safe.
- [ ] User data can fail gracefully: corrupt/missing data does not crash the app.
- [ ] No secrets, tokens, private URLs, or personal data are committed.

**Input and rendering**
- [ ] User-provided strings are rendered as text, not injected as HTML.
- [ ] Parsers reject or safely handle malformed, huge, or unexpected input.
- [ ] Import paths validate schema and version before writing durable state.

**Dependencies and supply chain**
- [ ] New dependency is necessary, maintained, and scoped to the problem.
- [ ] Dependency changes are intentional in `bun.lock`.
- [ ] Known security advisories are checked when the change materially increases risk.

**Browser permissions and network**
- [ ] Permission requests are tied to a user action and explain the immediate purpose in UI.
- [ ] Network access is absent unless intentionally introduced and documented.
- [ ] Console and network panels are clean during QA for relevant flows.

## Output

- For routine changes: note "security/privacy checklist: no concerns" in the review or task log.
- For findings: fix before ship, or file `work/issues/ISSUE-###` with severity and deferral reason.
- For architectural changes: write or update an ADR.
